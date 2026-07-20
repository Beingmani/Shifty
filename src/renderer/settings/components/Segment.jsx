import React from 'react';

/** Stasho-style segmented control. options: [{ id|value, label, icon? }] */
export default function Segment({ options, value, onChange, fill = false, 'aria-label': ariaLabel }) {
  return (
    <div
      className={`segment ${fill ? 'segment-fill' : ''}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((o) => {
        const id = o.id ?? o.value;
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`segment-option ${active ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
