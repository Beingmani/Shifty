import React, { useEffect, useState } from 'react';
import { Keyboard, Palette, Power } from 'lucide-react';
import HotkeyRecorder from './HotkeyRecorder.jsx';
import Switch from './Switch.jsx';
import Segment from './Segment.jsx';

const APPEARANCE_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'Auto' },
  { value: 'dark', label: 'Dark' },
];

export default function GeneralSettings({ settings }) {
  const [hotkeyStatus, setHotkeyStatus] = useState(null);

  useEffect(() => {
    window.shifty.hotkeyStatus().then(setHotkeyStatus);
  }, [settings.hotkey]);

  return (
    <div className="content-panel-card">
      <div className="content-panel">
        <section className="section">
          <div className="section-header-with-icon">
            <span className="section-icon">
              <Keyboard size={15} strokeWidth={2} />
            </span>
            <div className="section-text">
              <h3 className="section-title">Quick switcher shortcut</h3>
              <p className="section-description">
                Press from anywhere to open the switcher — type to filter, ↑↓ or Tab to move, Enter to switch.
              </p>
            </div>
          </div>
          <div className="section-body">
            <HotkeyRecorder
              value={settings.hotkey}
              onSave={(hotkey) => window.shifty.setSettings({ hotkey })}
            />
            {hotkeyStatus && settings.hotkey && !hotkeyStatus.registered && (
              <div className="banner banner-error">
                “{settings.hotkey}” could not be registered — another app may be using it. Pick a
                different shortcut.
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="section-header-with-icon">
            <span className="section-icon">
              <Palette size={15} strokeWidth={2} />
            </span>
            <div className="section-text">
              <h3 className="section-title">Appearance</h3>
              <p className="section-description">Match the system, or pin Shifty to light or dark.</p>
            </div>
          </div>
          <div className="section-body">
            <Segment
              fill
              options={APPEARANCE_OPTIONS}
              value={settings.appearance ?? 'system'}
              onChange={(appearance) => window.shifty.setSettings({ appearance })}
            />
          </div>
        </section>

        <section className="section">
          <div className="section-header-with-icon">
            <span className="section-icon">
              <Power size={15} strokeWidth={2} />
            </span>
            <div className="section-text">
              <h3 className="section-title">Startup</h3>
            </div>
          </div>
          <div className="section-body">
            <Switch
              checked={settings.launchAtLogin}
              onChange={(launchAtLogin) => window.shifty.setSettings({ launchAtLogin })}
              label="Launch Shifty at login"
              hint="Your schedules and shortcut are active from login"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
