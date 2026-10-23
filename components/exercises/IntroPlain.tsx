'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { personalizeIntroScript } from '@/lib/learner';
import SpeakerButton from '@/components/SpeakerButton';
import {
  ObjectArt,
  ObjectCluster,
  OBJECT_CLUSTER_GAP,
  objectClusterLayoutForBox,
  looksLikeObjects,
  splitObjectTokens,
  useObjectArtAspect,
} from '@/components/art/objects';
import type { Exercise } from '@/lib/types';

/**
 * The plain (non-count) intro screen. Its rule: at 360x640 and up, at 1x
 * font, the whole screen fits with no scroll and Continue on screen.
 *
 * - One picture as the display: drawn at 160 (IntroSingleArt).
 * - A lone group of pictures (🔴×5⚪×5): fitted grid, up to 5 across,
 *   <= 112px tall, items >= 48 (IntroGroupArt).
 * - A sum / difference (🍎🍎 + 🍎🍎🍎, 📦 = ۱۰) and a multi-picture visual
 *   (🍅×8, ☕☕☕  🍞🍞🍞): one line of terms (IntroArtLine). Each term is a
 *   row of items that never wraps inside itself; operators and numbers are
 *   text; the line wraps only between terms. Items shrink with the column
 *   width (visual <= 72, display <= 72) and never go under 48.
 * - A visual with no pictures ('۵۰ - ۱۰ = ۴۰') is text, not glyph tiles.
 * - If a multi-item intro still doesn't fit the height that's left, the
 *   speaker moves into the art row (as on the counting intro) instead of
 *   sitting on its own row above it.
 */

export const INTRO_SINGLE_SIZE = 160;
/** Item floor for every multi-item intro, and the size beside other groups. */
export const INTRO_ITEM_MIN = 48;
/** Largest item in an art line (sums, multi-picture visuals). */
const INTRO_LINE_MAX = 72;
/** Height cap of a multi-row group (two rows of ~52px). */
const INTRO_GROUP_MAX_HEIGHT = 112;
const ITEM_GAP = OBJECT_CLUSTER_GAP;
const TERM_GAP = 12;
/** Inline gap between the in-row speaker and the art. */
const SPEAKER_GAP = 12;
/** Fallback speaker width before it is measured (--tap-speaker). */
const SPEAKER_FALLBACK = 64;
/** Operator / number text in an art line. */
const LINE_TEXT_PX = 36;
const INTRO_SINGLE_MIN = 96;
const INTRO_SINGLE_SIDE = 0.7;
const INTRO_TALL_WIDTH_RATIO = 0.86;

const OPERATOR = /\s*([+\-=−×÷])\s*/;
const NUMBER = /^[0-9۰-۹٬,.:]+$/;

export type IntroTerm = { kind: 'items'; items: string[] } | { kind: 'text'; text: string };

/** Count of pictures (object graphemes) in a display / visual string. */
export function introPictureCount(value: string): number {
  return splitObjectTokens(value).filter((part) => looksLikeObjects(part)).length;
}

/**
 * Split a display / visual into terms: groups (two or more spaces) and
 * operators separate terms; inside a group, runs of pictures are an items
 * term and anything else (numbers, letters) a text term.
 */
export function introTerms(value: string): IntroTerm[] {
  const terms: IntroTerm[] = [];
  const groups = value.trim().split(/\s{2,}/).filter(Boolean);
  for (const group of groups) {
    for (const piece of group.split(OPERATOR)) {
      const text = piece.trim();
      if (!text) continue;
      if (OPERATOR.test(text) && text.length <= 2) {
        terms.push({ kind: 'text', text });
        continue;
      }
      let items: string[] = [];
      let rest = '';
      const flushRest = () => {
        if (rest.trim()) terms.push({ kind: 'text', text: rest.trim() });
        rest = '';
      };
      const flushItems = () => {
        if (items.length) terms.push({ kind: 'items', items });
        items = [];
      };
      for (const part of splitObjectTokens(text)) {
        if (looksLikeObjects(part)) {
          flushRest();
          items.push(part);
        } else {
          flushItems();
          rest += part;
        }
      }
      flushItems();
      flushRest();
    }
  }
  return terms;
}

function textWidth(text: string): number {
  return Math.ceil([...text].length * LINE_TEXT_PX * 0.62) + 8;
}

export type IntroLineLayout = {
  size: number;
  /** Columns per items term (a term wider than the line becomes a grid). */
  cols: number[];
  oneLine: boolean;
};

