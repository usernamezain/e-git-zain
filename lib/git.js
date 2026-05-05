import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync, spawnSync } from 'child_process';

export const git = simpleGit();

export function cmdExists(cmd) {
  try { execSync(`where ${cmd}`, { stdio: 'ignore' }); return true; } catch { return false; }
}

export async function ensureRepo() {
  const ok = await git.checkIsRepo().catch(() => false);
  if (!ok) { console.error(chalk.red('\n✖  Not a git repository.\n')); process.exit(1); }
}

export async function ensureAuthenticated() {
  const remotes = await git.getRemotes(true);
  const origin = remotes.find(r => r.name === 'origin');
  if (!origin) return;
  const sp = ora(chalk.blue('Verifying GitHub auth...')).start();
  try {
    await git.listRemote(['--heads', 'origin']);
    sp.succeed(chalk.green('Authenticated ✓'));
  } catch {
    sp.stop();
    console.log(chalk.yellow('\n⚠️  Authentication failed.'));
    const { action } = await inquirer.prompt([{ type: 'list', name: 'action', message: 'How to proceed?',
      choices: [{ name: 'GitHub CLI login', value: 'gh' }, { name: 'Manual (PAT/SSH)', value: 'manual' }, { name: 'Abort', value: 'abort' }] }]);
    if (action === 'abort') process.exit(1);
    if (action === 'gh') {
      if (cmdExists('gh')) { spawnSync('gh', ['auth', 'login'], { stdio: 'inherit' }); return ensureAuthenticated(); }
      else { console.log(chalk.red('✖  GitHub CLI not found: https://cli.github.com/')); process.exit(1); }
    }
    if (action === 'manual') console.log(chalk.cyan('Generate PAT: https://github.com/settings/tokens'));
  }
}

export async function checkAndSetupRemote() {
  const remotes = await git.getRemotes(true);
  if (remotes.length > 0) return;
  console.log(chalk.yellow('\nℹ  No remote found.'));
  const { ok } = await inquirer.prompt([{ type: 'confirm', name: 'ok', message: 'Add a GitHub remote now?', default: true }]);
  if (!ok) { console.log(chalk.red('✖  Remote required.\n')); process.exit(1); }
  const { url } = await inquirer.prompt([{ type: 'input', name: 'url', message: 'Remote URL:', validate: i => i.trim() ? true : 'Required' }]);
  const sp = ora('Adding remote...').start();
  try { await git.addRemote('origin', url); sp.succeed(chalk.green('Remote added!')); }
  catch (e) { sp.fail(chalk.red(e.message)); process.exit(1); }
}

export async function ensureGitIgnore() {
  try {
    const root = (await git.revparse(['--show-toplevel'])).trim();
    const p = (await import('path')).default.join(root, '.gitignore');
    await (await import('fs/promises')).access(p);
  } catch {
    console.log(chalk.yellow('\n🛡️  No .gitignore found.'));
    const { create } = await inquirer.prompt([{ type: 'confirm', name: 'create', message: 'Create one?', default: true }]);
    if (!create) return;
    const { patterns } = await inquirer.prompt([{ type: 'checkbox', name: 'patterns', message: 'Select items to ignore:',
      choices: [
        { name: 'node_modules/', value: 'node_modules/', checked: true },
        { name: '.env', value: '.env', checked: true },
        { name: 'dist/', value: 'dist/' }, { name: 'build/', value: 'build/' },
        { name: '.DS_Store', value: '.DS_Store' }, { name: 'npm-debug.log', value: 'npm-debug.log' },
      ] }]);
    if (patterns.length) {
      const root2 = (await git.revparse(['--show-toplevel'])).trim();
      const fsp = await import('fs/promises');
      const pa = await import('path');
      await fsp.writeFile(pa.default.join(root2, '.gitignore'), patterns.join('\n') + '\n');
      console.log(chalk.green('✅ .gitignore created!\n'));
    }
  }
}
