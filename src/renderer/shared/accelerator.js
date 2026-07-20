const KEY_ALIASES = {
  ' ': 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Escape: 'Esc',
};

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift', 'OS', 'Command']);

export function acceleratorToKeyCaps(accelerator) {
  if (!accelerator) return [];
  const isMac = navigator.platform.toLowerCase().includes('mac');
  return accelerator.split('+').map((part) => {
    if (part === 'CommandOrControl') return isMac ? '⌘' : 'Ctrl';
    if (part === 'Command') return '⌘';
    if (part === 'Control') return isMac ? '⌃' : 'Ctrl';
    if (part === 'Alt') return isMac ? '⌥' : 'Alt';
    if (part === 'Shift') return '⇧';
    if (part.length === 1) return part.toUpperCase();
    return part;
  });
}

export function keyEventToAccelerator(event) {
  const key = event.key;
  if (MODIFIER_KEYS.has(key)) return null;

  const parts = [];
  if (event.metaKey) parts.push('Command');
  if (event.ctrlKey) parts.push('Control');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  let keyName = KEY_ALIASES[key] || key;
  if (keyName.length === 1) keyName = keyName.toUpperCase();
  parts.push(keyName);

  if (parts.length < 2) return null;
  return parts.join('+');
}
