import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { git, ensureRepo, checkAndSetupRemote, ensureAuthenticated, ensureGitIgnore } from '../lib/git.js';
import { logPush } from '../lib/history.js';
import { panel, fileIcon, div } from '../lib/ui.js';

export default function registerPush(program) {
  program
    .argument('[message]', 'Commit message')
    .action(async (message) => {
      await ensureRepo();
      await checkAndSetupRemote();
      await ensureAuthenticated();
      await ensureGitIgnore();

      const status = await git.status();
      if (!status.files.length) { console.log(chalk.yellow('\nℹ  Nothing to push.\n')); process.exit(0); }

      console.log(chalk.cyan.bold('\n📂 Changed files:'));
      status.files.slice(0, 12).forEach(f => console.log(`  ${fileIcon(f.index)} ${chalk.white(f.path)}`));
      if (status.files.length > 12) console.log(chalk.gray(`  … +${status.files.length - 12} more`));

      if (!message) {
        const a = await inquirer.prompt([{ type: 'input', name: 'msg', message: '✏️  Commit message:', validate: i => i.trim() ? true : 'Required' }]);
        message = a.msg;
      }

      const sp = ora(chalk.blue('Staging files…')).start();
      await git.add('.');
      sp.text = chalk.blue('Committing…');
      const res = await git.commit(message);
      const hash = res.commit;

      let branch = status.current || 'main';
      if (branch === 'master') {
        sp.stop();
        const { rename } = await inquirer.prompt([{ type: 'confirm', name: 'rename', message: '⚠️  Rename "master" → "main"?', default: true }]);
        if (rename) { await git.raw(['branch', '-m', 'master', 'main']); branch = 'main'; console.log(chalk.green('✅ Renamed to "main"')); }
        sp.start();
      }

      sp.text = chalk.blue(`Pushing to ${branch}…`);
      try {
        await git.push(['--set-upstream', 'origin', branch]);
        sp.succeed(chalk.green(`Pushed to "${branch}" ✅`));
        await logPush(message, branch, hash);
        console.log(panel(
          `${chalk.gray('Branch:'.padEnd(10))} ${chalk.cyan(branch)}\n` +
          `${chalk.gray('Commit:'.padEnd(10))} ${chalk.yellow(hash.slice(0, 7))}\n` +
          `${chalk.gray('Message:'.padEnd(10))} ${chalk.white(message)}\n` +
          `${chalk.gray('Time:'.padEnd(10))} ${chalk.white(new Date().toLocaleTimeString())}`,
          'green', '🚀 Push Successful'
        ));
      } catch (e) { sp.fail(chalk.red('Push failed: ' + e.message)); }
    });
}
