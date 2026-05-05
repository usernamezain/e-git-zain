import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { git, ensureRepo } from '../lib/git.js';
import { panel } from '../lib/ui.js';

export default function registerStash(program) {
  program.command('stash')
    .description('📦 Interactive stash manager — save, list, restore, drop stashes.')
    .action(async () => {
      await ensureRepo();

      const { action } = await inquirer.prompt([{ type: 'list', name: 'action', message: '📦 Stash action:',
        choices: [
          { name: '💾  Save current changes to stash', value: 'save' },
          { name: '📋  List all stashes', value: 'list' },
          { name: '⬆️   Pop (restore latest stash)', value: 'pop' },
          { name: '🔁  Apply a specific stash', value: 'apply' },
          { name: '🗑️   Drop a stash', value: 'drop' },
          { name: '🧹  Clear all stashes', value: 'clear' },
          { name: '❌  Exit', value: 'exit' },
        ] }]);

      if (action === 'exit') return;

      if (action === 'save') {
        const status = await git.status();
        if (!status.files.length) { console.log(chalk.yellow('\nℹ  Nothing to stash.\n')); return; }
        const { name } = await inquirer.prompt([{ type: 'input', name: 'name', message: '📝 Stash name (optional):', default: `stash-${Date.now()}` }]);
        const sp = ora('Saving stash…').start();
        await git.stash(['push', '-m', name]);
        sp.succeed(chalk.green(`Stash "${name}" saved! (${status.files.length} file(s))`));
      }

      if (action === 'list') {
        const stashes = await git.stashList();
        if (!stashes.all.length) { console.log(chalk.yellow('\nℹ  No stashes found.\n')); return; }
        console.log(chalk.cyan.bold('\n📦 Stash List:\n'));
        stashes.all.forEach((s, i) => {
          console.log(`  ${chalk.yellow(`[${i}]`)} ${chalk.white(s.message || s.hash?.slice(0, 7))} ${chalk.gray(s.date || '')}`);
        });
        console.log('');
      }

      if (action === 'pop') {
        const sp = ora('Restoring latest stash…').start();
        try { await git.stash(['pop']); sp.succeed(chalk.green('Latest stash restored!')); }
        catch (e) { sp.fail(chalk.red('Pop failed: ' + e.message)); }
      }

      if (action === 'apply' || action === 'drop') {
        const stashes = await git.stashList();
        if (!stashes.all.length) { console.log(chalk.yellow('\nℹ  No stashes.\n')); return; }
        const choices = stashes.all.map((s, i) => ({ name: `[${i}] ${s.message || s.hash?.slice(0, 7)}`, value: i }));
        const { idx } = await inquirer.prompt([{ type: 'list', name: 'idx', message: action === 'apply' ? 'Apply which stash?' : 'Drop which stash?', choices }]);
        const sp = ora(action === 'apply' ? 'Applying…' : 'Dropping…').start();
        if (action === 'apply') { await git.stash(['apply', `stash@{${idx}}`]); sp.succeed(chalk.green('Stash applied!')); }
        else { await git.stash(['drop', `stash@{${idx}}`]); sp.succeed(chalk.green('Stash dropped.')); }
      }

      if (action === 'clear') {
        const { ok } = await inquirer.prompt([{ type: 'confirm', name: 'ok', message: chalk.red('Clear ALL stashes? Cannot undo!'), default: false }]);
        if (ok) { await git.stash(['clear']); console.log(chalk.green('\n✅ All stashes cleared.\n')); }
      }
    });
}
