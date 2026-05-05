import chalk from 'chalk';
import ora from 'ora';
import { git, ensureRepo } from '../lib/git.js';
import { panel } from '../lib/ui.js';

export default function registerPull(program) {
  program.command('pull')
    .description('⬇️  Smart pull — auto-stash, pull, restore stash, detect conflicts.')
    .option('--rebase', 'Pull with rebase')
    .action(async (opts) => {
      await ensureRepo();
      const status = await git.status();
      let stashed = false;

      if (status.files.length) {
        console.log(chalk.yellow(`\n📦 ${status.files.length} unsaved change(s) — auto-stashing…`));
        const sp = ora('Stashing…').start();
        try {
          await git.stash(['push', '-m', `git-easy auto ${new Date().toISOString()}`]);
          stashed = true;
          sp.succeed(chalk.green('Stashed! Will restore after pull.'));
        } catch { sp.warn(chalk.yellow('Nothing to stash.')); }
      }

      const sp = ora(chalk.blue('Pulling from remote…')).start();
      try {
        const res = await git.pull('origin', status.current, opts.rebase ? ['--rebase'] : []);
        const s = res.summary;
        sp.succeed(chalk.green('Pull complete! ✅'));
        console.log(panel(
          `${chalk.gray('Branch:'.padEnd(10))} ${chalk.cyan(status.current)}\n` +
          `${chalk.gray('Files:'.padEnd(10))} ${chalk.white(s.changes || 0)} changed\n` +
          `${chalk.gray('Changes:'.padEnd(10))} ${chalk.green('+' + s.insertions)} ${chalk.red('-' + s.deletions)}`,
          'green', '⬇️  Pull Summary'
        ));
      } catch (e) {
        sp.fail(chalk.red('Pull failed!'));
        if (e.message.includes('CONFLICT')) {
          const conflicts = (await git.status()).conflicted;
          console.log(chalk.red.bold('\n🔥 Merge Conflicts:\n'));
          conflicts.forEach(f => console.log(chalk.red(`  ⚡ ${f}`)));
          console.log(chalk.yellow('\n💡 Fix conflicts → stage files → run: e-git "merge resolved"\n'));
        } else console.error(chalk.red(e.message));
      }

      if (stashed) {
        const sp2 = ora('Restoring your changes…').start();
        try { await git.stash(['pop']); sp2.succeed(chalk.green('Changes restored!')); }
        catch { sp2.fail(chalk.red('Restore failed. Run: git stash pop')); }
      }
    });
}
