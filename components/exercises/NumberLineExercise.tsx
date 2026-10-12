'use client';

import { Exercise } from '@/lib/types';
import { formatPersianNumber } from '@/lib/persian';
import { playOptionAudio } from '@/lib/spoken-option';
import { exerciseHeading, exerciseHeadingClass } from '@/lib/exercise-copy';
import SpeakerButton from '@/components/SpeakerButton';
import { PomegranateSvg } from '@/components/art/objects';

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
  const numbers: number[] = [];
  for (let i = safeMin; i <= safeMax; i += 1) {
    numbers.push(i);
  }

  const selected = userAnswer ? Number(userAnswer.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))) : null;
  const xs = numbers.map((_, index) => {
    const span = Math.max(numbers.length - 1, 1);
    return 300 - (index / span) * 280;
  });

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className={exerciseHeadingClass(exercise)}>{exerciseHeading(exercise)}</h2>
      </div>
      <p className="body-lg muted" style={{ marginTop: -8 }}>
        علامت سبز را روی عدد درست بگذارید.
      </p>
      <div className="card" style={{ height: 300, alignContent: 'center', position: 'relative' }}>
        <svg viewBox="0 0 342 230" width="342" height="230">
          <line x1="6" y1="144" x2="318" y2="144" stroke="#1B2A22" strokeWidth="5" strokeLinecap="round" />
          <path d="M4 144l14-10v20z" fill="#1B2A22" />
          {numbers.map((num, index) => {
            const x = xs[index] ?? 20;
            return (
              <g key={num}>
                <line x1={x} y1="130" x2={x} y2="158" stroke="#1B2A22" strokeWidth="5" strokeLinecap="round" />
                <text x={x} y="204" textAnchor="middle" style={{ font: '800 36px Vazirmatn' }} fill="#1B2A22">
                  {formatPersianNumber(num)}
                </text>
                {selected === num && (
                  <g transform={`translate(${x} 46)`}>
                    <path d="M0 72c-16-20-26-32-26-46a26 26 0 0 1 52 0c0 14-10 26-26 46z" fill="#1F6408" />
                    <circle cx="0" cy="26" r="11" fill="#fff" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex justify-between w-[300px] font-bold text-[var(--ink-2)]">
          <span>کمتر</span>
          <span>بیشتر ←</span>
        </div>
        <div className="absolute inset-0 flex">
          {numbers.map((num) => (
            <button
              key={`hit-${num}`}
              type="button"
              disabled={disabled}
              aria-label={formatPersianNumber(num)}
              onClick={() => {
                const label = formatPersianNumber(num);
                onAnswerChange(label);
                playOptionAudio(label).catch(() => {});
              }}
              className="flex-1 min-h-[56px]"
            />
          ))}
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
