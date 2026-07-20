import { applyAppearance, resolveAppearance } from './theme.js';

export const THEME_SWEEP_COLORWAYS = ['stasho', 'mint', 'lagoon', 'deep', 'aurora', 'glow'];

export const THEME_SWEEP_MS = 2000;
export const THEME_MORPH_MS = 820;
const THEME_SWAP_AT = Math.max(0, THEME_SWEEP_MS - THEME_MORPH_MS);

let colorwayIndex = 0;
let bandEl = null;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function ensureGlimmBand() {
  if (bandEl?.isConnected) return bandEl;
  bandEl = document.createElement('div');
  bandEl.className = 'glimm-band';
  bandEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bandEl);
  return bandEl;
}

function morphTheme(nextAppearance) {
  const root = document.documentElement;
  root.classList.add('theme-morph');
  applyAppearance(nextAppearance);
  window.setTimeout(() => root.classList.remove('theme-morph'), THEME_MORPH_MS + 500);
}

function runSweep(fromResolved, onSwap) {
  const el = ensureGlimmBand();
  el.style.mixBlendMode = fromResolved === 'dark' ? 'screen' : 'multiply';

  const colorway = THEME_SWEEP_COLORWAYS[colorwayIndex % THEME_SWEEP_COLORWAYS.length];
  colorwayIndex += 1;

  const zone = 100 / 6;
  for (let i = 1; i <= 6; i += 1) {
    const x = (i - 1) * zone + Math.random() * zone;
    const y = 18 + Math.random() * 64;
    el.style.setProperty(`--b${i}x`, `${x.toFixed(1)}%`);
    el.style.setProperty(`--b${i}y`, `${y.toFixed(1)}%`);
  }

  el.classList.remove('glimm-band--sweep');
  THEME_SWEEP_COLORWAYS.forEach((name) => el.classList.remove(`glimm-band--${name}`));
  void el.offsetWidth;
  el.classList.add(`glimm-band--${colorway}`, 'glimm-band--sweep');

  const done = () => el.classList.remove('glimm-band--sweep');
  el.addEventListener('animationend', done, { once: true });

  window.setTimeout(() => onSwap(), THEME_SWAP_AT);
}

export function applyAppearanceAnimated(nextAppearance, currentAppearance, { onSwap } = {}) {
  const fromResolved = resolveAppearance(currentAppearance);
  const toResolved = resolveAppearance(nextAppearance);

  if (fromResolved === toResolved || prefersReducedMotion()) {
    applyAppearance(nextAppearance);
    onSwap?.();
    return Promise.resolve(toResolved);
  }

  return new Promise((resolve) => {
    runSweep(fromResolved, () => {
      morphTheme(nextAppearance);
      onSwap?.();
      resolve(toResolved);
    });
  });
}
