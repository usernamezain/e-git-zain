import fs from 'fs/promises';
import path from 'path';
import { git } from './git.js';

export async function historyPath() {
  try {
    const root = await git.revparse(['--show-toplevel']);
    return path.join(root.trim(), '.git', 'git-easy-history.json');
  } catch { return null; }
}

export async function readHistory() {
  const p = await historyPath();
  if (!p) return [];
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return []; }
}

export async function writeHistory(entries) {
  const p = await historyPath();
  if (!p) return;
  await fs.writeFile(p, JSON.stringify(entries.slice(0, 50), null, 2));
}

export async function logPush(message, branch, hash) {
  try {
    const history = await readHistory();
    if (history.length && history[0].hash === hash) return;
    history.unshift({ timestamp: new Date().toISOString(), displayTimestamp: new Date().toLocaleString(), message, branch, hash });
    await writeHistory(history);
  } catch {}
}
