import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FlaskConical,
  Info,
  Keyboard,
  Monitor,
  Moon,
  Palette,
  ScrollText,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import SettingsNav from './SettingsNav.jsx';
import SettingsPane from './SettingsPane.jsx';
import SettingsField from './SettingsField.jsx';
import SettingsAbout from './SettingsAbout.jsx';
import SettingsWhatsNew from './SettingsWhatsNew.jsx';
import Segment from './Segment.jsx';
import Switch from './Switch.jsx';
import HotkeyRecorder from './HotkeyRecorder.jsx';
import { applyAppearance } from '../../shared/theme.js';

const ICON = { strokeWidth: 1.6, 'aria-hidden': true };
const MODE_ICON = { size: 14, strokeWidth: 1.8, 'aria-hidden': true };

const APPEARANCE_MODES = [
  { id: 'light', label: 'Light', icon: <Sun {...MODE_ICON} /> },
  { id: 'dark', label: 'Dark', icon: <Moon {...MODE_ICON} /> },
  { id: 'system', label: 'System', icon: <Monitor {...MODE_ICON} /> },
];

const TOAST_PREVIEWS = [
  { id: 'success', label: 'Success / auto schedule' },
  { id: 'info', label: 'Info' },
  { id: 'schedule-start', label: 'Schedule · notify (Start)' },
  { id: 'schedule-auto', label: 'Schedule · auto fired' },
  { id: 'quit-ask', label: 'Switch · ask quit' },
  { id: 'chain', label: 'Chain · Start then Quit ask' },
  { id: 'action', label: 'Generic action' },
  { id: 'destructive', label: 'Generic destructive' },
];

function buildNavSections(isDev) {
  const sections = [
    {
      label: 'General',
      items: [
        {
          id: 'appearance',
          label: 'Appearance',
          icon: <Palette size={14} {...ICON} />,
          title: 'Appearance',
          description: 'Choose how Shifty looks.',
        },
        {
          id: 'shortcuts',
          label: 'Shortcuts',
          icon: <Keyboard size={14} {...ICON} />,
          title: 'Keyboard shortcuts',
          description: 'Global shortcut for the quick switcher.',
        },
        {
          id: 'general',
          label: 'General',
          icon: <SlidersHorizontal size={14} {...ICON} />,
          title: 'General',
          description: 'Startup behavior.',
        },
      ],
    },
    {
      label: 'About',
      items: [
        {
          id: 'whatsnew',
          label: "What's new",
          icon: <ScrollText size={14} {...ICON} />,
          title: "What's new",
          description: 'Release notes for recent Shifty versions.',
        },
        {
          id: 'about',
          label: 'About',
          icon: <Info size={14} {...ICON} />,
          title: 'About Shifty',
          description: 'Version, updates, and support links.',
        },
      ],
    },
  ];
  if (isDev) {
    sections.push({
      label: 'Developer',
      items: [
        {
          id: 'developer',
          label: 'Notifications',
          icon: <FlaskConical size={14} {...ICON} />,
          title: 'Notification previews',
          description: 'Dev only — fire each toast type to check layout and actions.',
        },
      ],
    });
  }
  return sections;
}

function flattenSections(sections) {
  return sections.flatMap((s) => s.items);
}

