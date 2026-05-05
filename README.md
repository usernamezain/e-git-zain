# ⚡ Git-Easy (e-git) v3.0.0

> The ultimate CLI to automate your entire GitHub workflow — push, pull, branch, diff, stash, PR, and more. Built with beautiful terminal UI.

[![npm version](https://img.shields.io/npm/v/e-git-zain.svg)](https://www.npmjs.com/package/e-git-zain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📦 Installation

```bash
npm install -g e-git-zain
```

---

## 🚀 Quick Start

```bash
e-git "your commit message"   # Stage, commit, and push in one command
```

---

## 📋 All Commands

| Command | Description |
|---|---|
| `e-git [message]` | ⚡ Commit all changes and push to GitHub |
| `e-git branch` | 🌿 Interactive branch manager |
| `e-git diff` | 🔍 Visual colored diff viewer |
| `e-git pull` | ⬇️ Smart pull with auto-stash |
| `e-git init` | 🏗️ Git repo initialization wizard |
| `e-git tag` | 🏷️ Create and push release tags |
| `e-git clone <url>` | 📥 Smart clone with auto-install |
| `e-git status` | 📊 Rich status dashboard |
| `e-git stash` | 📦 Interactive stash manager |
| `e-git pr` | 🔗 Open Pull Request in browser |
| `e-git schedule` | ⏱️ Auto-commit on file change or interval |
| `e-git history` | 📜 Browse & restore past pushes |
| `e-git list` | 📋 Table view of push history |
| `e-git undo` | 🔙 Revert to last pushed state |
| `e-git redo` | ⏭️ Jump forward after an undo |
| `e-git clear` | 🧹 Clear local push history |
| `e-git credits` | ✨ View creators |

---

## ✨ Feature Details

### ⚡ Push (Default)
```bash
e-git "feat: add login page"
e-git   # prompts for message interactively
```
- Shows a preview of all changed files before committing
- Auto-detects `master` branch and offers to rename it to `main`
- Displays a success panel with branch, commit hash, message, and time
- Logs every push to local history for undo/redo

---

### 🌿 Branch Manager
```bash
e-git branch
```
Interactive menu to:
- **Create** a new branch (with optional auto-switch)
- **Switch** between local branches
- **Rename** the current branch
- **Delete** any local branch (with force option)
- **Push** current branch to remote with upstream tracking

---

### 🔍 Visual Diff
```bash
e-git diff           # Show all changes
e-git diff --staged  # Show only staged changes
```
- Displays a colored **summary stat** block (files changed, insertions, deletions)
- Full line-by-line diff with green additions, red deletions, cyan hunks

---

### ⬇️ Smart Pull
```bash
e-git pull
e-git pull --rebase   # Pull with rebase
```
- Automatically **stashes** your local changes before pulling
- **Restores** your stash after the pull completes
- Detects and lists **merge conflicts** with resolution tips
- Shows a pull summary panel

---

### 🏗️ Init Wizard
```bash
e-git init
```
Full guided setup:
1. Enter project name and description
2. Initializes git on `main` branch
3. Creates a `README.md` and `.gitignore` automatically
4. Optionally creates the first commit
5. Optionally adds a GitHub remote and pushes

---

### 🏷️ Release Tags
```bash
e-git tag
```
- Shows all existing tags
- Smart semver default (auto-increments last tag)
- Creates an **annotated tag** with a message
- Optionally pushes tag to remote — perfect for npm releases

---

### 📥 Smart Clone
```bash
e-git clone https://github.com/user/repo.git
e-git clone https://github.com/user/repo.git --dir my-folder
```
- Clones the repository
- Auto-runs `npm install` if `package.json` is found
- Optionally opens the project in **VS Code** (`code .`)

---

### 📊 Rich Status Dashboard
```bash
e-git status
```
Displays:
- Current branch with **ahead/behind** remote count
- Color-coded file lists: staged (green), modified (yellow), untracked (red)
- Last 5 commits with short hashes

---

### 📦 Stash Manager
```bash
e-git stash
```
Interactive menu:
- **Save** changes to a named stash
- **List** all stashes with timestamps
- **Pop** the latest stash
- **Apply** a specific stash by index
- **Drop** a specific stash
- **Clear** all stashes (with confirmation)

---

### 🔗 Open Pull Request
```bash
e-git pr
e-git pr --base develop   # Set a custom base branch
```
- Pushes current branch to remote
- Builds the GitHub compare URL automatically
- Opens your browser to the **PR creation page**

---

### ⏱️ Schedule Auto-Push
```bash
e-git schedule                    # Watch for file changes
e-git schedule --interval 30      # Push every 30 minutes
e-git schedule --prefix "💾 Save" # Custom commit prefix
```
- **File watch mode**: auto-commits 2 seconds after any file change
- **Interval mode**: commits and pushes on a timer
- Ignores `node_modules`, `.git`, `dist`, `build`
- Press `Ctrl+C` to stop

---

### 📜 History & Time Travel
```bash
e-git history    # Interactive browser — view diffs, restore versions
e-git list       # Simple table view
e-git undo       # Revert to last pushed state
e-git redo       # Jump forward after undo
e-git clear      # Wipe local history log
```

---

## 🏗️ Project Structure

```
├── index.js              # Entry point — registers all commands
├── lib/
│   ├── git.js            # simpleGit instance + auth helpers
│   ├── ui.js             # chalk/boxen UI helpers
│   └── history.js        # Push history read/write
└── commands/
    ├── push.js           # Default push command
    ├── branch.js         # Branch manager
    ├── diff.js           # Visual diff
    ├── pull.js           # Smart pull
    ├── init.js           # Init wizard
    ├── tag.js            # Release tags
    ├── clone.js          # Smart clone
    ├── status.js         # Status dashboard
    ├── stash.js          # Stash manager
    ├── pr.js             # PR opener
    ├── schedule.js       # Auto-commit/push
    ├── history.js        # History + list + clear
    └── undoredo.js       # Undo + redo
```

---

## 🛠️ Tech Stack

- [commander](https://github.com/tj/commander.js) — CLI framework
- [simple-git](https://github.com/steveukx/git-js) — Git operations
- [inquirer](https://github.com/SBoudrias/Inquirer.js) — Interactive prompts
- [chalk](https://github.com/chalk/chalk) — Terminal colors
- [ora](https://github.com/sindresorhus/ora) — Loading spinners
- [boxen](https://github.com/sindresorhus/boxen) — Info panels
- [open](https://github.com/sindresorhus/open) — Open URLs in browser
- [chokidar](https://github.com/paulmillr/chokidar) — File watcher

---

## 👨‍💻 Credits

Created with ❤️ by **[Zain Ali](https://zain-mughal.vercel.app)**  
Built with **Antigravity AI**  
Learning resources: [m-learn.eu.cc](https://m-learn.eu.cc)

---

## 📄 License

MIT © Zain Ali
