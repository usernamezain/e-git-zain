#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

import registerPush   from './commands/push.js';
import registerBranch from './commands/branch.js';
import registerDiff   from './commands/diff.js';
import registerPull   from './commands/pull.js';
import registerInit   from './commands/init.js';
import registerTag    from './commands/tag.js';
import registerClone  from './commands/clone.js';
import registerStatus from './commands/status.js';
import registerStash  from './commands/stash.js';
import registerPR     from './commands/pr.js';
import registerSchedule from './commands/schedule.js';
import { registerHistory, registerList, registerClear } from './commands/history.js';
import { registerUndo, registerRedo } from './commands/undoredo.js';

const program = new Command();

program
  .name('git-easy')
  .description(chalk.cyan('⚡ Git-Easy v3.0.1 — The ultimate GitHub CLI companion'))
  .version('3.0.1');

// ── Core ───────────────────────────────────────────────────────────────────────
registerPush(program);      // e-git [message]       — commit & push

// ── New Features ───────────────────────────────────────────────────────────────
registerBranch(program);    // e-git branch          — branch manager
registerDiff(program);      // e-git diff            — visual diff
registerPull(program);      // e-git pull            — smart pull
registerInit(program);      // e-git init            — repo wizard
registerTag(program);       // e-git tag             — release tags
registerClone(program);     // e-git clone <url>     — smart clone
registerStatus(program);    // e-git status          — rich dashboard
registerStash(program);     // e-git stash           — stash manager
registerPR(program);        // e-git pr              — open PR in browser
registerSchedule(program);  // e-git schedule        — auto-commit/push

// ── History & Restore ──────────────────────────────────────────────────────────
registerHistory(program);   // e-git history
registerList(program);      // e-git list
registerClear(program);     // e-git clear
registerUndo(program);      // e-git undo
registerRedo(program);      // e-git redo

// ── Credits ────────────────────────────────────────────────────────────────────
program.command('credits').description('✨ View the creators.').action(() => {
  console.log(chalk.cyan.bold('\n✨ Git-Easy Credits\n'));
  console.log(`  ${chalk.yellow('Creator:')}   ${chalk.green.bold('Zain Ali')}`);
  console.log(`  ${chalk.yellow('Portfolio:')} ${chalk.cyan('https://zain-mughal.vercel.app')}`);
  console.log(`  ${chalk.yellow('Learning:')}  ${chalk.cyan('m-learn.eu.cc')}`);
  console.log(`  ${chalk.yellow('Built by:')}  ${chalk.blue('Antigravity AI')}\n`);
});

program.addHelpText('after', `\n${chalk.yellow('  Created with ❤️  by')} ${chalk.green.bold('Zain Ali')} & Antigravity.\n`);
program.parse(process.argv);
