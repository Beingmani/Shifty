import React from 'react';
import { Plus, X } from 'lucide-react';
import AppIcon from './AppIcon.jsx';
import { Dock, DockDivider, DockIcon, DockItem, DockLabel } from './Dock.jsx';

/** Ignores dock motion props (width / isHovered) from DockItem cloneElement. */
function DockRemoveButton({ onClick, label, width: _w, isHovered: _h }) {
  return (
    <button
      type="button"
      className="dock-item-remove"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
    >
      <X size={10} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}

export default function AppDock({ apps, iconByPath, iconLoadingPaths, onRemove, onAdd }) {
  return (
    <div className="app-dock-wrap">
      <Dock className="app-dock-panel">
        {apps.map((app) => (
          <DockItem key={app.path} className="dock-item-app">
            <DockLabel>{app.name}</DockLabel>
            <DockIcon>
              <AppIcon
                src={iconByPath.get(app.path)}
                name={app.name}
                fill
                loading={iconLoadingPaths?.has(app.path) && !iconByPath.get(app.path)}
              />
            </DockIcon>
            <DockRemoveButton
              label={`Remove ${app.name}`}
              onClick={() => onRemove(app.path)}
            />
          </DockItem>
        ))}

        {apps.length > 0 && <DockDivider />}
        <DockItem
          className="dock-item-add"
          onClick={onAdd}
          title="Add apps (⌘⇧A)"
        >
          <DockLabel>Add apps</DockLabel>
          <DockIcon>
            <span className="dock-add-glyph" aria-hidden="true">
              <Plus className="dock-add-plus" strokeWidth={2} />
            </span>
          </DockIcon>
        </DockItem>
      </Dock>
      {apps.length > 0 && (
        <p className="app-dock-hint">Hover icons to preview · click × to remove</p>
      )}
    </div>
  );
}
