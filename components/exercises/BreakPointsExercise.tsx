'use client';

import { Exercise } from '@/lib/types';
import { useEffect, useState } from 'react';
import SpeakerButton from '@/components/SpeakerButton';

interface BreakPointsExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function BreakPointsExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: BreakPointsExerciseProps) {
  const { word } = exercise.payload as { word: string };
  const [breakPoints, setBreakPoints] = useState<Set<number>>(new Set());

  const normalizeWord = (w: string) => {
    return w.replace(/[\u064B-\u0652\u0654\u0640\u200c ]/g, '');
  };

  const cleanWord = normalizeWord(word || '');
  const letters = cleanWord.split('');

  useEffect(() => {
    setBreakPoints(new Set());
  }, [exercise.id]);

  const toggleBreak = (index: number) => {
    if (disabled) return;
    const newBreaks = new Set(breakPoints);
    if (newBreaks.has(index)) {
      newBreaks.delete(index);
    } else {
      newBreaks.add(index);
    }
    setBreakPoints(newBreaks);
  };

  const buildAnswer = (points: Set<number>) => {
    const parts: string[] = [];
    let current = '';

    for (let i = 0; i < letters.length; i += 1) {
      current += letters[i];
      if (points.has(i)) {
        parts.push(current);
        current = '';
      }
    }
    if (current) parts.push(current);

    return parts.join('|');
  };

  useEffect(() => {
    onAnswerChange(buildAnswer(breakPoints));
  }, [breakPoints, exercise.id]);

  void userAnswer;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">{exercise.prompt}</div>
      </div>

      <div className="flex items-center gap-1 flex-wrap justify-center">
        {letters.map((letter, index) => (
          <div key={`${letter}-${index}`} className="flex items-center">
            <div className="bg-white border-4 border-brown-600 rounded-3xl w-14 h-20 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-brown-900">{letter}</span>
            </div>
            {index < letters.length - 1 && (
              <button
                type="button"
                onClick={() => toggleBreak(index)}
                disabled={disabled}
                className={`mx-1 w-10 h-10 rounded-full border-4 flex items-center justify-center ${
                  breakPoints.has(index)
                    ? 'bg-[var(--clay-400)] border-[var(--clay-800)] text-white'
                    : 'bg-white border-brown-400 text-brown-400'
                }`}
                aria-label="جدا کردن"
              >
                <span className="text-2xl font-bold">|</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-2xl text-brown-600 text-center leading-relaxed">
        روی دکمه‌های بین حروف بزنید تا کلمه را تکه کنید
      </div>
    </div>
  );
}
