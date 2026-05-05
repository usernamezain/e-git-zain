import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import simpleGit from 'simple-git';
import { panel } from '../lib/ui.js';

export default function registerClone(program) {
  program.command('clone')
    .description('📥 Smart clone — clone a repo, auto-install deps, open in VS Code.')
    .argument('<url>', 'GitHub repository URL')
    .option('-d, --dir <dir>', 'Target directory')
    .action(async (url, opts) => {
      const repoName = url.split('/').pop()?.replace('.git', '') || 'repo';
      const targetDir = opts.dir || repoName;

      const { install, openCode } = await inquirer.prompt([
        { type: 'confirm', name: 'install', message: '📦 Auto-install npm dependencies (if package.json found)?', default: true },
        { type: 'confirm', name: 'openCode', message: '💻 Open in VS Code after clone?', default: false },
      ]);

      const sp = ora(chalk.blue(`Cloning "${repoName}"…`)).start();
      try {
        await simpleGit().clone(url, targetDir);
        sp.succeed(chalk.green(`Cloned into "./${targetDir}"`));

        // Check for package.json
        const hasPackageJson = (() => {
          try { execSync(`test -f "${targetDir}/package.json" || if exist "${targetDir}\\package.json" echo yes`, { stdio: 'ignore' }); return true; } catch { return false; }
        })();

        if (install && hasPackageJson) {
          const sp2 = ora(chalk.blue('Installing npm packages…')).start();
          try {
            execSync('npm install', { cwd: targetDir, stdio: 'ignore' });
            sp2.succeed(chalk.green('Dependencies installed!'));
          } catch { sp2.warn(chalk.yellow('npm install failed — run it manually.')); }
        }

        if (openCode) {
          const sp3 = ora('Opening VS Code…').start();
          try { execSync(`code "${targetDir}"`); sp3.succeed(chalk.green('Opened in VS Code!')); }
          catch { sp3.warn(chalk.yellow('"code" command not found. Open VS Code manually.')); }
        }

        console.log(panel(
          `${chalk.gray('Repo:'.padEnd(12))} ${chalk.white(repoName)}\n` +
          `${chalk.gray('Directory:'.padEnd(12))} ${chalk.cyan('./' + targetDir)}\n` +
          `${chalk.gray('Deps:'.padEnd(12))} ${install && hasPackageJson ? chalk.green('installed ✓') : chalk.gray('skipped')}\n` +
          `${chalk.gray('VS Code:'.padEnd(12))} ${openCode ? chalk.green('opened ✓') : chalk.gray('skipped')}`,
          'magenta', '📥 Clone Complete'
        ));
      } catch (e) { sp.fail(chalk.red('Clone failed: ' + e.message)); }
    });
}
