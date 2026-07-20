import { app, nativeImage } from 'electron';
import { resolveAppIconPath } from './appAsset.js';

export function loadAppIcon() {
  const iconPath = resolveAppIconPath();
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
