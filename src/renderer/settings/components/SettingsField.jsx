import React from 'react';

export default function SettingsField({ id, label, hint, error, children, className = '' }) {
  return (
    <div className={`settings-field ${className}`.trim()}>
      {label && (
        <label className="settings-field-label" htmlFor={id}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="settings-field-error" role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="settings-field-hint">{hint}</p>}
    </div>
  );
}
