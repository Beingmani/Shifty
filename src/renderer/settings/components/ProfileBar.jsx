import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AppStack from '../../shared/AppStack.jsx';

const MAX_CHIP_STACK = 3;

export default function ProfileBar({ profiles, activeProfileId, selectedId, onSelect, onAdd }) {
  const [iconByPath, setIconByPath] = useState(() => new Map());
  const [pendingIconPaths, setPendingIconPaths] = useState(() => new Set());

  useEffect(() => {
    const paths = [];
    for (const p of profiles) {
      for (const a of p.apps ?? []) {
        if (a.path) paths.push(a.path);
      }
    }
    const unique = [...new Set(paths)];
    if (unique.length === 0) {
      setIconByPath(new Map());
      setPendingIconPaths(new Set());
      return undefined;
    }

    let cancelled = false;
    setPendingIconPaths(new Set(unique));

    window.shifty.iconsFor(unique).then((icons) => {
      if (cancelled || !icons) return;
      const next = new Map();
      for (const [path, url] of Object.entries(icons)) {
        if (url) next.set(path, url);
      }
      setIconByPath(next);
      setPendingIconPaths(new Set());
    });

    return () => {
      cancelled = true;
    };
  }, [profiles]);

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
              <AppStack
                apps={p.apps}
                iconByPath={iconByPath}
                iconLoadingPaths={pendingIconPaths}
                maxStack={MAX_CHIP_STACK}
                placeholder
                placeholderCount={MAX_CHIP_STACK}
                className="profile-chip-stack"
              />
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
