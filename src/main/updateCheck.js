import { app, dialog, shell } from 'electron';
import * as store from './store.js';

const GITHUB_REPO = 'Beingmani/Shifty';
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

let notifyRenderer = () => {};
let latestAvailable = null;
let handlersRegistered = false;

export function normalizeTag(tag) {
  return String(tag || '').replace(/^v/i, '').trim();
}

export function compareVersions(a, b) {
  const parse = (raw) => {
    const [core, pre] = raw.split('-');
    const nums = core.split('.').map((n) => parseInt(n, 10) || 0);
    while (nums.length < 3) nums.push(0);
    return { nums, pre: pre || '' };
  };
  const va = parse(a);
  const vb = parse(b);
  for (let i = 0; i < 3; i += 1) {
    if (va.nums[i] !== vb.nums[i]) return va.nums[i] - vb.nums[i];
  }
  if (!va.pre && vb.pre) return 1;
  if (va.pre && !vb.pre) return -1;
  if (!va.pre && !vb.pre) return 0;

  const partsA = va.pre.split('.');
  const partsB = vb.pre.split('.');
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i += 1) {
    const partA = partsA[i];
    const partB = partsB[i];
    if (partA === undefined) return -1;
    if (partB === undefined) return 1;

    const numA = parseInt(partA, 10);
    const numB = parseInt(partB, 10);
    const isNumA = !Number.isNaN(numA) && String(numA) === partA;
    const isNumB = !Number.isNaN(numB) && String(numB) === partB;

    if (isNumA && isNumB) {
      if (numA !== numB) return numA - numB;
    } else {
      const cmp = partA.localeCompare(partB);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

function getCurrentVersion() {
  return app.getVersion();
}

async function fetchLatestRelease() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=15`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Shifty',
    },
  });
  if (!res.ok) return null;

  const releases = await res.json();
  if (!Array.isArray(releases) || !releases.length) return null;

  let best = null;
  for (const rel of releases) {
    if (rel.draft) continue;
    const version = normalizeTag(rel.tag_name);
    if (!version) continue;
    if (!best || compareVersions(version, best.version) > 0) {
      best = {
        version,
        url: rel.html_url,
        name: rel.name || version,
      };
    }
  }
  return best;
}

export async function checkForUpdates({ quiet = false } = {}) {
  if (!app.isPackaged) return { available: false, current: getCurrentVersion() };

  const current = getCurrentVersion();
  const dismissed = normalizeTag(store.getSettings()?.dismissedUpdateVersion);

  try {
    const latest = await fetchLatestRelease();
    if (!latest) return { available: false, current };

    if (compareVersions(latest.version, current) <= 0) {
      latestAvailable = null;
      return { available: false, current, latest: latest.version };
    }

    if (dismissed && compareVersions(latest.version, dismissed) <= 0) {
      latestAvailable = null;
      return { available: false, current, latest: latest.version, dismissed: true };
    }

    latestAvailable = latest;
    const payload = { current, ...latest };
    notifyRenderer('update:available', payload);
    if (!quiet) {
      console.warn(`[shifty] update available: ${latest.version} (current ${current})`);
    }
    return { available: true, ...payload };
  } catch (err) {
    console.warn('[shifty] update check failed:', err?.message || err);
    return { available: false, current, error: err?.message || String(err) };
  }
}

async function openUpdateDialog() {
  const latest = latestAvailable || (await fetchLatestRelease());
  if (!latest) return { ok: false, error: 'no_release' };

  const current = getCurrentVersion();
  const { response } = await dialog.showMessageBox({
    type: 'info',
    buttons: ['Download update', 'Not now'],
    defaultId: 0,
    cancelId: 1,
    title: 'Update available',
    message: `Shifty ${latest.version} is available`,
    detail: [
      `You are on ${current}.`,
      '',
      'To update:',
      '1. Download the new DMG from GitHub',
      '2. Quit Shifty and replace it in Applications',
      '3. If macOS blocks the app, run in Terminal:',
      '   xattr -cr /Applications/Shifty.app',
      '4. Open Shifty normally',
    ].join('\n'),
  });

  if (response === 1) {
    return { ok: true, closed: true };
  }

  if (latest.url) await shell.openExternal(latest.url);
  return { ok: true, opened: true };
}

function dismissUpdate(version) {
  const tag = normalizeTag(version || latestAvailable?.version);
  if (!tag) return { ok: false };
  store.setSettings({ dismissedUpdateVersion: tag });
  latestAvailable = null;
  return { ok: true };
}

function registerUpdateHandlers(ipcMain) {
  if (handlersRegistered) return;
  handlersRegistered = true;

  ipcMain.handle('update:check', () => checkForUpdates({ quiet: true }));
  ipcMain.handle('update:open', () => openUpdateDialog());
  ipcMain.handle('update:dismiss', (_e, version) => dismissUpdate(version));
  ipcMain.handle('update:get-current', () => ({ version: getCurrentVersion() }));
  ipcMain.handle('app:get-info', () => ({
    name: app.getName(),
    version: getCurrentVersion(),
    isPackaged: app.isPackaged,
  }));
  ipcMain.handle('app:open-url', (_e, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { ok: true };
    }
    return { ok: false, error: 'invalid_url' };
  });
}

export function startUpdateChecks({ ipcMain, onNotify } = {}) {
  if (typeof onNotify === 'function') notifyRenderer = onNotify;
  registerUpdateHandlers(ipcMain);

  if (!app.isPackaged) return;

  const run = () => {
    checkForUpdates({ quiet: true }).catch(() => {});
  };
  run();
  const timer = setInterval(run, CHECK_INTERVAL_MS);
  timer.unref?.();
}
