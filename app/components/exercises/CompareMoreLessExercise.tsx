'use client';

import { Exercise } from '@/lib/types';

interface CompareMoreLessExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function CompareMoreLessExercise({ exercise, userAnswer, onAnswerChange, disabled }: CompareMoreLessExerciseProps) {
  const { left, right, ask } = exercise.payload as { left: string; right: string; ask: string };

  const labels: Record<string, string> = {
    left: 'چپ',
    right: 'راست',
    equal: 'یکسان',
  };

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-8">{exercise.prompt}</div>

      <div className="flex items-center gap-12 w-full max-w-4xl justify-center">
        <button
          onClick={() => onAnswerChange('left')}
          disabled={disabled}
          className={`flex-1 border-8 rounded-3xl p-12 text-6xl transition-all shadow-xl ${
            userAnswer === 'left'
              ? 'bg-orange-100 border-orange-600 scale-105'
              : 'bg-white border-brown-600 hover:bg-orange-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <div className="mb-4 text-7xl font-bold text-brown-900">چپ</div>
          <div className="text-7xl break-all">{left}</div>
        </button>

        <button
          onClick={() => onAnswerChange('right')}
          disabled={disabled}
          className={`flex-1 border-8 rounded-3xl p-12 text-6xl transition-all shadow-xl ${
            userAnswer === 'right'
              ? 'bg-orange-100 border-orange-600 scale-105'
              : 'bg-white border-brown-600 hover:bg-orange-50'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <div className="mb-4 text-7xl font-bold text-brown-900">راست</div>
          <div className="text-7xl break-all">{right}</div>
        </button>
      </div>

      <button
        onClick={() => onAnswerChange('equal')}
        disabled={disabled}
        className={`border-8 rounded-3xl px-16 py-8 text-7xl font-bold transition-all shadow-xl ${
          userAnswer === 'equal'
            ? 'bg-orange-100 border-orange-600 scale-105'
            : 'bg-white border-brown-600 hover:bg-orange-50 text-brown-900'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        یکسان هستند
      </button>
    </div>
  );
}
