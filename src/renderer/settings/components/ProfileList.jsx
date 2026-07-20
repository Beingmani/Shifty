import React from 'react';
import { Plus } from 'lucide-react';

export default function ProfileList({ profiles, activeProfileId, selectedId, onSelect, onAdd }) {
  return (
    <nav className="nav nav-profiles chromeScroll" aria-label="Profiles">
      <div className="nav-group">
        <div className="nav-group-head">
          <span className="nav-group-label">Profiles</span>
          <button type="button" className="icon-button" title="New profile" onClick={onAdd}>
            <Plus size={14} strokeWidth={2.25} />
          </button>
        </div>
        <div className="nav-items">
          {profiles.map((p) => {
            const isActive = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                onClick={() => onSelect(p.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-icon nav-emoji">{p.emoji}</span>
                <span className="nav-label">{p.name}</span>
                {p.id === activeProfileId && <span className="active-dot" title="Active" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
