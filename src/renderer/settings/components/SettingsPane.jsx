import React from 'react';

/** Stasho-style content pane: title header + scrollable body. */
export default function SettingsPane({ title, description, actions, children }) {
  return (
    <div className="pane">
      {(title || description || actions) && (
        <header className="pane-header">
          <div className="pane-header-text">
            {title && <h2 className="pane-title">{title}</h2>}
            {description && <p className="pane-description">{description}</p>}
          </div>
          {actions && <div className="pane-header-actions">{actions}</div>}
        </header>
      )}
      <div className="pane-scroll chromeScroll">
        <div className="pane-body">
          <div className="content-panel">{children}</div>
        </div>
      </div>
    </div>
  );
}
