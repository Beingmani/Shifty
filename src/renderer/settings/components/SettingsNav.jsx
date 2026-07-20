import React from 'react';

export default function SettingsNav({ sections = [], active, onChange }) {
  return (
    <nav className="settings-nav" aria-label="Settings sections">
      {sections.map((section) => (
        <div key={section.label} className="settings-nav-group">
          <span className="settings-nav-group-label">{section.label}</span>
          <div className="settings-nav-items">
            {section.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`settings-nav-item ${isActive ? 'settings-nav-item-active' : ''}`}
                  onClick={() => onChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="settings-nav-icon">{item.icon}</span>
                  <span className="settings-nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
