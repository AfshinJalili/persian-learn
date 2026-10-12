'use client';

import { Exercise } from '@/lib/types';
import { useState, useEffect } from 'react';

interface BreakPointsExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function BreakPointsExercise({ exercise, userAnswer, onAnswerChange, disabled }: BreakPointsExerciseProps) {
  const { word } = exercise.payload as { word: string };
  const [breakPoints, setBreakPoints] = useState<Set<number>>(new Set());
  
  const normalizeWord = (w: string) => {
    return w.replace(/[\u064B-\u0652\u0654\u0640\u200c ]/g, '');
  };

  const cleanWord = normalizeWord(word);
  const letters = cleanWord.split('');

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

  const buildAnswer = () => {
    const parts: string[] = [];
    let current = '';
    
    for (let i = 0; i < letters.length; i++) {
      current += letters[i];
      if (breakPoints.has(i)) {
        parts.push(current);
        current = '';
      }
    }
    if (current) parts.push(current);
    
    return parts.join('|');
  };

  useEffect(() => {
    onAnswerChange(buildAnswer());
  }, [breakPoints]);

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-8">{exercise.prompt}</div>

      <div className="flex items-center gap-4 mb-12">
        {letters.map((letter, index) => (
          <div key={index} className="flex items-center">
            <div className="bg-white border-4 border-brown-600 rounded-3xl w-24 h-32 flex items-center justify-center shadow-lg">
              <span className="text-7xl font-bold text-brown-900">{letter}</span>
            </div>
            {index < letters.length - 1 && (
              <button
                onClick={() => toggleBreak(index)}
                disabled={disabled}
                className={`mx-2 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all shadow-lg ${
                  breakPoints.has(index)
                    ? 'bg-orange-500 border-orange-700 text-white'
                    : 'bg-white border-brown-400 text-brown-400 hover:bg-orange-50'
                } ${disabled ? 'opacity-50' : ''}`}
              >
                <span className="text-4xl font-bold">|</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-3xl text-brown-600 text-center max-w-3xl leading-relaxed">
        روی دکمه‌های بین حروف بزنید تا کلمه را تکه کنید
      </div>
    </div>
  );
}
