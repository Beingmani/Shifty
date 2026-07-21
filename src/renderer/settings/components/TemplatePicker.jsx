import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

/**
 * Modal to pick a profile template (Work, Personal, Focus, Blank).
 * Templates resolve installed apps on this Mac; user can edit after create.
 */
export default function TemplatePicker({ open, onClose, onCreated }) {
  const [templates, setTemplates] = useState(null);
  const [creating, setCreating] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setError(null);
    setTemplates(null);
    window.shifty
      .listTemplates()
      .then((list) => {
        if (!cancelled) setTemplates(list ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load templates.');
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  async function pick(id) {
    if (creating) return;
    setCreating(id);
    setError(null);
    try {
      const profile = await window.shifty.createFromTemplate(id);
      onCreated?.(profile);
      onClose?.();
    } catch {
      setError('Could not create profile from template.');
    } finally {
      setCreating(null);
    }
  }

  return createPortal(
    <div
      className="template-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div
        className="template-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a profile template"
      >
        <header className="template-header">
          <div>
            <h2 className="template-title">New profile</h2>
            <p className="template-subtitle">
              Pick a template. Matching apps on this Mac are added automatically. Edit everything after.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-chrome btn-icon-only"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={15} strokeWidth={1.6} />
          </button>
        </header>

        <div className="template-body chromeScroll">
          {templates === null && (
            <div className="template-loading">
              <Loader2 size={18} className="spin" aria-hidden="true" />
              <span>Looking for apps on this Mac…</span>
            </div>
          )}

          {error && <p className="template-error">{error}</p>}

          {templates && (
            <div className="template-grid">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="template-card"
                  disabled={!!creating}
                  onClick={() => pick(t.id)}
                >
                  <span className="template-card-emoji" aria-hidden="true">
                    {t.emoji}
                  </span>
                  <span className="template-card-text">
                    <span className="template-card-name">{t.name}</span>
                    <span className="template-card-desc">{t.description}</span>
                    <span className="template-card-meta">
                      {t.id === 'blank'
                        ? 'No apps · fully custom'
                        : t.resolvedCount > 0
                          ? `${t.resolvedCount} app${t.resolvedCount === 1 ? '' : 's'} found on this Mac`
                          : 'No matching apps found · you can add them next'}
                    </span>
                  </span>
                  {creating === t.id && (
                    <Loader2 size={16} className="spin template-card-spinner" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
