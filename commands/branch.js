import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { git, ensureRepo } from '../lib/git.js';
import { panel, div } from '../lib/ui.js';

export default function registerBranch(program) {
  program.command('branch')
    .description('🌿 Interactive branch manager — create, switch, rename, delete, push.')
    .action(async () => {
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

      const { action } = await inquirer.prompt([{ type: 'list', name: 'action', message: 'Action:',
        choices: [
          { name: '✨  Create new branch', value: 'create' },
          { name: '🔀  Switch branch', value: 'switch' },
          { name: '✏️   Rename current branch', value: 'rename' },
          { name: '🗑️   Delete a branch', value: 'delete' },
          { name: '📤  Push current branch to remote', value: 'push' },
          { name: '❌  Exit', value: 'exit' },
        ] }]);

      if (action === 'exit') return;

      if (action === 'create') {
        const { name, sw } = await inquirer.prompt([
          { type: 'input', name: 'name', message: 'Branch name:', validate: i => i.trim() ? true : 'Required' },
          { type: 'confirm', name: 'sw', message: 'Switch to it?', default: true },
        ]);
        const sp = ora(chalk.blue(`Creating "${name}"…`)).start();
        await git.checkoutLocalBranch(name);
        if (!sw) await git.checkout(current);
        sp.succeed(chalk.green(`"${name}" created${sw ? ' & switched' : ''}!`));
      }

      if (action === 'switch') {
        const others = all.filter(b => b !== current);
        if (!others.length) { console.log(chalk.yellow('\nNo other branches.\n')); return; }
        const { t } = await inquirer.prompt([{ type: 'list', name: 't', message: 'Switch to:', choices: others }]);
        const sp = ora(chalk.blue(`Switching to "${t}"…`)).start();
        await git.checkout(t);
        sp.succeed(chalk.green(`Switched to "${t}"`));
      }

      if (action === 'rename') {
        const { n } = await inquirer.prompt([{ type: 'input', name: 'n', message: `New name for "${current}":`, validate: i => i.trim() ? true : 'Required' }]);
        const sp = ora('Renaming…').start();
        await git.raw(['branch', '-m', current, n]);
        sp.succeed(chalk.green(`Renamed to "${n}"`));
      }

      if (action === 'delete') {
        const del = all.filter(b => b !== current);
        if (!del.length) { console.log(chalk.yellow('\nNo branches to delete.\n')); return; }
        const { t, force } = await inquirer.prompt([
          { type: 'list', name: 't', message: 'Delete which?', choices: del },
          { type: 'confirm', name: 'force', message: 'Force delete?', default: false },
        ]);
        const sp = ora(chalk.blue(`Deleting "${t}"…`)).start();
        await git.deleteLocalBranch(t, force);
        sp.succeed(chalk.green(`"${t}" deleted.`));
      }

      if (action === 'push') {
        const sp = ora(chalk.blue(`Pushing "${current}"…`)).start();
        await git.push(['--set-upstream', 'origin', current]);
        sp.succeed(chalk.green(`"${current}" pushed to remote!`));
      }
    });
}
