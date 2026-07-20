import { Tray, nativeImage } from 'electron';
import { resolveTrayIconPath } from './appAsset.js';
import * as store from './store.js';

let tray = null;
let handlers = {
  activate: null,
  openSettings: null,
  openSwitcher: null,
  toggleMenubar: null,
};

/** Template icon for the macOS menu bar (adapts to light/dark bar). */
function buildTrayIcon() {
  const iconPath = resolveTrayIconPath();
  if (iconPath) {
    let icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      icon = icon.resize({ width: 18, height: 18, quality: 'best' });
      icon.setTemplateImage(true);
      return icon;
    }
  }

  // Fallback ⇄ glyph when no asset is found
  const size = 18;
  const buf = Buffer.alloc(size * size * 4, 0);
  const set = (x, y, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = 255;
    buf[i + 1] = 255;
    buf[i + 2] = 255;
    buf[i + 3] = a;
  };
  const hline = (y, x0, x1) => {
    for (let x = x0; x <= x1; x++) set(x, y);
  };
  hline(6, 4, 13);
  set(11, 5);
  set(12, 6);
  set(11, 7);
  hline(12, 4, 13);
  set(6, 11);
  set(5, 12);
  set(6, 13);

  const icon = nativeImage.createFromBuffer(buf, { width: size, height: size, scaleFactor: 1 });
  icon.setTemplateImage(true);
  return icon;
}

function refreshTrayTitle() {
  if (!tray) return;
  const { profiles, activeProfileId } = store.getSnapshot();
  const active = profiles.find((p) => p.id === activeProfileId);

  tray.setToolTip(active ? `Shifty — ${active.name}` : 'Shifty');
  // Emoji only — keeps the bar clean; full UI is in the popover
  tray.setTitle(active?.emoji ? ` ${active.emoji}` : '');
}

/**
 * Menu bar entry point:
 * - Left-click / right-click → custom Shifty panel (same UI language as the app)
 * - No native macOS context menu (that would break visual consistency)
 */
export function init({ activate, openSettings, openSwitcher, toggleMenubar }) {
  handlers = { activate, openSettings, openSwitcher, toggleMenubar };

  tray = new Tray(buildTrayIcon());
  refreshTrayTitle();

  // Do not call setContextMenu — both clicks open our styled panel
  const openPanel = (_event, bounds) => {
    handlers.toggleMenubar?.(bounds || tray.getBounds());
  };

  tray.on('click', openPanel);
  tray.on('right-click', openPanel);
  tray.on('double-click', openPanel);

  store.events.on('changed', refreshTrayTitle);
}

export function getTrayBounds() {
  try {
    return tray?.getBounds?.() ?? null;
  } catch {
    return null;
  }
}
