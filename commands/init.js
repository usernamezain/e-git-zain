import chalk from 'chalk';
import ora from 'ora';
import { input, confirm } from '@inquirer/prompts';
import fs from 'fs/promises';
import path from 'path';
import { git } from '../lib/git.js';
import { panel, banner } from '../lib/ui.js';

export default function registerInit(program) {
  program.command('init')
    .description('🏗️  Initialize a new git repo with wizard setup.')
    .action(async () => {
      banner();
      console.log(chalk.cyan.bold('\n🏗️  Git Repo Initialization Wizard\n'));

      const isRepo = await git.checkIsRepo().catch(() => false);
      if (isRepo) {
        const cont = await confirm({ message: '⚠️  Already a git repo. Continue?', default: false });
        if (!cont) return;
      }

      const name        = await input({ message: '📁 Project name:', default: path.basename(process.cwd()) });
      const desc        = await input({ message: '📝 Short description:', default: '' });
      const firstCommit = await confirm({ message: '🚀 Create initial commit?', default: true });
      const withRemote  = await confirm({ message: '🌐 Add GitHub remote?', default: false });
      const remoteUrl   = withRemote
        ? await input({ message: '🌐 Remote URL:', validate: i => i.trim() ? true : 'Required' })
        : '';

      const sp = ora(chalk.blue('Initializing…')).start();
      if (!isRepo) await git.init();
      await git.raw(['checkout', '-b', 'main']).catch(() => {});

      // create README
      await fs.writeFile('README.md', `# ${name}\n\n${desc}\n`);
      // create .gitignore
      await fs.writeFile('.gitignore', 'node_modules/\n.env\ndist/\nbuild/\n.DS_Store\n');
      sp.succeed(chalk.green('Repo initialized on "main"'));

      if (firstCommit) {
        const sp2 = ora('Creating first commit…').start();
        await git.add('.');
        await git.commit(`🎉 Initial commit: ${name}`);
        sp2.succeed(chalk.green('Initial commit created!'));
      }

      if (withRemote && remoteUrl) {
        const sp3 = ora('Adding remote…').start();
        await git.addRemote('origin', remoteUrl).catch(() => git.remote(['set-url', 'origin', remoteUrl]));
        if (firstCommit) {
          await git.push(['--set-upstream', 'origin', 'main']);
          sp3.succeed(chalk.green('Pushed to remote!'));
        } else sp3.succeed(chalk.green('Remote added!'));
      }

      console.log(panel(
        `${chalk.gray('Project:'.padEnd(12))} ${chalk.white(name)}\n` +
        `${chalk.gray('Branch:'.padEnd(12))} ${chalk.cyan('main')}\n` +
        `${chalk.gray('Remote:'.padEnd(12))} ${chalk.white(withRemote ? remoteUrl : 'none')}\n` +
        `${chalk.gray('.gitignore:'.padEnd(12))} ${chalk.green('created ✓')}`,
        'cyan', '🏗️  Repo Ready'
      ));
    });
}
