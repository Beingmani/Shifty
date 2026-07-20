export function resolveSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveAppearance(appearance) {
  if (appearance === 'system') return resolveSystemTheme();
  return appearance === 'dark' ? 'dark' : 'light';
}

function syncThemeToDom(appearance, resolved) {
  document.documentElement.setAttribute('data-theme', resolved);
  try {
    localStorage.setItem('shifty.theme', resolved);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem('shifty.appearance', appearance);
  } catch {
    /* ignore */
  }
}

export function applyAppearance(appearance) {
  const mode = appearance || 'system';
  if (window.shifty?.app?.applyAppearance) {
    const result = window.shifty.app.applyAppearance(mode);
    const resolved = result?.theme || resolveAppearance(mode);
    syncThemeToDom(result?.appearance || mode, resolved);
    return resolved;
  }
  const resolved = resolveAppearance(mode);
  syncThemeToDom(mode, resolved);
  return resolved;
}

let themeListenerAttached = false;

/** Apply a resolved theme token to the document (light | dark). */
export function applyResolvedTheme(theme, appearance) {
  if (theme !== 'light' && theme !== 'dark') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('shifty.theme', theme);
  } catch {
    /* ignore */
  }
  if (appearance === 'light' || appearance === 'dark' || appearance === 'system') {
    try {
      localStorage.setItem('shifty.appearance', appearance);
    } catch {
      /* ignore */
    }
  }
}

export function initTheme(appearance = 'system') {
  const boot = window.shifty?.app;
  applyAppearance(boot?.appearance ?? appearance);
  if (themeListenerAttached || typeof window === 'undefined') return;
  themeListenerAttached = true;
  // Always honor broadcasts so switcher / toast / settings stay in sync
  // for light, dark, and system (including OS flips while on system).
  window.shifty?.onThemeUpdated?.(({ theme, appearance: nextAppearance }) => {
    if (!theme) return;
    applyResolvedTheme(theme, nextAppearance);
  });
}
