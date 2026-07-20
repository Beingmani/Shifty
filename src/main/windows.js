import { BrowserWindow, screen, nativeTheme } from 'electron';
import path from 'node:path';
import { loadAppIcon, setDockVisible, settingsWindowNeedsDock } from './dock.js';
import * as store from './store.js';

let settingsWindow = null;
let switcherWindow = null;
let menubarWindow = null;
let toastWindow = null;
let toastHideTimer = null;
/** Cancels a deferred window.hide() when a new toast is shown right after dismiss. */
let toastWindowHideTimer = null;
/** Bumps whenever a toast is shown so stale hide timers can’t kill the new one. */
let toastGeneration = 0;
let toastCallbacks = { onPrimary: null, onDismiss: null, onTimeout: null };

/** macOS fires `app.activate` when a global shortcut wakes the app — skip opening Settings. */
let suppressSettingsOnActivate = false;

export function isSwitcherVisible() {
  return Boolean(
    switcherWindow && !switcherWindow.isDestroyed() && switcherWindow.isVisible()
  );
}

export function hasSettingsWindow() {
  return Boolean(settingsWindow && !settingsWindow.isDestroyed());
}

export function shouldOpenSettingsOnActivate() {
  if (suppressSettingsOnActivate || isSwitcherVisible()) return false;
  return hasSettingsWindow();
}

function markSwitcherActivation() {
  suppressSettingsOnActivate = true;
  queueMicrotask(() => {
    suppressSettingsOnActivate = false;
  });
}

function syncDockForSettings() {
  setDockVisible(settingsWindowNeedsDock(settingsWindow));
}

function attachSettingsDockHandlers(win) {
  const sync = () => syncDockForSettings();
  win.on('show', sync);
  win.on('hide', sync);
  win.on('minimize', sync);
  win.on('restore', sync);
  win.on('closed', sync);
}

const TOAST_WIDTH = 440;
const TOAST_HEIGHT = 96;

// Vite bundles main+preload side by side into .vite/build/, so __dirname works here.
const preloadPath = path.join(__dirname, 'preload.js');

function load(win, page) {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // Surface renderer errors in the terminal during development.
    win.webContents.on('console-message', (_e, level, message) => {
      if (level >= 2) console.log(`[renderer ${page}] ${message}`);
    });
    win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/${page}`);
  } else {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/${page}`)
    );
  }
}

export function showSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    setDockVisible(true);
    return settingsWindow;
  }
  settingsWindow = new BrowserWindow({
    width: 920,
    height: 640,
    minWidth: 720,
    minHeight: 480,
    title: 'Shifty',
    icon: loadAppIcon(),
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 22, y: 18 },
    backgroundColor: '#00000000',
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    show: false,
    webPreferences: { preload: preloadPath },
  });
  load(settingsWindow, 'settings.html');
  attachSettingsDockHandlers(settingsWindow);
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    settingsWindow.focus();
    setDockVisible(true);
  });
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  return settingsWindow;
}

export function createSwitcher() {
  switcherWindow = new BrowserWindow({
    width: 480,
    height: 440,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    fullscreenable: false,
    minimizable: false,
    hasShadow: false,
    webPreferences: { preload: preloadPath },
  });
  switcherWindow.setAlwaysOnTop(true, 'screen-saver');
  switcherWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  load(switcherWindow, 'switcher.html');
  switcherWindow.on('blur', () => hideSwitcher());
  return switcherWindow;
}

function currentThemePayload() {
  const appearance = store.getSettings()?.appearance ?? 'system';
  const theme =
    appearance === 'dark' || appearance === 'light'
      ? appearance
      : nativeTheme.shouldUseDarkColors
        ? 'dark'
        : 'light';
  return { appearance, theme };
}

export function toggleSwitcher() {
  if (!switcherWindow || switcherWindow.isDestroyed()) createSwitcher();
  if (switcherWindow.isVisible()) {
    hideSwitcher();
    return;
  }
  markSwitcherActivation();
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { x, y, width, height } = display.workArea;
  const [w, h] = switcherWindow.getSize();
  switcherWindow.setPosition(
    Math.round(x + (width - w) / 2),
    Math.round(y + height * 0.22)
  );
  switcherWindow.show();
  switcherWindow.focus();
  // Send theme every open so a long-lived switcher window never drifts
  switcherWindow.webContents.send('switcher:shown', currentThemePayload());
}

export function hideSwitcher() {
  if (switcherWindow && !switcherWindow.isDestroyed() && switcherWindow.isVisible()) {
    switcherWindow.hide();
  }
}

