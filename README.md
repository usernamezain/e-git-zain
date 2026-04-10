# e-git 🚀 | The Ultimate Git & GitHub Automation CLI
 

[![npm version](https://img.shields.io/npm/v/e-git-zain.svg?style=flat-square)](https://www.npmjs.com/package/e-git-zain)
[![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen.svg)](https://github.com/usernamezain/e-git-zain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

**Stop memorizing complex git commands. Automate your GitHub workflow with a single, smart CLI tool.**

`e-git` (also known as `e-git-zain`) is a powerful, interactive command-line interface designed to streamline your development process. From **Smart .gitignore management** to **Time-Travel Rollbacks (Undo/Redo)**, `e-git` makes staging, committing, and pushing code effortless.

---

## 📑 Table of Contents
- [🌟 Key Features](#-key-features)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [📖 Detailed Usage](#-detailed-usage)
  - [⚡ One-Click Push](#-one-click-push)
  - [🕰️ Time Travel (Undo/Redo)](#️-time-travel-undoredo)
  - [🛡️ GitIgnore Assistant](#️-gitignore-assistant)
- [📅 Monthly Updates](#-monthly-updates)
- [✨ Credits & Authors](#-credits--authors)
- [🔥 Support & Donations](#-support--donations)

---

## 🌟 Key Features

- **🎨 Git Automation**: Stage, commit, and push in one fast command.
- **🛡️ Smart .gitignore Helper**: Never push your secret `.env` or heavy `node_modules` again.
- **🕰️ Git Undo & Redo**: The ultimate "mistake eraser." Revert to previous pushes or jump forward in time.
- **📜 Interactive History**: Browse past pushes with colorized diffs and instant restore options.
- **🔐 Authentication Shield**: Seamless integration with GitHub CLI and token-based authentication.
- **📡 Auto-Remote Setup**: Automatically configures your GitHub remotes if they are missing.

---

## 🚀 Quick Start & Installation

Install `e-git` globally via NPM to use it in any local repository:

```bash
npm install -g e-git-zain
```

*Note: After installation, you can use either `e-git` or `git-easy` at your command prompt.*

---

## 📖 Detailed Usage

### ⚡ One-Click Push
Automate the `add .`, `commit -m`, and `push` cycle.
```bash
# Interactive mode (prompts for message)
e-git

# Quick push (argument mode)
e-git "feat: add user authentication"
```

### 🕰️ Time Travel (Undo/Redo)
Jump back and forth between push states without losing work.
```bash
# Revert to the state of your previous push
e-git undo

# Jump forward to a newer state after an undo
e-git redo
```

### 📜 History & Listing
Explore your project's timeline professionally.
```bash
# Interactive menu: view code changes or restore files
e-git history

# Quick overview: Table view of all successful pushes
e-git list
```

### 🛡️ GitIgnore Assistant
Keeps your repository clean and secure. If `e-git` notices a missing `.gitignore`, it will interactively help you create one and suggest folders to hide (like node_modules and .env).

---

## 📅 Monthly Updates 
I am committed to making `e-git` the best developer tool. I release **feature updates every month** to add more power to your workflow!

---

## ✨ Credits & Authors

**e-git** was developed and is maintained by **Zain Ali**.

- **🌍 Portfolio**: [zain-mughal.vercel.app](https://zain-mughal.vercel.app)
- **💻 GitHub**: [@usernamezain](https://github.com/usernamezain)
- **📚 Learning Course**: [m-learn.eu.cc](http://m-learn.eu.cc)
- **📧 Email**: [devmughal8@gmail.com](mailto:devmughal8@gmail.com)

---

## 🔥 Support & Donations

If `e-git-zain` helps you save time or prevents mistakes, consider supporting the project!

- **WhatsApp / Direct Contact**: `03124030056`
- **Contributions**: Pull requests are always welcome!

---
*Keywords: Git Automation, GitHub CLI, Git Undo Redo, Node.js Git Tool, Zain Ali, DevOps Automation.*
