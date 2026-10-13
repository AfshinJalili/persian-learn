'use client';

import type { ReactNode } from 'react';

type UndoMarker = 'match' | 'build';

export function PlacedUndoBadge({
  value,
  locked,
  onUndo,
  marker = 'match',
}: {
  value: string;
  locked: boolean;
  onUndo: () => void;
  marker?: UndoMarker;
}) {
  const undoProps = undoMarkerProps(marker, value);
  return (
    <button
      type="button"
      aria-label="پس گرفتن"
      disabled={locked}
      onClick={onUndo}
      className="placed-undo-badge match-chip-undo"
      {...undoProps}
    >
      ✕
    </button>
  );
}

export function PlacedItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={className ? `match-digit-placed-wrap ${className}` : 'match-digit-placed-wrap'}>
      {children}
    </span>
  );
}

function undoMarkerProps(marker: UndoMarker, value: string) {
  switch (marker) {
    case 'build':
      return { 'data-build-undo': value };
    case 'match':
      return { 'data-match-undo': value };
    default: {
      const _exhaustive: never = marker;
      return _exhaustive;
    }
  }
}