/** Item size and per-term columns for an art line `width` px wide. */
export function introLineLayout(terms: IntroTerm[], width: number, maxSize: number): IntroLineLayout {
  const itemTerms = terms.filter((t): t is { kind: 'items'; items: string[] } => t.kind === 'items');
  const n = itemTerms.reduce((sum, t) => sum + t.items.length, 0);
  if (n === 0) return { size: INTRO_ITEM_MIN, cols: [], oneLine: true };
  const text = terms.reduce((sum, t) => sum + (t.kind === 'text' ? textWidth(t.text) : 0), 0);
  const gaps =
    TERM_GAP * Math.max(0, terms.length - 1) +
    itemTerms.reduce((sum, t) => sum + ITEM_GAP * Math.max(0, t.items.length - 1), 0);
  const fit = Math.floor((width - text - gaps) / n);
  if (fit >= INTRO_ITEM_MIN) {
    return { size: Math.min(maxSize, fit), cols: itemTerms.map((t) => t.items.length), oneLine: true };
  }
  // Wrap between terms at the floor size; a term wider than the whole line
  // becomes a grid of up to 5 across (ten-frame rows), <= 112px tall.
  const maxCols = Math.max(1, Math.min(5, Math.floor((width + ITEM_GAP) / (INTRO_ITEM_MIN + ITEM_GAP))));
  let size = INTRO_ITEM_MIN;
  const cols = itemTerms.map((t) => {
    const k = t.items.length;
    if (k * INTRO_ITEM_MIN + (k - 1) * ITEM_GAP <= width) return k;
    const rows = Math.ceil(k / maxCols);
    return Math.ceil(k / rows);
  });
  if (itemTerms.length === 1 && terms.length === 1) {
    // A lone wide term (📦×10, 🍅×8): grow back up to what width and the
    // two-row height cap allow.
    const c = cols[0];
    const rows = Math.ceil(n / c);
    const byWidth = Math.floor((width - ITEM_GAP * (c - 1)) / c);
    const byHeight = Math.floor((INTRO_GROUP_MAX_HEIGHT - ITEM_GAP * (rows - 1)) / rows);
    size = Math.max(INTRO_ITEM_MIN, Math.min(maxSize, byWidth, rows > 1 ? byHeight : maxSize));
  }
  return { size, cols, oneLine: false };
}

export function IntroArtLine({
  terms,
  width,
  maxSize = INTRO_LINE_MAX,
  role,
}: {
  terms: IntroTerm[];
  width: number;
  maxSize?: number;
  role: 'display' | 'visual';
}) {
  const layout = introLineLayout(terms, width, maxSize);
  let itemIndex = 0;
  const renderTerm = (term: IntroTerm, index: number) => {
    if (term.kind === 'text') {
      return (
        <span key={`t-${index}`} className="intro-art-text" style={{ fontSize: LINE_TEXT_PX }}>
          {term.text}
        </span>
      );
    }
    const cols = layout.cols[itemIndex++] ?? term.items.length;
    return (
      <span
        key={`i-${index}`}
        className="intro-art-term"
        data-art-term
        style={{ gridTemplateColumns: `repeat(${cols}, ${layout.size}px)`, gap: ITEM_GAP }}
      >
        {term.items.map((item, k) => (
          <ObjectArt key={`${item}-${k}`} token={item} size={layout.size} />
        ))}
      </span>
    );
  };
  // An operator stays on the line of the term after it ("- 🍎🍎", "= ۱۰").
  const units: { start: number; terms: IntroTerm[] }[] = [];
  for (let i = 0; i < terms.length; i += 1) {
    const term = terms[i];
    const isOperator = term.kind === 'text' && OPERATOR.test(term.text) && term.text.length <= 2;
    if (isOperator && i + 1 < terms.length) {
      units.push({ start: i, terms: [term, terms[i + 1]] });
      i += 1;
    } else {
      units.push({ start: i, terms: [term] });
    }
  }
  return (
    <div
      className="intro-art-line"
      data-art-line={role}
      data-one-line={layout.oneLine || undefined}
      style={{ columnGap: TERM_GAP, rowGap: ITEM_GAP, maxWidth: width }}
    >
      {units.map((unit) =>
        unit.terms.length === 1 ? (
          renderTerm(unit.terms[0], unit.start)
        ) : (
          <span key={`u-${unit.start}`} className="intro-art-unit" style={{ columnGap: TERM_GAP }}>
            {unit.terms.map((term, k) => renderTerm(term, unit.start + k))}
          </span>
        )
      )}
    </div>
  );
}

