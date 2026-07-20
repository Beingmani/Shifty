#!/usr/bin/env node
/**
 * Kill orphaned Shifty dev Electron processes before a fresh start.
 * Prevents single-instance lock from a hung process making `npm start` appear broken.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Distinctive path fragment for this project's Electron binary only
const electronMarker = path.join(root, 'node_modules', 'electron');

function listPids() {
  try {
    const out = execSync('ps -ax -o pid=,command=', { encoding: 'utf8' });
    const pids = [];
    for (const line of out.split('\n')) {
      if (!line.includes(electronMarker)) continue;
      if (line.includes('kill-stale-dev')) continue;
      const pid = parseInt(line.trim().split(/\s+/)[0], 10);
      if (Number.isFinite(pid) && pid > 0 && pid !== process.pid) pids.push(pid);
    }
    return [...new Set(pids)];
  } catch {
    return [];
  }
}

const pids = listPids();
for (const pid of pids) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    /* already gone */
  }
}
// Escalate stragglers
setTimeout(() => {
  for (const pid of listPids()) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      /* ignore */
    }
  }
}, 400);

// Also clear forge parent if still around (best-effort, path-scoped)
try {
  execSync(
    `ps -ax -o pid=,command= | grep -F ${JSON.stringify(root)} | grep -F 'electron-forge start' | grep -v grep | awk '{print $1}' | while read p; do kill -TERM "$p" 2>/dev/null; done`,
    { stdio: 'ignore', shell: '/bin/bash' }
  );
} catch {
  /* ignore */
}

console.log(
  pids.length
    ? `Cleared ${pids.length} stale Shifty Electron process(es).`
    : 'No stale Shifty Electron processes found.'
);
