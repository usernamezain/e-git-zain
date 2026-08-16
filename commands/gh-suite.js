import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ensureGhCli, getRepoFullName, ghJson, ghRun } from '../lib/github.js';
import { panel, div } from '../lib/ui.js';

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return chalk.gray('—');
  return new Date(iso).toLocaleString();
}

function stateLabel(state) {
  if (!state) return chalk.gray('unknown');
  const s = state.toLowerCase();
  if (s === 'open')        return chalk.green('● open');
  if (s === 'closed')      return chalk.red('● closed');
  if (s === 'merged')      return chalk.magenta('● merged');
  if (s === 'success')     return chalk.green('✔ success');
  if (s === 'failure')     return chalk.red('✘ failure');
  if (s === 'in_progress') return chalk.yellow('⟳ running');
  if (s === 'queued')      return chalk.blue('… queued');
  if (s === 'cancelled')   return chalk.gray('○ cancelled');
  if (s === 'skipped')     return chalk.gray('— skipped');
  return chalk.gray(state);
}

// ── Pull Request functions ────────────────────────────────────────────────────

async function listPRs() {
  const sp = ora(chalk.blue('Fetching pull requests…')).start();
  const prs = ghJson(
    'gh pr list --json number,title,state,author,createdAt,headRefName,mergeable --limit 20'
  );
  sp.stop();

  if (!prs || !prs.length) {
    console.log(chalk.yellow('\nℹ  No open pull requests found.\n'));
    return;
  }

  console.log(chalk.cyan.bold('\n🔀 Pull Requests\n'));
  console.log(chalk.gray('─'.repeat(82)));
  prs.forEach(pr => {
    const mergeFlag = pr.mergeable === 'MERGEABLE'
      ? chalk.green(' [✓ mergeable]')
      : chalk.red(' [⚠ blocked]');
    console.log(
      `  ${chalk.yellow('#' + String(pr.number).padEnd(5))} ` +
      `${stateLabel(pr.state).padEnd(22)} ` +
      `${chalk.white(pr.title.slice(0, 42).padEnd(44))}` +
      `${mergeFlag}`
    );
    console.log(
      `  ${chalk.gray('     Branch:')} ${chalk.cyan(pr.headRefName.padEnd(24))} ` +
      `${chalk.gray('by')} ${chalk.green(pr.author?.login || '—')}  ` +
      `${chalk.gray(fmtDate(pr.createdAt))}`
    );
    console.log('');
  });
  console.log(chalk.gray('─'.repeat(82)) + '\n');
}

async function viewPR() {
  const sp = ora(chalk.blue('Fetching PRs…')).start();
  const prs = ghJson('gh pr list --json number,title,state,author,headRefName --limit 20');
  sp.stop();

  if (!prs || !prs.length) { console.log(chalk.yellow('\nℹ  No open PRs.\n')); return; }

  const { prNum } = await inquirer.prompt([{
    type: 'list', name: 'prNum',
    message: 'Select a PR to view:',
    choices: prs.map(p => ({
      name: `#${p.number} — ${p.title.slice(0, 50)} [${p.headRefName}]`,
      value: p.number,
    })),
  }]);

  const sp2 = ora('Loading PR details…').start();
  const detail = ghJson(
    `gh pr view ${prNum} --json number,title,state,author,body,createdAt,headRefName,baseRefName,url,mergeable,reviews,comments`
  );
  sp2.stop();

  if (!detail) { console.log(chalk.red('\n✖  Could not load PR details.\n')); return; }

  const reviewSummary = (detail.reviews || [])
    .map(r => `${chalk.green(r.author?.login || '?')}: ${r.state}`)
    .join(', ') || chalk.gray('No reviews yet');

  console.log(panel(
    `${chalk.gray('PR:'.padEnd(14))} ${chalk.yellow('#' + detail.number)} — ${chalk.white.bold(detail.title)}\n` +
    `${chalk.gray('State:'.padEnd(14))} ${stateLabel(detail.state)}\n` +
    `${chalk.gray('Author:'.padEnd(14))} ${chalk.green(detail.author?.login || '—')}\n` +
    `${chalk.gray('Branch:'.padEnd(14))} ${chalk.cyan(detail.headRefName)} → ${chalk.cyan(detail.baseRefName)}\n` +
    `${chalk.gray('Mergeable:'.padEnd(14))} ${detail.mergeable === 'MERGEABLE' ? chalk.green('Yes ✓') : chalk.red(detail.mergeable || 'Unknown')}\n` +
    `${chalk.gray('Reviews:'.padEnd(14))} ${reviewSummary}\n` +
    `${chalk.gray('Created:'.padEnd(14))} ${chalk.white(fmtDate(detail.createdAt))}\n` +
    `${chalk.gray('URL:'.padEnd(14))} ${chalk.underline.blue(detail.url)}\n` +
    (detail.body?.trim() ? `\n${chalk.bold('Description:')}\n${chalk.white(detail.body.trim().slice(0, 500))}` : ''),
    'blue', `🔀 PR #${detail.number}`
  ));
}

