import chalk from 'chalk';
import ora from 'ora';
import { select, input, confirm } from '@inquirer/prompts';
import { git, ensureRepo } from '../lib/git.js';
import { panel, div } from '../lib/ui.js';

// ── Exported action — called directly by dashboard (same process, same TTY) ──
export async function runBranch() {
  await ensureRepo();
  const summary = await git.branchLocal();
  const current = summary.current;
  const all = Object.keys(summary.branches);

  console.log(panel(
    all.map(b => b === current
      ? chalk.green(`▶  ${b}  ${chalk.gray('← current')}`)
      : chalk.white(`   ${b}`)
    ).join('\n'),
    'cyan', '🌿 Local Branches'
  ));

  const action = await select({
    message: 'Action:',
    choices: [
      { name: '✨  Create new branch',             value: 'create' },
      { name: '🔀  Switch branch',                 value: 'switch' },
      { name: '✏️   Rename current branch',         value: 'rename' },
      { name: '🗑️   Delete a branch',               value: 'delete' },
      { name: '📤  Push current branch to remote', value: 'push' },
      { name: '❌  Exit',                          value: 'exit' },
    ],
  });

  if (action === 'exit') return;

  if (action === 'create') {
    const name = await input({ message: 'Branch name:', validate: i => i.trim() ? true : 'Required' });
    const sw   = await confirm({ message: 'Switch to it?', default: true });
    const sp = ora(chalk.blue(`Creating "${name}"…`)).start();
    await git.checkoutLocalBranch(name);
    if (!sw) await git.checkout(current);
    sp.succeed(chalk.green(`"${name}" created${sw ? ' & switched' : ''}!`));
  }

  if (action === 'switch') {
    const others = all.filter(b => b !== current);
    if (!others.length) { console.log(chalk.yellow('\nNo other branches.\n')); return; }
    const t = await select({ message: 'Switch to:', choices: others.map(b => ({ name: b, value: b })) });
    const sp = ora(chalk.blue(`Switching to "${t}"…`)).start();
    await git.checkout(t);
    sp.succeed(chalk.green(`Switched to "${t}"`));
  }

  if (action === 'rename') {
    const n = await input({ message: `New name for "${current}":`, validate: i => i.trim() ? true : 'Required' });
    const sp = ora('Renaming…').start();
    await git.raw(['branch', '-m', current, n]);
    sp.succeed(chalk.green(`Renamed to "${n}"`));
  }

  if (action === 'delete') {
    const del = all.filter(b => b !== current);
    if (!del.length) { console.log(chalk.yellow('\nNo branches to delete.\n')); return; }
    const t     = await select({ message: 'Delete which?', choices: del.map(b => ({ name: b, value: b })) });
    const force = await confirm({ message: 'Force delete?', default: false });
    const sp = ora(chalk.blue(`Deleting "${t}"…`)).start();
    await git.deleteLocalBranch(t, force);
    sp.succeed(chalk.green(`"${t}" deleted.`));
  }

  if (action === 'push') {
    const sp = ora(chalk.blue(`Pushing "${current}"…`)).start();
    await git.push(['--set-upstream', 'origin', current]);
    sp.succeed(chalk.green(`"${current}" pushed to remote!`));
  }
}

// ── Commander registration ────────────────────────────────────────────────────
export default function registerBranch(program) {
  program.command('branch')
    .description('🌿 Interactive branch manager — create, switch, rename, delete, push.')
    .action(runBranch);
}
