import chalk from 'chalk';
import ora from 'ora';
import { git, ensureRepo } from '../lib/git.js';
import { panel, div, fileIcon } from '../lib/ui.js';

export default function registerStatus(program) {
  program.command('status')
    .description('📊 Rich status dashboard — branch, changes, ahead/behind, last commit.')
    .action(async () => {
      await ensureRepo();
      const sp = ora(chalk.blue('Loading status…')).start();

      const [status, log] = await Promise.all([
        git.status(),
        git.log(['--oneline', '-5']),
      ]);

      let aheadBehind = '';
      try {
        const rb = await git.raw(['rev-list', '--left-right', '--count', `HEAD...origin/${status.current}`]);
        const [ahead, behind] = rb.trim().split('\t');
        aheadBehind = `${chalk.green('↑' + ahead)} ${chalk.red('↓' + behind)}`;
      } catch { aheadBehind = chalk.gray('(no remote tracking)'); }

      sp.stop();

      // Branch panel
      const staged = status.files.filter(f => f.index !== ' ' && f.index !== '?');
      const unstaged = status.files.filter(f => f.working_dir !== ' ');
      const untracked = status.files.filter(f => f.index === '?');

      const branchLine = `${chalk.gray('Branch:'.padEnd(14))} ${chalk.cyan.bold(status.current)}  ${aheadBehind}`;
      const cleanLine = status.files.length === 0
        ? chalk.green('✨  Working tree clean')
        : `${chalk.yellow(`⚡  ${status.files.length} file(s) changed`)}`;

      console.log(panel(branchLine + '\n' + cleanLine, 'cyan', '📊 Repo Status'));

      if (status.files.length) {
        console.log(chalk.bold('  📂 Changes:\n'));
        if (staged.length) {
          console.log(chalk.green('  Staged:'));
          staged.forEach(f => console.log(`    ${chalk.green('●')} ${f.path}`));
        }
        if (unstaged.length) {
          console.log(chalk.yellow('\n  Modified (not staged):'));
          unstaged.forEach(f => console.log(`    ${chalk.yellow('●')} ${f.path}`));
        }
        if (untracked.length) {
          console.log(chalk.red('\n  Untracked:'));
          untracked.forEach(f => console.log(`    ${chalk.red('●')} ${f.path}`));
        }
        console.log('');
      }

      if (log.all.length) {
        console.log(chalk.bold('  📜 Recent Commits:\n'));
        log.all.forEach((c, i) => {
          const bullet = i === 0 ? chalk.yellow('◆') : chalk.gray('·');
          console.log(`  ${bullet} ${chalk.yellow(c.hash.slice(0, 7))} ${chalk.white(c.message)}`);
        });
        console.log('');
      }
    });
}
