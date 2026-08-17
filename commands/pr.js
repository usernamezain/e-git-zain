import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import open from 'open';
import { git, ensureRepo } from '../lib/git.js';
import { panel } from '../lib/ui.js';

export default function registerPR(program) {
  program.command('pr')
    .description('🔗 Open a Pull Request on GitHub — detects remote URL and launches browser.')
    .option('--base <branch>', 'Base branch for PR', 'main')
    .action(async (opts) => {
      await ensureRepo();
      const sp = ora(chalk.blue('Preparing PR…')).start();

      try {
        const remotes = await git.getRemotes(true);
        const origin = remotes.find(r => r.name === 'origin');
        if (!origin) { sp.fail(chalk.red('No remote "origin" found.')); return; }

        const rawUrl = origin.refs.push || origin.refs.fetch;
        // Normalize to https URL
        let repoUrl = rawUrl
          .replace(/^git@github\.com:/, 'https://github.com/')
          .replace(/\.git$/, '');

        const status = await git.status();
        const branch = status.current;

        // Try to push current branch first
        try { await git.push(['--set-upstream', 'origin', branch]); } catch {}

        const prUrl = `${repoUrl}/compare/${opts.base}...${branch}?expand=1`;
        sp.succeed(chalk.green('Opening GitHub PR page…'));

        console.log(panel(
          `${chalk.gray('Repo:'.padEnd(12))} ${chalk.white(repoUrl)}\n` +
          `${chalk.gray('Branch:'.padEnd(12))} ${chalk.cyan(branch)}\n` +
          `${chalk.gray('Base:'.padEnd(12))} ${chalk.cyan(opts.base)}\n` +
          `${chalk.gray('URL:'.padEnd(12))} ${chalk.underline.blue(prUrl)}`,
          'blue', '🔗 Pull Request'
        ));

        await open(prUrl);
        console.log(chalk.green('\n✅ PR page opened in your browser!\n'));
      } catch (e) { sp.fail(chalk.red('PR failed: ' + e.message)); }
    });
}
