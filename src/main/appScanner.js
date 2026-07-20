import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { app } from 'electron';
import * as store from './store.js';
import {
  extractAppIconFromPath,
  ICON_CACHE_VERSION,
  invalidateIconCache,
  getAppIconsCacheDir,
} from './appIcons.js';

const SCAN_ROOTS = [
  '/Applications',
  '/System/Applications',
  path.join(os.homedir(), 'Applications'),
];

const MEMORY_TTL_MS = 60_000;
let memoryCache = null; // { at, apps }
let cacheMigrated = false;

function ensureCacheMigrated() {
  if (cacheMigrated) return;
  cacheMigrated = true;

  if (store.getIconCacheVersion() !== ICON_CACHE_VERSION) {
    try {
      const dir = getAppIconsCacheDir();
      if (fsSync.existsSync(dir)) fsSync.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    store.setIconCache({});
    store.setIconCacheVersion(ICON_CACHE_VERSION);
  } else {
    store.setIconCache(invalidateIconCache(store.getIconCache()));
  }
}

async function listAppBundles(dir, depth = 1) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || !entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name.endsWith('.app')) {
      found.push(full);
    } else if (depth > 0) {
      found.push(...(await listAppBundles(full, depth - 1)));
    }
  }
  return found;
}

async function iconFor(appPath, diskCache) {
  let mtime = 0;
  try {
    mtime = (await fs.stat(appPath)).mtimeMs;
  } catch {
    return null;
  }

  const cached = diskCache[appPath];
  if (
    cached &&
    cached.v === ICON_CACHE_VERSION &&
    !cached.generic &&
    cached.mtime === mtime &&
    cached.dataUrl
  ) {
    return cached.dataUrl;
  }

  const dataUrl = await extractAppIconFromPath(appPath);
  if (dataUrl) {
    diskCache[appPath] = { mtime, dataUrl, v: ICON_CACHE_VERSION, generic: false };
    return dataUrl;
  }

  // Last resort — do not persist; Electron often returns a blank generic glyph for .app bundles.
  try {
    const icon = await app.getFileIcon(appPath, { size: 'normal' });
    if (!icon.isEmpty()) return icon.toDataURL();
  } catch {
    /* ignore */
  }

  return null;
}

export async function scanApps({ force = false } = {}) {
  ensureCacheMigrated();

  if (!force && memoryCache && Date.now() - memoryCache.at < MEMORY_TTL_MS) {
    return memoryCache.apps;
  }

  const bundlePaths = (
    await Promise.all(SCAN_ROOTS.map((root) => listAppBundles(root)))
  ).flat();

  const apps = bundlePaths.map((p) => ({
    path: p,
    name: path.basename(p, '.app'),
    iconDataUrl: null,
  }));

  apps.sort((a, b) => a.name.localeCompare(b.name));
  memoryCache = { at: Date.now(), apps };
  return apps;
}

/** Icons for specific app paths — used by profile tiles and the app search list. */
export async function iconsFor(paths) {
  ensureCacheMigrated();
  const diskCache = store.getIconCache();
  const unique = [...new Set(paths.filter(Boolean))];

  const entries = await Promise.all(
    unique.map(async (p) => [p, await iconFor(p, diskCache)])
  );

  store.setIconCache(diskCache);
  return Object.fromEntries(entries);
}
