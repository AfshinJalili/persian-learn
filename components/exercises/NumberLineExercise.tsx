'use client';

import { Exercise } from '@/lib/types';
import { formatPersianNumber } from '@/lib/persian';
import { playOptionAudio } from '@/lib/spoken-option';
import { exerciseHeading, exerciseHeadingClass } from '@/lib/exercise-copy';
import SpeakerButton from '@/components/SpeakerButton';
import { PomegranateSvg } from '@/components/art/objects';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

const MIN_CELL = 48;

/**
 * Columns for the number line: as many as fit at >= 48px (and >= 1.7em of the
 * numeral, so big text still fits), balanced so the rows are near-equal.
 */
function useNumberLineColumns(ref: RefObject<HTMLOListElement | null>, count: number): number {
  const [cols, setCols] = useState(Math.min(count, 6));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const width = el.clientWidth;
      if (!(width > 0)) return;
      const num = el.querySelector('.number-line-num');
      const fontPx = num ? parseFloat(getComputedStyle(num).fontSize) || 28 : 28;
      const cell = Math.max(MIN_CELL, fontPx * 1.7);
      const fit = Math.max(1, Math.min(count, Math.floor(width / cell)));
      const rows = Math.ceil(count / fit);
      const next = Math.ceil(count / rows);
      setCols((prev) => (prev === next ? prev : next));
    };
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, count]);
  return cols;
}

interface NumberLineExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function NumberLineExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: NumberLineExerciseProps) {
  const { min, max } = exercise.payload as {
    min: number;
    max: number;
    start: number;
    move: number;
  };
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 5;
  // 0..100 lines count in tens (11 marks), like 0..10 lines count in ones.
  const step = safeMax - safeMin > 10 ? Math.ceil((safeMax - safeMin) / 10) : 1;
  const numbers: number[] = [];
  for (let i = safeMin; i <= safeMax; i += step) {
    numbers.push(i);
  }
  if (numbers[numbers.length - 1] !== safeMax) numbers.push(safeMax);
  const lineRef = useRef<HTMLOListElement>(null);

  const selected = userAnswer ? Number(userAnswer.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))) : null;
  const cols = useNumberLineColumns(lineRef, numbers.length);

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className={exerciseHeadingClass(exercise)}>{exerciseHeading(exercise)}</h2>
      </div>
      <p className="body-lg muted number-line-hint">
        علامت سبز را روی عدد درست بگذارید.
      </p>
      <div className="card number-line-card">
        {/* Each number is its own >= 48px tap cell on the line. The line wraps
            onto more rows (still right to left) when the screen is narrow or
            the text is large, instead of shrinking the cells. */}
        <ol
          ref={lineRef}
          className="number-line"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          data-cols={cols}
        >
          {numbers.map((num, index) => {
            const label = formatPersianNumber(num);
            const isSelected = selected === num;
            const rowStart = index % cols === 0;
            const rowEnd = index % cols === cols - 1 || index === numbers.length - 1;
            return (
              <li key={num}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={label}
                  aria-pressed={isSelected}
                  data-number-tick={num}
                  className={`number-line-tick${isSelected ? ' selected' : ''}`}
                  data-row-start={rowStart || undefined}
                  data-row-end={rowEnd || undefined}
                  onClick={(event) => {
                    onAnswerChange(label);
                    playOptionAudio(label).catch(() => {});
                    event.currentTarget.scrollIntoView?.({ block: 'nearest' });
                  }}
                >
                  <span className="number-line-pin" aria-hidden="true">
                    {isSelected && (
                      <svg viewBox="-28 0 56 74">
                        <path d="M0 72c-16-20-26-32-26-46a26 26 0 0 1 52 0c0 14-10 26-26 46z" fill="#1F6408" />
                        <circle cx="0" cy="26" r="11" fill="#fff" />
                      </svg>
                    )}
                  </span>
                  <span className="number-line-mark" aria-hidden="true" />
                  <span className="number-line-num">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="number-line-legend">
          <span>کمتر</span>
          <span>بیشتر ←</span>
        </div>
      </div>
      {selected !== null && selected >= 0 && selected <= 5 && (
        <div className="flex items-center gap-2.5 justify-center">
          {Array.from({ length: selected }, (_, index) => (
            <span key={index} className="illus" style={{ width: 40, height: 40 }}>
              <PomegranateSvg />
            </span>
          ))}
          <span className="body-lg" style={{ fontWeight: 700 }}>
            = {formatPersianNumber(selected)}
          </span>
        </div>
      )}
    </>
  );
}
