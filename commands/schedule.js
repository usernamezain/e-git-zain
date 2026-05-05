import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import chokidar from 'chokidar';
import { git, ensureRepo } from '../lib/git.js';
import { logPush } from '../lib/history.js';

let debounceTimer = null;

async function autoCommit(branch, prefix, sp) {
  try {
    const status = await git.status();
    if (!status.files.length) return;
    const msg = `${prefix} ${new Date().toLocaleTimeString()}`;
    await git.add('.');
    const res = await git.commit(msg);
    await git.push(['--set-upstream', 'origin', branch]);
    await logPush(msg, branch, res.commit);
    sp.succeed(chalk.green(`[${new Date().toLocaleTimeString()}] Auto-pushed: ${msg}`));
    sp.start(chalk.blue('👀 Watching for changes…'));
  } catch (e) {
    sp.warn(chalk.yellow('Auto-push skipped: ' + e.message));
    sp.start(chalk.blue('👀 Watching for changes…'));
  }
}

export default function registerSchedule(program) {
  program.command('schedule')
    .description('⏱️  Auto-commit & push on file changes or at a set interval.')
    .option('-i, --interval <minutes>', 'Push every N minutes instead of on file change')
    .option('-p, --prefix <msg>', 'Commit message prefix', '⏱️ Auto-save')
    .action(async (opts) => {
      await ensureRepo();

      const status = await git.status();
      const branch = status.current || 'main';

      console.log(chalk.cyan.bold('\n⏱️  Schedule Mode\n'));
      console.log(chalk.gray(`  Branch : ${chalk.cyan(branch)}`));
      console.log(chalk.gray(`  Mode   : ${opts.interval ? chalk.yellow('Interval (' + opts.interval + 'min)') : chalk.green('File Watch')}`));
      console.log(chalk.gray(`  Prefix : ${chalk.white(opts.prefix)}`));
      console.log(chalk.yellow('\n  Press Ctrl+C to stop.\n'));

      const sp = ora(chalk.blue('👀 Watching for changes…')).start();

      if (opts.interval) {
        const ms = parseInt(opts.interval) * 60 * 1000;
        if (isNaN(ms) || ms <= 0) { sp.fail(chalk.red('Invalid interval.')); return; }
        setInterval(() => autoCommit(branch, opts.prefix, sp), ms);
      } else {
        const watcher = chokidar.watch('.', {
          ignored: /(^|[\/\\])(\.git|node_modules|dist|build)/,
          persistent: true, ignoreInitial: true,
        });
        watcher.on('all', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => autoCommit(branch, opts.prefix, sp), 2000);
        });
      }

      // Keep alive
      process.on('SIGINT', () => {
        sp.stop();
        console.log(chalk.cyan('\n\n👋 Schedule mode stopped.\n'));
        process.exit(0);
      });
      await new Promise(() => {}); // block forever
    });
}