async function createPR() {
  const { title, body, base, draft } = await inquirer.prompt([
    { type: 'input',   name: 'title', message: '📝 PR title:', validate: i => i.trim() ? true : 'Required' },
    { type: 'input',   name: 'body',  message: '📄 PR description (optional):', default: '' },
    { type: 'input',   name: 'base',  message: '🎯 Base branch to merge into:', default: 'main' },
    { type: 'confirm', name: 'draft', message: '📋 Create as draft PR?', default: false },
  ]);

  const sp = ora(chalk.blue('Creating pull request…')).start();
  const draftFlag = draft ? ' --draft' : '';
  // Sanitize for shell
  const safeTitle = title.replace(/"/g, '\\"');
  const safeBody  = body.replace(/"/g, '\\"');
  const result = ghRun(
    `gh pr create --title "${safeTitle}" --body "${safeBody}" --base "${base}"${draftFlag}`
  );
  sp.stop();

  if (result) {
    console.log(chalk.green('\n✅ Pull Request created!\n'));
    console.log(chalk.cyan(result.trim()) + '\n');
  } else {
    console.log(chalk.red('\n✖  PR creation failed.'));
    console.log(chalk.yellow('   Try: gh pr create (interactive mode)\n'));
  }
}

async function mergePR() {
  const sp = ora(chalk.blue('Fetching open PRs…')).start();
  const prs = ghJson('gh pr list --json number,title,state,mergeable --limit 20');
  sp.stop();

  if (!prs || !prs.length) { console.log(chalk.yellow('\nℹ  No open PRs.\n')); return; }

  const { prNum } = await inquirer.prompt([{
    type: 'list', name: 'prNum',
    message: 'Select PR to merge:',
    choices: prs.map(p => {
      const mergeStatus = p.mergeable === 'MERGEABLE'
        ? chalk.green('[✓ mergeable]')
        : chalk.red(`[⚠ ${p.mergeable || 'blocked'}]`);
      return { name: `#${p.number} — ${p.title.slice(0, 50)} ${mergeStatus}`, value: p.number };
    }),
  }]);

  const pr = prs.find(p => p.number === prNum);

  if (pr.mergeable !== 'MERGEABLE') {
    console.log(chalk.red.bold(`\n⚠️  PR #${prNum} is NOT mergeable (${pr.mergeable || 'conflict/checks failing'}).\n`));
    const { proceed } = await inquirer.prompt([{
      type: 'list', name: 'proceed',
      message: chalk.yellow('What would you like to do?'),
      choices: [
        { name: '🚀 Attempt merge anyway (may fail on GitHub)',   value: 'try' },
        { name: '🔙 Abort — fix the PR first',                    value: 'abort' },
      ],
    }]);
    if (proceed === 'abort') { console.log(chalk.cyan('\n  Aborted.\n')); return; }
  }

  const { strategy } = await inquirer.prompt([{
    type: 'list', name: 'strategy',
    message: 'Merge strategy:',
    choices: [
      { name: '🔀 Merge commit (preserve full history)',  value: '--merge' },
      { name: '🧩 Squash & merge (combine into 1 commit)', value: '--squash' },
      { name: '⏭️  Rebase & merge (linear history)',       value: '--rebase' },
    ],
  }]);

  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: chalk.yellow(`Merge PR #${prNum}?`),
    default: true,
  }]);
  if (!confirm) { console.log(chalk.cyan('\n  Aborted.\n')); return; }

  const sp2 = ora(chalk.blue(`Merging PR #${prNum}…`)).start();
  const result = ghRun(`gh pr merge ${prNum} ${strategy} --delete-branch`);
  if (result !== null) {
    sp2.succeed(chalk.green(`PR #${prNum} merged and branch deleted ✅`));
    console.log(chalk.cyan(result.trim() || '') + '\n');
  } else {
    sp2.fail(chalk.red(`Merge failed.`));
    console.log(chalk.yellow(`\n  Try manually: gh pr merge ${prNum} ${strategy}\n`));
  }
}

// ── Issues ────────────────────────────────────────────────────────────────────