// ── Menu bar popover (solid chrome under tray icon) ───────────────────

const MENUBAR_W = 340;
const MENUBAR_H = 420;

function ensureMenubarWindow() {
  if (menubarWindow && !menubarWindow.isDestroyed()) return menubarWindow;

  menubarWindow = new BrowserWindow({
    width: MENUBAR_W,
    height: MENUBAR_H,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: preloadPath,
      backgroundThrottling: false,
    },
  });

  try {
    menubarWindow.setAlwaysOnTop(true, 'floating');
  } catch {
    menubarWindow.setAlwaysOnTop(true);
  }
  try {
    menubarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch {
    /* ignore */
  }

  load(menubarWindow, 'menubar.html');
  menubarWindow.on('blur', () => hideMenubar());
  menubarWindow.on('closed', () => {
    menubarWindow = null;
  });
  return menubarWindow;
}

/**
 * Position + show the menubar panel under the tray icon bounds.
 * @param {{ x: number, y: number, width: number, height: number } | null} trayBounds
 */
export function showMenubar(trayBounds = null) {
  const win = ensureMenubarWindow();
  hideSwitcher();

  const display = trayBounds
    ? screen.getDisplayNearestPoint({
        x: Math.round(trayBounds.x + trayBounds.width / 2),
        y: Math.round(trayBounds.y + trayBounds.height / 2),
      })
    : screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

  const { x: dx, y: dy, width: dw, height: dh } = display.workArea;
  const [ww, wh] = win.getSize();

  let px;
  let py;
  if (trayBounds && trayBounds.width > 0) {
    px = Math.round(trayBounds.x + trayBounds.width / 2 - ww / 2);
    // Menu bar is above workArea; place just under the tray icon
    py = Math.round(trayBounds.y + trayBounds.height + 6);
  } else {
    px = Math.round(dx + dw - ww - 12);
    py = Math.round(dy + 8);
  }

  // Clamp into display work area
  px = Math.min(Math.max(px, display.bounds.x + 4), display.bounds.x + display.bounds.width - ww - 4);
  py = Math.min(Math.max(py, dy), dy + dh - wh - 4);

  win.setPosition(px, py, false);

  const reveal = () => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('menubar:shown', currentThemePayload());
    win.show();
    win.focus();
  };

  if (win.webContents.isLoadingMainFrame?.() || win.webContents.isLoading()) {
    win.webContents.once('did-finish-load', reveal);
  } else {
    reveal();
  }
}

export function hideMenubar() {
  if (menubarWindow && !menubarWindow.isDestroyed() && menubarWindow.isVisible()) {
    menubarWindow.hide();
  }
}

export function toggleMenubar(trayBounds = null) {
  if (menubarWindow && !menubarWindow.isDestroyed() && menubarWindow.isVisible()) {
    hideMenubar();
    return;
  }
  showMenubar(trayBounds);
}

