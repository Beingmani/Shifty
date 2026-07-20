import React from 'react';

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
}) {
  return (
    <header className="profile-hero">
      <div className="profile-hero-inline">
        <div className="profile-hero-inline-main">
          <input
            className="profile-hero-emoji"
            value={profile.emoji ?? ''}
            maxLength={4}
            onChange={(e) => onPatch({ emoji: e.target.value })}
            title="Profile emoji"
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
        <StatPills
          appCount={appCount}
          scheduleSummary={scheduleSummary}
          scheduleEnabled={scheduleEnabled}
        />
      </div>
    </header>
  );
}
