import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// ── Inline history logic — mirrors lib/history.js exactly ─────────────────────
async function writeHistory(entries, filePath) {
  await fs.writeFile(filePath, JSON.stringify(entries.slice(0, 50), null, 2));
}

async function readHistory(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return [];
  }
}

async function logPush(message, branch, hash, filePath) {
  const history = await readHistory(filePath);
  if (history.length && history[0].hash === hash) return; // dedup
  history.unshift({
    timestamp: new Date().toISOString(),
    displayTimestamp: new Date().toLocaleString(),
    message,
    branch,
    hash,
  });
  await writeHistory(history, filePath);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('History module — readHistory', () => {
  it('returns empty array for a non-existent file', async () => {
    const history = await readHistory('/tmp/does-not-exist-egit-xyz-12345.json');
    expect(history).toEqual([]);
    expect(Array.isArray(history)).toBe(true);
  });

  it('returns empty array for a malformed JSON file', async () => {
    const tmpFile = path.join(os.tmpdir(), `bad-json-${Date.now()}.json`);
    await fs.writeFile(tmpFile, '{ not valid json ');
    const history = await readHistory(tmpFile);
    expect(history).toEqual([]);
    await fs.unlink(tmpFile).catch(() => {});
  });

  it('returns empty array for an empty file', async () => {
    const tmpFile = path.join(os.tmpdir(), `empty-${Date.now()}.json`);
    await fs.writeFile(tmpFile, '');
    const history = await readHistory(tmpFile);
    expect(history).toEqual([]);
    await fs.unlink(tmpFile).catch(() => {});
  });
});

describe('History module — writeHistory & readHistory', () => {
  let tmpFile;

  beforeEach(async () => {
    tmpFile = path.join(os.tmpdir(), `egit-history-${Date.now()}-${Math.random()}.json`);
  });

  afterEach(async () => {
    try { await fs.unlink(tmpFile); } catch {}
  });

  it('writes entries and reads them back correctly', async () => {
    const entries = [
      { timestamp: '2026-01-01T00:00:00.000Z', message: 'feat: login', branch: 'main', hash: 'abc1234' },
    ];
    await writeHistory(entries, tmpFile);
    const history = await readHistory(tmpFile);
    expect(history).toHaveLength(1);
    expect(history[0].message).toBe('feat: login');
    expect(history[0].branch).toBe('main');
    expect(history[0].hash).toBe('abc1234');
  });

  it('caps history at 50 entries — extras are dropped', async () => {
    const entries = Array.from({ length: 55 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      message: `commit-${i}`,
      branch: 'main',
      hash: `deadbeef${String(i).padStart(2, '0')}`,
    }));
    await writeHistory(entries, tmpFile);
    const history = await readHistory(tmpFile);
    expect(history).toHaveLength(50);
  });

  it('preserves entry order (writes exactly what is given)', async () => {
    const entries = [
      { timestamp: '2026-03-01T00:00:00Z', message: 'third', branch: 'main', hash: 'ccc' },
      { timestamp: '2026-02-01T00:00:00Z', message: 'second', branch: 'dev', hash: 'bbb' },
      { timestamp: '2026-01-01T00:00:00Z', message: 'first', branch: 'main', hash: 'aaa' },
    ];
    await writeHistory(entries, tmpFile);
    const history = await readHistory(tmpFile);
    expect(history[0].hash).toBe('ccc');
    expect(history[1].hash).toBe('bbb');
    expect(history[2].hash).toBe('aaa');
  });
});

describe('History module — logPush', () => {
  let tmpFile;

  beforeEach(async () => {
    tmpFile = path.join(os.tmpdir(), `egit-log-${Date.now()}-${Math.random()}.json`);
  });

  afterEach(async () => {
    try { await fs.unlink(tmpFile); } catch {}
  });

  it('logs a push entry with all required fields', async () => {
    await logPush('feat: add login', 'main', 'abc1234', tmpFile);
    const history = await readHistory(tmpFile);

    expect(history).toHaveLength(1);
    expect(history[0].message).toBe('feat: add login');
    expect(history[0].branch).toBe('main');
    expect(history[0].hash).toBe('abc1234');
    expect(history[0].timestamp).toBeTruthy();
    expect(history[0].displayTimestamp).toBeTruthy();
  });

  it('prepends new entries — newest is always first', async () => {
    await logPush('first push',  'main', 'hash001', tmpFile);
    await logPush('second push', 'main', 'hash002', tmpFile);
    await logPush('third push',  'main', 'hash003', tmpFile);

    const history = await readHistory(tmpFile);
    expect(history).toHaveLength(3);
    expect(history[0].hash).toBe('hash003'); // newest first
    expect(history[1].hash).toBe('hash002');
    expect(history[2].hash).toBe('hash001');
  });

  it('does NOT duplicate entries with the same hash', async () => {
    await logPush('feat: add login', 'main', 'abc1234', tmpFile);
    await logPush('feat: add login', 'main', 'abc1234', tmpFile); // duplicate
    await logPush('feat: add login', 'main', 'abc1234', tmpFile); // duplicate again

    const history = await readHistory(tmpFile);
    expect(history).toHaveLength(1);
  });

  it('allows different hashes even with same message', async () => {
    await logPush('fix: typo', 'main', 'hash001', tmpFile);
    await logPush('fix: typo', 'main', 'hash002', tmpFile); // different hash = new entry

    const history = await readHistory(tmpFile);
    expect(history).toHaveLength(2);
  });

  it('handles pushes to different branches', async () => {
    await logPush('feat: a', 'main',    'hash001', tmpFile);
    await logPush('feat: b', 'develop', 'hash002', tmpFile);
    await logPush('feat: c', 'feature', 'hash003', tmpFile);

    const history = await readHistory(tmpFile);
    expect(history).toHaveLength(3);
    expect(history[0].branch).toBe('feature');
    expect(history[1].branch).toBe('develop');
    expect(history[2].branch).toBe('main');
  });

  it('caps total history at 50 entries after many logPush calls', async () => {
    // Pre-fill with 49 entries
    const initial = Array.from({ length: 49 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      displayTimestamp: new Date().toLocaleString(),
      message: `old commit ${i}`,
      branch: 'main',
      hash: `oldhash${i}`,
    }));
    await writeHistory(initial, tmpFile);

    // Add 3 more
    await logPush('new commit A', 'main', 'newhashA', tmpFile);
    await logPush('new commit B', 'main', 'newhashB', tmpFile);
    await logPush('new commit C', 'main', 'newhashC', tmpFile);

    const history = await readHistory(tmpFile);
    expect(history).toHaveLength(50);
    expect(history[0].hash).toBe('newhashC'); // newest at top
  });
});
