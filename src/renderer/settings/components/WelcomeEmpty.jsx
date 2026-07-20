import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import appIcon from '@assets/app-icon.png';

const QUICK_STARTERS = [
  { id: 'work', emoji: '💼', label: 'Work' },
  { id: 'personal', emoji: '🏠', label: 'Personal' },
  { id: 'focus', emoji: '🎯', label: 'Focus' },
  { id: 'blank', emoji: '✨', label: 'Blank' },
];

function formatHotkey(hotkey) {
  return (
    hotkey
      ?.replace('Alt', '⌥')
      .replace('Command', '⌘')
      .replace('Control', '⌃')
      .replace('Shift', '⇧')
      .replace('+', '') ?? '⌥Space'
  );
}

export default function WelcomeEmpty({ hotkey, onGetStarted, onCreated, onShowGuide }) {
  const [creating, setCreating] = useState(null);
  const hotkeyLabel = formatHotkey(hotkey);

  async function pick(id) {
    if (creating) return;
    setCreating(id);
    try {
      const profile = await window.shifty.createFromTemplate(id);
      onCreated?.(profile);
    } catch {
      // fall back to full picker if quick create fails
      onGetStarted?.();
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="welcome-empty">
      <img src={appIcon} alt="" className="welcome-icon" width={64} height={64} draggable={false} />
      <h2 className="welcome-title">Welcome to Shifty</h2>
      <p className="welcome-description">
        Save app sets for Work, Personal, or Focus — then switch with{' '}
        <kbd className="welcome-kbd">{hotkeyLabel}</kbd> or the menu bar.
      </p>
      <button type="button" className="btn btn-primary welcome-cta" onClick={onGetStarted}>
        Choose a template
      </button>
      <div className="welcome-quick">
        {QUICK_STARTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="welcome-quick-btn"
            disabled={!!creating}
            onClick={() => pick(item.id)}
          >
            {creating === item.id ? (
              <Loader2 size={13} className="spin" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{item.emoji}</span>
            )}
            {item.label}
          </button>
        ))}
      </div>
      {onShowGuide ? (
        <button type="button" className="welcome-guide-link" onClick={onShowGuide}>
          How it works
        </button>
      ) : null}
    </div>
  );
}
