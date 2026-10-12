'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
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

export const COUNT_CARD_BASE_ZONE = 208;
export const COUNT_CARD_BASE_HEIGHT = 118;
export const COUNT_CARD_MIN_SIZE = 32;
export const COUNT_CARD_GAP_PREFERRED = 12;
export const COUNT_CARD_GAP_MIN = 8;

export type CountCardPosition = {
  right: number;
  top: number;
  z: number;
};

export type CountCardLayout = {
  size: number;
  step: number;
  gap: number;
  rowStep: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
  positions: CountCardPosition[];
};

export function countCardLayout(
  n: number,
  zoneWidth = COUNT_CARD_BASE_ZONE,
  zoneHeight = COUNT_CARD_BASE_HEIGHT
): CountCardLayout {
  const count = Math.max(0, Math.min(10, Math.floor(n)));
  if (count <= 0) {
    return {
      size: 0,
      step: 0,
      gap: 0,
      rowStep: 0,
      cols: 0,
      rows: 0,
      width: 0,
      height: 0,
      positions: [],
    };
  }

  const cols = Math.min(5, count);
  const rows = count > 5 ? 2 : 1;

  const sizeFor = (gap: number) => {
    if (count === 1) {
      return Math.max(
        COUNT_CARD_MIN_SIZE,
        Math.min(96, Math.floor(zoneWidth), Math.floor(zoneHeight))
      );
    }
    const fromWidth = Math.floor((zoneWidth - gap * (cols - 1)) / cols);
    const fromHeight =
      rows === 1 ? Math.floor(zoneHeight) : Math.floor((zoneHeight - gap) / rows);
    return Math.min(fromWidth, fromHeight);
  };

  let gap = COUNT_CARD_GAP_PREFERRED;
  let size = sizeFor(gap);
  if (size < COUNT_CARD_MIN_SIZE) {
    gap = COUNT_CARD_GAP_MIN;
    size = sizeFor(gap);
  }
  if (size < COUNT_CARD_MIN_SIZE) {
    gap = COUNT_CARD_GAP_MIN;
    size = COUNT_CARD_MIN_SIZE;
  }
  if (count === 1) gap = 0;

  const step = count === 1 ? 0 : size + gap;
  const rowStep = rows === 2 ? size + gap : 0;
  const positions: CountCardPosition[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = index < 5 ? 0 : 1;
    const col = index < 5 ? index : index - 5;
    positions.push({
      right: col * step,
      top: row * rowStep,
      z: 1,
    });
  }

  return {
    size,
    step,
    gap,
    rowStep,
    cols,
    rows,
    width: cols * size + Math.max(0, cols - 1) * gap,
    height: rows * size + Math.max(0, rows - 1) * gap,
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

export const INTRO_HELPER = 'هر کارت را بزنید تا عددش را بشنوید.';
export const CONTINUE_GATE_HINT = 'اول کارت‌ها را بزنید';

type CountCardProps = {
  count: number;
  token: string;
  label: string;
  onPlay: () => void;
  playing?: boolean;
  highlightIndex?: number | null;
  pulse?: boolean;
  invite?: boolean;
  heard?: boolean;
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
  invite = false,
  heard = false,
  staggerIndex = 0,
}: CountCardProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [zone, setZone] = useState({
    width: COUNT_CARD_BASE_ZONE,
    height: COUNT_CARD_BASE_HEIGHT,
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
        setZone((current) =>
          current.width === width && current.height === (height > 0 ? height : current.height)
            ? current
            : { width, height: height > 0 ? height : COUNT_CARD_BASE_HEIGHT }
        );
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

  const className = [
    'cc-card',
    playing ? 'playing' : '',
    heard ? 'heard' : '',
    invite ? 'invite' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      data-count={count}
      data-count-card
      data-heard={heard ? 'true' : 'false'}
      className={className}
      style={{
        animationDelay: `${staggerIndex * 120}ms`,
        minHeight: Math.max(layout.height + 24, COUNT_CARD_BASE_HEIGHT),
      }}
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
      </div>
      <span className="cc-spk" aria-hidden="true">
        <SpeakerIcon />
        {heard ? (
          <span className="cc-check" data-cc-check aria-hidden="true">
            <Check strokeWidth={2.8} />
          </span>
        ) : null}
      </span>
      <div ref={zoneRef} className="cc-zone" aria-hidden="true">
        <div className="cc-cluster" style={{ width: layout.width, height: layout.height }}>
          {layout.positions.map((position, index) => {
            const highlighted = highlightIndex === index;
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
