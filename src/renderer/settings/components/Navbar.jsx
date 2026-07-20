import React from 'react';
import ThemeToggle from './ThemeToggle.jsx';
import appIcon from '@assets/app-icon.png';

export default function Navbar({
  profileName,
  hotkey,
  canActivate,
  activating,
  isActiveProfile,
  onOpenSettings,
  onActivate,
  onGoHome,
}) {
  const hotkeyLabel =
    hotkey
      ?.replace('Alt', '⌥')
      .replace('Command', '⌘')
      .replace('Control', '⌃')
      .replace('Shift', '⇧') ?? '⌥Space';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand-cluster">
          <button type="button" className="brand-home" onClick={onGoHome}>
            <img src={appIcon} alt="" className="brand-icon" width={28} height={28} draggable={false} />
            <span className="brand-wordmark">Shifty</span>
          </button>
          {profileName && (
            <>
              <span className="brand-separator" aria-hidden="true">
                /
              </span>
              <span className="brand-context">{profileName}</span>
            </>
          )}
        </div>

        <button type="button" className="navbar-search-trigger" disabled aria-hidden="true">
          <span className="navbar-search-text">Press {hotkeyLabel} to switch</span>
          <kbd className="navbar-search-kbd">{hotkeyLabel}</kbd>
        </button>

        <div className="navbar-actions">
          <ThemeToggle />

          <button
            type="button"
            className="btn btn-chrome btn-icon-only"
            onClick={onOpenSettings}
            title="Settings"
            aria-label="Settings"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          {canActivate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onActivate}
              disabled={activating}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>{activating ? 'Opening…' : isActiveProfile ? 'Reopen' : 'Activate'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
