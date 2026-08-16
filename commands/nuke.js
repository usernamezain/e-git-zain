import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { git, ensureRepo, cmdExists } from '../lib/git.js';
import { panel } from '../lib/ui.js';

// ── Helper: force push current branch ────────────────────────────────────────
async function doForcePush() {
  const status = await git.status();
  const branch = status.current || 'main';

  console.log(chalk.red.bold(`\n⚠️  FORCE PUSH — "${branch}" to remote\n`));
  console.log(chalk.gray('  This will overwrite remote history. Other collaborators may lose work.\n'));

  const { confirm } = await inquirer.prompt([{
    type: 'input', name: 'confirm',
    message: chalk.red(`Type the branch name "${chalk.white.bold(branch)}" to confirm:`),
    validate: i => i.trim() === branch ? true : `Type exactly: ${branch}`,
  }]);

  if (confirm.trim() !== branch) {
    console.log(chalk.cyan('\n  Aborted. Nothing was changed.\n'));
    return;
  }

  const sp = ora(chalk.red('Force pushing…')).start();
  try {
    await git.push(['--force-with-lease', '--set-upstream', 'origin', branch]);
    sp.succeed(chalk.green(`Force pushed "${branch}" to remote ✅`));
    console.log(panel(
      `${chalk.gray('Branch:'.padEnd(12))} ${chalk.cyan(branch)}\n` +
      `${chalk.gray('Mode:'.padEnd(12))} ${chalk.red.bold('FORCE PUSH ⚠️')}\n` +
      `${chalk.gray('Time:'.padEnd(12))} ${chalk.white(new Date().toLocaleString())}`,
      'red', '💣 Force Push Complete'
    ));
  } catch (e) {
    sp.fail(chalk.red('Force push failed: ' + e.message));
    console.log(chalk.yellow('\n  💡 If --force-with-lease fails (remote has new commits), use --force:'));
    console.log(chalk.cyan('     git push --force origin ' + branch + '\n'));
  }
}

// ── Helper: delete a branch (local + remote) ─────────────────────────────────
async function doDeleteBranch(branchName) {
  const summary = await git.branchLocal();
  const all = Object.keys(summary.branches);

  if (!branchName) {
    const others = all.filter(b => b !== summary.current);
    if (!others.length) {
      console.log(chalk.yellow('\n  No other branches to delete.\n'));
      return;
    }
    const { target } = await inquirer.prompt([{
      type: 'list', name: 'target',
      message: '🌿 Which branch do you want to nuke?',
      choices: others,
    }]);
    branchName = target;
  }

  if (branchName === summary.current) {
    console.log(chalk.red(`\n  ✖  Cannot delete the currently checked-out branch "${branchName}".\n`));
    console.log(chalk.cyan('  Switch to another branch first, then run nuke again.\n'));
    return;
  }

  console.log(chalk.red.bold(`\n💣 Branch Deletion: "${branchName}"\n`));
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: chalk.red(`Delete local AND remote branch "${branchName}"? This cannot be undone.`),
    default: false,
  }]);
  if (!confirm) { console.log(chalk.cyan('\n  Aborted. Branch is safe.\n')); return; }

  const sp = ora('Deleting branch…').start();
  const results = { local: '–', remote: '–' };

  // Delete local
  try {
    await git.deleteLocalBranch(branchName, true); // force=true
    results.local = chalk.green('Deleted ✓');
  } catch (e) {
    results.local = chalk.yellow('Not found / ' + e.message.slice(0, 40));
  }

  // Delete remote
  try {
    await git.push(['origin', '--delete', branchName]);
    results.remote = chalk.green('Deleted ✓');
  } catch (e) {
    results.remote = chalk.yellow('Not found / ' + e.message.slice(0, 40));
  }

  sp.succeed(chalk.green('Branch deletion complete.'));
  console.log(panel(
    `${chalk.gray('Branch:'.padEnd(12))} ${chalk.red(branchName)}\n` +
    `${chalk.gray('Local:'.padEnd(12))} ${results.local}\n` +
    `${chalk.gray('Remote:'.padEnd(12))} ${results.remote}`,
    'red', '💣 Branch Nuked'
  ));
}

