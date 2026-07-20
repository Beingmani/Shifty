import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { app } from 'electron';

export const ICON_CACHE_VERSION = 3;

/** Cached + displayed sharp on Retina: extract large, downscale in CSS. */
const ICON_TARGET_PX = 128;

function getCacheDir() {
  return path.join(app.getPath('userData'), 'app-icons');
}

export function getAppIconsCacheDir() {
  return getCacheDir();
}

function cachePathForApp(appPath) {
  const normalized = path.resolve(appPath);
  const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  const base = path.basename(normalized, '.app').replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(getCacheDir(), `${base}-${hash}.png`);
}

function cachePathForBundle(bundleId) {
  const safe = bundleId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(getCacheDir(), `bundle-${safe}.png`);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 12000, maxBuffer: 8 * 1024 * 1024, ...opts }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function findAppPath(bundleId) {
  if (!bundleId) return null;
  try {
    const out = await run('/usr/bin/mdfind', [`kMDItemCFBundleIdentifier == "${bundleId}"`]);
    const match = out.trim().split('\n').find((p) => p.endsWith('.app'));
    return match || null;
  } catch {
    return null;
  }
}

function findIcnsInBundle(appPath) {
  const resourcesDir = path.join(appPath, 'Contents', 'Resources');
  if (!fs.existsSync(resourcesDir)) return null;
  const files = fs.readdirSync(resourcesDir);
  const icns = files.filter((f) => f.endsWith('.icns'));
  if (!icns.length) return null;
  const appName = path.basename(appPath, '.app').toLowerCase();
  const preferred =
    icns.find((f) => f.toLowerCase() === 'appicon.icns') ||
    icns.find((f) => f.toLowerCase().startsWith(appName)) ||
    icns.find((f) => f.toLowerCase() === 'icon.icns') ||
    icns[0];
  return path.join(resourcesDir, preferred);
}

function pngToDataUrl(buf) {
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function readCachedPng(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const buf = fs.readFileSync(filePath);
    // Reject tiny/blank PNGs that sometimes come from failed conversions.
    if (buf.length < 400) return null;
    return pngToDataUrl(buf);
  } catch {
    return null;
  }
}

async function writeCachedPng(filePath, buf) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buf);
}

async function normalizeIconPng(pngPath) {
  const outPath = path.join(os.tmpdir(), `shifty-icon-${Date.now()}-${process.pid}.png`);
  try {
    // Downscale only — never upscale a tiny bitmap (that would stay blocky).
    await run('/usr/bin/sips', [
      '-Z',
      String(ICON_TARGET_PX),
      pngPath,
      '--out',
      outPath,
    ]);
    if (!fs.existsSync(outPath)) return null;
    const buf = fs.readFileSync(outPath);
    return buf.length >= 400 ? buf : null;
  } catch {
    try {
      const buf = fs.readFileSync(pngPath);
      return buf.length >= 400 ? buf : null;
    } catch {
      return null;
    }
  } finally {
    try {
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    } catch {
      /* ignore */
    }
  }
}

/** Fast path: sips converts .icns → PNG, capped at ICON_TARGET_PX. */
async function extractViaSips(icnsPath) {
  const outPath = path.join(os.tmpdir(), `shifty-sips-${Date.now()}-${process.pid}.png`);
  try {
    await run('/usr/bin/sips', [
      '-s',
      'format',
      'png',
      '-Z',
      String(ICON_TARGET_PX),
      icnsPath,
      '--out',
      outPath,
    ]);
    if (!fs.existsSync(outPath)) return null;
    const buf = fs.readFileSync(outPath);
    return buf.length >= 400 ? buf : null;
  } catch {
    return null;
  } finally {
    try {
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    } catch {
      /* ignore */
    }
  }
}

/** Stasho-quality path: iconutil unpacks the .icns into crisp PNGs. */
async function extractViaIconutil(icnsPath) {
  const iconsetDir = path.join(os.tmpdir(), `shifty-iconset-${Date.now()}-${process.pid}.iconset`);
  try {
    await run('/usr/bin/iconutil', ['-c', 'iconset', icnsPath, '-o', iconsetDir]);

    // Prefer the largest available bitmap — upscaling 32px looks awful on Retina.
    const candidates = [
      'icon_256x256.png',
      'icon_128x128@2x.png',
      'icon_128x128.png',
      'icon_64x64@2x.png',
      'icon_32x32@2x.png',
      'icon_64x64.png',
      'icon_32x32.png',
      'icon_16x16@2x.png',
    ];
    let pngPath = null;
    for (const name of candidates) {
      const candidate = path.join(iconsetDir, name);
      if (fs.existsSync(candidate)) {
        pngPath = candidate;
        break;
      }
    }
    if (!pngPath) return null;

    return normalizeIconPng(pngPath);
  } catch {
    return null;
  } finally {
    try {
      fs.rmSync(iconsetDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

/** Extract a Retina-ready PNG data URL from an .app bundle path. */
export async function extractAppIconFromPath(appPath) {
  if (!appPath || process.platform !== 'darwin') return null;

  const resolved = path.resolve(appPath);
  if (!resolved.endsWith('.app') || !fs.existsSync(resolved)) return null;

  const cached = cachePathForApp(resolved);
  const fromDisk = readCachedPng(cached);
  if (fromDisk) return fromDisk;

  const icnsPath = findIcnsInBundle(resolved);
  if (!icnsPath) return null;

  let buf = await extractViaIconutil(icnsPath);
  if (!buf) buf = await extractViaSips(icnsPath);
  if (!buf) return null;

  await writeCachedPng(cached, buf);
  return pngToDataUrl(buf);
}

/** Extract icon by bundle ID — same approach Stasho uses for screenshot source apps. */
export async function extractAppIcon(bundleId) {
  if (!bundleId || process.platform !== 'darwin') return null;

  const cached = cachePathForBundle(bundleId);
  const fromDisk = readCachedPng(cached);
  if (fromDisk) return fromDisk;

  const appPath = await findAppPath(bundleId);
  if (!appPath) return null;

  const dataUrl = await extractAppIconFromPath(appPath);
  if (!dataUrl) return null;

  try {
    const buf = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    await writeCachedPng(cached, buf);
  } catch {
    /* ignore */
  }
  return dataUrl;
}

export async function readBundleId(appPath) {
  const plist = path.join(appPath, 'Contents', 'Info.plist');
  if (!fs.existsSync(plist)) return null;
  try {
    const out = await run('/usr/bin/plutil', ['-extract', 'CFBundleIdentifier', 'raw', plist]);
    return out.trim() || null;
  } catch {
    return null;
  }
}

/** Drop stale icon cache entries (generic getFileIcon results from older builds). */
export function invalidateIconCache(storeCache) {
  if (!storeCache || typeof storeCache !== 'object') return {};
  const next = {};
  for (const [key, entry] of Object.entries(storeCache)) {
    if (entry?.v === ICON_CACHE_VERSION && entry?.dataUrl && !entry?.generic) {
      next[key] = entry;
    }
  }
  return next;
}