/** One picture as the intro's main content: 160px art box (see 2bacfd1). */
function IntroSingleArt({ token }: { token: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(INTRO_SINGLE_SIZE);
  useEffect(() => {
    const column = ref.current?.parentElement?.parentElement;
    if (!column || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      const width = column.clientWidth;
      if (!(width > 0)) return;
      const next = Math.max(
        INTRO_SINGLE_MIN,
        Math.min(INTRO_SINGLE_SIZE, Math.floor(width * INTRO_SINGLE_SIDE))
      );
      setSize((prev) => (prev === next ? prev : next));
    });
    observer.observe(column);
    return () => observer.disconnect();
  }, []);
  const aspect = useObjectArtAspect(token);
  const ratio = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  const height = Math.max(size, Math.ceil((size * INTRO_TALL_WIDTH_RATIO) / ratio));
  return (
    <div ref={ref} className="intro-single-art" data-single-art>
      <ObjectArt token={token} size={size} height={height} />
    </div>
  );
}

/** A lone group of pictures fitted to `width` (up to 5 across, <= 112px tall). */
function IntroGroupArt({ token, width }: { token: string; width: number }) {
  const count = splitObjectTokens(token).length;
  const fitted =
    width > 0
      ? objectClusterLayoutForBox(count, width, INTRO_GROUP_MAX_HEIGHT, OBJECT_CLUSTER_GAP)
      : null;
  const fits = fitted != null && fitted.unclamped >= INTRO_ITEM_MIN;
  return (
    <div className="intro-group-art" data-group-art>
      {fits ? (
        <ObjectCluster token={token} boxWidth={width} boxHeight={INTRO_GROUP_MAX_HEIGHT} />
      ) : (
        <ObjectArt token={token} size={INTRO_ITEM_MIN} />
      )}
    </div>
  );
}

type DisplayKind = 'single' | 'group' | 'line' | 'pieces';

function displayKind(pieces: string[]): DisplayKind {
  if (pieces.length !== 1) return 'pieces';
  const token = pieces[0].trim();
  if (!looksLikeObjects(token)) return 'pieces';
  if (splitObjectTokens(token).length === 1) return 'single';
  const terms = introTerms(token);
  return terms.length > 1 ? 'line' : 'group';
}

/** A multi-item intro: more than one picture in the display or the visual. */
export function isMultiItemIntro(exercise: Exercise): boolean {
  const payload = exercise.payload as { display?: string; visual?: string };
  const display = String(payload.display || '');
  const pieces = display.split(/\s{2,}/).filter(Boolean);
  if (displayKind(pieces) === 'single' && introPictureCount(String(payload.visual || '')) <= 1) {
    return false;
  }
  return introPictureCount(display) > 1 || introPictureCount(String(payload.visual || '')) > 1;
}