async function listIssues() {
  const sp = ora(chalk.blue('Fetching issues…')).start();
  const issues = ghJson(
    'gh issue list --json number,title,state,author,createdAt,labels,assignees --limit 25'
  );
  sp.stop();

  if (!issues || !issues.length) {
    console.log(chalk.yellow('\nℹ  No open issues.\n'));
    return;
  }

  console.log(chalk.cyan.bold('\n🐛 Issues\n'));
  console.log(chalk.gray('─'.repeat(82)));
  issues.forEach(issue => {
    const labels = (issue.labels || [])
      .map(l => chalk.bgGray.white(` ${l.name} `))
      .join(' ');
    const assignees = (issue.assignees || [])
      .map(a => chalk.cyan('@' + a.login))
      .join(', ') || chalk.gray('unassigned');

    console.log(
      `  ${chalk.yellow('#' + String(issue.number).padEnd(5))} ` +
      `${chalk.white(issue.title.slice(0, 55).padEnd(57))} ` +
      `${labels}`
    );
    console.log(
      `  ${chalk.gray('     by')} ${chalk.green(issue.author?.login || '—')}  ` +
      `${chalk.gray(fmtDate(issue.createdAt))}  ${assignees}`
    );
    console.log('');
  });
  console.log(chalk.gray('─'.repeat(82)) + '\n');
}

