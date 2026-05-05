import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
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
        const { cont } = await inquirer.prompt([{ type: 'confirm', name: 'cont', message: '⚠️  Already a git repo. Continue?', default: false }]);
        if (!cont) return;
      }

      const { name, desc, withRemote, remoteUrl, firstCommit } = await inquirer.prompt([
        { type: 'input', name: 'name', message: '📁 Project name:', default: path.basename(process.cwd()) },
        { type: 'input', name: 'desc', message: '📝 Short description:', default: '' },
        { type: 'confirm', name: 'firstCommit', message: '🚀 Create initial commit?', default: true },
        { type: 'confirm', name: 'withRemote', message: '🌐 Add GitHub remote?', default: false },
        { type: 'input', name: 'remoteUrl', message: '🌐 Remote URL:', when: a => a.withRemote, validate: i => i.trim() ? true : 'Required' },
      ]);

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
