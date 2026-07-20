import React from 'react';

/** Stasho-style toggle: 38×22 pill track, brand-green when on. */
export default function Switch({
  checked,
  onChange,
  label,
  hint,
  compact = false,
  disabled = false,
  'aria-label': ariaLabel,
}) {
  const id = React.useId();
  return (
    <label
      className={`switch-row ${compact ? 'switch-row-compact' : ''} ${disabled ? 'switch-row-disabled' : ''}`}
      htmlFor={id}
    >
      {!compact && (
        <span className="switch-text">
          <span className="switch-label">{label}</span>
          {hint && <span className="switch-hint">{hint}</span>}
        </span>
      )}
      {compact && label && <span className="switch-compact-label">{label}</span>}
      <input
        id={id}
        type="checkbox"
        className="switch-input"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel || (compact ? label : undefined)}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
    </label>
  );
}
