import React, { useEffect, useState } from 'react';
import { acceleratorToKeyCaps, keyEventToAccelerator } from '../../shared/accelerator.js';

export default function HotkeyRecorder({ value, onSave }) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const keys = acceleratorToKeyCaps(value);

  useEffect(() => {
    if (!recording) return undefined;

    const onKeyDown = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecording(false);
        return;
      }

      const accelerator = keyEventToAccelerator(e);
      if (!accelerator) return;

      const check = await window.shifty.validateHotkey(accelerator);
      if (!check.ok) {
        setError(check.reason);
        return;
      }

      setError(null);
      setRecording(false);
      onSave(accelerator);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [recording, onSave]);

  return (
    <div className="shortcut-field">
      <div
        className={[
          'shortcut-chrome',
          recording && 'shortcut-chrome-active',
          error && 'shortcut-chrome-error',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          className="keycap-row"
          onClick={() => {
            setRecording(true);
            setError(null);
          }}
          onBlur={() => setRecording(false)}
        >
          {recording ? (
            <span className="recording-label">Press keys…</span>
          ) : keys.length > 0 ? (
            keys.map((key, i) => (
              <kbd key={`${key}-${i}`} className="keycap">
                {key}
              </kbd>
            ))
          ) : (
            <span className="recording-label">Click to set shortcut</span>
          )}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-chrome btn-compact"
            onClick={() => onSave('Alt+Space')}
          >
            Reset
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
      <p className="field-hint">Captures the next key combo you press. Esc cancels.</p>
    </div>
  );
}
