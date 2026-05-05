<div align="center">

# ⚡ Git-Easy (`e-git`)

**v3.0.0 · The ultimate CLI to automate your entire GitHub workflow**

Push, pull, branch, diff, stash, open PRs, auto-commit on schedule — all from one beautiful terminal tool.

[![npm](https://img.shields.io/npm/v/e-git-zain?color=cyan&style=flat-square)](https://www.npmjs.com/package/e-git-zain)
[![npm downloads](https://img.shields.io/npm/dm/e-git-zain?color=green&style=flat-square)](https://www.npmjs.com/package/e-git-zain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)

</div>

---

## 📦 Installation

```bash
npm install -g e-git-zain
```

After install, two aliases are available:

```bash
e-git --help
git-easy --help
```

---

## ⚡ Quick Start

```bash
e-git "your commit message"
```

That's it — stages everything, commits, and pushes to your remote in one shot.

---

## 📋 Commands at a Glance

| Command | Description |
|---|---|
| `e-git [message]` | ⚡ Stage → commit → push to GitHub |
| `e-git branch` | 🌿 Interactive branch manager |
| `e-git diff [-s]` | 🔍 Visual colored diff |
| `e-git pull [--rebase]` | ⬇️ Smart pull with auto-stash |
| `e-git init` | 🏗️ Guided repo initialization wizard |
| `e-git tag` | 🏷️ Create & push semver release tags |
| `e-git clone <url> [-d dir]` | 📥 Smart clone with auto-install |
| `e-git status` | 📊 Rich status dashboard |
| `e-git stash` | 📦 Interactive stash manager |
| `e-git pr [--base branch]` | 🔗 Open Pull Request in browser |
| `e-git schedule [-i min] [-p prefix]` | ⏱️ Auto-commit on file change or interval |
| `e-git history` | 📜 Browse & restore past pushes (interactive) |
| `e-git list` | 📋 Table view of push history |
| `e-git undo` | 🔙 Revert files to last pushed state |
| `e-git redo` | ⏭️ Jump forward after an undo |
| `e-git clear` | 🧹 Clear local push history log |
| `e-git credits` | ✨ View the creators |

---

## 🔍 Detailed Feature Reference

---

### ⚡ Push (Default Command)

```bash
e-git "feat: add login page"
e-git                          # will prompt for commit message
```

**What happens step by step:**

1. Checks you're in a valid git repository
2. Verifies a remote (`origin`) exists — offers to add one if missing
3. Verifies GitHub authentication (offers GitHub CLI login or PAT guidance if it fails)
4. Checks for a `.gitignore` file — offers to generate one from a checklist if missing
5. Scans for changed files and displays a **color-coded preview**:
   - 🔴 `+` Untracked new files
   - 🟡 `~` Modified files
   - 🟢 `✓` Staged files
6. Prompts for a commit message if none was provided
7. Stages all files (`git add .`)
8. Creates the commit
9. **Auto-detects if you're on `master`** — asks if you want to rename it to `main` before pushing
10. Pushes with `--set-upstream` so tracking is always configured
11. Displays a **success panel** (boxen) showing:
    - Branch name
    - Short commit hash
    - Commit message
    - Time of push
12. Logs the push to local history (for undo/redo/history commands)

**Smart behaviors:**
- If nothing has changed, exits cleanly with an info message
- If push fails, shows the full error detail
- Truncates file list display at 12 files with `+N more` hint

---

### 🌿 Branch — Interactive Branch Manager

```bash
e-git branch
```

Opens an **interactive menu** showing all local branches (with the current branch highlighted in green). Then presents these options:

| Action | What it does |
|---|---|
| **Create new branch** | Prompts for name, creates it, optionally switches to it immediately |
| **Switch branch** | Lists all other branches — select and switch in one step |
| **Rename current branch** | Prompts for a new name, renames in place |
| **Delete a branch** | Select from list, choose normal or force delete |
| **Push current branch to remote** | Pushes with `--set-upstream` so tracking is set |
| **Exit** | Returns to terminal |

**Visual output:** A `boxen` panel lists all branches before the menu appears, so you always know where you stand.

---

### 🔍 Diff — Visual Colored Diff

```bash
e-git diff            # show all working directory changes
e-git diff --staged   # show only staged (index) changes
e-git diff -s         # shorthand for --staged
```

**Output includes two sections:**

1. **📊 Summary block** — file-by-file stat line with `+` additions (green) and `-` deletions (red)
2. **📄 Full diff** — line-by-line color coding:
   - 🟢 Green — added lines
   - 🔴 Red — removed lines
   - 🔵 Cyan — hunk headers (`@@`)
   - 🟡 Yellow — diff file headers
   - Gray — context lines

If there are no changes to show, exits with a clean `ℹ No changes` message.

---

### ⬇️ Pull — Smart Pull

```bash
e-git pull
e-git pull --rebase   # pull using rebase strategy instead of merge
```

**Smart stash workflow:**
1. Detects if you have unsaved local changes
2. **Auto-stashes** them with a timestamped name before pulling
3. Pulls from `origin/<current-branch>`
4. Shows a **pull summary panel** (files changed, insertions, deletions)
5. **Automatically pops the stash** to restore your work

**Conflict detection:**
- If the pull produces merge conflicts, lists every conflicting file with a 🔥 warning
- Shows resolution tips:
  - Edit files manually
  - Run `git mergetool`
  - Stage fixes and re-commit

---

### 🏗️ Init — Repo Initialization Wizard

```bash
e-git init
```

**Full guided setup — answers a few prompts then handles everything:**

| Prompt | What it does |
|---|---|
| Project name | Defaults to current folder name |
| Short description | Used in generated `README.md` |
| Create initial commit? | Commits README + .gitignore as first commit |
| Add GitHub remote? | Optionally adds `origin` remote |
| Remote URL | If yes, adds remote and pushes first commit |

**Auto-generated files:**
- `README.md` — pre-filled with project name and description
- `.gitignore` — pre-filled with `node_modules/`, `.env`, `dist/`, `build/`, `.DS_Store`
- Initializes on `main` branch (not `master`)

**End result panel** shows: project name, branch, remote URL, and `.gitignore` status.

---

### 🏷️ Tag — Release Tag Creator

```bash
e-git tag
```

**Perfect for npm package releases and versioning.**

1. Lists your **last 8 existing tags** before prompting
2. Suggests the next version by **auto-incrementing** the last tag's patch number
3. Asks for a **tag message** (release notes / changelog)
4. Creates an **annotated git tag** (not a lightweight tag)
5. Optionally **pushes the tag to remote**

**End result panel** shows: tag name, message, and whether it was pushed.

**Example flow:**
```
? New tag version (last: v1.2.3): v1.2.4
? Tag message: Fix auth bug and add dark mode
? Push tag to remote? Yes
✅ Tag "v1.2.4" pushed!
```

---

### 📥 Clone — Smart Clone

```bash
e-git clone https://github.com/user/repo.git
e-git clone https://github.com/user/repo.git --dir my-project
e-git clone https://github.com/user/repo.git -d my-project
```

**Options:**

| Flag | Description | Default |
|---|---|---|
| `-d, --dir <dir>` | Target folder name | Repository name |

**After cloning:**
1. Detects if a `package.json` exists in the cloned folder
2. **Auto-runs `npm install`** if found and you confirm
3. **Opens VS Code** with `code <dir>` if you confirm (requires `code` in PATH)

**End result panel** shows: repo name, directory, dependency install status, and VS Code status.

---

### 📊 Status — Rich Status Dashboard

```bash
e-git status
```

**Everything you need to know at a glance — all in one screen:**

**Top panel:**
- Current branch name (bold cyan)
- Ahead / behind remote count (↑ green, ↓ red)
- "Working tree clean" or file change count

**File change section (color-coded by state):**
- 🟢 **Staged** (index) files — ready to commit
- 🟡 **Modified** (unstaged) files — edited but not staged
- 🔴 **Untracked** files — new files not yet tracked

**Recent commits section:**
- Last 5 commits with short hash and message
- Most recent highlighted with a `◆` bullet

Runs `git status` and `git log` **in parallel** for maximum speed.

---

### 📦 Stash — Interactive Stash Manager

```bash
e-git stash
```

**Full stash lifecycle in one interactive menu:**

| Action | What it does |
|---|---|
| **Save** | Stashes all current changes with a custom name (defaults to `stash-<timestamp>`) |
| **List** | Shows all stashes with their index, name, and date |
| **Pop** | Restores the latest stash and removes it from the stash list |
| **Apply** | Pick a specific stash by index to apply without removing it |
| **Drop** | Pick a specific stash by index to permanently delete |
| **Clear** | Deletes ALL stashes (requires confirmation) |
| **Exit** | Returns to terminal |

**Notes:**
- Save shows the file count that was stashed
- List, Apply, and Drop show stash messages and timestamps
- Clear has a `default: false` safety confirmation

---

### 🔗 PR — Open Pull Request in Browser

```bash
e-git pr
e-git pr --base develop    # open PR against a different base branch
```

**Options:**

| Flag | Description | Default |
|---|---|---|
| `--base <branch>` | The target (base) branch for the PR | `main` |

**What it does:**
1. Reads your `origin` remote URL (supports both HTTPS and SSH `git@github.com:` formats)
2. Normalizes SSH URLs to HTTPS automatically
3. Pushes your current branch to remote (with `--set-upstream`)
4. Builds the GitHub compare URL: `github.com/<repo>/compare/<base>...<branch>?expand=1`
5. Displays a panel with repo, branch, base branch, and full PR URL
6. **Opens the URL in your default browser** using the `open` package

---

### ⏱️ Schedule — Auto-Commit & Push

```bash
# File watch mode — auto-push 2 seconds after any file change
e-git schedule

# Interval mode — push every 30 minutes regardless of changes
e-git schedule --interval 30
e-git schedule -i 30

# Custom commit message prefix
e-git schedule --prefix "💾 WIP save"
e-git schedule -p "backup"
```

**Options:**

| Flag | Description | Default |
|---|---|---|
| `-i, --interval <minutes>` | Push every N minutes | (file watch mode) |
| `-p, --prefix <msg>` | Commit message prefix | `⏱️ Auto-save` |

**File watch mode (default):**
- Uses `chokidar` to watch the entire project directory
- Ignores: `.git/`, `node_modules/`, `dist/`, `build/`
- Has a **2-second debounce** — waits for you to stop typing before committing
- Each auto-commit message: `<prefix> <HH:MM:SS>`

**Interval mode:**
- Pushes on a timer regardless of whether files changed
- Only commits if there are actual changes (skips empty commits)

**Both modes:**
- Show a live spinner `👀 Watching for changes…`
- Display a success line for every auto-push with timestamp
- Press `Ctrl+C` to stop cleanly

---

### 📜 History — Interactive Push Browser

```bash
e-git history
```

**Browse every push you've made from this machine:**
1. Shows a paginated list (15 items/page) of all logged pushes with:
   - Date & time
   - Branch name (in green)
   - Commit message
2. Select any push to **view its full diff** (colored, with compact summary)
3. From the detail view, choose:
   - **🔙 Back** — return to the list
   - **🕰️ Restore** — reset files to that exact state (with destructive warning)
   - **❌ Exit**

---

### 📋 List — Table View of Push History

```bash
e-git list
```

Simple, non-interactive table output showing all recorded pushes:

```
──────────────────────────────────────────────────────────────────────
Date & Time               Branch         Message
──────────────────────────────────────────────────────────────────────
5/5/2026, 9:02:30 AM      main           feat: add login page
5/4/2026, 8:45:10 PM      main           fix: auth bug
──────────────────────────────────────────────────────────────────────
```

---

### 🔙 Undo — Revert to Last Push

```bash
e-git undo
```

**Safely rolls back your working directory:**
- If HEAD matches the latest logged push → reverts to the **one before that**
- If HEAD is already behind → reverts to the **most recent** logged push
- Always shows what push you're reverting to (message + timestamp)
- Requires confirmation before the destructive `git reset --hard`

---

### ⏭️ Redo — Jump Forward After Undo

```bash
e-git redo
```

**Undid too much? This brings you back:**
- Finds your current HEAD in the push history
- Jumps to the push **one step newer** than the current state
- Shows a `⚠️ CRITICAL` extra warning if the target push is more than **30 minutes old**
- Requires confirmation before applying

---

### 🧹 Clear — Wipe Push History

```bash
e-git clear
```

Deletes the local push history file (`.git/git-easy-history.json`). Requires confirmation. This only affects the **local log** used by `e-git history / undo / redo` — it does not touch any git commits or remotes.

---

### ✨ Credits

```bash
e-git credits
```

Displays creator info, portfolio link, and learning resources.

---

## 🏗️ Project Structure

```
e-git-zain/
├── index.js                  # Entry point — imports & registers all commands
├── package.json
├── lib/
│   ├── git.js                # simpleGit instance, auth check, remote setup, .gitignore helper
│   ├── ui.js                 # banner, panel(), div(), badge(), fileIcon() — chalk/boxen helpers
│   └── history.js            # historyPath(), readHistory(), writeHistory(), logPush()
└── commands/
    ├── push.js               # Default push: stage → commit → push + success panel
    ├── branch.js             # Branch manager: create/switch/rename/delete/push
    ├── diff.js               # Visual diff: stat summary + full color diff
    ├── pull.js               # Smart pull: auto-stash → pull → restore + conflict report
    ├── init.js               # Init wizard: git init + README + .gitignore + first commit
    ├── tag.js                # Release tags: annotated tag + push
    ├── clone.js              # Smart clone: clone + npm install + VS Code open
    ├── status.js             # Status dashboard: branch/files/ahead-behind/commits
    ├── stash.js              # Stash manager: save/list/pop/apply/drop/clear
    ├── pr.js                 # PR opener: build GitHub compare URL + open browser
    ├── schedule.js           # Auto-commit: chokidar file watcher or interval timer
    ├── history.js            # history (interactive) + list (table) + clear commands
    └── undoredo.js           # undo + redo commands
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

---

## 🔐 Authentication

`e-git` uses your system's existing git credentials. If authentication fails during a push, it offers three paths:

1. **GitHub CLI** (`gh auth login`) — recommended, interactive OAuth
2. **Personal Access Token (PAT)** — paste as password, generate at [github.com/settings/tokens](https://github.com/settings/tokens)
3. **Abort** — exit safely

---

## 📌 Notes

- Push history is stored locally at `.git/git-easy-history.json` (inside `.git` so it's never committed)
- The tool always pushes to the **`main`** branch by default. If you're on `master`, it will ask to rename it
- `e-git schedule` blocks the terminal while running — use a separate terminal window or run it in the background

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
