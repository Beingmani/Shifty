import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';

const POPOVER_WIDTH = 288;
const POPOVER_EST_HEIGHT = 220;

/** Curated set for profile avatars — work, personal, hobbies, vibes. */
export const PROFILE_EMOJIS = [
  '💼', '🏠', '🎯', '✨', '🗂️', '💻', '🎨', '🎮', '📚', '🏋️',
  '☕', '🌙', '🌞', '🚀', '💡', '🎵', '📷', '✈️', '🍕', '🐶',
  '🐱', '🌿', '🔥', '⚡', '🛠️', '📊', '🎬', '🧘', '💬', '📝',
  '🏃', '🎓', '🧑‍💻', '🏢', '📱', '🖥️', '🎧', '📅', '🔔', '⭐',
  '🌈', '🦄', '🍀', '🎉', '❤️', '💜', '💙', '🌊', '🏖️', '🛏️',
  '🍳', '🚗', '🎸', '🏆', '🧪', '🔬', '📈', '🤝', '🧠', '🌍',
];

export default function EmojiPicker({
  value,
  onChange,
  className = '',
  id: idProp,
  'aria-label': ariaLabel = 'Profile emoji',
}) {
  const uid = useId();
  const id = idProp || uid;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const display = value?.trim();
  const hasCustom = Boolean(display);

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;

    let left = rect.left;
    if (left + POPOVER_WIDTH > vw - 8) {
      left = Math.max(8, rect.right - POPOVER_WIDTH);
    }
    left = Math.max(8, left);

    let top = rect.bottom + gap;
    if (top + POPOVER_EST_HEIGHT > vh - 8 && rect.top > POPOVER_EST_HEIGHT + gap) {
      top = rect.top - POPOVER_EST_HEIGHT - gap;
    }

    setCoords({ top, left });
  }

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  function pick(emoji) {
    onChange(emoji);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const popover = open
    ? createPortal(
        <div
          ref={popoverRef}
          className="emoji-picker-popover"
          role="dialog"
          aria-label="Choose an emoji"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="emoji-picker-grid" role="listbox" aria-label="Emoji options">
            {PROFILE_EMOJIS.map((emoji) => {
              const selected = value === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`emoji-picker-option ${selected ? 'is-selected' : ''}`}
                  onClick={() => pick(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={rootRef} className={`emoji-picker ${open ? 'emoji-picker-open' : ''}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`emoji-picker-trigger ${className}`.trim()}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {hasCustom ? (
          <span className="emoji-picker-value" aria-hidden="true">
            {display}
          </span>
        ) : (
          <Smile size={18} strokeWidth={1.75} className="emoji-picker-placeholder" aria-hidden="true" />
        )}
      </button>
      {popover}
    </div>
  );
}
