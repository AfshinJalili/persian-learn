'use client';

import { Exercise } from '@/lib/types';
import { useState } from 'react';

interface BuildWordExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function BuildWordExercise({ exercise, userAnswer, onAnswerChange, disabled }: BuildWordExerciseProps) {
  const { picture, letters } = exercise.payload as { picture: string; letters: string[] };
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

  const handleLetterClick = (letter: string, index: number) => {
    if (disabled) return;
    const newSelected = [...selectedLetters, letter];
    setSelectedLetters(newSelected);
    onAnswerChange(newSelected.join(''));
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedLetters([]);
    onAnswerChange('');
  };

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-8">{exercise.prompt}</div>

      <div className="text-[120px] mb-8">{picture}</div>

      <div className="bg-white border-8 border-brown-600 rounded-3xl p-8 min-h-[160px] w-full max-w-2xl flex items-center justify-center gap-4">
        {selectedLetters.length === 0 ? (
          <div className="text-4xl text-brown-400">حروف را انتخاب کنید</div>
        ) : (
          selectedLetters.map((letter, index) => (
            <div
              key={index}
              className="bg-orange-100 border-4 border-orange-600 rounded-2xl w-24 h-32 flex items-center justify-center shadow-lg"
            >
              <span className="text-[120px] font-bold text-brown-900 leading-none">{letter}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-6 flex-wrap justify-center w-full max-w-2xl">
        {letters.map((letter, index) => (
          <button
            key={index}
            onClick={() => handleLetterClick(letter, index)}
            disabled={disabled}
            className={`bg-white hover:bg-orange-50 active:bg-orange-100 border-4 border-brown-600 rounded-3xl w-24 h-32 flex items-center justify-center shadow-lg transition-all ${
              disabled ? 'opacity-50' : 'hover:scale-110'
            }`}
          >
            <span className="text-[120px] font-bold text-brown-900 leading-none">{letter}</span>
          </button>
        ))}
      </div>

      {selectedLetters.length > 0 && !disabled && (
        <button
          onClick={handleClear}
          className="bg-red-100 hover:bg-red-200 border-4 border-red-600 rounded-full px-12 py-4 text-3xl font-bold text-red-900 transition-all shadow-lg"
        >
          پاک کردن
        </button>
      )}
    </div>
  );
}