// ── Helper: delete remote GitHub repository ───────────────────────────────────
async function doDeleteRepo() {
  if (!cmdExists('gh')) {
    console.log(chalk.red('\n✖  GitHub CLI (gh) is required to delete repositories.'));
    console.log(chalk.cyan('   Install:  https://cli.github.com/\n'));
    return;
  }

  let repoInfo = '';
  try {
    repoInfo = execSync(
      'gh repo view --json nameWithOwner -q .nameWithOwner',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
  } catch {
    console.log(chalk.red('\n✖  Could not detect repo. Make sure you are inside a GitHub repo and `gh auth login` is done.\n'));
    return;
  }

  console.log(chalk.red.bold('\n💀 REPOSITORY DELETION — READ CAREFULLY\n'));
  console.log(`  ${chalk.red('Repository:')} ${chalk.white.bold(repoInfo)}`);
  console.log(chalk.red('  This will PERMANENTLY DELETE the remote repository on GitHub!'));
  console.log(chalk.red('  This action CANNOT be undone. All PRs, issues, and code will be lost.\n'));

  const { step1 } = await inquirer.prompt([{
    type: 'confirm', name: 'step1',
    message: chalk.red.bold('Are you 100% sure you want to permanently delete this repository?'),
    default: false,
  }]);
  if (!step1) { console.log(chalk.cyan('\n  Aborted. Repository is safe.\n')); return; }

  const { confirmName } = await inquirer.prompt([{
    type: 'input', name: 'confirmName',
    message: chalk.red(`Type the full repository name "${chalk.white.bold(repoInfo)}" to confirm:`),
    validate: i => i.trim() === repoInfo ? true : `Must match exactly: ${repoInfo}`,
  }]);
  if (confirmName.trim() !== repoInfo) {
    console.log(chalk.cyan('\n  Name did not match. Aborted.\n'));
    return;
  }

  const sp = ora(chalk.red('Permanently deleting repository…')).start();
  try {
    execSync(`gh repo delete "${repoInfo}" --yes`, { stdio: 'pipe' });
    sp.succeed(chalk.red.bold(`Repository "${repoInfo}" permanently deleted.`));
    console.log(panel(
      `${chalk.gray('Repository:'.padEnd(14))} ${chalk.red.bold(repoInfo)}\n` +
      `${chalk.gray('Status:'.padEnd(14))} ${chalk.red.bold('PERMANENTLY DELETED 💀')}\n` +
      `${chalk.gray('Time:'.padEnd(14))} ${chalk.white(new Date().toLocaleString())}`,
      'red', '💀 Repository Deleted'
    ));
    console.log(chalk.yellow('\n  The local folder still exists. You can delete it manually.\n'));
  } catch (e) {
    sp.fail(chalk.red('Deletion failed: ' + e.message));
    console.log(chalk.yellow('\n  Try manually: gh repo delete ' + repoInfo + ' --yes\n'));
  }
}

// ── Main Command ──────────────────────────────────────────────────────────────
export default function registerNuke(program) {
  program.command('nuke')
    .description('💣 Nuclear options — force push, delete branch, or delete remote repo.')
    .option('--force-push',       '🚀 Force push current branch to remote')
    .option('--branch <name>',    '🌿 Delete a specific local+remote branch by name')
    .option('--delete-branch',    '🌿 Interactively delete a branch')
    .option('--repo',             '💀 Delete the entire remote GitHub repository')
    .action(async (opts) => {
      await ensureRepo();

      // ── Flag-based invocation ──────────────────────────────────────────────
      if (opts.forcePush)     { await doForcePush();               return; }
      if (opts.branch)        { await doDeleteBranch(opts.branch);  return; }
      if (opts.deleteBranch)  { await doDeleteBranch(null);         return; }
      if (opts.repo)          { await doDeleteRepo();               return; }

      // ── Interactive mode ───────────────────────────────────────────────────
      console.log(chalk.red.bold('\n💣 Nuclear Options\n'));
      console.log(chalk.gray('  Use these carefully — most actions are irreversible.\n'));

      const { action } = await inquirer.prompt([{
        type: 'list', name: 'action',
        message: 'What do you want to do?',
        choices: [
          { name: '🚀 Force push current branch to remote',      value: 'force-push' },
          { name: '🌿 Delete a branch (local + remote)',          value: 'branch' },
          { name: '💀 Delete the entire remote repository',       value: 'repo' },
          new inquirer.Separator(),
          { name: '❌ Exit (nothing will change)',                value: 'exit' },
        ],
      }]);

      if (action === 'exit')        return;
      if (action === 'force-push')  await doForcePush();
      if (action === 'branch')      await doDeleteBranch(null);
      if (action === 'repo')        await doDeleteRepo();
    });
}
