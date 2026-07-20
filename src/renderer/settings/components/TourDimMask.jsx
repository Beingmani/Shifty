import React from 'react';

const PAD = 10;

export default function TourDimMask({ rect, onDismiss }) {
  if (!rect) {
    return <div className="onboarding-tour-backdrop" onMouseDown={onDismiss} aria-hidden="true" />;
  }

  const top = Math.max(0, rect.top - PAD);
  const left = Math.max(0, rect.left - PAD);
  const width = rect.width + PAD * 2;
  const height = rect.height + PAD * 2;
  const bottom = top + height;
  const right = left + width;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const panelProps = {
    className: 'onboarding-tour-dim-panel',
    onMouseDown: onDismiss,
    'aria-hidden': true,
  };

  return (
    <>
      {top > 0 && <div {...panelProps} style={{ top: 0, left: 0, right: 0, height: top }} />}
      {left > 0 && <div {...panelProps} style={{ top, left: 0, width: left, height }} />}
      {right < vw && <div {...panelProps} style={{ top, left: right, right: 0, height }} />}
      {bottom < vh && <div {...panelProps} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />}
    </>
  );
}
