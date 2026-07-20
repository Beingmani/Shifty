import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

export default function ProfileSwitcher({
  profiles = [],
  selectedId,
  activeProfileId,
  onSelect,
  onAdd,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selected = profiles.find((p) => p.id === selectedId) ?? profiles[0] ?? null;

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  if (!selected) return null;

  function pick(id) {
    onSelect(id);
    setOpen(false);
  }

  function handleAdd() {
    setOpen(false);
    onAdd?.();
  }

  return (
    <div className="brand-profile-switch" ref={rootRef}>
      <button
        type="button"
        className={`brand-profile-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Switch profile, current: ${selected.name}`}
      >
        <span className="brand-profile-trigger-label">{selected.name}</span>
        <ChevronDown size={14} strokeWidth={2} className="brand-profile-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="brand-profile-menu" role="listbox" aria-label="Profiles">
          <ul className="brand-profile-list">
            {profiles.map((p) => {
              const isSelected = p.id === selectedId;
              const isLive = p.id === activeProfileId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`brand-profile-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => pick(p.id)}
                  >
                    <span className="brand-profile-option-emoji" aria-hidden="true">
                      {p.emoji || '✦'}
                    </span>
                    <span className="brand-profile-option-name">{p.name}</span>
                    {isLive && (
                      <span className="brand-profile-option-dot" title="Active profile" aria-label="Active" />
                    )}
                    {isSelected && (
                      <svg
                        className="brand-profile-option-check"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {onAdd && (
            <div className="brand-profile-menu-foot">
              <button type="button" className="brand-profile-add" onClick={handleAdd}>
                <Plus size={14} strokeWidth={2.25} aria-hidden="true" />
                <span>New profile</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
