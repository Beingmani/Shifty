import { contextBridge, ipcRenderer } from 'electron';

function subscribe(channel, cb) {
  const listener = (_event, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const boot = (() => {
  try {
    const data = ipcRenderer.sendSync('app:get-theme-sync');
    if (data && typeof data === 'object') return data;
    return { appearance: 'system', theme: data || 'light' };
  } catch {
    return { appearance: 'system', theme: 'light' };
  }
})();

contextBridge.exposeInMainWorld('shifty', {
  app: {
    theme: boot.theme,
    appearance: boot.appearance,
    applyAppearance: (appearance) => {
      try {
        return ipcRenderer.sendSync('app:apply-appearance-sync', appearance);
      } catch {
        return { appearance: 'system', theme: 'light' };
      }
    },
  },

  listProfiles: () => ipcRenderer.invoke('profiles:list'),
  saveProfile: (profile) => ipcRenderer.invoke('profiles:save', profile),
  deleteProfile: (id) => ipcRenderer.invoke('profiles:delete', id),
  activateProfile: (id, opts) => ipcRenderer.invoke('profiles:activate', id, opts),
  listTemplates: () => ipcRenderer.invoke('profiles:templates'),
  createFromTemplate: (templateId) =>
    ipcRenderer.invoke('profiles:createFromTemplate', templateId),

  scanApps: (opts) => ipcRenderer.invoke('apps:scan', opts),
  iconsFor: (paths) => ipcRenderer.invoke('apps:icons', paths),
  getAppIcon: (appPath) => ipcRenderer.invoke('apps:get-icon', appPath),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (partial) => ipcRenderer.invoke('settings:set', partial),

  validateHotkey: (accelerator) => ipcRenderer.invoke('hotkey:validate', accelerator),
  hotkeyStatus: () => ipcRenderer.invoke('hotkey:status'),

  isDev: () => ipcRenderer.invoke('app:is-dev'),
  previewToast: (type) => ipcRenderer.invoke('dev:preview-toast', type),

  hideSwitcher: () => ipcRenderer.send('switcher:hide'),
  openSwitcher: () => ipcRenderer.send('switcher:open'),
  switchTo: (id) => ipcRenderer.send('switcher:activate', id),
  openSettings: () => ipcRenderer.send('settings:openWindow'),
  hideMenubar: () => ipcRenderer.send('menubar:hide'),
  quitApp: () => ipcRenderer.send('app:quit'),

  // Custom toast window
  toastAction: (action) => ipcRenderer.send('toast:action', action),
  toastDismiss: () => ipcRenderer.send('toast:dismiss'),
  onToastShow: (cb) => subscribe('toast:show', cb),
  onToastHide: (cb) => subscribe('toast:hide', cb),

  onStoreChanged: (cb) => subscribe('store:changed', cb),
  onSwitcherShown: (cb) => subscribe('switcher:shown', cb),
  onMenubarShown: (cb) => subscribe('menubar:shown', cb),
  onThemeUpdated: (cb) => subscribe('theme:updated', cb),
});
