import { ipcMain, app, nativeTheme } from 'electron';
import * as store from './store.js';
import * as appScanner from './appScanner.js';
import * as launcher from './launcher.js';
import * as hotkeys from './hotkeys.js';
import * as windows from './windows.js';
import * as notifications from './notifications.js';
import * as profileTemplates from './profileTemplates.js';

function isDevBuild() {
  return !app.isPackaged;
}

function normalizeAppearance(appearance) {
  if (appearance === 'light' || appearance === 'dark' || appearance === 'system') return appearance;
  return 'system';
}

function resolveAppearance(appearance) {
  const mode = normalizeAppearance(appearance);
  if (mode === 'system') return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  return mode;
}

export function register() {
  ipcMain.on('app:get-theme-sync', (e) => {
    const appearance = normalizeAppearance(store.getSettings().appearance);
    e.returnValue = {
      appearance,
      theme: resolveAppearance(appearance),
    };
  });

  ipcMain.on('app:apply-appearance-sync', (e, appearance) => {
    const mode = normalizeAppearance(appearance);
    nativeTheme.themeSource = mode;
    e.returnValue = {
      appearance: mode,
      theme: resolveAppearance(mode),
    };
  });

  ipcMain.handle('profiles:list', () => store.getSnapshot());
  ipcMain.handle('profiles:save', (_e, profile) => store.saveProfile(profile));
  ipcMain.handle('profiles:delete', (_e, id) => store.deleteProfile(id));
  ipcMain.handle('profiles:activate', (_e, id, opts) =>
    launcher.activateProfile(id, opts ?? {})
  );
  ipcMain.handle('profiles:templates', () => profileTemplates.listTemplates());
  ipcMain.handle('profiles:createFromTemplate', async (_e, templateId) => {
    const partial = await profileTemplates.buildProfileFromTemplate(templateId || 'blank');
    return store.saveProfile(partial);
  });

  ipcMain.handle('apps:scan', (_e, opts) => appScanner.scanApps(opts ?? {}));
  ipcMain.handle('apps:icons', (_e, paths) => appScanner.iconsFor(paths ?? []));
  ipcMain.handle('apps:get-icon', async (_e, appPath) => {
    if (!appPath) return null;
    const icons = await appScanner.iconsFor([appPath]);
    return icons[appPath] ?? null;
  });

  ipcMain.handle('settings:get', () => store.getSettings());
  ipcMain.handle('settings:set', (_e, partial) => {
    const next = store.setSettings(partial);
    if ('launchAtLogin' in partial) {
      app.setLoginItemSettings({ openAtLogin: !!partial.launchAtLogin });
    }
    if ('appearance' in partial) {
      const mode = normalizeAppearance(partial.appearance);
      nativeTheme.themeSource = mode;
      windows.broadcast('theme:updated', {
        appearance: mode,
        theme: resolveAppearance(mode),
      });
    }
    return next;
  });

  ipcMain.handle('hotkey:validate', (_e, accelerator) => hotkeys.validate(accelerator));
  ipcMain.handle('hotkey:status', () => hotkeys.status());

  ipcMain.on('switcher:hide', () => windows.hideSwitcher());
  ipcMain.on('switcher:activate', (_e, id) => {
    windows.hideSwitcher();
    windows.hideMenubar();
    launcher.activateProfile(id, { source: 'switcher' });
  });
  ipcMain.on('switcher:open', () => windows.toggleSwitcher());
  ipcMain.on('settings:openWindow', (_e, section) => windows.showSettings(section));
  ipcMain.on('menubar:hide', () => windows.hideMenubar());
  ipcMain.on('app:quit', () => app.quit());

  // Custom toast window actions
  ipcMain.on('toast:action', (_e, action) => windows.handleToastAction(action));
  ipcMain.on('toast:dismiss', () => windows.handleToastAction('dismiss'));

  // Dev helpers (packaged builds no-op / deny)
  ipcMain.handle('app:is-dev', () => isDevBuild());
  ipcMain.handle('dev:preview-toast', (_e, type) => {
    if (!isDevBuild()) return { ok: false, error: 'Dev only' };
    notifications.preview(type);
    return { ok: true, type };
  });

  // Push store changes to every open renderer.
  store.events.on('changed', () => {
    windows.broadcast('store:changed', store.getSnapshot());
  });
}
