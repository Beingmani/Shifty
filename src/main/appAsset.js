import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const APP_ICON_FILES = ['Shifty.png', 'app-icon.png', 'icon.png'];
const TRAY_ICON_FILES = ['tray-iconTemplate.png', 'tray-icon.png', ...APP_ICON_FILES];

function assetCandidates(filenames) {
  const roots = [
    app.getAppPath(),
    path.join(moduleDir, '../../assets'),
    path.join(process.cwd(), 'assets'),
  ];
  if (process.resourcesPath) {
    roots.push(path.join(process.resourcesPath, 'assets'));
  }
  const paths = [];
  for (const root of roots) {
    for (const name of filenames) {
      paths.push(path.join(root, name));
    }
  }
  return paths;
}

export function resolveAppIconPath() {
  return assetCandidates(APP_ICON_FILES).find((p) => fs.existsSync(p)) ?? null;
}

export function resolveTrayIconPath() {
  return assetCandidates(TRAY_ICON_FILES).find((p) => fs.existsSync(p)) ?? null;
}
