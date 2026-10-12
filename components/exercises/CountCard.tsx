'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ObjectArt, looksLikeObjects, splitObjectTokens } from '@/components/art/objects';
import SpeakerIcon from '@/components/ui/SpeakerIcon';
import { formatPersianNumber } from '@/lib/persian';
import type { Exercise } from '@/lib/types';

export const COUNT_WORDS = [
  'یک',
  'دو',
  'سه',
  'چهار',
  'پنج',
  'شش',
  'هفت',
  'هشت',
  'نه',
  'ده',
] as const;

export const COUNT_CARD_BASE_ZONE = 184;
export const COUNT_CARD_ZONE_HEIGHT = 96;
export const COUNT_CARD_MIN_SIZE = 36;

const BASE_SIZES = [0, 96, 84, 70, 54, 44, 44, 44, 44, 44, 44] as const;
const BASE_ROW_STEP = 38;
const OVERLAP = 0.78;
const JITTER = 4;

export type CountCardPosition = {
  right: number;
  top: number;
  z: number;
};

export type CountCardLayout = {
  size: number;
  step: number;
  rowStep: number;
  width: number;
  height: number;
  positions: CountCardPosition[];
};

export function countCardLayout(
  n: number,
  zoneWidth = COUNT_CARD_BASE_ZONE,
  zoneHeight = COUNT_CARD_ZONE_HEIGHT
): CountCardLayout {
  const count = Math.max(0, Math.min(10, Math.floor(n)));
  if (count <= 0) {
    return { size: 0, step: 0, rowStep: 0, width: 0, height: 0, positions: [] };
  }

  const widthScale = zoneWidth < COUNT_CARD_BASE_ZONE ? zoneWidth / COUNT_CARD_BASE_ZONE : 1;
  const heightScale = zoneHeight < COUNT_CARD_ZONE_HEIGHT ? zoneHeight / COUNT_CARD_ZONE_HEIGHT : 1;
  const scale = Math.min(widthScale, heightScale);
  const size = Math.max(COUNT_CARD_MIN_SIZE, Math.round(BASE_SIZES[count] * scale));

  const cols = Math.min(5, count);
  const rows = count > 5 ? 2 : 1;
  const step = count === 1 ? 0 : Math.round(size * OVERLAP);
  const rowStep = rows === 2 ? Math.round(BASE_ROW_STEP * (size / 44)) : 0;
  const positions: CountCardPosition[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = index < 5 ? 0 : 1;
    const col = index < 5 ? index : index - 5;
    const jitter = col % 2 === 1 ? JITTER : 0;
    const rowBase = rows === 2 ? (row === 1 ? 20 : 10) : 10;
    positions.push({
      right: col * step,
      top: row * rowStep + jitter,
      z: rowBase + (9 - col),
    });
  }

  return {
    size,
    step,
    rowStep,
    width: count === 1 ? size : size + step * (cols - 1),
    height: count === 1 ? size : size + rowStep + JITTER,
    positions,
  };
}

export function isCountingIntro(exercise: Exercise): boolean {
  if (exercise.type !== 'intro') return false;
  const payload = exercise.payload as { display?: string; labels?: unknown };
  if (Array.isArray(payload.labels) && payload.labels.length > 0) return true;
  const groups = String(payload.display || '')
    .split(/\s{2,}/)
    .filter(Boolean);
  return groups.length >= 2 && groups.every((group) => looksLikeObjects(group.trim()));
}

export function countWord(count: number): string {
  return COUNT_WORDS[count - 1] ?? formatPersianNumber(count);
}

type CountCardProps = {
  count: number;
  token: string;
  label: string;
  onPlay: () => void;
  playing?: boolean;
  highlightIndex?: number | null;
  pulse?: boolean;
  staggerIndex?: number;
};

export default function CountCard({
  count,
  token,
  label,
  onPlay,
  playing = false,
  highlightIndex = null,
  pulse = false,
  staggerIndex = 0,
}: CountCardProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [zone, setZone] = useState({
    width: COUNT_CARD_BASE_ZONE,
    height: COUNT_CARD_ZONE_HEIGHT,
  });
  const glyph = splitObjectTokens(token)[0] ?? token;
  const layout = countCardLayout(count, zone.width, zone.height);
  const liveWord =
    playing && highlightIndex != null ? countWord(highlightIndex + 1) : playing ? label : '';

  useLayoutEffect(() => {
    const node = zoneRef.current;
    if (!node) return;

    const update = () => {
      const box = node.getBoundingClientRect();
      const width = Math.round(box.width);
      const height = Math.round(box.height);
      if (width > 0) {
        setZone({
          width,
          height: height > 0 ? height : COUNT_CARD_ZONE_HEIGHT,
        });
      }
    };

    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPlay();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      data-count={count}
      data-count-card
      className={`cc-card${playing ? ' playing' : ''}`}
      style={{ animationDelay: `${staggerIndex * 120}ms` }}
      onClick={onPlay}
      onKeyDown={handleKeyDown}
    >
      {liveWord ? (
        <span className="cc-sr" aria-live="polite">
          {liveWord}
        </span>
      ) : null}
      <div className={`cc-tile${pulse ? ' pulse' : ''}`} aria-hidden="true">
        <span className="cc-num">{formatPersianNumber(count)}</span>
        <span className="cc-word">{countWord(count)}</span>
        <span className="cc-spk">
          <SpeakerIcon />
        </span>
      </div>
      <div ref={zoneRef} className="cc-zone" aria-hidden="true">
        <div
          className="cc-cluster"
          style={{ width: layout.width, height: layout.height }}
        >
          {layout.positions.map((position, index) => {
            const highlighted = highlightIndex === index;
            const itemDelay = staggerIndex * 120 + 150 + index * 90;
            return (
              <span
                key={`${glyph}-${index}`}
                className={`cc-item${highlighted ? ' hl' : ''}`}
                data-cc-item={index}
                style={{
                  width: layout.size,
                  height: layout.size,
                  right: position.right,
                  top: position.top,
                  zIndex: highlighted ? 50 : position.z,
                  animationDelay: `${itemDelay}ms`,
                }}
              >
                {highlighted ? (
                  <span className="cc-badge">{formatPersianNumber(index + 1)}</span>
                ) : null}
                <ObjectArt token={glyph} size={layout.size} />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