export default function SettingsModal({ open, onClose, settings: initialSettings, initialSection = 'appearance' }) {
  const [activeSection, setActiveSection] = useState('appearance');
  const [appearance, setAppearance] = useState('system');
  const [hotkey, setHotkey] = useState('Alt+Space');
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [hotkeyStatus, setHotkeyStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isDev, setIsDev] = useState(false);
  const initialRef = useRef(null);

  useEffect(() => {
    window.shifty.isDev?.().then((v) => setIsDev(!!v));
  }, []);

  const navSections = useMemo(() => buildNavSections(isDev), [isDev]);
  const navItems = useMemo(() => flattenSections(navSections), [navSections]);
  const activeMeta = navItems.find((i) => i.id === activeSection) ?? navItems[0];

  useEffect(() => {
    if (!open || !initialSettings) return;
    const snapshot = {
      appearance: initialSettings.appearance ?? 'system',
      hotkey: initialSettings.hotkey ?? 'Alt+Space',
      launchAtLogin: !!initialSettings.launchAtLogin,
    };
    initialRef.current = snapshot;
    setAppearance(snapshot.appearance);
    setHotkey(snapshot.hotkey);
    setLaunchAtLogin(snapshot.launchAtLogin);
    setSaveError(null);
    setActiveSection(initialSection);
  }, [open, initialSettings, initialSection]);

  useEffect(() => {
    if (!open) return;
    applyAppearance(appearance);
  }, [appearance, open]);

  useEffect(() => {
    if (!open) return;
    window.shifty.hotkeyStatus().then(setHotkeyStatus);
  }, [open, hotkey]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  function handleClose() {
    if (initialRef.current) {
      applyAppearance(initialRef.current.appearance);
    }
    onClose?.();
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const initial = initialRef.current;
      const partial = {};
      if (appearance !== initial.appearance) partial.appearance = appearance;
      if (hotkey !== initial.hotkey) partial.hotkey = hotkey;
      if (launchAtLogin !== initial.launchAtLogin) partial.launchAtLogin = launchAtLogin;
      if (Object.keys(partial).length > 0) {
        await window.shifty.setSettings(partial);
      }
      onClose?.();
    } catch {
      setSaveError('Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  function renderSectionContent() {
    switch (activeSection) {
      case 'appearance':
        return (
          <SettingsField label="Theme">
            <Segment
              fill
              value={appearance}
              onChange={setAppearance}
              options={APPEARANCE_MODES}
              aria-label="Theme"
            />
          </SettingsField>
        );
      case 'shortcuts':
        return (
          <SettingsField
            label="Quick switcher shortcut"
            hint="Press it from anywhere to open the switcher — type to filter, ↑↓ or Tab to choose, Enter to switch, Esc to dismiss."
          >
            <HotkeyRecorder value={hotkey} onSave={setHotkey} />
            {hotkeyStatus && hotkey && !hotkeyStatus.registered && (
              <div className="banner banner-error">
                “{hotkey}” could not be registered — another app may be using it.
              </div>
            )}
          </SettingsField>
        );
      case 'general':
        return (
          <Switch
            checked={launchAtLogin}
            onChange={setLaunchAtLogin}
            label="Launch Shifty at login"
            hint="Keeps your schedules and shortcut always available"
          />
        );
      case 'developer':
        return (
          <SettingsField
            label="Preview toasts"
            hint="Fires the same custom top-center toasts production uses. Primary buttons only log a follow-up toast."
          >
            <div className="dev-toast-grid">
              {TOAST_PREVIEWS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="btn btn-chrome btn-compact"
                  onClick={() => window.shifty.previewToast?.(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </SettingsField>
        );
      case 'whatsnew':
        return <SettingsWhatsNew />;
      case 'about':
        return <SettingsAbout />;
      default:
        return null;
    }
  }

  if (!open) return null;

  const readOnlySection = activeSection === 'about' || activeSection === 'whatsnew';

  return createPortal(
    <div
      className="settings-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="presentation"
    >
      <div className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
        <header className="settings-panel-header">
          <h2 className="settings-panel-title">Settings</h2>
          <button
            type="button"
            className="btn btn-chrome btn-icon-only"
            onClick={handleClose}
            aria-label="Close"
            title="Close"
          >
            <X size={15} {...ICON} />
          </button>
        </header>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            <SettingsNav sections={navSections} active={activeSection} onChange={setActiveSection} />
          </aside>

          <div className="settings-main">
            <SettingsPane title={activeMeta.title} description={activeMeta.description}>
              {renderSectionContent()}
            </SettingsPane>
          </div>
        </div>

        {saveError && <div className="settings-banner-error">{saveError}</div>}

        <footer className="settings-footer">
          <button type="button" className="btn btn-chrome" onClick={handleClose}>
            {readOnlySection ? 'Close' : 'Cancel'}
          </button>
          {!readOnlySection ? (
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body
  );
}
