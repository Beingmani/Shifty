import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const POPOVER_WIDTH = 200;
const POPOVER_EST_HEIGHT = 230;

function parseTime(value) {
  const [hRaw, mRaw] = String(value || '09:00').split(':').map(Number);
  const h24 = Number.isFinite(hRaw) ? hRaw : 9;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  const mSnap = Math.round(m / 5) * 5;
  return {
    h24,
    m: Math.min(55, mSnap >= 60 ? 0 : mSnap),
    h12,
    period,
    exactM: ((m % 60) + 60) % 60,
  };
}

function toValue(h12, m, period) {
  let h24 = h12 % 12;
  if (period === 'PM') h24 += 12;
  if (period === 'AM' && h12 === 12) h24 = 0;
  if (period === 'PM' && h12 === 12) h24 = 12;
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDisplay(value) {
  const { h12, exactM, period } = parseTime(value);
  return `${h12}:${String(exactM).padStart(2, '0')} ${period}`;
}

function scrollSelectedIntoView(listEl, selectedValue) {
  if (!listEl) return;
  const el = listEl.querySelector(`[data-value="${selectedValue}"]`);
  el?.scrollIntoView({ block: 'center', behavior: 'auto' });
}

/**
 * Custom chrome time field.
 * Popover portals to document.body (fixed) so it never expands the schedule block.
 */
export default function TimeField({ value, onChange, label, id: idProp }) {
  const uid = useId();
  const id = idProp || uid;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const hourListRef = useRef(null);
  const minListRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const parsed = useMemo(() => parseTime(value), [value]);

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 6;

    let left = rect.left;
    if (left + POPOVER_WIDTH > vw - 8) {
      left = Math.max(8, rect.right - POPOVER_WIDTH);
    }
    left = Math.max(8, left);

    // Prefer below; flip above if not enough room
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
    // Capture scroll from any scrollable ancestor
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
      }
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey, true);
    requestAnimationFrame(() => {
      scrollSelectedIntoView(hourListRef.current, parsed.h12);
      scrollSelectedIntoView(minListRef.current, parsed.m);
    });
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open, parsed.h12, parsed.m]);

  function commit(next) {
    onChange(toValue(next.h12, next.m, next.period));
  }

  function setHour(h12) {
    commit({ h12, m: parsed.m, period: parsed.period });
  }

  function setMinute(m) {
    commit({ h12: parsed.h12, m, period: parsed.period });
  }

  function setPeriod(period) {
    commit({ h12: parsed.h12, m: parsed.m, period });
  }

  const popover = open
    ? createPortal(
        <div
          ref={popoverRef}
          className="time-field-popover"
          role="dialog"
          aria-label={label || 'Pick a time'}
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="time-field-cols">
            <div className="time-field-col" ref={hourListRef} role="listbox" aria-label="Hour">
              {HOURS_12.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="option"
                  data-value={h}
                  aria-selected={parsed.h12 === h}
                  className={`time-field-opt ${parsed.h12 === h ? 'is-on' : ''}`}
                  onClick={() => setHour(h)}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="time-field-col" ref={minListRef} role="listbox" aria-label="Minute">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="option"
                  data-value={m}
                  aria-selected={parsed.m === m}
                  className={`time-field-opt ${parsed.m === m ? 'is-on' : ''}`}
                  onClick={() => setMinute(m)}
                >
                  {String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="time-field-col time-field-col-period" role="listbox" aria-label="AM or PM">
              {['AM', 'PM'].map((p) => (
                <button
                  key={p}
                  type="button"
                  role="option"
                  aria-selected={parsed.period === p}
                  className={`time-field-opt ${parsed.period === p ? 'is-on' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="time-field-popover-foot">
            <button type="button" className="btn btn-chrome btn-compact" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`time-field ${open ? 'time-field-open' : ''}`} ref={rootRef}>
      {label && (
        <span className="time-field-label" id={`${id}-label`}>
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="time-field-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={label ? undefined : 'Time'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="time-field-value">{formatDisplay(value)}</span>
        <ChevronDown size={14} strokeWidth={2.25} className="time-field-chevron" aria-hidden="true" />
      </button>
      {popover}
    </div>
  );
}
