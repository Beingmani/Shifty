import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function UpdatePill({ version, onOpen }) {
  if (!version) return null;

  return (
    <button
      type="button"
      className="update-pill"
      onClick={onOpen}
      aria-label={`Update available: Shifty ${version}. Click to download.`}
    >
      <span className="update-pill-dot" aria-hidden="true" />
      <span className="update-pill-label">Update to {version}</span>
      <span className="update-pill-icon" aria-hidden="true">
        <ArrowUp size={13} strokeWidth={2.4} />
      </span>
    </button>
  );
}
