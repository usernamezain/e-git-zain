import chalk from 'chalk';
import ora from 'ora';
import { input, confirm, select } from '@inquirer/prompts';
import fs from 'fs/promises';
import path from 'path';
import { git } from '../lib/git.js';
import { panel, banner } from '../lib/ui.js';

// ── Helper: check if a file exists ───────────────────────────────────────────
async function fileExists(filePath) {
  try { await fs.access(filePath); return true; } catch { return false; }
}

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
      const firstCommit = await confirm({ message: '🚀 Create initial commit?', default: true });
      const withRemote  = await confirm({ message: '🌐 Add GitHub remote?', default: false });
      const remoteUrl   = withRemote
        ? await input({ message: '🌐 Remote URL:', validate: i => i.trim() ? true : 'Required' })
        : '';

      const sp = ora(chalk.blue('Initializing…')).start();
      if (!isRepo) await git.init();
      await git.raw(['checkout', '-b', 'main']).catch(() => {});

      // ── README: smart check ─────────────────────────────────────────────────
      const readmePath   = path.join(process.cwd(), 'README.md');
      const readmeExists = await fileExists(readmePath);
      let readmeStatus   = chalk.gray('kept existing ✓');

      sp.stop(); // pause spinner for interactive prompt

      if (readmeExists) {
        // README already exists — ask the user instead of blindly overwriting
        console.log(chalk.yellow('\n📄 README.md already exists in this folder.'));
        const readmeAction = await select({
          message: 'What would you like to do with README.md?',
          choices: [
            { name: '✅ Keep it — don\'t touch my existing README',       value: 'keep' },
            { name: '✏️  Overwrite it — generate a new one from scratch', value: 'overwrite' },
            { name: '➕ Append — add project info below existing content', value: 'append' },
          ],
        });

        if (readmeAction === 'overwrite') {
          const desc = await input({ message: '📝 Short description (for README):', default: '' });
          await fs.writeFile(readmePath, buildReadme(name, desc));
          readmeStatus = chalk.green('overwritten ✓');
        } else if (readmeAction === 'append') {
          const desc = await input({ message: '📝 Short description to append:', default: '' });
          const existing = await fs.readFile(readmePath, 'utf8');
          const appendBlock =
            `\n---\n\n## About\n\n${desc || name}\n\n` +
            `> Initialized with [e-git](https://github.com/usernamezain/e-git-zain) · ${new Date().toLocaleDateString()}\n`;
          await fs.writeFile(readmePath, existing.trimEnd() + appendBlock);
          readmeStatus = chalk.green('appended ✓');
        }
        // 'keep' → do nothing
      } else {
        // No README yet — optionally create one
        const createReadme = await confirm({ message: '📄 Create a README.md?', default: true });
        if (createReadme) {
          const desc = await input({ message: '📝 Short description (optional — press Enter to skip):', default: '' });
          await fs.writeFile(readmePath, buildReadme(name, desc));
          readmeStatus = chalk.green('created ✓');
        } else {
          readmeStatus = chalk.gray('skipped');
        }
      }

      sp.start(chalk.blue('Finishing setup…'));

      // ── .gitignore: only create if missing ─────────────────────────────────
      const gitignorePath   = path.join(process.cwd(), '.gitignore');
      const gitignoreExists = await fileExists(gitignorePath);
      let gitignoreStatus   = chalk.gray('kept existing ✓');

      if (!gitignoreExists) {
        await fs.writeFile(gitignorePath, 'node_modules/\n.env\ndist/\nbuild/\n.DS_Store\n');
        gitignoreStatus = chalk.green('created ✓');
      }

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
        `${chalk.gray('Project:'.padEnd(14))} ${chalk.white(name)}\n` +
        `${chalk.gray('Branch:'.padEnd(14))} ${chalk.cyan('main')}\n` +
        `${chalk.gray('Remote:'.padEnd(14))} ${chalk.white(withRemote ? remoteUrl : 'none')}\n` +
        `${chalk.gray('README.md:'.padEnd(14))} ${readmeStatus}\n` +
        `${chalk.gray('.gitignore:'.padEnd(14))} ${gitignoreStatus}`,
        'cyan', '🏗️  Repo Ready'
      ));
    });
}

// ── README template ───────────────────────────────────────────────────────────
function buildReadme(name, desc) {
  const descLine = desc?.trim() ? `\n${desc.trim()}\n` : '';
  return (
    `# ${name}\n` +
    descLine +
    `\n## Getting Started\n\n` +
    `\`\`\`bash\n# clone the repo\ngit clone <your-repo-url>\n\`\`\`\n\n` +
    `## License\n\nMIT\n`
  );
}
