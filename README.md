<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=32&duration=2800&pause=1000&color=00D9FF&center=true&vCenter=true&width=700&lines=⚡+e-git-zain+v4.0.0;The+Terminal+GitHub+Companion;Push.+Protect.+Review.+Delete.+All+in+one.;🤖+AI+coming+in+v5.0.0...;🔍+GitHub+Search+%26+CVE+Scanner+coming..." alt="Typing SVG" />

<br/>

[![npm version](https://img.shields.io/npm/v/e-git-zain?color=00D9FF&style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/e-git-zain)
[![npm downloads](https://img.shields.io/npm/dm/e-git-zain?color=22C55E&style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/e-git-zain)
[![Tests](https://img.shields.io/badge/tests-33%20passing-22C55E?style=for-the-badge&logo=vitest&logoColor=white)](./tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-22C55E?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)

<br/>

> **Push, protect, branch, stash, manage PRs, delete repos, run a TUI dashboard — all from one beautiful terminal tool.**
> No browser. No switching apps. Just your terminal.

</div>

---

## 📦 Installation

```bash
npm install -g e-git-zain
```

Two global aliases are registered automatically:

```bash
e-git --help        # primary alias
git-easy --help     # secondary alias
```

---

## ⚡ The 1-Command Workflow

```bash
e-git "feat: add dark mode"
```

That single command does **all of this**:

```
  🔐 Scan for secrets in changed files
  🛡️  Run pre-push checks (lint / test) if configured
  📂 Show you what's changed
  ✏️  Stage everything (git add .)
  💬 Commit with your message
  🚀 Push to remote with --set-upstream
  📋 Log the push to history (for undo/redo)
  📦 Print a success panel with branch, hash, message, time
```

---

## 🗺️ Command Map

```mermaid
mindmap
  root((e-git))
    🚀 Push
      Commit & push
      --force flag
      Secret scan shield
      Pre-push checks
    💣 Nuke
      Force push
      Delete branch
      Delete remote repo
    🐙 GitHub Hub
      Pull Requests
        List
        View
        Create
        Merge
      Issues
        List
        View
        Create
        Close
      Actions
        List runs
        View logs
        Re-run failed
    🖥️ Dashboard
      Status panel
      Branch list
      Commit log
      Stash list
      Push history
      Actions panel
      Quick actions
    🌿 Branch
      Create
      Switch
      Rename
      Delete
      Push to remote
    📦 Stash
      Save
      List
      Pop
      Apply
      Drop
      Clear all
    ⬇️ Pull
      Smart stash
      Pull
      Restore stash
      Conflict report
    📜 History
      Browse pushes
      View diff
      Restore state
      Undo last push
      Redo after undo
    🛠️ Utilities
      init wizard
      tag releases
      clone smart
      status rich
      diff visual
      schedule auto
      credits
```

---

## 📋 Full Command Reference

| Command | Alias | Description |
|---|---|---|
| `e-git [message]` | | ⚡ Stage → secret scan → commit → push |
| `e-git [message] --force` | `-f` | 💣 Force push with safety confirmation |
| `e-git nuke` | | 💣 Nuclear options menu (force push / delete) |
| `e-git nuke --force-push` | | 🚀 Force push current branch |
| `e-git nuke --delete-branch` | | 🌿 Delete a local + remote branch |
| `e-git nuke --repo` | | 💀 Permanently delete remote GitHub repo |
| `e-git github` | `e-git gh` | 🐙 GitHub hub — PRs, issues, actions |
| `e-git github prs` | | 📋 List open pull requests |
| `e-git github pr-view` | | 🔍 View a PR in detail |
| `e-git github pr-create` | | ➕ Create a pull request |
| `e-git github pr-merge` | | 🔀 Merge a PR (with strategy picker) |
| `e-git github issues` | | 🐛 List open issues |
| `e-git github issue-view` | | 🔍 View an issue in detail |
| `e-git github issue-create` | | ➕ Create an issue |
| `e-git github issue-close` | | ✅ Close an issue |
| `e-git github actions` | | ⚙️ View recent workflow runs |
| `e-git github action-logs` | | 📋 View workflow run logs in browser |
| `e-git github rerun` | | 🔄 Re-run a failed workflow |
| `e-git dashboard` | `e-git dash` | 🖥️ Full TUI dashboard |
| `e-git branch` | | 🌿 Interactive branch manager |
| `e-git diff` | | 🔍 Visual colored diff |
| `e-git diff --staged` | `-s` | 🔍 Staged-only diff |
| `e-git pull` | | ⬇️ Smart pull with auto-stash |
| `e-git pull --rebase` | | ⬇️ Pull with rebase strategy |
| `e-git init` | | 🏗️ Guided repo initialization wizard |
| `e-git tag` | | 🏷️ Create & push semver release tags |
| `e-git clone <url>` | | 📥 Smart clone (auto-install + VS Code) |
| `e-git status` | | 📊 Rich status dashboard |
| `e-git stash` | | 📦 Interactive stash manager |
| `e-git pr` | | 🔗 Open Pull Request in browser |
| `e-git schedule` | | ⏱️ Auto-commit on file change |
| `e-git schedule -i <min>` | | ⏱️ Auto-commit every N minutes |
| `e-git history` | | 📜 Browse & restore past pushes |
| `e-git list` | | 📋 Table view of push history |
| `e-git undo` | | 🔙 Revert to last pushed state |
| `e-git redo` | | ⏭️ Jump forward after undo |
| `e-git clear` | | 🧹 Clear local push history log |
| `e-git credits` | | ✨ View creators |

---

## 🛡️ Safety Shields (v4.0.0)

Every `e-git push` runs two shields **before** staging anything:

### Shield 1 — Secret Scanner

Scans all changed files for 13 secret patterns:

```mermaid
flowchart LR
    A[🚀 e-git push] --> B{Secret Scan}
    B -->|CLEAN ✓| C[Pre-push Checks]
    B -->|SECRETS FOUND ⚠️| D[Show alert]
    D --> E{User choice}
    E -->|Abort| F[❌ Push blocked]
    E -->|Continue anyway| C
    C -->|No scripts| G[Stage & Commit]
    C -->|lint / test chosen| H[Run checks]
    H -->|Pass ✓| G
    H -->|Fail| I{Continue?}
    I -->|No| F
    I -->|Yes| G
    G --> J[🚀 Push]
    J --> K[📋 Log to history]
```

**Patterns detected:**

| Pattern | Example |
|---|---|
| AWS Access Key | `AKIA[0-9A-Z]{16}` |
| AWS Secret Key | `aws_secret_access_key = …` |
| GitHub Token | `ghp_…` |
| GitHub Fine-Grained PAT | `github_pat_…` |
| Generic API Key | `api_key = "…"` |
| RSA / EC / OPENSSH Private Key | `-----BEGIN RSA PRIVATE KEY-----` |
| Slack Token | `xoxb-…` |
| Stripe Secret Key | `sk_live_…` |
| Stripe Publishable Key | `pk_live_…` |
| Password in config | `password = "…"` |
| MongoDB connection string | `mongodb://user:pass@host` |
| JWT Secret | `jwt_secret = "…"` |
| SendGrid API Key | `SG.…` |

### Shield 2 — Pre-Push Checks

If your project has `lint` or `test` scripts in `package.json`, you're offered to run them before pushing. You choose which to run — or skip.

```
🛡️  Pre-push checks detected. Select which to run:
❯ 🔍 lint  — npm run lint
  🧪 tests — npm test
  ⏭️  Skip all checks
```

---

## 💣 Nuclear Options (`e-git nuke`)

```bash
e-git nuke               # interactive menu
e-git nuke --force-push  # force push current branch
e-git nuke --delete-branch [name]   # delete local + remote branch
e-git nuke --repo        # permanently delete the GitHub repository
```

```mermaid
flowchart TD
    A[e-git nuke] --> B{Action?}
    B -->|Force Push| C[Type branch name\nto confirm]
    C -->|Confirmed| D[git push --force-with-lease]
    B -->|Delete Branch| E[Pick branch]
    E --> F[Confirm]
    F --> G[Delete local + remote]
    B -->|Delete Repo| H[2-step confirmation\nType repo name]
    H -->|Confirmed| I[gh repo delete --yes]
    D & G & I --> J[✅ Result panel]
```

> ⚠️ Repo deletion requires `gh` CLI installed and authenticated (`gh auth login`)

---

## 🐙 GitHub Hub (`e-git github`)

A full GitHub management terminal — no browser needed.

```bash
e-git github            # interactive hub menu
e-git gh prs            # list open PRs
e-git gh pr-create      # create a PR
e-git gh pr-merge       # merge a PR (with strategy picker)
e-git gh issues         # list issues
e-git gh actions        # view recent workflow runs
e-git gh rerun          # re-run a failed workflow
```

**PR merge flow:**

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant T as 🖥️ Terminal
    participant G as 🐙 GitHub

    U->>T: e-git gh pr-merge
    T->>G: gh pr list
    G-->>T: [PR list + mergeable status]
    T->>U: Show PRs (⚠️ blocked ones flagged)
    U->>T: Pick PR
    alt Not mergeable
        T->>U: ⚠️ PR is blocked — proceed anyway?
        U->>T: Yes / Abort
    end
    T->>U: Pick strategy (Merge / Squash / Rebase)
    U->>T: Confirm
    T->>G: gh pr merge --squash --delete-branch
    G-->>T: Success
    T->>U: ✅ Merged + branch deleted
```

---

## 🖥️ TUI Dashboard (`e-git dashboard`)

```bash
e-git dashboard     # full dashboard
e-git dash          # short alias
e-git dash --no-actions   # skip Actions panel (faster)
```

The dashboard renders all sections automatically:

```
  ╔══════════════════════════════════════════════════════════════════╗
  ║  🖥️   E-GIT DASHBOARD                                   v4.0.0  ║
  ║  Branch: main                                                    ║
  ╚══════════════════════════════════════════════════════════════════╝

📊  Status
══════════════════════════════════════════════════════════════════
  Branch:   main   ↑2 ahead   ↓0 behind
  State:    ⚡ 3 file(s) changed

  ● Staged (ready to commit):
    + src/dashboard.js

  ● Modified (not staged):
    ~ README.md

🌿  Branches
══════════════════════════════════════════════════════════════════
  ▶ main  ← current
  · feature/login
  · fix/auth-bug

📜  Recent Commits
══════════════════════════════════════════════════════════════════
  ◆ 2afbaaf  feat: v4.0.0 - safety shields, nuke, GitHub hub
  · c29bead  fix: pre-push hook handler
  · 8a3e52f  feat: vitest suite - 33 tests passing

📦  Stashes
══════════════════════════════════════════════════════════════════
  [0] WIP — login page styling

🕰️   Push History
══════════════════════════════════════════════════════════════════
  ◆ 8/17/2026, 12:19 AM    main      feat: v4.0.0 - safety shields…

⚙️   GitHub Actions — Recent Runs
══════════════════════════════════════════════════════════════════
  ✔  CI — Node.js Tests       main
  ✔  Publish to npm           main

─────────────────────────────────────────────────────────────────
🎛️  Quick action:
❯ 🔄 Refresh dashboard
  🌿 Branch manager
  🐙 GitHub hub
  💣 Nuclear options
  ❌ Exit
```

---

## 🌿 Branch Manager (`e-git branch`)

```bash
e-git branch
```

| Action | What it does |
|---|---|
| **Create new branch** | Prompts for name → creates → optionally switches |
| **Switch branch** | Pick from list → one-step switch |
| **Rename current branch** | Enter new name → rename in place |
| **Delete a branch** | Pick from list → normal or force delete |
| **Push current branch** | Push with `--set-upstream` |
| **Exit** | Return to terminal |

---

## ⬇️ Smart Pull (`e-git pull`)

```mermaid
flowchart LR
    A[e-git pull] --> B{Local changes?}
    B -->|Yes| C[Auto-stash with timestamp]
    B -->|No| D[git pull]
    C --> D
    D --> E{Merge conflicts?}
    E -->|Yes| F[🔥 List conflicting files\nShow resolution tips]
    E -->|No| G[Pop stash]
    C --> G
    G --> H[✅ Show pull summary panel]
```

---

## 📦 Stash Manager (`e-git stash`)

```bash
e-git stash
```

| Action | What it does |
|---|---|
| **Save** | Stash with custom name (default: `stash-<timestamp>`) |
| **List** | All stashes with index, name, date |
| **Pop** | Restore latest stash and remove it |
| **Apply** | Pick stash by index → apply without removing |
| **Drop** | Pick stash by index → permanently delete |
| **Clear** | Delete ALL stashes (requires confirmation) |

---

## ⏱️ Auto-Schedule (`e-git schedule`)

```bash
e-git schedule                    # watch for file changes → auto-push after 2s debounce
e-git schedule -i 30              # push every 30 minutes
e-git schedule -p "💾 WIP save"   # custom commit message prefix
```

| Flag | Description | Default |
|---|---|---|
| `-i, --interval <minutes>` | Push every N minutes | (file watch mode) |
| `-p, --prefix <msg>` | Commit message prefix | `⏱️ Auto-save` |

Ignores: `.git/`, `node_modules/`, `dist/`, `build/`

---

## 📜 History & Time Travel

```bash
e-git history     # interactive browser — pick any push, view diff, or restore
e-git list        # plain table view of all logged pushes
e-git undo        # revert files to last pushed state
e-git redo        # jump forward after an undo
e-git clear       # wipe local push history log
```

**History table output:**

```
──────────────────────────────────────────────────────────────────────
Date & Time               Branch         Message
──────────────────────────────────────────────────────────────────────
8/17/2026, 12:19 AM       main           feat: v4.0.0 safety shields
8/16/2026, 11:43 PM       main           fix: pre-push handler
8/16/2026, 10:01 PM       feature/login  feat: add login component
──────────────────────────────────────────────────────────────────────
```

> Push history is stored at `.git/git-easy-history.json` — inside `.git` so it is **never committed**.

---

## 🧪 Test Suite (Vitest)

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

**33 tests across 2 test files — all passing:**

```
 ✓ tests/lib/safety.test.js  (21 tests)
   Secret Scanner — Detection         14 ✓
   Secret Scanner — False Positives    6 ✓
   Secret Scanner — Multiple patterns  1 ✓

 ✓ tests/lib/history.test.js (12 tests)
   readHistory edge cases              3 ✓
   writeHistory & readHistory          3 ✓
   logPush behavior                    6 ✓

 Test Files  2 passed (2)
 Tests      33 passed (33)
 Duration   1.43s
```

---

## 🏗️ Project Structure

```
e-git-zain/                         v4.0.0
├── index.js                        Entry point — imports & registers all commands
├── package.json
├── vitest.config.js                Vitest test configuration
├── lib/
│   ├── git.js                      simpleGit, auth check, remote setup, .gitignore helper
│   ├── ui.js                       banner, panel(), div(), badge(), fileIcon()
│   ├── history.js                  historyPath(), readHistory(), writeHistory(), logPush()
│   ├── safety.js               ★   Secret scanner + pre-push check runner [v4.0.0]
│   └── github.js               ★   gh CLI wrapper: ensureGhCli, ghJson, ghRun [v4.0.0]
├── commands/
│   ├── push.js                     Default push + safety shields + --force flag
│   ├── nuke.js                 ★   Force push / delete branch / delete repo [v4.0.0]
│   ├── gh-suite.js             ★   GitHub hub: PRs, issues, actions [v4.0.0]
│   ├── dashboard.js            ★   TUI full-repo dashboard [v4.0.0]
│   ├── branch.js                   Branch manager
│   ├── diff.js                     Visual diff
│   ├── pull.js                     Smart pull
│   ├── init.js                     Init wizard
│   ├── tag.js                      Release tags
│   ├── clone.js                    Smart clone
│   ├── status.js                   Status dashboard
│   ├── stash.js                    Stash manager
│   ├── pr.js                       PR opener (browser)
│   ├── schedule.js                 Auto-commit
│   ├── history.js                  history + list + clear
│   └── undoredo.js                 undo + redo
└── tests/
    ├── lib/safety.test.js      ★   21 secret scanner tests [v4.0.0]
    └── lib/history.test.js     ★   12 history module tests [v4.0.0]

★ = Added in v4.0.0
```

---

## 🛠️ Tech Stack

| Package | Purpose |
|---|---|
| [commander](https://github.com/tj/commander.js) | CLI argument parsing & subcommands |
| [simple-git](https://github.com/steveukx/git-js) | All git operations |
| [inquirer](https://github.com/SBoudrias/Inquirer.js) | Interactive terminal prompts |
| [chalk](https://github.com/chalk/chalk) | Terminal colors & styling |
| [ora](https://github.com/sindresorhus/ora) | Elegant loading spinners |
| [boxen](https://github.com/sindresorhus/boxen) | Rounded info panels |
| [open](https://github.com/sindresorhus/open) | Open URLs in default browser |
| [chokidar](https://github.com/paulmillr/chokidar) | Cross-platform file watcher |
| [vitest](https://vitest.dev) | Fast unit & integration test runner |
| `gh` CLI (optional) | Required for `nuke --repo`, `e-git github` commands |

---

## 🔐 Authentication

`e-git` uses your system's existing git credentials. If authentication fails, it offers:

1. **GitHub CLI** (`gh auth login`) — recommended, interactive OAuth
2. **Personal Access Token (PAT)** — generate at [github.com/settings/tokens](https://github.com/settings/tokens)
3. **Abort** — exit safely

---

## 🗂️ Changelog

### v4.0.0 — Safety, Power & GitHub Integration
- ✅ **Secret Scanner** — 13-pattern scanner runs before every push
- ✅ **Pre-push Checks** — lint/test runner shield integrated into push
- ✅ **`e-git --force` / `e-git nuke --force-push`** — force push with safety confirmation
- ✅ **`e-git nuke --delete-branch`** — delete local + remote branch interactively
- ✅ **`e-git nuke --repo`** — permanently delete a GitHub repository (2-step confirmation)
- ✅ **`e-git github` (`e-git gh`)** — full GitHub hub: PRs, issues, Actions — no browser
- ✅ **`e-git dashboard` (`e-git dash`)** — TUI overview: status, branches, commits, stashes, history, Actions
- ✅ **Vitest test suite** — 33 tests across secret scanner and history module

### v3.0.0
- Added `schedule`, `stash`, `clone`, `tag`, `diff`, `pull`, `init`, `status`
- Added `history`, `undo`, `redo`, `clear`
- Added `branch` manager, `pr` opener

### v2.0.0
- Added `lib/` modular architecture, `ora` spinners, `boxen` panels

### v1.0.0
- Initial release — `e-git [message]` commit & push

---

## 🔮 What's Coming — v5.0.0 (AI + Search)

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=18&duration=3000&pause=800&color=A855F7&center=true&vCenter=true&width=700&lines=🤖+AI+commit+messages...;🔍+Search+any+GitHub+repo+from+CLI...;🛡️+Scan+for+CVEs+%26+vulnerabilities...;📊+AI-powered+code+review+in+terminal..." alt="Coming soon" />

</div>

> These features are **actively being designed**. The architecture below shows exactly how each will work.

---

### 🤖 Feature 1 — AI-Powered Commit Messages & Code Review

```bash
e-git ai          # AI hub — pick what you want AI to do
e-git ai commit   # AI generates your commit message from the diff
e-git ai review   # AI reviews your staged changes inline in the terminal
e-git ai explain  # AI explains the last N commits in plain English
```

**How it works:**

```mermaid
sequenceDiagram
    participant U as 👤 You
    participant T as 🖥️ Terminal
    participant A as 🤖 AI (Gemini / GPT)
    participant G as 📦 Git

    U->>T: e-git ai commit
    T->>G: git diff --staged
    G-->>T: Raw diff output
    T->>A: "Here is the diff — write a commit message"
    A-->>T: "feat(auth): add JWT token refresh with 15-min expiry"
    T->>U: Show AI message + options:
    note over T,U: ✅ Use this  ✏️ Edit  🔄 Regenerate  ❌ Write my own
    U->>T: ✅ Use this
    T->>G: git commit -m "feat(auth): add JWT token refresh…"
    G-->>T: Committed ✓
    T->>U: 🚀 Ready to push!
```

**What AI can do in v5.0.0:**

| Command | What AI does | Model |
|---|---|---|
| `e-git ai commit` | Reads `git diff --staged` → generates a semantic commit message (feat/fix/chore/docs) | Gemini Flash / GPT-4o-mini |
| `e-git ai review` | Reads staged diff → gives line-by-line suggestions (bugs, style, security) | Gemini Pro / GPT-4o |
| `e-git ai explain` | Reads last N commits → writes a plain-English changelog summary | Gemini Flash |
| `e-git ai pr-description` | Reads branch diff vs main → drafts PR title + body | Gemini Pro |

**Example terminal output for `e-git ai commit`:**

```
🤖 Analyzing your diff with AI...

  Staged changes detected:
    ~ src/auth/token.js       (+42 lines)
    ~ src/middleware/guard.js  (+18 lines)
    + tests/auth.test.js      (+67 lines)

  ✨ AI-suggested commit message:

  ┌─────────────────────────────────────────────────────────────────┐
  │  feat(auth): add JWT refresh token rotation with 15-min TTL     │
  │                                                                 │
  │  - Implement token refresh endpoint in middleware/guard.js      │
  │  - Add expiry validation and rotation logic in auth/token.js    │
  │  - Cover both happy path and expiry edge cases in tests         │
  └─────────────────────────────────────────────────────────────────┘

  ❯ ✅ Use this message
    ✏️  Edit before using
    🔄 Regenerate (different style)
    ❌ Write my own message
```

> **AI is opt-in, never forced.** You can skip it at any prompt or configure a default model and API key in `~/.egitrc`.

---

### 🔍 Feature 2 — GitHub Repo Search & CVE Vulnerability Scanner

```bash
e-git search <query>              # search GitHub repos by keyword
e-git search <query> --sort stars # sort by stars, forks, or updated
e-git search <query> --lang js    # filter by language
e-git vuln                        # scan your current project for known CVEs
e-git vuln <package>              # look up a specific npm package for CVEs
e-git vuln --repo <github-url>    # scan any public GitHub repo for vulnerabilities
```

**Full data flow:**

```mermaid
flowchart TD
    A[👤 User] -->|e-git search react dashboard| B[Parse query + filters]
    B --> C[GitHub Search API]
    C --> D{Results}
    D --> E[📋 Render result table]
    E --> F{Pick a repo}
    F -->|View details| G[Show stars, forks,
last commit, license,
top contributors]
    F -->|Clone it| H[e-git clone the repo
auto-install + VS Code]
    F -->|Scan for vulns| I[🛡️ CVE Scanner]

    A2[👤 User] -->|e-git vuln| J[Read package.json
dependencies]
    J --> K[Query OSV.dev / Snyk / GitHub Advisory DB]
    K --> L{Vulnerabilities found?}
    L -->|None ✓| M[✅ All dependencies clean]
    L -->|Found ⚠️| N[Show CVE table:
package · severity · CVE ID · fix version]
    N --> O{User choice}
    O -->|Auto-fix| P[npm audit fix]
    O -->|View details| Q[Open CVE advisory in browser]
    O -->|Export report| R[Save vuln-report.json]
```

**`e-git search` — what the output looks like:**

```
🔍 Searching GitHub for: "react dashboard admin"
   Filters: language=javascript  sort=stars

──────────────────────────────────────────────────────────────────────────────
 #   Repository                          ⭐ Stars   🍴 Forks   Updated
──────────────────────────────────────────────────────────────────────────────
 1   marmelab/react-admin                24,100     5,280     2 days ago
 2   ant-design/ant-design-pro           36,700     8,100     4 hours ago
 3   creativetimofficial/material-dash   11,200     1,890     1 week ago
 4   apexcharts/apexcharts-react          3,400       420     3 days ago
 5   recharts/recharts                   23,900     1,740     1 day ago
──────────────────────────────────────────────────────────────────────────────

❯ 📄 View details for a repo
  📥 Clone a repo
  🛡️  Scan a repo for vulnerabilities
  🔎 New search
  ❌ Exit
```

**`e-git vuln` — vulnerability scan output:**

```
🛡️  Scanning your project dependencies for known CVEs...
   Reading package.json — 42 direct dependencies found
   Querying GitHub Advisory Database + OSV.dev...

──────────────────────────────────────────────────────────────────────────
 Package          Version   Severity   CVE ID            Fix Available
──────────────────────────────────────────────────────────────────────────
 ⚠️  axios          0.21.1    HIGH       CVE-2023-45857    0.28.0 ✓
 ⚠️  lodash         4.17.15   MEDIUM     CVE-2021-23337    4.17.21 ✓
 ⚠️  minimatch      3.0.4     HIGH       CVE-2022-3517     3.1.2 ✓
 ✅  chalk          5.3.0     —          Clean             —
 ✅  commander      12.1.0    —          Clean             —
──────────────────────────────────────────────────────────────────────────
 3 vulnerabilities found  (2 HIGH · 1 MEDIUM)

❯ 🔧 Auto-fix all (npm audit fix)
  📋 Export report as vuln-report.json
  🌐 View CVE details in browser
  ❌ Exit
```

**Vulnerability data sources (v5.0.0 plan):**

| Source | What it covers |
|---|---|
| [GitHub Advisory Database](https://github.com/advisories) | npm, PyPI, Maven, Go, Rust — official GitHub CVE data |
| [OSV.dev](https://osv.dev) | Google's open-source vulnerability DB — broad ecosystem coverage |
| `npm audit` | Local npm vulnerability check — instant, no API key required |
| [Snyk API](https://snyk.io) | Deep dependency tree analysis (optional, requires Snyk token) |

---

### 🗓️ v5.0.0 Roadmap

```mermaid
gantt
    title e-git v5.0.0 Development Roadmap
    dateFormat  YYYY-MM-DD
    section 🔍 Search Engine
    GitHub Repo Search API         :active, s1, 2026-09-01, 14d
    Result TUI table renderer      :s2, after s1, 7d
    Clone from search results      :s3, after s2, 5d
    section 🛡️ Vulnerability Scanner
    npm audit integration          :v1, 2026-09-01, 7d
    GitHub Advisory DB connector   :v2, after v1, 10d
    OSV.dev connector              :v3, after v2, 7d
    CVE report exporter            :v4, after v3, 5d
    section 🤖 AI Engine
    AI commit message generator    :a1, 2026-09-15, 10d
    AI diff reviewer               :a2, after a1, 10d
    AI PR description writer       :a3, after a2, 7d
    AI explain commits             :a4, after a3, 5d
    section 📦 Release
    v5.0.0 publish to npm          :r1, 2026-10-20, 3d
```

> 🌟 **Follow the repo** and ⭐ star it to get notified when v5.0.0 drops.
> Join the community for early previews: 👉 [WhatsApp Channel](https://whatsapp.com/channel/0029VbBUVv35fM5eAnXw3w2D)

---

## 👨‍💻 Credits

Made with ❤️ by **[Zain Ali](https://zain-mughal.vercel.app)**  
Community: **mugha.dev community**  
Learning platform: **[m-learn.eu.cc](https://m-learn.eu.cc)**

✨ **Join for more exclusive drops:**  
👉 [WhatsApp Channel](https://whatsapp.com/channel/0029VbBUVv35fM5eAnXw3w2D)

---

## 📄 License

MIT © Zain Ali — see [LICENSE](LICENSE) for full text.
