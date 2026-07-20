import './env.js';
import { app, globalShortcut, nativeTheme } from 'electron';
import * as store from './store.js';
import * as launcher from './launcher.js';
import * as scheduler from './scheduler.js';
import * as hotkeys from './hotkeys.js';
import * as tray from './tray.js';
import * as windows from './windows.js';
import * as ipc from './ipc.js';
import { ensureDockVisible } from './dock.js';

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', () => windows.showSettings());

  app.whenReady().then(() => {
    ensureDockVisible();
    nativeTheme.themeSource = store.getSettings().appearance ?? 'system';

    ipc.register();
    windows.createSwitcher();
    tray.init({
      activate: (id) => launcher.activateProfile(id, { source: 'tray' }),
      openSettings: () => windows.showSettings(),
      openSwitcher: () => windows.toggleSwitcher(),
      toggleMenubar: (bounds) => windows.toggleMenubar(bounds),
    });
    hotkeys.init(() => windows.toggleSwitcher());
    scheduler.init({ activate: (id, opts) => launcher.activateProfile(id, opts) });
    // Warm toast after a tick so a toast-window failure never blocks startup
    setTimeout(() => {
      try {
        windows.ensureToastReady();
      } catch (err) {
        console.error('[startup] toast warm-up failed', err);
      }
    }, 0);

    nativeTheme.on('updated', () => {
      const appearance = store.getSettings().appearance ?? 'system';
      if (appearance !== 'system') return;
      windows.broadcast('theme:updated', {
        appearance: 'system',
        theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
      });
    });

    windows.showSettings();

    // Clicking the Dock icon reopens Settings when the window was closed.
    app.on('activate', () => windows.showSettings());
  });

  // Keep running in the Dock after the settings window closes (standard macOS behavior).
  app.on('window-all-closed', () => {});

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
