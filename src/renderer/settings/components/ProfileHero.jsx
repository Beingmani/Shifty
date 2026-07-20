import React from 'react';
import { Trash2 } from 'lucide-react';
import EmojiPicker from './EmojiPicker.jsx';

function StatPills({ appCount, scheduleSummary, scheduleEnabled }) {
  return (
    <div className="profile-hero-stats">
      <span className="profile-stat-pill">
        {appCount === 0 ? 'No apps' : `${appCount} app${appCount === 1 ? '' : 's'}`}
      </span>
      <span
        className={`profile-stat-pill ${scheduleEnabled ? 'profile-stat-pill-active' : ''}`}
      >
        {scheduleEnabled ? scheduleSummary : 'Schedule off'}
      </span>
    </div>
  );
}

export default function ProfileHero({
  profile,
  appCount,
  scheduleSummary,
  scheduleEnabled,
  onPatch,
  onDelete,
}) {
  return (
    <header className="profile-hero">
      <div className="profile-hero-inline">
        <div className="profile-hero-inline-main">
          <EmojiPicker
            className="profile-hero-emoji"
            value={profile.emoji ?? ''}
            onChange={(emoji) => onPatch({ emoji })}
            aria-label="Profile emoji"
          />
          <input
            className="profile-hero-name"
            value={profile.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            placeholder="Profile name"
            aria-label="Profile name"
          />
        </div>
        <div className="profile-hero-actions">
          <StatPills
            appCount={appCount}
            scheduleSummary={scheduleSummary}
            scheduleEnabled={scheduleEnabled}
          />
          {onDelete && (
            <button
              type="button"
              className="btn btn-destructive-ghost profile-hero-delete"
              onClick={onDelete}
              title="Delete profile"
              aria-label="Delete profile"
            >
              <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
