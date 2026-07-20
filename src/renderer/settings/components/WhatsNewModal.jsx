import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Wrench, ArrowLeftRight, X } from 'lucide-react';
import changelogRaw from '../../../../CHANGELOG.md?raw';
import { parseChangelog } from '../../shared/parseChangelog.js';

const GROUP_CONFIG = {
  Added: { className: 'is-added', Icon: Sparkles },
  Fixed: { className: 'is-fixed', Icon: Wrench },
  Changed: { className: 'is-changed', Icon: ArrowLeftRight },
};

const ICON = { size: 12, strokeWidth: 2.2, 'aria-hidden': true };

export default function WhatsNewModal({ open, onClose, onViewAll }) {
  const release = useMemo(() => {
    const releases = parseChangelog(changelogRaw);
    return (
      releases.find((r) => r.version === import.meta.env.VITE_APP_VERSION) || releases[0] || null
    );
  }, []);

  if (!open || !release) return null;

  return createPortal(
    <div
      className="settings-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div className="whatsnew-modal" role="dialog" aria-modal="true" aria-label="What's new">
        <header className="whatsnew-modal-header">
          <h2 className="whatsnew-modal-title">What&apos;s new in v{release.version}</h2>
          <button type="button" className="btn btn-chrome btn-icon-only" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </header>

        <div className="whatsnew-modal-body">
          {release.summary ? <p className="whatsnew-modal-summary">{release.summary}</p> : null}

          {release.groups.length > 0 ? (
            <div className="whatsnew-modal-groups">
              {release.groups.map((group) => {
                const config = GROUP_CONFIG[group.label] || GROUP_CONFIG.Changed;
                const { className, Icon } = config;
                return (
                  <div key={group.label} className="whatsnew-modal-group">
                    <span className={['whatsnew-modal-group-label', className].join(' ')}>{group.label}</span>
                    <ul className="whatsnew-modal-items">
                      {group.items.map((item, i) => (
                        <li key={i} className="whatsnew-modal-item">
                          <span className={['whatsnew-modal-item-icon', className].join(' ')}>
                            <Icon {...ICON} />
                          </span>
                          {item.split(' — ')[0]}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <footer className="whatsnew-modal-footer">
          <button type="button" className="btn btn-chrome" onClick={onViewAll}>
            Full changelog
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
