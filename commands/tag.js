import chalk from 'chalk';
import ora from 'ora';
import { input, confirm } from '@inquirer/prompts';
import { git, ensureRepo } from '../lib/git.js';
import { panel } from '../lib/ui.js';

export default function registerTag(program) {
  program.command('tag')
    .description('🏷️  Create and push release tags (semver). Perfect for npm releases.')
    .action(async () => {
      await ensureRepo();

      // Show existing tags
      const tags = await git.tags();
      if (tags.all.length) {
        console.log(chalk.cyan.bold('\n🏷️  Existing Tags:'));
        tags.all.slice(-8).forEach(t => console.log(`  ${chalk.yellow('◆')} ${chalk.white(t)}`));
        console.log('');
      }

      const lastTag = tags.all[tags.all.length - 1] || 'v0.0.0';

      const version = await input({
        message: `🏷️  New tag version (last: ${chalk.yellow(lastTag)}):`,
        default: lastTag.replace(/(\d+)$/, n => String(+n + 1)),
        validate: i => i.trim() ? true : 'Required',
      });
      const message = await input({ message: '📝 Tag message (release notes):', validate: i => i.trim() ? true : 'Required' });
      const pushTag = await confirm({ message: '📤 Push tag to remote?', default: true });

      const sp = ora(chalk.blue(`Creating tag "${version}"…`)).start();
      try {
        await git.addAnnotatedTag(version, message);
        sp.succeed(chalk.green(`Tag "${version}" created!`));

        if (pushTag) {
          const sp2 = ora(chalk.blue('Pushing tag…')).start();
          await git.pushTags('origin');
          sp2.succeed(chalk.green(`Tag "${version}" pushed to remote!`));
        }

        console.log(panel(
          `${chalk.gray('Tag:'.padEnd(10))} ${chalk.yellow(version)}\n` +
          `${chalk.gray('Message:'.padEnd(10))} ${chalk.white(message)}\n` +
          `${chalk.gray('Pushed:'.padEnd(10))} ${pushTag ? chalk.green('Yes ✓') : chalk.gray('No')}`,
          'yellow', '🏷️  Tag Created'
        ));
      } catch (e) { sp.fail(chalk.red('Tag failed: ' + e.message)); }
    });
}
