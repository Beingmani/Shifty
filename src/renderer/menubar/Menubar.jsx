import React, { useEffect, useMemo, useState } from 'react';
import { Settings, AppWindow, Power } from 'lucide-react';
import { useStore } from '../shared/useStore.js';
import { applyResolvedTheme } from '../shared/theme.js';
import AppIcon from '../settings/components/AppIcon.jsx';
import appIcon from '@assets/app-icon.png';

const MAX_STACK = 4;

function stackPose(i) {
  const leanLeft = i % 2 === 0;
  return {
    zIndex: i + 1,
    transform: `translate(${leanLeft ? -1 : 1}px, ${leanLeft ? 2 : -2}px) rotate(${leanLeft ? -16 : 16}deg)`,
  };
}

function AppStack({ apps, iconByPath }) {
  const list = apps ?? [];
  if (list.length === 0) return null;
  const shown = list.slice(0, MAX_STACK);
  const extra = list.length - shown.length;
  return (
    <div className="mb-stack" aria-hidden="true">
      {shown.map((app, i) => (
        <span key={app.path} className="mb-stack-icon" style={stackPose(i)} title={app.name}>
          <AppIcon src={iconByPath.get(app.path)} name={app.name} fill />
        </span>
      ))}
      {extra > 0 && (
        <span className="mb-stack-more" style={stackPose(shown.length)}>
          +{extra}
        </span>
      )}
    </div>
  );
}

export default function Menubar() {
  const snapshot = useStore();
  const [iconByPath, setIconByPath] = useState(() => new Map());
  const [activatingId, setActivatingId] = useState(null);

  const profiles = snapshot?.profiles ?? [];
  const activeId = snapshot?.activeProfileId ?? null;
  const active = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId]
  );

  useEffect(() => {
    return window.shifty.onMenubarShown?.((payload) => {
      if (payload?.theme) applyResolvedTheme(payload.theme, payload.appearance);
      setActivatingId(null);
    });
  }, []);

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
      return undefined;
    }
    let cancelled = false;
    window.shifty.iconsFor(unique).then((icons) => {
      if (cancelled || !icons) return;
      const m = new Map();
      for (const [p, url] of Object.entries(icons)) {
        if (url) m.set(p, url);
      }
      setIconByPath(m);
    });
    return () => {
      cancelled = true;
    };
  }, [profiles]);

  async function activate(id) {
    if (!id || activatingId) return;
    setActivatingId(id);
    try {
      await window.shifty.activateProfile(id);
      window.shifty.hideMenubar?.();
    } finally {
      setActivatingId(null);
    }
  }

  function openShifty() {
    window.shifty.openSettings();
    window.shifty.hideMenubar?.();
  }

  function quitApp() {
    window.shifty.quitApp?.();
  }

  return (
    <div className="mb-panel">
      <header className="mb-header">
        <div className="mb-brand">
          <img src={appIcon} alt="" className="mb-brand-icon" width={28} height={28} draggable={false} />
          <div className="mb-brand-text">
            <span className="mb-brand-name">Shifty</span>
            <span className="mb-brand-sub">
              {active
                ? `Active · ${active.emoji || ''} ${active.name}`.trim()
                : 'Switch profile'}
            </span>
          </div>
        </div>
      </header>

      <div className="mb-list chromeScroll" role="listbox" aria-label="Profiles">
        {profiles.length === 0 ? (
          <div className="mb-empty">
            <p className="mb-empty-text">No profiles yet</p>
            <button type="button" className="mb-link" onClick={openShifty}>
              Open Settings to create one
            </button>
          </div>
        ) : (
          profiles.map((p) => {
            const isActive = p.id === activeId;
            const busy = activatingId === p.id;
            const count = p.apps?.length ?? 0;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`mb-item${isActive ? ' is-active' : ''}${busy ? ' is-busy' : ''}`}
                onClick={() => activate(p.id)}
                disabled={!!activatingId}
              >
                <span className="mb-emoji" aria-hidden="true">
                  {p.emoji || '🗂️'}
                </span>
                <span className="mb-meta">
                  <span className="mb-name-row">
                    <span className="mb-name">{p.name}</span>
                    {isActive && <span className="mb-pill">Active</span>}
                  </span>
                  <span className="mb-sub">
                    {busy
                      ? 'Switching…'
                      : count === 0
                        ? 'No apps'
                        : `${count} app${count === 1 ? '' : 's'}`}
                  </span>
                </span>
                <AppStack apps={p.apps} iconByPath={iconByPath} />
              </button>
            );
          })
        )}
      </div>

      <footer className="mb-footer">
        <button type="button" className="mb-footer-btn" onClick={openShifty} title="Open Shifty">
          <AppWindow size={13} strokeWidth={2.25} aria-hidden="true" />
          <span className="mb-footer-label">Open</span>
        </button>
        <button type="button" className="mb-footer-btn" onClick={openShifty} title="Settings">
          <Settings size={13} strokeWidth={2.25} aria-hidden="true" />
          <span className="mb-footer-label">Settings</span>
        </button>
        <button
          type="button"
          className="mb-footer-btn mb-footer-quit"
          onClick={quitApp}
          title="Quit Shifty"
        >
          <Power size={13} strokeWidth={2.25} aria-hidden="true" />
          <span className="mb-footer-label">Quit</span>
        </button>
      </footer>
    </div>
  );
}
