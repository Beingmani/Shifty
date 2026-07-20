import React from 'react';
import { Plus } from 'lucide-react';

export default function ProfileBar({ profiles, activeProfileId, selectedId, onSelect, onAdd }) {
  return (
    <div className="profile-bar">
      <div className="profile-bar-chips">
        {profiles.map((p) => {
          const isSelected = p.id === selectedId;
          const isLive = p.id === activeProfileId;
          return (
            <button
              key={p.id}
              type="button"
              className={[
                'profile-chip',
                isSelected && 'profile-chip-active',
                isLive && 'profile-chip-live',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(p.id)}
              aria-current={isSelected ? 'true' : undefined}
            >
              <span className="profile-chip-emoji">{p.emoji}</span>
              <span className="profile-chip-name">{p.name}</span>
              {isLive && <span className="profile-chip-dot" title="Active profile" />}
            </button>
          );
        })}
        <button type="button" className="profile-chip profile-chip-add" onClick={onAdd} title="New profile">
          <Plus size={14} strokeWidth={2.25} />
          <span>New profile</span>
        </button>
      </div>
    </div>
  );
}
