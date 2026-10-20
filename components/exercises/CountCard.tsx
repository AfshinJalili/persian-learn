'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
import { ObjectArt, splitObjectTokens } from '@/components/art/objects';
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

// Cluster zone the design is drawn for (spec §2: 184 × 96 at 390px).
export const COUNT_CARD_BASE_ZONE = 184;
export const COUNT_CARD_BASE_HEIGHT = 96;
export const COUNT_CARD_MIN_SIZE = 36;
/** Spec §3 item size S for n = 1…10 (n ≥ 5 all use 44). */
export const COUNT_CARD_SIZES = [96, 84, 70, 54, 44] as const;
/** Horizontal step as a share of S: neighbours overlap by 22% of their box. */
export const COUNT_CARD_STEP_RATIO = 0.78;
/** Two-row step for 44px items (rows overlap by 6px); scales with S. */
export const COUNT_CARD_ROW_STEP_44 = 38;
/** Every second item in a row sits this much lower. */
export const COUNT_CARD_JITTER = 4;

export type CountCardPosition = {
  right: number;
  top: number;
  z: number;
};

export type CountCardLayout = {
  size: number;
  step: number;
  /** step − size: negative, the overlap between neighbours. */
  gap: number;
  rowStep: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
  positions: CountCardPosition[];
};

/**
 * Spec §3 overlap layout: one row up to 5, then a ten-frame 5 + (n − 5) with
 * the bottom row at the RTL start. Item S comes from the size table and only
 * shrinks (floor 36) when the cluster would not fit the zone; if it still
 * doesn't fit at the floor, the step tightens (more overlap) instead of
 * wrapping.
 */
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
  const zoneW = Math.max(0, Math.floor(zoneWidth));
  const zoneH = Math.max(0, Math.floor(zoneHeight));

  let size: number;
  let step = 0;
  let rowStep = 0;
  let jitter = 0;
  if (count === 1) {
    // A lone picture fills the zone (>= the table's 96 whenever the zone
    // allows) so its visible ink is >= 70% of the card height.
    size = Math.max(COUNT_CARD_MIN_SIZE, Math.min(zoneW, zoneH));
  } else {
    const base = COUNT_CARD_SIZES[Math.min(cols, 5) - 1];
    jitter = COUNT_CARD_JITTER;
    const extent = (s: number) => {
      const st = Math.round(s * COUNT_CARD_STEP_RATIO);
      const rs = rows === 2 ? Math.round((s * COUNT_CARD_ROW_STEP_44) / 44) : 0;
      return { w: s + st * (cols - 1), h: s + rs + jitter };
    };
    const full = extent(base);
    const scale = Math.min(1, zoneW / full.w, zoneH / full.h);
    size = Math.max(COUNT_CARD_MIN_SIZE, Math.floor(base * scale));
    while (size > COUNT_CARD_MIN_SIZE) {
      const e = extent(size);
      if (e.w <= zoneW && e.h <= zoneH) break;
      size -= 1;
    }
    step = Math.round(size * COUNT_CARD_STEP_RATIO);
    if (size + step * (cols - 1) > zoneW) {
      step = Math.max(1, Math.floor((zoneW - size) / (cols - 1)));
    }
    rowStep = rows === 2 ? Math.round((size * COUNT_CARD_ROW_STEP_44) / 44) : 0;
  }

  const positions: CountCardPosition[] = [];
  for (let index = 0; index < count; index += 1) {
    const row = index < 5 ? 0 : 1;
    const col = index < 5 ? index : index - 5;
    positions.push({
      right: col * step,
      top: row * rowStep + (col % 2 === 1 ? jitter : 0),
      // Front (bottom) row over the back row; first-counted item on top.
      z: (rows === 2 && row === 1 ? 20 : 10) + (9 - col),
    });
  }

  return {
    size,
    step,
    gap: count === 1 ? 0 : step - size,
    rowStep,
    cols,
    rows,
    width: size + step * (cols - 1),
    height: size + rowStep * (rows - 1) + (count > 1 ? jitter : 0),
    positions,
  };
}

/** Payload variant that opts an intro into the tappable count-card layout. */
export const COUNT_CARDS_VARIANT = 'count_cards';

/**
 * Only intros explicitly flagged in content (payload.variant = "count_cards",
 * emitted by math_content.py) use the count cards. Never inferred from the
 * display: e.g. the clock intro m12l2e1 (☀️  🌙) is a normal intro.
 */
export function isCountingIntro(exercise: Exercise): boolean {
  if (exercise.type !== 'intro') return false;
  const payload = exercise.payload as { variant?: unknown };
  return payload.variant === COUNT_CARDS_VARIANT;
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
      style={{ animationDelay: `${staggerIndex * 120}ms` }}
      onClick={onPlay}
      onKeyDown={handleKeyDown}
    >
      {liveWord ? (
        <span className="cc-sr" aria-live="polite">
          {liveWord}
        </span>
      ) : null}
      <div className="cc-lead" aria-hidden="true">
        <div className={`cc-tile${pulse ? ' pulse' : ''}`}>
          <span className="cc-num">{formatPersianNumber(count)}</span>
          <span className="cc-word">{countWord(count)}</span>
        </div>
        <span className="cc-spk">
          <SpeakerIcon />
          {heard ? (
            <span className="cc-check" data-cc-check>
              <Check strokeWidth={2.8} />
            </span>
          ) : null}
        </span>
      </div>
      <div ref={zoneRef} className="cc-zone" aria-hidden="true" style={{ '--cc-zone-h': `${layout.height}px` } as CSSProperties}>
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
