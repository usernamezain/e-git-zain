import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { git, ensureRepo } from '../lib/git.js';
import { readHistory } from '../lib/history.js';

async function restoreTo(hash, extraWarning = false) {
  if (extraWarning) console.log(chalk.red.bold('⚠️  This state is more than 30 minutes old!'));
  const { ok } = await inquirer.prompt([{ type: 'confirm', name: 'ok', message: chalk.yellow('Restore to this state? (destructive)'), default: false }]);
  if (!ok) { console.log(chalk.cyan('\nAborted.\n')); return; }
  const sp = ora(chalk.blue('Restoring…')).start();
  await git.reset(['--hard', hash]);
  sp.succeed(chalk.green('Files restored! 🕰️'));
}

export function registerUndo(program) {
  program.command('undo')
    .description('🔙 Revert files to the last successful push state.')
    .action(async () => {
      await ensureRepo();
      const history = await readHistory();
      const withHash = history.filter(e => e.hash);
      if (!withHash.length) { console.log(chalk.yellow('\nℹ  No tracked pushes to undo.\n')); return; }

      const currentHash = (await git.revparse(['HEAD'])).trim();
      let target = withHash[0];
      if (currentHash === withHash[0].hash && withHash[1]) target = withHash[1];

      console.log(chalk.cyan(`\nUndo to: "${chalk.white(target.message)}" (${target.displayTimestamp || target.timestamp})`));
      await restoreTo(target.hash);
    });
}

export function registerRedo(program) {
  program.command('redo')
    .description('⏭️  Jump forward if you undid by accident.')
    .action(async () => {
      await ensureRepo();
      const history = await readHistory();
      const currentHash = (await git.revparse(['HEAD'])).trim();
      const idx = history.findIndex(e => e.hash === currentHash);

      if (idx <= 0) { console.log(chalk.yellow('\nℹ  Already at the latest state.\n')); return; }

      const target = history[idx - 1];
      const mins = (Date.now() - new Date(target.timestamp).getTime()) / 60000;
      console.log(chalk.cyan(`\nRedo to: "${chalk.white(target.message)}" (${target.displayTimestamp || target.timestamp})`));
      await restoreTo(target.hash, mins > 30);
    });
}
