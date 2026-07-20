import React from 'react';
import AppIcon from '../settings/components/AppIcon.jsx';

/** Criss-cross stack pose — alternate lean left / right. */
export function stackPose(i) {
  const leanLeft = i % 2 === 0;
  return {
    zIndex: i + 1,
    transform: `translate(${leanLeft ? -1 : 1}px, ${leanLeft ? 2 : -2}px) rotate(${leanLeft ? -16 : 16}deg)`,
  };
}

/**
 * Overlapping app icon pile. Optional empty placeholder tiles when no apps.
 */
export default function AppStack({
  apps,
  iconByPath,
  iconLoadingPaths,
  maxStack = 3,
  showExtra = false,
  placeholder = false,
  placeholderCount,
  className = 'app-stack',
}) {
  const list = apps ?? [];
  const isEmpty = list.length === 0;
  const placeholderSlots = placeholderCount ?? maxStack;

  if (isEmpty && !placeholder) return null;

  if (isEmpty) {
    return (
      <div className={`${className} ${className}--placeholder`} aria-hidden="true">
        {Array.from({ length: placeholderSlots }, (_, i) => (
          <span
            key={i}
            className={`${className}-icon ${className}-icon--placeholder`}
            style={stackPose(i)}
          />
        ))}
      </div>
    );
  }

  const shown = list.slice(0, maxStack);
  const extra = list.length - shown.length;

  return (
    <div className={className} aria-hidden="true">
      {shown.map((app, i) => (
        <span key={app.path} className={`${className}-icon`} style={stackPose(i)} title={app.name}>
          <AppIcon
            src={iconByPath?.get(app.path)}
            name={app.name}
            fill
            loading={iconLoadingPaths?.has(app.path) && !iconByPath?.get(app.path)}
          />
        </span>
      ))}
      {showExtra && extra > 0 && (
        <span className={`${className}-more`} style={stackPose(shown.length)}>
          +{extra}
        </span>
      )}
    </div>
  );
}
