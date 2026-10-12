'use client';

import { Exercise } from '@/lib/types';
import { formatPersianNumber } from '@/lib/persian';

interface NumberLineExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function NumberLineExercise({ exercise, userAnswer, onAnswerChange, disabled }: NumberLineExerciseProps) {
  const { min, max, start, move } = exercise.payload as { min: number; max: number; start: number; move: number };
  const choices = [exercise.answer, ...exercise.distractors];
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  const numbers = [];
  for (let i = min; i <= max; i++) {
    numbers.push(i);
  }

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-8">{exercise.prompt}</div>

      <div className="bg-cream-100 border-4 border-brown-600 rounded-3xl p-12 w-full max-w-4xl">
        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 h-2 bg-brown-600 -translate-y-1/2" />
          
          <div className="relative flex justify-between">
            {numbers.map((num) => (
              <div key={num} className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full mb-4 ${
                  num === start ? 'bg-green-600 ring-8 ring-green-300' : 'bg-brown-600'
                }`} />
                <div className="text-5xl font-bold text-brown-900">
                  {formatPersianNumber(num)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-4xl text-center text-brown-700">
          شروع: {formatPersianNumber(start)}
          {' • '}
          حرکت: {move > 0 ? '+' : ''}{formatPersianNumber(move)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
        {shuffled.map((choice) => (
          <button
            key={choice}
            onClick={() => onAnswerChange(choice)}
            disabled={disabled}
            className={`bg-white border-4 rounded-3xl p-8 text-[120px] font-bold transition-all shadow-lg leading-none ${
              userAnswer === choice
                ? 'bg-orange-100 border-orange-600 scale-105'
                : 'border-brown-600 hover:bg-orange-50'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
