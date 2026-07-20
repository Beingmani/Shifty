import { globalShortcut } from 'electron';
import * as store from './store.js';

let current = null;
let onTrigger = null;

export function validate(accelerator) {
  if (!accelerator) return { ok: false, reason: 'Empty shortcut' };
  if (globalShortcut.isRegistered(accelerator) && accelerator !== current) {
    return { ok: false, reason: 'Already in use by Shifty' };
  }
  try {
    // Test-register (unless it's already ours), then restore.
    if (accelerator === current) return { ok: true };
    const ok = globalShortcut.register(accelerator, () => {});
    if (ok) globalShortcut.unregister(accelerator);
    return ok
      ? { ok: true }
      : { ok: false, reason: 'That shortcut is taken by another app' };
  } catch (err) {
    return { ok: false, reason: `Invalid shortcut: ${err.message}` };
  }
}

export function register() {
  const { hotkey } = store.getSettings();
  if (current) {
    try {
      globalShortcut.unregister(current);
    } catch {
      /* ignore */
    }
    current = null;
  }
  if (!hotkey) return { ok: false, reason: 'No shortcut set' };
  let ok = false;
  try {
    ok = globalShortcut.register(hotkey, () => onTrigger?.());
  } catch {
    ok = false;
  }
  if (ok) current = hotkey;
  return ok
    ? { ok: true }
    : { ok: false, reason: `Could not register "${hotkey}" — it may be taken by another app` };
}

export function status() {
  const { hotkey } = store.getSettings();
  return { hotkey, registered: current === hotkey && !!hotkey };
}

export function init(trigger) {
  onTrigger = trigger;
  const result = register();
  store.events.on('changed', (what) => {
    if (what === 'settings') register();
  });
  return result;
}
