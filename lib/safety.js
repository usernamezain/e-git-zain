import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { select, checkbox, confirm, Separator } from '@inquirer/prompts';
import { execSync } from 'child_process';
import { git } from './git.js';

// ── Secret Patterns ───────────────────────────────────────────────────────────
const SECRET_PATTERNS = [
  { name: 'AWS Access Key',      regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'AWS Secret Key',      regex: /aws_secret_access_key\s*=\s*[^\s]{20,}/gi },
  { name: 'GitHub Token',        regex: /ghp_[a-zA-Z0-9]{36}/g },
  { name: 'GitHub Fine-Grained', regex: /github_pat_[a-zA-Z0-9_]{82}/g },
  { name: 'Generic API Key',     regex: /api[_-]?key\s*[:=]\s*["']?[a-zA-Z0-9\-_]{16,}/gi },
  { name: 'Private Key Header',  regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Slack Token',         regex: /xox[baprs]-[0-9a-zA-Z\-]{10,}/g },
  { name: 'Stripe Secret Key',   regex: /sk_live_[0-9a-zA-Z]{24,}/g },
  { name: 'Stripe Publishable',  regex: /pk_live_[0-9a-zA-Z]{24,}/g },
  { name: 'Password in config',  regex: /password\s*=\s*["'][^"']{4,}/gi },
  { name: 'DB Connection String',regex: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi },
  { name: 'JWT Secret',          regex: /jwt[_-]?secret\s*[:=]\s*["']?[a-zA-Z0-9\-_]{10,}/gi },
  { name: 'SendGrid API Key',    regex: /SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}/g },
  { name: 'Twilio Auth Token',   regex: /SK[a-f0-9]{32}/g },
];

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.mp3', '.wav', '.avi', '.mov',
  '.zip', '.gz', '.tar', '.rar', '.7z',
  '.lock', '.pdf', '.docx', '.xlsx',
]);
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt', '.cache',
]);

// ── File Scanner ──────────────────────────────────────────────────────────────
async function scanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORED_EXTENSIONS.has(ext)) return [];
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const hits = [];
    for (const { name, regex } of SECRET_PATTERNS) {
      regex.lastIndex = 0;
      if (regex.test(content)) {
        hits.push({ file: filePath, pattern: name });
      }
    }
    return hits;
  } catch { return []; }
}

// ── Secret Scan (runs on changed files before push) ───────────────────────────
export async function runSecretScan() {
  let root;
  try { root = (await git.revparse(['--show-toplevel'])).trim(); }
  catch { return true; } // not in a repo — skip

  const status = await git.status();
  if (!status.files.length) return true; // nothing changed

  // Only scan files that are actually staged/modified/untracked
  const changedFiles = status.files
    .map(f => path.join(root, f.path))
    .filter(f => !IGNORED_DIRS.has(path.dirname(f).split(path.sep)[0]));

  const hits = [];
  for (const file of changedFiles) {
    const fileHits = await scanFile(file);
    hits.push(...fileHits);
  }

  if (hits.length === 0) {
    console.log(chalk.green('  🔐 Secret scan: clean ✓'));
    return true;
  }

  console.log(chalk.red.bold('\n🔐 SECRET SCAN ALERT — Potential secrets detected!\n'));
  const uniqueFiles = [...new Set(hits.map(h => h.file))];
  for (const file of uniqueFiles) {
    const fileHits = hits.filter(h => h.file === file);
    const rel = file.replace(root + path.sep, '');
    console.log(`  ${chalk.red('✖')} ${chalk.yellow.bold(rel)}`);
    fileHits.forEach(h => console.log(`    ${chalk.gray('→')} ${chalk.red(h.pattern)}`));
  }
  console.log('');

  const proceed = await select({
    message: chalk.yellow('⚠️  Secrets detected. How do you want to proceed?'),
    choices: [
      { name: '🔙  Abort push — fix the secrets first (recommended)', value: 'abort' },
      { name: '⚠️   Continue anyway — I understand the risk',          value: 'continue' },
    ],
  });

  if (proceed === 'abort') return false;

  // Warn again if user chose to continue
  console.log(chalk.yellow.bold('\n  ⚠️  Proceeding with potential secrets in code. Be careful!\n'));
  return true;
}

// ── Pre-Push Checks (lint + test) ────────────────────────────────────────────
export async function runPrePushChecks() {
  let root;
  try { root = (await git.revparse(['--show-toplevel'])).trim(); }
  catch { return true; }

  let pkg = {};
  try {
    pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  } catch { return true; } // no package.json — skip

  const scripts = pkg.scripts || {};
  const available = [];
  if (scripts.lint) available.push({ name: `🔍 lint  — npm run lint`, value: 'lint' });
  if (scripts.test) available.push({ name: `🧪 tests — npm test`,     value: 'test' });

  if (!available.length) return true; // no scripts to run

  console.log('');
  const checks = await checkbox({
    message: '🛡️  Pre-push checks detected. Select which to run before pushing:',
    choices: [
      ...available,
      new Separator(),
      { name: '⏭️  Skip all checks', value: 'skip', checked: false },
    ],
  });

  if (!checks.length || checks.includes('skip')) return true;

  for (const check of checks.filter(c => c !== 'skip')) {
    const cmd = check === 'lint' ? 'npm run lint' : 'npm test';
    console.log(chalk.blue(`\n  ▶ Running ${chalk.white.bold(cmd)}…\n`));
    try {
      execSync(cmd, { cwd: root, stdio: 'inherit' });
      console.log(chalk.green(`\n  ✅ ${cmd} passed!\n`));
    } catch {
      console.log(chalk.red(`\n  ✖  ${chalk.white.bold(cmd)} FAILED.\n`));
      const continueAnyway = await confirm({
        message: chalk.yellow(`${cmd} failed. Push anyway? (not recommended)`),
        default: false,
      });
      if (!continueAnyway) return false;
    }
  }
  return true;
}
