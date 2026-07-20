import { app, nativeImage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

function resolveIconPath() {
  const candidates = [
    path.join(app.getAppPath(), 'assets/app-icon.png'),
    path.join(app.getAppPath(), 'assets/icon.png'),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

export function loadAppIcon() {
  const iconPath = resolveIconPath();
  if (!iconPath) return nativeImage.createEmpty();
  const icon = nativeImage.createFromPath(iconPath);
  return icon.isEmpty() ? nativeImage.createEmpty() : icon;
}

/** Ensure Shifty appears as a normal Dock app with the branded icon. */
export function ensureDockVisible() {
  if (process.platform !== 'darwin') return;

  app.setActivationPolicy('regular');
  app.dock.show();

  const icon = loadAppIcon();
  if (!icon.isEmpty()) app.dock.setIcon(icon);
}
