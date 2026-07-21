import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { resolveAppearance } from '../../shared/theme.js';
import { applyAppearanceAnimated } from '../../shared/themeTransition.js';

export default function ThemeToggle() {
  const [appearance, setAppearance] = React.useState(
    () =>
      localStorage.getItem('shifty.appearance') ||
      window.shifty?.app?.appearance ||
      'system'
  );

  React.useEffect(() => {
    return window.shifty?.onStoreChanged?.((snap) => {
      if (snap?.settings?.appearance) setAppearance(snap.settings.appearance);
    });
  }, []);

  const resolved = resolveAppearance(appearance);
  const isDark = resolved === 'dark';
  const flippingRef = React.useRef(false);

  async function flip() {
    if (flippingRef.current) return;
    flippingRef.current = true;

    const next = isDark ? 'light' : 'dark';

    try {
      await applyAppearanceAnimated(next, appearance, {
        onSwap: () => setAppearance(next),
      });
      try {
        await window.shifty.setSettings({ appearance: next });
      } catch {
        /* keep local change even if save fails */
      }
    } finally {
      flippingRef.current = false;
    }
  }

  return (
    <button
      type="button"
      className="btn btn-chrome btn-icon-only"
      onClick={flip}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDark ? <Sun strokeWidth={1.6} size={15} aria-hidden="true" /> : <Moon strokeWidth={1.6} size={15} aria-hidden="true" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
