import React, { useCallback, useEffect, useState } from 'react';

const RELEASES_URL = 'https://github.com/Beingmani/Shifty/releases';
const ISSUES_URL = 'https://github.com/Beingmani/Shifty/issues/new/choose';
const SOURCE_URL = 'https://github.com/Beingmani/Shifty';
const CHANGELOG_URL = 'https://github.com/Beingmani/Shifty/blob/main/CHANGELOG.md';

const BUILT_WITH = [
  { name: 'Electron', role: 'Desktop shell', url: 'https://www.electronjs.org/' },
  { name: 'React', role: 'Interface', url: 'https://react.dev/' },
  { name: 'Framer Motion', role: 'Motion', url: 'https://www.framer.com/motion/' },
  { name: 'Lucide', role: 'Icons', url: 'https://lucide.dev/' },
];

function openExternal(url) {
  window.shifty?.shell?.openUrl?.(url);
}

export default function SettingsAbout() {
  const [info, setInfo] = useState(null);
  const [updateState, setUpdateState] = useState({ checking: false, message: '' });
  const [updateAvailable, setUpdateAvailable] = useState(null);

  const loadInfo = useCallback(async () => {
    try {
      const [appInfo, current] = await Promise.all([
        window.shifty.appInfo.get(),
        window.shifty.updates.getCurrent(),
      ]);
      setInfo({
        ...appInfo,
        version: appInfo?.version || current?.version || '',
      });
    } catch {
      setInfo(null);
    }
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const checkUpdates = useCallback(async () => {
    setUpdateState({ checking: true, message: '' });
    try {
      const result = await window.shifty.updates.check();
      if (result?.available) {
        setUpdateAvailable(result);
        setUpdateState({ checking: false, message: `Version ${result.version} is available.` });
      } else if (result?.error) {
        setUpdateState({ checking: false, message: 'Could not check for updates.' });
      } else {
        setUpdateAvailable(null);
        setUpdateState({
          checking: false,
          message: result?.latest
            ? `You’re on the latest release (${result.current}).`
            : `You’re on ${result?.current || 'the current version'}.`,
        });
      }
    } catch {
      setUpdateState({ checking: false, message: 'Could not check for updates.' });
    }
  }, []);

  return (
    <div className="settings-about">
      <div className="settings-about-hero">
        <div className="settings-about-title-row">
          <h3 className="settings-about-name">{info?.name || 'Shifty'}</h3>
          <span className="settings-about-version">
            {info?.version ? `v${info.version}` : '…'}
          </span>
        </div>
        <p className="settings-about-tagline">
          Profile-based app switcher for macOS. Your profiles and settings stay on this Mac.
        </p>
        {updateAvailable?.version ? (
          <span className="settings-about-update-note">Update {updateAvailable.version} available</span>
        ) : null}
      </div>

      <div className="settings-about-group">
        <h4 className="settings-about-group-title">Updates</h4>
        <div className="settings-about-row">
          <span className="settings-about-row-label">Check for updates</span>
          <button
            type="button"
            className="btn btn-chrome btn-compact"
            onClick={checkUpdates}
            disabled={updateState.checking}
          >
            {updateState.checking ? 'Checking…' : 'Check now'}
          </button>
        </div>
        {updateState.message ? (
          <p
            className={[
              'settings-about-status',
              updateState.message.includes('Could not') && 'is-error',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {updateState.message}
          </p>
        ) : null}
        {updateAvailable ? (
          <div className="settings-about-row">
            <span className="settings-about-row-label">Download</span>
            <button
              type="button"
              className="settings-about-link"
              onClick={() => window.shifty.updates.open()}
            >
              Open release page
            </button>
          </div>
        ) : null}
      </div>

      <div className="settings-about-group">
        <h4 className="settings-about-group-title">Support</h4>
        <div className="settings-about-row">
          <span className="settings-about-row-label">Report a bug</span>
          <button type="button" className="settings-about-link" onClick={() => openExternal(ISSUES_URL)}>
            GitHub Issues
          </button>
        </div>
        <div className="settings-about-row">
          <span className="settings-about-row-label">Release notes</span>
          <button type="button" className="settings-about-link" onClick={() => openExternal(RELEASES_URL)}>
            View releases
          </button>
        </div>
        <div className="settings-about-row">
          <span className="settings-about-row-label">Changelog</span>
          <button type="button" className="settings-about-link" onClick={() => openExternal(CHANGELOG_URL)}>
            View changelog
          </button>
        </div>
        <div className="settings-about-row">
          <span className="settings-about-row-label">Source code</span>
          <button type="button" className="settings-about-link" onClick={() => openExternal(SOURCE_URL)}>
            GitHub
          </button>
        </div>
      </div>

      <div className="settings-about-group">
        <h4 className="settings-about-group-title">Built with</h4>
        <p className="settings-about-lead">
          Shifty is made possible by open-source software. Tap a library to learn more.
        </p>
        <div className="settings-about-built-grid">
          {BUILT_WITH.map((lib) => (
            <button
              key={lib.name}
              type="button"
              className="settings-about-built-card"
              onClick={() => openExternal(lib.url)}
            >
              <span className="settings-about-built-main">
                <span className="settings-about-built-name">{lib.name}</span>
                <span className="settings-about-built-role">{lib.role}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="settings-about-foot">
          Shifty is released under the{' '}
          <button type="button" className="settings-about-link inline" onClick={() => openExternal(SOURCE_URL)}>
            MIT License
          </button>
          .
        </p>
      </div>
    </div>
  );
}