/** Send to every open renderer. */
export function broadcast(channel, payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

// ── Custom toast (top-center, below notch / menu bar) ─────────────────

/** Best-effort warm-up — never throws (must not block app startup). */
export function ensureToastReady() {
  try {
    return ensureToastWindow();
  } catch (err) {
    console.error('[toast] ensureToastReady failed', err);
    return null;
  }
}

function ensureToastWindow() {
  if (toastWindow && !toastWindow.isDestroyed()) return toastWindow;

  // Keep options conservative — exotic window types (panel/toolbar) have
  // crashed some Electron/macOS combos at launch.
  toastWindow = new BrowserWindow({
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT,
    show: false,
    frame: false,
    // Transparent so rounded corners don’t show a square OS frame behind the card
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: true,
    // Off: CSS box-shadow on .toast-card is the only shadow (avoids double layer)
    hasShadow: false,
    webPreferences: {
      preload: preloadPath,
      backgroundThrottling: false,
    },
  });

  try {
    toastWindow.setAlwaysOnTop(true, 'floating');
  } catch {
    toastWindow.setAlwaysOnTop(true);
  }
  try {
    toastWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch {
    /* ignore */
  }
  try {
    toastWindow.setHiddenInMissionControl?.(true);
  } catch {
    /* ignore */
  }

  load(toastWindow, 'toast.html');
  toastWindow.on('closed', () => {
    toastWindow = null;
  });
  return toastWindow;
}

function positionToast(win) {
  const point = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  // workArea.y is already below the menu bar / notch
  const { x, y, width } = display.workArea;
  const [w] = win.getSize();
  const posX = Math.round(x + (width - w) / 2);
  const posY = Math.round(y + 10);
  win.setPosition(posX, posY, false);
}

/**
 * Show the custom Shifty toast.
 * @param {{ title, body, primaryLabel?, kind?, durationMs?, onPrimary?, onDismiss? }} opts
 */
export function showToast(opts = {}) {
  let win;
  try {
    win = ensureToastWindow();
  } catch (err) {
    console.error('[toast] could not create toast window', err);
    return;
  }
  if (!win) return;

  // Invalidate any pending auto-dismiss / window-hide from a previous toast
  // (e.g. Start → Quit ask: old hide timer used to kill the quit prompt).
  toastGeneration += 1;
  const gen = toastGeneration;
  if (toastHideTimer) {
    clearTimeout(toastHideTimer);
    toastHideTimer = null;
  }
  if (toastWindowHideTimer) {
    clearTimeout(toastWindowHideTimer);
    toastWindowHideTimer = null;
  }

  toastCallbacks = {
    onPrimary: typeof opts.onPrimary === 'function' ? opts.onPrimary : null,
    onDismiss: typeof opts.onDismiss === 'function' ? opts.onDismiss : null,
    onTimeout: typeof opts.onTimeout === 'function' ? opts.onTimeout : null,
  };

  const { theme, appearance } = currentThemePayload();

  const payload = {
    id: `${Date.now()}`,
    title: opts.title || 'Shifty',
    body: opts.body || '',
    primaryLabel: opts.primaryLabel || null,
    kind: opts.kind || 'info',
    theme,
    appearance,
  };

  const reveal = () => {
    if (!win || win.isDestroyed() || gen !== toastGeneration) return;
    try {
      positionToast(win);
      win.webContents.send('toast:show', payload);
      // showInactive keeps the user’s focused app active
      if (typeof win.showInactive === 'function') win.showInactive();
      else win.show();
    } catch (err) {
      console.error('[toast] reveal failed', err);
    }

    const ms = Number(opts.durationMs);
    if (Number.isFinite(ms) && ms > 0) {
      toastHideTimer = setTimeout(() => {
        if (gen !== toastGeneration) return;
        hideToast({ reason: 'timeout' });
      }, ms);
    }
  };

  if (win.webContents.isLoadingMainFrame?.() || win.webContents.isLoading()) {
    win.webContents.once('did-finish-load', reveal);
  } else {
    reveal();
  }
}

export function hideToast({ reason = 'dismiss', runCallbacks = true } = {}) {
  if (toastHideTimer) {
    clearTimeout(toastHideTimer);
    toastHideTimer = null;
  }

  const cb = toastCallbacks;
  toastCallbacks = { onPrimary: null, onDismiss: null, onTimeout: null };

  if (toastWindow && !toastWindow.isDestroyed()) {
    const genAtHide = toastGeneration;
    try {
      toastWindow.webContents.send('toast:hide');
    } catch {
      /* ignore */
    }
    // Delay so exit animation can play — but cancel if a new toast is shown
    if (toastWindowHideTimer) clearTimeout(toastWindowHideTimer);
    toastWindowHideTimer = setTimeout(() => {
      toastWindowHideTimer = null;
      if (genAtHide !== toastGeneration) return;
      if (toastWindow && !toastWindow.isDestroyed() && toastWindow.isVisible()) {
        toastWindow.hide();
      }
    }, 220);
  }

  if (runCallbacks) {
    try {
      if (reason === 'timeout' && typeof cb.onTimeout === 'function') cb.onTimeout();
      else if (reason === 'dismiss' && typeof cb.onDismiss === 'function') cb.onDismiss();
      // primary is invoked by handleToastAction after hideToast returns
    } catch (err) {
      console.error('[toast] callback failed', err);
    }
  }

  return cb;
}

/** Called from IPC when user clicks primary / dismiss in the toast renderer. */
export function handleToastAction(action) {
  if (action === 'primary') {
    const { onPrimary } = hideToast({ reason: 'primary', runCallbacks: false });
    if (typeof onPrimary === 'function') {
      // Run after hide so the queue can present the next toast cleanly
      setTimeout(() => {
        try {
          const result = onPrimary();
          if (result && typeof result.then === 'function') {
            result.catch((err) => console.error('[toast] onPrimary failed', err));
          }
        } catch (err) {
          console.error('[toast] onPrimary failed', err);
        }
      }, 0);
    }
    return;
  }
  hideToast({ reason: 'dismiss' });
}