async function createIssue() {
  const { title, body, label, assignee } = await inquirer.prompt([
    { type: 'input', name: 'title',    message: '🐛 Issue title:', validate: i => i.trim() ? true : 'Required' },
    { type: 'input', name: 'body',     message: '📄 Description (optional):', default: '' },
    { type: 'input', name: 'label',    message: '🏷️  Label (e.g. bug, enhancement — leave blank to skip):', default: '' },
    { type: 'input', name: 'assignee', message: '👤 Assign to GitHub username (leave blank to skip):', default: '' },
  ]);

  const sp = ora(chalk.blue('Creating issue…')).start();
  const safeTitle = title.replace(/"/g, '\\"');
  const safeBody  = body.replace(/"/g, '\\"');
  let cmd = `gh issue create --title "${safeTitle}" --body "${safeBody}"`;
  if (label.trim())    cmd += ` --label "${label.trim()}"`;
  if (assignee.trim()) cmd += ` --assignee "${assignee.trim()}"`;

  const result = ghRun(cmd);
  sp.stop();

  if (result) {
    console.log(chalk.green('\n✅ Issue created!\n'));
    console.log(chalk.cyan(result.trim()) + '\n');
  } else {
    console.log(chalk.red('\n✖  Issue creation failed.'));
    console.log(chalk.yellow('   Try: gh issue create (interactive mode)\n'));
  }
}

async function viewIssue() {
  const sp = ora(chalk.blue('Fetching issues…')).start();
  const issues = ghJson('gh issue list --json number,title,state,author --limit 25');
  sp.stop();

  if (!issues || !issues.length) { console.log(chalk.yellow('\nℹ  No open issues.\n')); return; }

  const { issueNum } = await inquirer.prompt([{
    type: 'list', name: 'issueNum',
    message: 'Select an issue to view:',
    choices: issues.map(i => ({
      name: `#${i.number} — ${i.title.slice(0, 60)}`,
      value: i.number,
    })),
  }]);

  const sp2 = ora('Loading issue details…').start();
  const detail = ghJson(
    `gh issue view ${issueNum} --json number,title,state,author,body,createdAt,labels,assignees,url,comments`
  );
  sp2.stop();

  if (!detail) { console.log(chalk.red('\n✖  Could not load issue details.\n')); return; }

  const labels = (detail.labels || []).map(l => chalk.bgGray.white(` ${l.name} `)).join(' ') || chalk.gray('none');
  const assignees = (detail.assignees || []).map(a => chalk.cyan('@' + a.login)).join(', ') || chalk.gray('unassigned');

  console.log(panel(
    `${chalk.gray('Issue:'.padEnd(14))} ${chalk.yellow('#' + detail.number)} — ${chalk.white.bold(detail.title)}\n` +
    `${chalk.gray('State:'.padEnd(14))} ${stateLabel(detail.state)}\n` +
    `${chalk.gray('Author:'.padEnd(14))} ${chalk.green(detail.author?.login || '—')}\n` +
    `${chalk.gray('Labels:'.padEnd(14))} ${labels}\n` +
    `${chalk.gray('Assignees:'.padEnd(14))} ${assignees}\n` +
    `${chalk.gray('Comments:'.padEnd(14))} ${chalk.white(String(detail.comments?.length || 0))}\n` +
    `${chalk.gray('Created:'.padEnd(14))} ${chalk.white(fmtDate(detail.createdAt))}\n` +
    `${chalk.gray('URL:'.padEnd(14))} ${chalk.underline.blue(detail.url)}\n` +
    (detail.body?.trim() ? `\n${chalk.bold('Description:')}\n${chalk.white(detail.body.trim().slice(0, 600))}` : ''),
    'yellow', `🐛 Issue #${detail.number}`
  ));
}

async function closeIssue() {
  const sp = ora(chalk.blue('Fetching open issues…')).start();
  const issues = ghJson('gh issue list --json number,title,state --limit 25');
  sp.stop();

  if (!issues || !issues.length) { console.log(chalk.yellow('\nℹ  No open issues.\n')); return; }

  const { issueNum } = await inquirer.prompt([{
    type: 'list', name: 'issueNum',
    message: 'Select an issue to close:',
    choices: issues.map(i => ({ name: `#${i.number} — ${i.title.slice(0, 55)}`, value: i.number })),
  }]);

  const { comment } = await inquirer.prompt([{
    type: 'input', name: 'comment',
    message: '💬 Closing comment (optional):',
    default: '',
  }]);

  const sp2 = ora(chalk.blue('Closing issue…')).start();
  let cmd = `gh issue close ${issueNum}`;
  if (comment.trim()) cmd += ` --comment "${comment.replace(/"/g, '\\"')}"`;

  const result = ghRun(cmd);
  if (result !== null) {
    sp2.succeed(chalk.green(`Issue #${issueNum} closed ✅`));
  } else {
    sp2.fail(chalk.red(`Failed to close issue #${issueNum}`));
  }
}

// ── Actions / Workflows ───────────────────────────────────────────────────────

async function listActions() {
  const sp = ora(chalk.blue('Fetching workflow runs…')).start();
  const runs = ghJson(
    'gh run list --json databaseId,name,status,conclusion,createdAt,headBranch,event --limit 15'
  );
  sp.stop();

  if (!runs || !runs.length) {
    console.log(chalk.yellow('\nℹ  No workflow runs found.\n'));
    return;
  }

  console.log(chalk.cyan.bold('\n⚙️  GitHub Actions — Recent Runs\n'));
  console.log(chalk.gray('─'.repeat(88)));
  console.log(
    `  ${'Status'.padEnd(28)} ${'Workflow'.padEnd(38)} ${'Branch'.padEnd(22)} Created`
  );
  console.log(chalk.gray('─'.repeat(88)));
  runs.forEach(run => {
    const state = run.conclusion || run.status;
    console.log(
      `  ${stateLabel(state).padEnd(28)} ` +
      `${chalk.white(run.name.slice(0, 36).padEnd(38))} ` +
      `${chalk.cyan(run.headBranch.slice(0, 20).padEnd(22))} ` +
      `${chalk.gray(fmtDate(run.createdAt))}`
    );
  });
  console.log(chalk.gray('─'.repeat(88)) + '\n');
}

async function viewActionLogs() {
  const sp = ora(chalk.blue('Fetching recent runs…')).start();
  const runs = ghJson('gh run list --json databaseId,name,status,conclusion,headBranch --limit 15');
  sp.stop();

  if (!runs || !runs.length) { console.log(chalk.yellow('\nℹ  No runs found.\n')); return; }

  const { runId } = await inquirer.prompt([{
    type: 'list', name: 'runId',
    message: 'Select a run to view logs:',
    choices: runs.map(r => ({
      name: `${r.name} — ${r.conclusion || r.status} [${r.headBranch}]`,
      value: r.databaseId,
    })),
  }]);

  console.log(chalk.cyan('\n  Opening logs in browser…\n'));
  ghRun(`gh run view ${runId} --web`);
}

async function rerunAction() {
  const sp = ora(chalk.blue('Fetching failed/cancelled runs…')).start();
  const runs = ghJson('gh run list --json databaseId,name,status,conclusion --limit 15');
  sp.stop();

  const failed = (runs || []).filter(r =>
    r.conclusion === 'failure' || r.conclusion === 'cancelled'
  );

  if (!failed.length) {
    console.log(chalk.yellow('\nℹ  No failed or cancelled runs to re-run.\n'));
    return;
  }

  const { runId } = await inquirer.prompt([{
    type: 'list', name: 'runId',
    message: 'Select a run to re-run:',
    choices: failed.map(r => ({
      name: `${r.name} (${chalk.red(r.conclusion)})`,
      value: r.databaseId,
    })),
  }]);

  const { failed: failedOnly } = await inquirer.prompt([{
    type: 'confirm', name: 'failed',
    message: 'Re-run only failed jobs? (No = re-run all jobs)',
    default: true,
  }]);

  const sp2 = ora(chalk.blue('Re-running workflow…')).start();
  const flag = failedOnly ? ' --failed' : '';
  const result = ghRun(`gh run rerun ${runId}${flag}`);
  if (result !== null) {
    sp2.succeed(chalk.green('Workflow re-run triggered ✅'));
  } else {
    sp2.fail(chalk.red('Re-run failed. Try: gh run rerun ' + runId));
  }
}

// ── Main Command ──────────────────────────────────────────────────────────────
export default function registerGhSuite(program) {
  const gh = program
    .command('github')
    .alias('gh')
    .description('🐙 GitHub hub — PRs, issues, and Actions without leaving the terminal.');

  // ── Sub-commands ─────────────────────────────────────────────────────────
  gh.command('prs').description('📋 List open pull requests').action(async () => {
    if (!ensureGhCli()) return; await listPRs();
  });
  gh.command('pr-view').description('🔍 View a PR in detail').action(async () => {
    if (!ensureGhCli()) return; await viewPR();
  });
  gh.command('pr-create').description('➕ Create a pull request').action(async () => {
    if (!ensureGhCli()) return; await createPR();
  });
  gh.command('pr-merge').description('🔀 Merge a pull request').action(async () => {
    if (!ensureGhCli()) return; await mergePR();
  });
  gh.command('issues').description('🐛 List open issues').action(async () => {
    if (!ensureGhCli()) return; await listIssues();
  });
  gh.command('issue-view').description('🔍 View an issue in detail').action(async () => {
    if (!ensureGhCli()) return; await viewIssue();
  });
  gh.command('issue-create').description('➕ Create an issue').action(async () => {
    if (!ensureGhCli()) return; await createIssue();
  });
  gh.command('issue-close').description('✅ Close an issue').action(async () => {
    if (!ensureGhCli()) return; await closeIssue();
  });
  gh.command('actions').description('⚙️  View recent workflow runs').action(async () => {
    if (!ensureGhCli()) return; await listActions();
  });
  gh.command('action-logs').description('📋 View workflow run logs').action(async () => {
    if (!ensureGhCli()) return; await viewActionLogs();
  });
  gh.command('rerun').description('🔄 Re-run a failed workflow').action(async () => {
    if (!ensureGhCli()) return; await rerunAction();
  });

  // ── Interactive hub (called with just `e-git github` or `e-git gh`) ───────
  gh.action(async () => {
    if (!ensureGhCli()) return;

    const repoName = getRepoFullName() || 'your repo';
    console.log(chalk.cyan.bold(`\n🐙 GitHub Integration Hub\n`) +
                chalk.gray(`   Repository: ${chalk.white(repoName)}\n`));

    const { section } = await inquirer.prompt([{
      type: 'list', name: 'section',
      message: 'What would you like to do?',
      choices: [
        new inquirer.Separator('── Pull Requests ──────────────────'),
        { name: '📋 List open PRs',                  value: 'prs' },
        { name: '🔍 View a PR in detail',             value: 'pr-view' },
        { name: '➕ Create a PR',                     value: 'pr-create' },
        { name: '🔀 Merge a PR',                      value: 'pr-merge' },
        new inquirer.Separator('── Issues ─────────────────────────'),
        { name: '🐛 List open issues',                value: 'issues' },
        { name: '🔍 View an issue in detail',         value: 'issue-view' },
        { name: '➕ Create an issue',                 value: 'issue-create' },
        { name: '✅ Close an issue',                  value: 'issue-close' },
        new inquirer.Separator('── GitHub Actions ──────────────────'),
        { name: '⚙️  View recent workflow runs',       value: 'actions' },
        { name: '📋 View run logs (browser)',          value: 'action-logs' },
        { name: '🔄 Re-run a failed workflow',         value: 'rerun' },
        new inquirer.Separator(),
        { name: '❌ Exit',                            value: 'exit' },
      ],
    }]);

    const map = {
      'prs':          listPRs,
      'pr-view':      viewPR,
      'pr-create':    createPR,
      'pr-merge':     mergePR,
      'issues':       listIssues,
      'issue-view':   viewIssue,
      'issue-create': createIssue,
      'issue-close':  closeIssue,
      'actions':      listActions,
      'action-logs':  viewActionLogs,
      'rerun':        rerunAction,
    };

    if (section !== 'exit' && map[section]) await map[section]();
  });
}
