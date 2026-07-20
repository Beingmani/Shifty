import React, { useMemo, useState } from 'react';
import changelogRaw from '../../../../CHANGELOG.md?raw';
import { parseChangelog } from '../../shared/parseChangelog.js';

const GROUP_COLORS = {
  Added: 'is-added',
  Changed: 'is-changed',
  Fixed: 'is-fixed',
};

export default function SettingsWhatsNew() {
  const releases = useMemo(() => parseChangelog(changelogRaw), []);
  const [expanded, setExpanded] = useState(() => new Set([releases[0]?.version].filter(Boolean)));

  function toggle(version) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  }

  if (!releases.length) {
    return <p className="settings-whatsnew-empty">No release notes yet.</p>;
  }

  return (
    <div className="settings-whatsnew">
      {releases.map((release, idx) => {
        const isOpen = expanded.has(release.version);
        const isLatest = idx === 0;
        return (
          <div key={release.version} className="settings-whatsnew-release">
            <button
              type="button"
              className="settings-whatsnew-header"
              onClick={() => toggle(release.version)}
              aria-expanded={isOpen}
            >
              <div className="settings-whatsnew-header-left">
                <span className="settings-whatsnew-version">
                  v{release.version}
                  {isLatest ? <span className="settings-whatsnew-latest">Latest</span> : null}
                </span>
                {release.summary ? (
                  <span className="settings-whatsnew-summary">{release.summary}</span>
                ) : null}
              </div>
              <div className="settings-whatsnew-header-right">
                <span className="settings-whatsnew-date">{release.date}</span>
                <span className={['settings-whatsnew-chevron', isOpen && 'is-open'].filter(Boolean).join(' ')}>
                  ›
                </span>
              </div>
            </button>

            {isOpen && release.groups.length > 0 ? (
              <div className="settings-whatsnew-body">
                {release.groups.map((group) => (
                  <div key={group.label} className="settings-whatsnew-group">
                    <span
                      className={[
                        'settings-whatsnew-group-label',
                        GROUP_COLORS[group.label] || 'is-changed',
                      ].join(' ')}
                    >
                      {group.label}
                    </span>
                    <ul className="settings-whatsnew-items">
                      {group.items.map((item, i) => {
                        const dashIdx = item.indexOf(' — ');
                        const title = dashIdx > -1 ? item.slice(0, dashIdx) : item;
                        const desc = dashIdx > -1 ? item.slice(dashIdx + 3) : null;
                        return (
                          <li key={i} className="settings-whatsnew-item">
                            <span className="settings-whatsnew-item-title">{title}</span>
                            {desc ? <span className="settings-whatsnew-item-desc">{desc}</span> : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
