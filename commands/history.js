import chalk from 'chalk';
import inquirer from 'inquirer';
import { git, ensureRepo } from '../lib/git.js';
import { readHistory } from '../lib/history.js';
import { div } from '../lib/ui.js';

async function viewDiff(hash) {
  console.log(chalk.cyan.bold(`\n📝 Changes for ${chalk.white(hash.slice(0, 7))}\n`));
  const diff = await git.show([hash, '--color=always', '--pretty=format:%B', '--compact-summary']);
  console.log(diff);
  console.log(div() + '\n');
}

async function restoreTo(hash) {
  const { ok } = await inquirer.prompt([{ type: 'confirm', name: 'ok', message: chalk.yellow('⚠️  Restore to this state? (destructive)'), default: false }]);
  if (!ok) { console.log(chalk.cyan('\nAborted. Files safe.\n')); return; }
  const sp = (await import('ora')).default(chalk.blue('Restoring…')).start();
  await git.reset(['--hard', hash]);
  sp.succeed(chalk.green('Files restored! 🕰️'));
}

export function registerHistory(program) {
  program.command('history')
    .description('📜 Interactive push history — browse, diff, restore any version.')
    .action(async () => {
      await ensureRepo();
      const history = await readHistory();
      if (!history.length) { console.log(chalk.yellow('\nℹ  No push history.\n')); return; }

      console.log(chalk.cyan.bold('\n📜 Push History:\n'));
      const choices = history.map(e => ({
        name: `${chalk.gray((e.displayTimestamp || e.timestamp).slice(0, 22).padEnd(24))} ${chalk.green((e.branch || 'main').padEnd(12))} ${e.message}`,
        value: e,
      }));
      choices.push(new inquirer.Separator(), { name: '❌ Exit', value: 'exit' });

      const { sel } = await inquirer.prompt([{ type: 'list', name: 'sel', message: 'Select a push:', choices, pageSize: 15 }]);
      if (sel === 'exit' || !sel) return;

      if (sel.hash) {
        await viewDiff(sel.hash);
        const { act } = await inquirer.prompt([{ type: 'list', name: 'act', message: 'Action:',
          choices: [{ name: '🔙 Back', value: 'back' }, { name: '🕰️  Restore to this version', value: 'restore' }, { name: '❌ Exit', value: 'exit' }] }]);
        if (act === 'restore') await restoreTo(sel.hash);
      }
    });
}

export function registerList(program) {
  program.command('list')
    .description('📋 Table view of all recorded pushes.')
    .action(async () => {
      await ensureRepo();
      const history = await readHistory();
      if (!history.length) { console.log(chalk.yellow('\nℹ  No push history.\n')); return; }
      console.log(chalk.cyan.bold('\n🚀 Push History\n'));
      console.log(chalk.gray('─'.repeat(70)));
      console.log(`${chalk.bold('Date & Time'.padEnd(26))} ${chalk.bold('Branch'.padEnd(14))} ${chalk.bold('Message')}`);
      console.log(chalk.gray('─'.repeat(70)));
      history.forEach(e => console.log(`${(e.displayTimestamp || e.timestamp).slice(0, 24).padEnd(26)} ${chalk.green((e.branch || 'main').padEnd(14))} ${e.message}`));
      console.log(chalk.gray('─'.repeat(70)) + '\n');
    });
}

export function registerClear(program) {
  program.command('clear')
    .description('🧹 Clear local push history log.')
    .action(async () => {
      const { ok } = await inquirer.prompt([{ type: 'confirm', name: 'ok', message: chalk.red('Clear all push history?'), default: false }]);
      if (!ok) return;
      const { historyPath } = await import('../lib/history.js');
      const p = await historyPath();
      try { await (await import('fs/promises')).unlink(p); console.log(chalk.green('\n✅ History cleared.\n')); }
      catch { console.log(chalk.yellow('\nℹ  No history to clear.\n')); }
    });
}
