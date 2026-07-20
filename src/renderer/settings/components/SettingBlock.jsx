import React from 'react';

/** Self-contained settings card — icon header, optional action, body slot. */
export default function SettingBlock({
  icon: Icon,
  title,
  description,
  badge,
  headerAction,
  children,
  muted = false,
  className = '',
  tourId,
}) {
  return (
    <section
      className={`setting-block ${muted ? 'setting-block-muted' : ''} ${className}`.trim()}
      data-tour={tourId || undefined}
    >
      <header className="setting-block-header">
        <div className="setting-block-heading">
          {Icon && (
            <span className="setting-block-icon">
              <Icon size={15} strokeWidth={2} aria-hidden="true" />
            </span>
          )}
          <div className="setting-block-text">
            <div className="setting-block-title-row">
              <h3 className="setting-block-title">{title}</h3>
              {badge != null && badge !== '' && (
                <span className="setting-block-badge">{badge}</span>
              )}
            </div>
            {description && <p className="setting-block-description">{description}</p>}
          </div>
        </div>
        {headerAction && <div className="setting-block-action">{headerAction}</div>}
      </header>
      {children && <div className="setting-block-body">{children}</div>}
    </section>
  );
}
