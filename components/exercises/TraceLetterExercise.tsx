'use client';

import { useEffect, useState } from 'react';
import { Eraser, RotateCcw } from 'lucide-react';
import { playOptionAudio } from '@/lib/spoken-option';
import { exerciseHeading, exerciseHeadingClass } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';

interface Props {
  exercise: Exercise;
  onComplete: (answer: string) => void;
}

export default function TraceLetterExercise({ exercise, onComplete }: Props) {
  const [traced, setTraced] = useState(false);
  const payload = exercise.payload as { letter: string; forms: string[] };
  const letter = payload.letter || exercise.answer;

  useEffect(() => {
    setTraced(false);
  }, [exercise.id]);

  const handleTrace = async () => {
    if (traced) return;
    setTraced(true);
    onComplete(letter);
    playOptionAudio(letter).catch(() => {});
  };

  const handleReset = () => {
    setTraced(false);
    onComplete('');
  };

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className={exerciseHeadingClass(exercise)}>{exerciseHeading(exercise)}</h2>
      </div>
      <button
        type="button"
        className="card"
        style={{ height: 380, background: '#fff', position: 'relative' }}
        onClick={handleTrace}
        aria-label={letter}
      >
        <span className="body-lg" style={{ position: 'absolute', top: 12, right: 20, color: 'var(--ink-2)', fontWeight: 700 }}>
          از دایرهٔ سبز شروع کنید
        </span>
        <svg viewBox="0 0 320 300" width="300" height="282" aria-hidden="true">
          <path d="M266 140 C 280 186, 262 206, 226 206 L 100 206 C 62 206, 46 186, 52 150" fill="none" stroke="#E6E9E7" strokeWidth="46" strokeLinecap="round" />
          <path d="M266 140 C 280 186, 262 206, 226 206 L 100 206 C 62 206, 46 186, 52 150" fill="none" stroke="#9AA59F" strokeWidth="4" strokeDasharray="4 12" strokeLinecap="round" />
          {traced && (
            <path d="M266 140 C 280 186, 262 206, 226 206 L 100 206 C 62 206, 46 186, 52 150" fill="none" stroke="#58CC02" strokeWidth="30" strokeLinecap="round" />
          )}
          {!traced && (
            <path d="M266 140 C 280 186, 262 206, 226 206 L 176 206" fill="none" stroke="#58CC02" strokeWidth="30" strokeLinecap="round" />
          )}
          <circle cx="160" cy="262" r="17" fill="#E6E9E7" stroke="#9AA59F" strokeWidth="4" strokeDasharray="4 7" />
          <circle cx="266" cy="140" r="20" fill="#1F6408" />
          <text x="266" y="149" textAnchor="middle" fill="#fff" style={{ font: '800 24px Vazirmatn' }}>
            ۱
          </text>
          <path d="M200 112 h-70 m14 -12 l-14 12 l14 12" stroke="#0D4F9E" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {!traced && (
          <span className="illus" style={{ position: 'absolute', width: 64, height: 64, left: 126, top: 196 }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M9 11V4.8a1.5 1.5 0 0 1 3 0V10m0-.5V3.8a1.5 1.5 0 0 1 3 0V10m0-.3V5.3a1.5 1.5 0 0 1 3 0v8.2c0 4.3-2.6 7.5-6.7 7.5-2.7 0-4.2-1.4-5.6-3.6l-2.1-3.3a1.5 1.5 0 0 1 2.4-1.8L9 14"
                fill="#FBE3CF"
                stroke="#7A4A2A"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
        <span className="glyph" style={{ position: 'absolute', opacity: 0 }}>
          {letter}
        </span>
      </button>
      <div className="btn-row">
        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleReset}>
          <RotateCcw strokeWidth={2.6} />
          دوباره نشانم بده
        </button>
        <button type="button" className="icon-btn" style={{ width: 64, height: 64 }} aria-label="پاک کردن" onClick={handleReset}>
          <Eraser strokeWidth={2.6} />
        </button>
      </div>
    </>
  );
}
