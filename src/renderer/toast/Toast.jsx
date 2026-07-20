import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import { applyResolvedTheme } from '../shared/theme.js';

/**
 * Custom top-of-screen toast — driven by main process via toast:show / toast:hide.
 * Supports optional primary action (e.g. Start / Quit).
 */
export default function Toast() {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubShow = window.shifty.onToastShow((payload) => {
      // Always match current app theme when a toast appears
      if (payload?.theme) {
        applyResolvedTheme(payload.theme, payload.appearance);
      }
      setToast(payload);
      setVisible(true);
    });
    const unsubHide = window.shifty.onToastHide(() => {
      setVisible(false);
    });
    // Live updates while toast window is warm (Settings theme save / OS flip)
    const unsubTheme = window.shifty.onThemeUpdated?.((data) => {
      if (data?.theme) applyResolvedTheme(data.theme, data.appearance);
    });
    return () => {
      unsubShow?.();
      unsubHide?.();
      unsubTheme?.();
    };
  }, []);

  function dismiss() {
    setVisible(false);
    window.shifty.toastDismiss();
  }

  function primary() {
    setVisible(false);
    window.shifty.toastAction('primary');
  }

  const kind = toast?.kind || 'info';
  const Icon = kind === 'success' ? Check : Bell;

  return (
    <div className="toast-root">
      <AnimatePresence
        onExitComplete={() => {
          if (!visible) setToast(null);
        }}
      >
        {visible && toast && (
          <motion.div
            className={`toast-card toast-card-${kind}`}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
          >
            <div className={`toast-icon toast-icon-${kind}`} aria-hidden="true">
              <Icon size={16} strokeWidth={2.25} />
            </div>

            <div className="toast-copy">
              <p className="toast-title">{toast.title}</p>
              {toast.body ? <p className="toast-body">{toast.body}</p> : null}
            </div>

            <div className="toast-actions">
              {toast.primaryLabel ? (
                <button type="button" className="toast-btn toast-btn-primary" onClick={primary}>
                  {toast.primaryLabel}
                </button>
              ) : null}
              <button
                type="button"
                className="toast-btn toast-btn-ghost"
                onClick={dismiss}
                aria-label="Dismiss"
                title="Dismiss"
              >
                <X size={14} strokeWidth={2.25} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
