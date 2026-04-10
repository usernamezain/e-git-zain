#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

const git = simpleGit();
const program = new Command();

/**
 * Returns the absolute path to the .git-easy-history.json file in the git root.
 */
async function getHistoryPath() {
    try {
        const root = await git.revparse(['--show-toplevel']);
        return path.join(root.trim(), '.git', 'git-easy-history.json');
    } catch {
        return null;
    }
}

/**
 * Checks if a command exists in the current environment.
 */
function commandExists(cmd) {
    try {
        execSync(`command -v ${cmd} || where ${cmd}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Verifies if the user is authenticated and has access to the remote repo.
 */
async function ensureAuthenticated() {
    const remotes = await git.getRemotes(true);
    if (remotes.length === 0) return;

    const origin = remotes.find(r => r.name === 'origin');
    if (!origin) return;

    const spinner = ora(chalk.blue('Verifying GitHub authentication...')).start();
    try {
        await git.listRemote(['--heads', 'origin']);
        spinner.succeed(chalk.green('Authentication verified!'));
    } catch (err) {
        spinner.stop();
        console.log(chalk.yellow('\n⚠️ Authentication failed or permission denied.'));
        
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'How would you like to proceed?',
                choices: [
                    { name: 'Login using GitHub CLI (Recommended)', value: 'gh' },
                    { name: 'I will handle it manually (Paste a PAT/SSH)', value: 'manual' },
                    { name: 'Abort', value: 'abort' }
                ]
            }
        ]);

        if (action === 'abort') process.exit(1);

        if (action === 'gh') {
            if (commandExists('gh')) {
                console.log(chalk.blue('\nLaunching GitHub CLI login...'));
                spawnSync('gh', ['auth', 'login'], { stdio: 'inherit' });
                return ensureAuthenticated();
            } else {
                console.log(chalk.red('\n✖ GitHub CLI ("gh") is not installed.'));
                console.log(chalk.cyan('Download it here: https://cli.github.com/\n'));
                process.exit(1);
            }
        }

        if (action === 'manual') {
            console.log(chalk.cyan('\nTip: You can use a Personal Access Token (PAT) as your password.'));
            console.log(chalk.cyan('Generate one here: https://github.com/settings/tokens\n'));
        }
    }
}

/**
 * Ensures the repo has an origin remote. If not, asks the user to add one.
 */
async function checkAndSetupRemote() {
    const remotes = await git.getRemotes(true);
    if (remotes.length === 0) {
        console.log(chalk.yellow('\nℹ No remote found for this repository.'));
        const { setupRemote } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'setupRemote',
                message: 'Would you like to add a GitHub remote now?',
                default: true
            }
        ]);

        if (setupRemote) {
            const { remoteUrl } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'remoteUrl',
                    message: 'Enter the GitHub repository URL (e.g., https://github.com/user/repo.git):',
                    validate: (input) => input.trim().length > 0 ? true : 'Please enter a valid Git URL.'
                }
            ]);

            const spinner = ora(chalk.blue('Adding remote "origin"...')).start();
            try {
                await git.addRemote('origin', remoteUrl);
                spinner.succeed(chalk.green('Remote "origin" added successfully!'));
            } catch (err) {
                spinner.fail(chalk.red('Failed to add remote.'));
                console.error(chalk.red(`Error: ${err.message}`));
                process.exit(1);
            }
        } else {
            console.log(chalk.red('\n✖ Error: A remote is required to push code.\n'));
            process.exit(1);
        }
    }
}

/**
 * Logs a successful push event to a local JSON file in .git directory.
 */
async function logPushEvent(message, branch, hash) {
    try {
        const historyPath = await getHistoryPath();
        if (!historyPath) return;

        const timestamp = new Date().toISOString(); 
        const displayTimestamp = new Date().toLocaleString();
        const newEntry = { timestamp, displayTimestamp, message, branch, hash };

        let history = [];
        try {
            const data = await fs.readFile(historyPath, 'utf8');
            history = JSON.parse(data);
        } catch (e) {
            // File doesn't exist
        }

        if (history.length > 0 && history[0].hash === hash) return;

        history.unshift(newEntry);
        await fs.writeFile(historyPath, JSON.stringify(history.slice(0, 50), null, 2));
    } catch (err) {
        // Silently fail
    }
}

/**
 * Checks for a .gitignore file and helps the user create one if missing.
 */
async function ensureGitIgnore() {
    try {
        const root = await git.revparse(['--show-toplevel']);
        const gitIgnorePath = path.join(root.trim(), '.gitignore');

        try {
            await fs.access(gitIgnorePath);
            return; // .gitignore already exists
        } catch {
            // .gitignore does not exist
            console.log(chalk.yellow('\n🛡️  No .gitignore found in your project.'));
            const { createIgnore } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'createIgnore',
                    message: 'Would you like to create a .gitignore to keep your repo clean?',
                    default: true
                }
            ]);

            if (createIgnore) {
                const { patterns } = await inquirer.prompt([
                    {
                        type: 'checkbox',
                        name: 'patterns',
                        message: 'Select folders/files to ignore:',
                        choices: [
                            { name: 'node_modules (NPM dependencies)', value: 'node_modules/', checked: true },
                            { name: '.env (Sensitive secrets & keys)', value: '.env', checked: true },
                            { name: 'dist (Build output)', value: 'dist/' },
                            { name: 'build (Build output)', value: 'build/' },
                            { name: '.DS_Store (Mac junk files)', value: '.DS_Store' },
                            { name: 'npm-debug.log', value: 'npm-debug.log' },
                            { name: '.git-easy-history.json (Git-Easy local log)', value: '.git/git-easy-history.json' }
                        ]
                    }
                ]);

                if (patterns.length > 0) {
                    const content = patterns.join('\n') + '\n';
                    await fs.writeFile(gitIgnorePath, content);
                    console.log(chalk.green('✅ .gitignore created successfully! Your secrets are safe. 🛡️\n'));
                } else {
                    console.log(chalk.cyan('No patterns selected. Skipping .gitignore creation.\n'));
                }
            }
        }
    } catch (err) {
        // Silently fail if not in a git repo or other issues
    }
}

/**
 * Destructively restores the repository to a specific commit hash.
 */
async function restoreToState(hash, autoConfirm = false, extraWarning = false) {
    try {
        if (!autoConfirm) {
            console.log(chalk.red.bold('\n⚠️  WARNING: DESTRUCTIVE ACTION'));
            console.log(chalk.red('This will delete all unpushed changes and reset your files to this specific version.'));
            
            if (extraWarning) {
                console.log(chalk.red.bold('CRITICAL: This version is more than 30 minutes old. Proceed with caution!'));
            }

            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: chalk.yellow('Are you absolutely sure you want to redo/undo to this state?'),
                    default: false
                }
            ]);

            if (!confirm) {
                console.log(chalk.cyan('\nRestore aborted. Your files are safe.\n'));
                return false;
            }
        }

        const spinner = ora(chalk.blue(`Restoring files to ${hash.substring(0, 7)}...`)).start();
        await git.reset(['--hard', hash]);
        spinner.succeed(chalk.green('Files restored successfully! Your workspace is back in time. 🕰️'));
        return true;
    } catch (err) {
        console.error(chalk.red(`\n✖ Restore failed: ${err.message}\n`));
        return false;
    }
}

/**
 * Displays the diff for a specific commit hash.
 */
async function viewCommitDiff(hash) {
    try {
        console.log(chalk.cyan.bold(`\n📝 Showing changes for push: ${chalk.white(hash.substring(0, 7))}\n`));
        const diff = await git.show([hash, '--color=always', '--pretty=format:%B', '--compact-summary']);
        console.log(diff);
        console.log(chalk.gray('\n' + ''.padEnd(80, '-') + '\n'));
    } catch (err) {
        console.error(chalk.red(`\n✖ Could not fetch diff: ${err.message}\n`));
    }
}

/**
 * Displays a simple list of pushes without interactivity.
 */
async function listPushes() {
    try {
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            console.error(chalk.red('\n✖ Error: Not a git repository.\n'));
            return;
        }

        const historyPath = await getHistoryPath();
        if (!historyPath) {
             console.log(chalk.yellow('\nℹ No push history found for this repository.\n'));
             return;
        }

        let history = [];
        try {
            const data = await fs.readFile(historyPath, 'utf8');
            history = JSON.parse(data);
        } catch (e) {
            console.log(chalk.yellow('\nℹ No push history found for this repository.\n'));
            return;
        }

        if (history.length === 0) {
            console.log(chalk.yellow('\nℹ No push history found for this repository.\n'));
            return;
        }

        console.log(chalk.cyan.bold('\n🚀 Git-Easy Push History (List View):\n'));
        console.log(chalk.gray(''.padEnd(80, '-')));
        console.log(
            `${chalk.bold('Date & Time').padEnd(30)} | ${chalk.bold('Branch').padEnd(15)} | ${chalk.bold('Message')}`
        );
        console.log(chalk.gray(''.padEnd(80, '-')));

        history.forEach(entry => {
            const time = entry.displayTimestamp || entry.timestamp || 'Unknown';
            console.log(
                `${time.padEnd(28)} | ${chalk.green((entry.branch || 'main').padEnd(15))} | ${entry.message}`
            );
        });
        console.log(chalk.gray(''.padEnd(80, '-')) + '\n');

    } catch (err) {
        console.log(chalk.yellow('\nℹ No push history found for this repository.\n'));
    }
}

/**
 * Displays the push history in an interactive format.
 */
async function displayHistory() {
    try {
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            console.error(chalk.red('\n✖ Error: Not a git repository.\n'));
            return;
        }

        const historyPath = await getHistoryPath();
        if (!historyPath) {
             console.log(chalk.yellow('\nℹ No push history found for this repository.\n'));
             return;
        }

        let history = [];
        try {
            const data = await fs.readFile(historyPath, 'utf8');
            history = JSON.parse(data);
        } catch (e) {
            console.log(chalk.yellow('\nℹ No push history found for this repository.\n'));
            return;
        }

        if (history.length === 0) {
            console.log(chalk.yellow('\nℹ No push history found for this repository.\n'));
            return;
        }

        console.log(chalk.cyan.bold('\n🚀 Git-Easy Push History:'));

        const choices = history.map((entry) => ({
            name: `${chalk.gray((entry.displayTimestamp || entry.timestamp).padEnd(25))} | ${chalk.green((entry.branch || 'main').padEnd(10))} | ${entry.message}`,
            value: entry
        }));

        choices.push(new inquirer.Separator());
        choices.push({ name: '❌ Exit', value: 'exit' });

        const { selectedPush } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedPush',
                message: 'Select a push to view details/restore:',
                choices,
                pageSize: 15
            }
        ]);

        if (selectedPush === 'exit' || !selectedPush) return;

        if (selectedPush.hash) {
            await viewCommitDiff(selectedPush.hash);
            
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would like to do with this version?',
                    choices: [
                        { name: '🔙 Back to list', value: 'back' },
                        { name: '🕰️  Restore My Files to this Version (Undo Mistakes)', value: 'restore' },
                        { name: '❌ Exit', value: 'exit' }
                    ]
                }
            ]);

            if (action === 'back') return displayHistory();
            if (action === 'restore') {
                await restoreToState(selectedPush.hash);
            }
        } else {
            console.log(chalk.yellow('\nℹ Detailed view only available for newer pushes.\n'));
        }

    } catch (err) {
        console.error(chalk.red('\n✖ An error occurred while browsing history:'));
        console.error(chalk.gray(err.message));
    }
}

/**
 * Clears the push history from the repo.
 */
async function clearHistory() {
    try {
        const historyPath = await getHistoryPath();
        if (!historyPath) return;

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: chalk.red('Are you sure you want to clear your local push history? (This cannot be undone)'),
                default: false
            }
        ]);

        if (confirm) {
            await fs.unlink(historyPath);
            console.log(chalk.green('\n✅ Push history cleared successfully!\n'));
        }
    } catch (err) {
        console.log(chalk.yellow('\nℹ No history file found to clear.\n'));
    }
}

program
  .name('git-easy')
  .description('🚀 Git-Easy: The ultimate CLI to automate your GitHub workflow.')
  .version('2.0.0');

// Main Push Command (Default)
program
  .argument('[message]', '⚡ Commits all changes and pushes them to GitHub. If no message is given, it will ask for one.')
  .action(async (message) => {
    try {
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        console.error(chalk.red('\n✖ Error: Not a git repository.\n'));
        process.exit(1);
      }

      await checkAndSetupRemote();
      await ensureAuthenticated();
      await ensureGitIgnore();

      const status = await git.status();
      if (status.files.length === 0) {
        console.log(chalk.yellow('\nℹ No changes detected. Nothing to push.\n'));
        process.exit(0);
      }

      let commitMessage = message;
      if (!commitMessage) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'message',
            message: 'Enter commit message:',
            validate: (input) => input.trim() !== '' ? true : 'Commit message cannot be empty.'
          }
        ]);
        commitMessage = answers.message;
      }

      const spinner = ora(chalk.blue('Processing your push...')).start();

      spinner.text = chalk.blue('Staging files...');
      await git.add('.');

      spinner.text = chalk.blue('Committing changes...');
      const commitResult = await git.commit(commitMessage);
      const commitHash = commitResult.commit;

      const currentBranch = status.current || 'main';
      spinner.text = chalk.blue(`Pushing to remote (${currentBranch})...`);
      
      try {
        await git.push('origin', currentBranch);
        spinner.succeed(chalk.green('Code pushed successfully! 🚀'));
        
        await logPushEvent(commitMessage, currentBranch, commitHash);
        
      } catch (pushErr) {
        spinner.fail(chalk.red('Failed to push to remote.'));
        console.error(chalk.red(`\nError details: ${pushErr.message}`));
      }

    } catch (err) {
      console.error(chalk.red(`\n✖ An unexpected error occurred: ${err.message}\n`));
      process.exit(1);
    }
  });

// History Command (Interactive)
program
  .command('history')
  .description('📜 Opens an interactive menu to browse past pushes, view detailed code changes, or RESTORE your project to any previous version.')
  .action(displayHistory);

// List Command (Non-interactive)
program
  .command('list')
  .description('📋 Provides a simple, non-interactive table view of all recorded pushes for a quick overview.')
  .action(listPushes);

// Clear Command
program
  .command('clear')
  .description('🧹 Wipes your local Git-Easy history log. Use this if you want to start your push history tracking from scratch.')
  .action(clearHistory);

// Undo Command
program
  .command('undo')
  .description('🔙 The "Mistake Eraser". Instantly reverts all files in your project to the state of the last successful push. If you just pushed, it steps back to the push before that.')
  .action(async () => {
    try {
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            console.error(chalk.red('\n✖ Error: Not a git repository.\n'));
            process.exit(1);
        }

        const historyPath = await getHistoryPath();
        if (!historyPath) {
             console.log(chalk.yellow('\nℹ No push history found. Nothing to undo.\n'));
             return;
        }

        let history = [];
        try {
            const data = await fs.readFile(historyPath, 'utf8');
            history = JSON.parse(data);
        } catch (e) {
            console.log(chalk.yellow('\nℹ No push history found. Nothing to undo.\n'));
            return;
        }

        const latestPush = history.find(entry => entry.hash);
        if (!latestPush) {
            console.log(chalk.yellow('\nℹ No tracked pushes found to undo.\n'));
            return;
        }

        const currentHash = (await git.revparse(['HEAD'])).trim();
        let targetPush = latestPush;

        if (currentHash === latestPush.hash) {
            const previousPush = history.find((entry) => entry.hash && entry.hash !== latestPush.hash);
            if (previousPush) {
                targetPush = previousPush;
            }
        }

        console.log(chalk.cyan(`\nTargeting undo to push: "${chalk.white(targetPush.message)}" (${targetPush.displayTimestamp || targetPush.timestamp})`));
        await restoreToState(targetPush.hash);

    } catch (err) {
        console.error(chalk.red(`\n✖ Undo failed: ${err.message}\n`));
    }
  });

// Redo Command
program
  .command('redo')
  .description('⏭️ The "Forward Jumper". If you ran an "undo" by accident, this command jumps your project forward to the newer state you were previously on.')
  .action(async () => {
    try {
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            console.error(chalk.red('\n✖ Error: Not a git repository.\n'));
            process.exit(1);
        }

        const historyPath = await getHistoryPath();
        if (!historyPath) {
             console.log(chalk.yellow('\nℹ No push history found. Nothing to redo.\n'));
             return;
        }

        let history = [];
        try {
            const data = await fs.readFile(historyPath, 'utf8');
            history = JSON.parse(data);
        } catch (e) {
            console.log(chalk.yellow('\nℹ No push history found. Nothing to redo.\n'));
            return;
        }

        const currentHash = (await git.revparse(['HEAD'])).trim();
        const currentIndex = history.findIndex(entry => entry.hash === currentHash);
        
        if (currentIndex <= 0) {
            console.log(chalk.yellow('\nℹ You are already at the latest redoable state.\n'));
            return;
        }

        const targetPush = history[currentIndex - 1]; 
        const pushTime = new Date(targetPush.timestamp).getTime();
        const now = Date.now();
        const minutesDiff = (now - pushTime) / (1000 * 60);

        const extraWarning = minutesDiff > 30;

        console.log(chalk.cyan(`\nTargeting redo to push: "${chalk.white(targetPush.message)}" (${targetPush.displayTimestamp || targetPush.timestamp})`));
        await restoreToState(targetPush.hash, false, extraWarning);

    } catch (err) {
        console.error(chalk.red(`\n✖ Redo failed: ${err.message}\n`));
    }
  });

// Credits Command
program
  .command('credits')
  .description('✨ View the creators of Git-Easy.')
  .action(() => {
    console.log(chalk.cyan.bold('\n✨ Git-Easy Credits ✨'));
    console.log(chalk.white('-----------------------------------'));
    console.log(`${chalk.yellow('Principal Creator:')} ${chalk.green.bold('Zain Ali')} (for the easy work!)`);
    console.log(`${chalk.yellow('Portfolio:')} ${chalk.cyan('https://zain-mughal.vercel.app')}`);
    console.log(`${chalk.yellow('Learning:')} ${chalk.cyan('m-learn.eu.cc')}`);
    console.log(`${chalk.yellow('Developed by:')} ${chalk.blue('Antigravity AI')}`);
    console.log(chalk.white('-----------------------------------\n'));
  });

// Custom Help Text
program.addHelpText('after', `
${chalk.yellow('Credits:')}
  Created with ❤️ by ${chalk.green.bold('Zain Ali')} & Antigravity.
  Use ${chalk.cyan('git-easy credits')} to see more!
`);

program.parse(process.argv);
