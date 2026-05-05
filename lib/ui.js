import chalk from 'chalk';
import boxen from 'boxen';

export function banner() {
  console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════════════╗
  ║  ⚡  E-GIT  ·  Git-Easy  v3.0.0  ⚡     ║
  ║     Your ultimate GitHub companion 🚀    ║
  ╚══════════════════════════════════════════╝`));
}

export function div(char = '─', len = 58) {
  return chalk.gray(char.repeat(len));
}

export function panel(content, color = 'cyan', title = '') {
  return boxen((title ? chalk.bold(title) + '\n\n' : '') + content, {
    padding: 1, margin: { top: 1, bottom: 1, left: 2, right: 2 },
    borderStyle: 'round', borderColor: color,
  });
}

export function successPanel(lines) {
  const content = lines.map(([k, v]) =>
    `${chalk.gray((k + ':').padEnd(12))} ${chalk.white(v)}`
  ).join('\n');
  console.log(panel(chalk.green.bold('✅ Success!\n\n') + content, 'green'));
}

export function badge(text, bg = 'bgCyan') {
  return chalk[bg].black(` ${text} `);
}

export function fileIcon(index) {
  if (index === '?') return chalk.red('+');
  if (index === 'M' || index === 'm') return chalk.yellow('~');
  if (index === 'D') return chalk.red('-');
  return chalk.green('✓');
}
