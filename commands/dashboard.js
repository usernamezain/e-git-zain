import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { git, ensureRepo } from '../lib/git.js';
import { readHistory } from '../lib/history.js';
import { panel, div, badge } from '../lib/ui.js';
import { ensureGhCli, ghJson } from '../lib/github.js';

// ── Display helpers ───────────────────────────────────────────────────────────
function ruler(char = '═', len = 66) {
  return chalk.gray(char.repeat(len));
}

function section(icon, title) {
  return `\n${chalk.cyan.bold(`${icon}  ${title}`)}\n${ruler()}`;
}

function actLabel(state) {
  if (!state) return chalk.gray('?');
  const s = state.toLowerCase();
  if (s === 'success')     return chalk.green('✔');
  if (s === 'failure')     return chalk.red('✘');
  if (s === 'in_progress') return chalk.yellow('⟳');
  if (s === 'cancelled')   return chalk.gray('○');
  return chalk.gray('·');
}

// ── Dashboard sections ────────────────────────────────────────────────────────

async function renderStatus(status) {
  const staged   = status.files.filter(f => f.index !== ' ' && f.index !== '?');
  const unstaged = status.files.filter(f => f.working_dir !== ' ');
  const untracked = status.files.filter(f => f.index === '?');

  let syncLine = chalk.gray('  (no remote tracking)');
  try {
    const rb = await git.raw(['rev-list', '--left-right', '--count', `HEAD...origin/${status.current}`]);
    const [ahead, behind] = rb.trim().split('\t');
    syncLine = `  ${chalk.green('↑' + ahead + ' ahead')}   ${chalk.red('↓' + behind + ' behind')}`;
  } catch {}

  console.log(section('📊', 'Status'));
  console.log(`  ${chalk.gray('Branch:  ')} ${chalk.cyan.bold(status.current)}${syncLine}`);
  const stateStr = status.files.length === 0
    ? chalk.green('✨ Working tree clean')
    : chalk.yellow(`⚡ ${status.files.length} file(s) changed`);
  console.log(`  ${chalk.gray('State:   ')} ${stateStr}\n`);

  if (staged.length)    { console.log(`  ${chalk.green('● Staged (ready to commit):')}`);  staged.forEach(f => console.log(`    ${chalk.green('+')} ${f.path}`)); console.log(''); }
  if (unstaged.length)  { console.log(`  ${chalk.yellow('● Modified (not staged):')}`);    unstaged.forEach(f => console.log(`    ${chalk.yellow('~')} ${f.path}`)); console.log(''); }
  if (untracked.length) { console.log(`  ${chalk.red('● Untracked (new files):')}`);       untracked.forEach(f => console.log(`    ${chalk.red('?')} ${f.path}`)); console.log(''); }
}

async function renderBranches(status) {
  const branchData = await git.branchLocal();
  const all = Object.keys(branchData.branches);

  console.log(section('🌿', 'Branches'));
  all.slice(0, 10).forEach(b => {
    const isCurr = b === status.current;
    const marker = isCurr ? chalk.green('▶') : chalk.gray('·');
    const label  = isCurr
      ? chalk.green.bold(b) + chalk.gray('  ← current')
      : chalk.white(b);
    console.log(`  ${marker} ${label}`);
  });
  if (all.length > 10) console.log(chalk.gray(`  … +${all.length - 10} more branches`));
  console.log('');
}

async function renderCommits() {
  const log = await git.log(['--oneline', '-8']);
  console.log(section('📜', 'Recent Commits'));
  log.all.forEach((c, i) => {
    const bullet = i === 0 ? chalk.yellow('◆') : chalk.gray('·');
    console.log(`  ${bullet} ${chalk.yellow(c.hash.slice(0, 7))}  ${chalk.white(c.message.slice(0, 62))}`);
  });
  console.log('');
}

async function renderStashes() {
  const stashes = await git.stashList();
  console.log(section('📦', 'Stashes'));
  if (!stashes.all.length) {
    console.log(chalk.gray('  (no stashes)\n'));
    return;
  }
  stashes.all.slice(0, 5).forEach((s, i) => {
    console.log(`  ${chalk.yellow(`[${i}]`)} ${chalk.white((s.message || s.hash?.slice(0, 7) || '').slice(0, 55))}`);
  });
  if (stashes.all.length > 5) console.log(chalk.gray(`  … +${stashes.all.length - 5} more`));
  console.log('');
}

