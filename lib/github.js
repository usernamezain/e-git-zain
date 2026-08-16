import { execSync } from 'child_process';
import chalk from 'chalk';

/** Get the repo nameWithOwner (e.g., "usernamezain/e-git-zain") */
export function getRepoFullName() {
  try {
    return execSync('gh repo view --json nameWithOwner -q .nameWithOwner', {
      encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch { return null; }
}

/** Check if gh CLI is available and authenticated — prints guidance if not */
export function ensureGhCli() {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    console.log(chalk.red('\n✖  GitHub CLI (gh) is not installed or not authenticated.'));
    console.log(chalk.cyan('   Install:  https://cli.github.com/'));
    console.log(chalk.cyan('   Authenticate: gh auth login\n'));
    return false;
  }
}

/** Run a gh CLI command and parse the JSON output. Returns null on failure. */
export function ghJson(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return JSON.parse(out);
  } catch { return null; }
}

/** Run a gh CLI command and return the raw string output. Returns null on failure. */
export function ghRun(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch { return null; }
}
