import { app, nativeImage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function resolveIconPath() {
  const candidates = [
    path.join(app.getAppPath(), 'assets/app-icon.png'),
    path.join(app.getAppPath(), 'assets/icon.png'),
    // Dev / Vite bundle: main lives in .vite/build/
    path.join(moduleDir, '../../assets/app-icon.png'),
    path.join(moduleDir, '../../assets/icon.png'),
    path.join(process.cwd(), 'assets/app-icon.png'),
    path.join(process.cwd(), 'assets/icon.png'),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

export function loadAppIcon() {
  const iconPath = resolveIconPath();
  if (!iconPath) return nativeImage.createEmpty();
  const icon = nativeImage.createFromPath(iconPath);
  return icon.isEmpty() ? nativeImage.createEmpty() : icon;
}

/**
 * macOS Dock visibility:
 * - Settings open → regular app with branded Dock icon
 * - Menu bar / switcher / toast only → accessory (no Dock icon)
 */
export function setDockVisible(visible) {
  if (process.platform !== 'darwin') return;

  if (visible) {
    app.setActivationPolicy('regular');
    app.dock.show();
    const icon = loadAppIcon();
    if (!icon.isEmpty()) app.dock.setIcon(icon);
    return;
  }

  app.dock.hide();
  app.setActivationPolicy('accessory');
}

/** @deprecated Use setDockVisible(true) */
export function ensureDockVisible() {
  setDockVisible(true);
}

export function settingsWindowNeedsDock(win) {
  if (!win || win.isDestroyed()) return false;
  return win.isVisible() || win.isMinimized();
}