async function renderHistory() {
  const history = await readHistory();
  console.log(section('🕰️ ', 'Push History'));
  if (!history.length) { console.log(chalk.gray('  (no history yet)\n')); return; }
  history.slice(0, 6).forEach((e, i) => {
    const bullet = i === 0 ? chalk.cyan('◆') : chalk.gray('·');
    const ts = (e.displayTimestamp || new Date(e.timestamp).toLocaleString()).slice(0, 22);
    console.log(
      `  ${bullet} ${chalk.gray(ts.padEnd(24))} ${chalk.green((e.branch || 'main').padEnd(14))} ` +
      `${chalk.white((e.message || '').slice(0, 34))}`
    );
  });
  console.log('');
}

async function renderActions() {
  // Try gh CLI but fail silently — not everyone has it
  try {
    const runs = ghJson('gh run list --json name,status,conclusion,headBranch --limit 5');
    if (!runs || !runs.length) return;

    console.log(section('⚙️ ', 'GitHub Actions'));
    runs.forEach(r => {
      const state = r.conclusion || r.status;
      console.log(
        `  ${actLabel(state)} ${chalk.white(r.name.slice(0, 42).padEnd(44))} ${chalk.cyan(r.headBranch)}`
      );
    });
    console.log('');
  } catch {
    // gh CLI not available — skip silently
  }
}

// ── Main Command ──────────────────────────────────────────────────────────────
export default function registerDashboard(program) {
  program
    .command('dashboard')
    .alias('dash')
    .description('🖥️  Interactive TUI dashboard — full repo overview at a glance.')
    .option('--no-actions', 'Skip GitHub Actions panel (faster, no gh CLI needed)')
    .action(async (opts) => {
      await ensureRepo();

      const sp = ora(chalk.blue('Loading dashboard…')).start();
      const status = await git.status();
      sp.stop();

      // ── Clear & Header ─────────────────────────────────────────────────────
      process.stdout.write('\x1Bc'); // cross-platform clear
      const versionBadge = chalk.gray('v4.0.0');
      const branchBadge  = chalk.cyan.bold(status.current || 'unknown');
      const timeBadge    = chalk.gray(new Date().toLocaleString());

      console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════════════════════════════════════╗
  ║  🖥️   E-GIT DASHBOARD                                   ${versionBadge}  ║
  ║  Branch: ${branchBadge.padEnd(58)}║
  ╚══════════════════════════════════════════════════════════════════╝`));
      console.log(chalk.gray(`  ${timeBadge}\n`));

      // ── Render sections ────────────────────────────────────────────────────
      await renderStatus(status);
      await renderBranches(status);
      await renderCommits();
      await renderStashes();
      await renderHistory();
      if (opts.actions !== false) await renderActions();

      // ── Quick action menu ──────────────────────────────────────────────────
      console.log(ruler('─'));
      const { action } = await inquirer.prompt([{
        type: 'list', name: 'action',
        message: '🎛️  Quick action:',
        choices: [
          { name: '🔄 Refresh dashboard',                value: 'refresh' },
          { name: '🌿 Branch manager   (e-git branch)',  value: 'branch' },
          { name: '📦 Stash manager    (e-git stash)',   value: 'stash' },
          { name: '🐙 GitHub hub       (e-git github)',  value: 'github' },
          { name: '💣 Nuclear options  (e-git nuke)',    value: 'nuke' },
          { name: '📜 Push history     (e-git history)', value: 'history' },
          new inquirer.Separator(),
          { name: '❌ Exit dashboard',                   value: 'exit' },
        ],
      }]);

      if (action === 'exit') {
        console.log(chalk.cyan('\n  Goodbye! 👋\n'));
        return;
      }

      if (action === 'refresh') {
        // Re-run the dashboard by re-importing and re-invoking
        const { default: register } = await import('./dashboard.js');
        // We spawn a sub-process so commander re-parses
        const { execSync } = await import('child_process');
        execSync(`node "${process.argv[1]}" dashboard`, { stdio: 'inherit' });
        return;
      }

      console.log(chalk.cyan(`\n  Launching: ${chalk.white.bold('e-git ' + action)}\n`));
      // Dynamically import and invoke the chosen command
      const moduleMap = {
        branch:  '../commands/branch.js',
        stash:   '../commands/stash.js',
        github:  '../commands/gh-suite.js',
        nuke:    '../commands/nuke.js',
        history: '../commands/history.js',
      };
      if (moduleMap[action]) {
        // Lazy-load and run via child process for clean commander isolation
        const { execSync } = await import('child_process');
        try {
          execSync(`node "${process.argv[1]}" ${action}`, { stdio: 'inherit' });
        } catch {}
      }
    });
}
