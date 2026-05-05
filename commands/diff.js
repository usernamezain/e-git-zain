import chalk from 'chalk';
import ora from 'ora';
import { git, ensureRepo } from '../lib/git.js';
import { div } from '../lib/ui.js';

export default function registerDiff(program) {
  program.command('diff')
    .description('🔍 Visual colored diff of your changes.')
    .option('-s, --staged', 'Show only staged changes')
    .action(async (opts) => {
      await ensureRepo();
      const sp = ora(chalk.blue('Loading diff…')).start();

      const args = opts.staged ? ['--cached'] : [];
      const stat = await git.diff([...args, '--stat']);
      const full = await git.diff([...args, '--color=always']);
      sp.stop();

      if (!stat.trim() && !full.trim()) {
        console.log(chalk.yellow('\nℹ  No changes to display.\n')); return;
      }

      const title = opts.staged ? '📋 Staged Changes' : '🔍 Working Directory Changes';
      console.log('\n' + chalk.cyan.bold(title));
      console.log(div());

      if (stat.trim()) {
        console.log(chalk.bold('\n  📊 Summary:\n'));
        stat.trim().split('\n').forEach(line => {
          if (line.includes('|')) {
            const [file, changes] = line.split('|');
            const colored = changes.replace(/\+/g, chalk.green('+')).replace(/-/g, chalk.red('-'));
            console.log(`  ${chalk.white(file)}${chalk.gray('|')}${colored}`);
          } else {
            console.log(chalk.gray('  ' + line));
          }
        });
      }

      if (full.trim()) {
        console.log(chalk.bold('\n  📄 Full Diff:\n'));
        full.split('\n').forEach(line => {
          if (line.startsWith('+') && !line.startsWith('+++')) console.log(chalk.green(line));
          else if (line.startsWith('-') && !line.startsWith('---')) console.log(chalk.red(line));
          else if (line.startsWith('@@')) console.log(chalk.cyan(line));
          else if (line.startsWith('diff ') || line.startsWith('index ')) console.log(chalk.yellow(line));
          else console.log(chalk.gray(line));
        });
      }
      console.log('\n' + div() + '\n');
    });
}