export default function IntroPlain({
  exercise,
  onContinue,
}: {
  exercise: Exercise;
  onContinue: () => void;
}) {
  const payload = exercise.payload as { display: string; visual?: string };
  const pieces = String(payload.display || '')
    .split(/\s{2,}/)
    .filter(Boolean);
  const visual = String(payload.visual || '').trim();
  const kind = displayKind(pieces);
  const multi = isMultiItemIntro(exercise);
  const visualPictures = introPictureCount(visual);

  const columnRef = useRef<HTMLDivElement>(null);
  const speakerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [speakerW, setSpeakerW] = useState(SPEAKER_FALLBACK);
  const [inline, setInline] = useState(false);
  const [host, setHost] = useState<'visual' | 'display'>('visual');
  const displayRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const column = columnRef.current;
    if (!column || typeof ResizeObserver === 'undefined') return undefined;
    const scroller = (column.closest('.content') as HTMLElement | null) ?? column.parentElement;
    const observer = new ResizeObserver(() => {
      const next = Math.floor(column.clientWidth);
      if (next > 0) setWidth((prev) => (prev === next ? prev : next));
      setTick((t) => t + 1);
    });
    observer.observe(column);
    if (scroller) observer.observe(scroller);
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) setTick((t) => t + 1);
    });
    return () => {
      live = false;
      observer.disconnect();
    };
  }, []);

  // Still taller than the room left (after the art is fitted to the width):
  // move the speaker into the art row. One way per mount.
  useLayoutEffect(() => {
    if (!multi || inline || width <= 0) return;
    const column = columnRef.current;
    const scroller = (column?.closest('.content') as HTMLElement | null) ?? column?.parentElement;
    if (!column || !scroller) return;
    if (scroller.scrollHeight <= scroller.clientHeight + 1) return;
    const spk = speakerRef.current?.getBoundingClientRect().width;
    if (spk && spk > 0) setSpeakerW(Math.ceil(spk));
    // Host the speaker beside an art row that has room for it as drawn (so
    // that row doesn't re-wrap, e.g. a word's letters into a column); among
    // those, or if neither has room, the narrower row.
    const need = (spk && spk > 0 ? Math.ceil(spk) : SPEAKER_FALLBACK) + SPEAKER_GAP;
    const dw = displayRef.current?.getBoundingClientRect().width ?? Infinity;
    const vw = visualRef.current?.getBoundingClientRect().width ?? Infinity;
    const dRoom = dw + need <= width;
    const vRoom = vw + need <= width;
    if (dRoom !== vRoom) setHost(vRoom ? 'visual' : 'display');
    else setHost(vw <= dw ? 'visual' : 'display');
    setInline(true);
  }, [multi, inline, width, tick]);

  const speaker = (
    <div ref={speakerRef} className="intro-speaker" data-intro-speaker>
      <SpeakerButton text={exercise.audio_script} size="md" />
    </div>
  );

  const rowWidth = (row: 'visual' | 'display') =>
    inline && host === row ? Math.max(0, width - speakerW - SPEAKER_GAP) : width;
  const withSpeaker = (row: 'visual' | 'display', node: ReactNode) =>
    inline && host === row ? (
      <div className="intro-speaker-row" data-speaker-row style={{ columnGap: SPEAKER_GAP }}>
        {speaker}
        {node}
      </div>
    ) : (
      node
    );

  const displayNode = (
    <div ref={displayRef} className="flex flex-wrap items-end justify-center gap-4" data-intro-display>
      {pieces.map((group, index) => {
        const token = group.trim();
        const key = `${group}-${index}`;
        if (kind === 'single') return <IntroSingleArt key={key} token={token} />;
        if (kind === 'group') return <IntroGroupArt key={key} token={token} width={rowWidth('display')} />;
        if (kind === 'line') {
          return (
            <IntroArtLine key={key} terms={introTerms(token)} width={rowWidth('display')} role="display" />
          );
        }
        // A number ('۱٬۰۰۰', '۱۰') beside pictures reads as one number, not
        // as a grid of digit tiles; a word or sentence ('نان و ماست') beside
        // pictures is text, not a two-column grid of letter tiles.
        if (multi && NUMBER.test(token) && splitObjectTokens(token).length > 1) {
          return (
            <span key={key} className="intro-number-text" data-intro-number>
              {token}
            </span>
          );
        }
        if (multi && introPictureCount(token) === 0 && splitObjectTokens(token).length > 1) {
          return (
            <span key={key} className="intro-word-text" data-intro-word dir="rtl">
              {token}
            </span>
          );
        }
        return <ObjectArt key={key} token={token} size={INTRO_ITEM_MIN} />;
      })}
    </div>
  );

  let visualNode: ReactNode = null;
  if (visual) {
    if (!looksLikeObjects(visual)) {
      visualNode = (
        <div ref={visualRef} className="intro-visual" data-intro-visual="text">
          <p className="intro-visual-text" dir="ltr">
            {visual}
          </p>
        </div>
      );
    } else if (visualPictures > 1 || introTerms(visual).length > 1) {
      visualNode = (
        <div ref={visualRef} className="intro-visual" data-intro-visual="line">
          <IntroArtLine terms={introTerms(visual)} width={rowWidth('visual')} role="visual" />
        </div>
      );
    } else {
      visualNode = (
        <div ref={visualRef} className="intro-visual" data-intro-visual="single">
          <ObjectArt token={visual} size={72} />
        </div>
      );
    }
  }

  return (
    <div
      ref={columnRef}
      className="flex flex-1 flex-col items-center gap-4 text-center"
      style={{ justifyContent: 'safe center' }}
      data-intro-plain
      data-speaker-inline={inline || undefined}
    >
      {inline ? null : speaker}
      {withSpeaker('display', displayNode)}
      {visualNode ? withSpeaker('visual', visualNode) : null}
      <p className="body-lg">{personalizeIntroScript(exercise.audio_script)}</p>
      <button type="button" onClick={onContinue} className="btn btn-primary">
        ادامه
        <ArrowLeft strokeWidth={2.6} />
      </button>
    </div>
  );
}
