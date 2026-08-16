import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { git, ensureRepo, checkAndSetupRemote, ensureAuthenticated, ensureGitIgnore } from '../lib/git.js';
import { logPush } from '../lib/history.js';
import { panel, fileIcon, div } from '../lib/ui.js';
import { runSecretScan, runPrePushChecks } from '../lib/safety.js';

export default function registerPush(program) {
  program
    .argument('[message]', 'Commit message')
    .option('-f, --force', '💣 Force push — overwrites remote history (use with caution!)')
    .action(async (message, opts) => {
      await ensureRepo();
      await checkAndSetupRemote();
      await ensureAuthenticated();
      await ensureGitIgnore();

      const status = await git.status();
      if (!status.files.length) {
        console.log(chalk.yellow('\nℹ  Nothing to push.\n'));
        process.exit(0);
      }

      // ── Show changed files ─────────────────────────────────────────────────
      console.log(chalk.cyan.bold('\n📂 Changed files:'));
      status.files.slice(0, 12).forEach(f =>
        console.log(`  ${fileIcon(f.index)} ${chalk.white(f.path)}`)
      );
      if (status.files.length > 12)
        console.log(chalk.gray(`  … +${status.files.length - 12} more`));
      console.log('');

      // ── 🛡️  Safety Shield 1: Secret Scan ──────────────────────────────────
      const secretsOk = await runSecretScan();
      if (!secretsOk) {
        console.log(chalk.red.bold('\n✖  Push aborted. Remove secrets from your files before pushing.\n'));
        process.exit(1);
      }

      // ── 🛡️  Safety Shield 2: Pre-push checks (lint / test) ────────────────
      const checksOk = await runPrePushChecks();
      if (!checksOk) {
        console.log(chalk.red.bold('\n✖  Push aborted — pre-push checks failed.\n'));
        process.exit(1);
      }

      // ── Commit message ─────────────────────────────────────────────────────
      if (!message) {
        const a = await inquirer.prompt([{
          type: 'input', name: 'msg',
          message: '✏️  Commit message:',
          validate: i => i.trim() ? true : 'Commit message is required',
        }]);
        message = a.msg;
      }

      // ── Force push safety confirmation ─────────────────────────────────────
      if (opts.force) {
        console.log(chalk.red.bold('\n⚠️  FORCE PUSH — This will OVERWRITE remote history!\n'));
        const { confirm } = await inquirer.prompt([{
          type: 'confirm', name: 'confirm',
          message: chalk.red('Are you absolutely sure you want to force push?'),
          default: false,
        }]);
        if (!confirm) {
          console.log(chalk.cyan('\n  Aborted force push. Nothing was changed.\n'));
          process.exit(0);
        }
      }

      // ── Stage → Commit → Push ──────────────────────────────────────────────
      const sp = ora(chalk.blue('Staging files…')).start();
      await git.add('.');
      sp.text = chalk.blue('Committing…');
      const res = await git.commit(message);
      const hash = res.commit;

      let branch = status.current || 'main';

      // Offer to rename master → main
      if (branch === 'master') {
        sp.stop();
        const { rename } = await inquirer.prompt([{
          type: 'confirm', name: 'rename',
          message: '⚠️  Rename "master" → "main"?',
          default: true,
        }]);
        if (rename) {
          await git.raw(['branch', '-m', 'master', 'main']);
          branch = 'main';
          console.log(chalk.green('✅ Renamed to "main"'));
        }
        sp.start();
      }

      sp.text = chalk.blue(`${opts.force ? '💣 Force p' : 'P'}ushing to ${branch}…`);

      try {
        const pushArgs = opts.force
          ? ['--force-with-lease', '--set-upstream', 'origin', branch]
          : ['--set-upstream', 'origin', branch];

        await git.push(pushArgs);
        sp.succeed(chalk.green(`${opts.force ? 'Force p' : 'P'}ushed to "${branch}" ✅`));
        await logPush(message, branch, hash);

        console.log(panel(
          `${chalk.gray('Branch:'.padEnd(10))} ${chalk.cyan(branch)}\n` +
          `${chalk.gray('Commit:'.padEnd(10))} ${chalk.yellow(hash ? hash.slice(0, 7) : 'n/a')}\n` +
          `${chalk.gray('Message:'.padEnd(10))} ${chalk.white(message)}\n` +
          `${chalk.gray('Mode:'.padEnd(10))} ${opts.force ? chalk.red.bold('FORCE ⚠️') : chalk.green('Normal')}\n` +
          `${chalk.gray('Time:'.padEnd(10))} ${chalk.white(new Date().toLocaleTimeString())}`,
          opts.force ? 'red' : 'green',
          opts.force ? '💣 Force Push Successful' : '🚀 Push Successful'
        ));
      } catch (e) {
        sp.fail(chalk.red('Push failed: ' + e.message));
        console.log(chalk.yellow('\n  💡 Tip: If rejected due to diverged history, use:'));
        console.log(chalk.cyan('     e-git nuke --force-push\n'));
      }
    });
}
