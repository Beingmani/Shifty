import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../shared/useStore.js';
import { applyResolvedTheme } from '../shared/theme.js';
import AppIcon from '../settings/components/AppIcon.jsx';

const MAX_STACK = 5;

/**
 * Criss-cross stack: alternate lean left / right, slight Y offset.
 * Even → left, odd → right (clear X pattern when piled).
 */
function stackPose(i) {
  const leanLeft = i % 2 === 0;
  const rot = leanLeft ? -18 : 18;
  const y = leanLeft ? 3 : -3;
  const x = leanLeft ? -1 : 1;
  return {
    zIndex: i + 1,
    transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
  };
}

/** Overlapping, slightly fanned app icons only (no text). */
function AppStack({ apps, iconByPath, iconLoadingPaths }) {
  const list = apps ?? [];
  if (list.length === 0) return null;

  const shown = list.slice(0, MAX_STACK);
  const extra = list.length - shown.length;

  return (
    <div className="switcher-stack" aria-hidden="true">
      {shown.map((app, i) => (
        <span
          key={app.path}
          className="switcher-stack-icon"
          style={stackPose(i)}
          title={app.name}
        >
          <AppIcon
            src={iconByPath.get(app.path)}
            name={app.name}
            fill
            loading={iconLoadingPaths?.has(app.path) && !iconByPath.get(app.path)}
          />
        </span>
      ))}
      {extra > 0 && (
        <span className="switcher-stack-more" style={stackPose(shown.length)}>
          +{extra}
        </span>
      )}
    </div>
  );
}

export default function Switcher() {
  const snapshot = useStore();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [iconByPath, setIconByPath] = useState(() => new Map());
  const [pendingIconPaths, setPendingIconPaths] = useState(() => new Set());
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const profiles = snapshot?.profiles ?? [];
  const activeId = snapshot?.activeProfileId ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? profiles.filter((p) => p.name.toLowerCase().includes(q)) : profiles;
  }, [profiles, query]);

  const clampedIndex = Math.min(index, Math.max(filtered.length - 1, 0));

  // Reset, sync theme, and refocus every time the panel is shown.
  useEffect(() => {
    return window.shifty.onSwitcherShown((payload) => {
      if (payload?.theme) {
        applyResolvedTheme(payload.theme, payload.appearance);
      }
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }, []);

  // Load icons for all apps in all profiles (cached by main process).
  useEffect(() => {
    const paths = [];
    for (const p of profiles) {
      for (const a of p.apps ?? []) {
        if (a.path) paths.push(a.path);
      }
    }
    const unique = [...new Set(paths)];
    if (unique.length === 0) {
      setIconByPath(new Map());
      setPendingIconPaths(new Set());
      return undefined;
    }

    let cancelled = false;
    setPendingIconPaths(new Set(unique));

    window.shifty.iconsFor(unique).then((icons) => {
      if (cancelled || !icons) return;
      const m = new Map();
      for (const [path, url] of Object.entries(icons)) {
        if (url) m.set(path, url);
      }
      setIconByPath(m);
      setPendingIconPaths(new Set());
    });
    return () => {
      cancelled = true;
    };
  }, [profiles]);

  // Keep selected row in view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`[data-index="${clampedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [clampedIndex, filtered.length]);

  function move(delta) {
    if (filtered.length === 0) return;
    setIndex((clampedIndex + delta + filtered.length) % filtered.length);
  }

  function activate(id) {
    if (!id) return;
    window.shifty.switchTo(id);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      window.shifty.hideSwitcher();
    } else if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[clampedIndex];
      if (target) activate(target.id);
    }
  }

  return (
    <div className="switcher" onKeyDown={onKeyDown}>
      <header className="switcher-header">
        <div className="switcher-search">
          <Search size={15} strokeWidth={2} className="switcher-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            className="switcher-input"
            placeholder="Switch profile…"
            value={query}
            aria-label="Filter profiles"
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
          />
        </div>
      </header>

      <div className="switcher-list chromeScroll" ref={listRef} role="listbox" aria-label="Profiles">
        {filtered.length === 0 && (
          <div className="switcher-empty">
            {profiles.length === 0 ? (
              <button
                type="button"
                className="switcher-link"
                onClick={() => window.shifty.openSettings()}
              >
                No profiles yet — open Settings
              </button>
            ) : (
              <p className="switcher-empty-text">No matches</p>
            )}
          </div>
        )}

        {filtered.map((p, i) => {
          const selected = i === clampedIndex;
          const active = p.id === activeId;
          const count = p.apps?.length ?? 0;
          return (
            <button
              key={p.id}
              type="button"
              role="option"
              data-index={i}
              aria-selected={selected}
              className={`switcher-item${selected ? ' is-selected' : ''}${active ? ' is-active' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => activate(p.id)}
            >
              <span className="switcher-emoji" aria-hidden="true">
                {p.emoji || '🗂️'}
              </span>
              <span className="switcher-meta">
                <span className="switcher-name-row">
                  <span className="switcher-name">{p.name}</span>
                  {active && <span className="switcher-active-pill">Active</span>}
                </span>
                <span className="switcher-sub">
                  {count === 0 ? 'No apps' : `${count} app${count === 1 ? '' : 's'}`}
                </span>
              </span>
              <AppStack apps={p.apps} iconByPath={iconByPath} iconLoadingPaths={pendingIconPaths} />
            </button>
          );
        })}
      </div>

      <footer className="switcher-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <span className="switcher-footer-label">move</span>
        </span>
        <span>
          <kbd>↩</kbd>
          <span className="switcher-footer-label">switch</span>
        </span>
        <span>
          <kbd>esc</kbd>
          <span className="switcher-footer-label">close</span>
        </span>
      </footer>
    </div>
  );
}
