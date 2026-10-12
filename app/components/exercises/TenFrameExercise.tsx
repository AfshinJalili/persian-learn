'use client';

import { Exercise } from '@/lib/types';
import { formatPersianNumber } from '@/lib/persian';

interface TenFrameExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function TenFrameExercise({ exercise, userAnswer, onAnswerChange, disabled }: TenFrameExerciseProps) {
  const { count, objects } = exercise.payload as { count: number; objects: string };
  const choices = [exercise.answer, ...exercise.distractors];
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  const renderTenFrame = () => {
    const cells = [];
    for (let i = 0; i < 10; i++) {
      const filled = i < count;
      cells.push(
        <div
          key={i}
          className="flex items-center justify-center border-4 border-brown-600 bg-cream-50 aspect-square"
        >
          {filled && <span className="text-6xl">{objects}</span>}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center">{exercise.prompt}</div>

      <div className="grid grid-cols-5 gap-2 w-full max-w-2xl">
        {renderTenFrame()}
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
        {shuffled.map((choice) => (
          <button
            key={choice}
            onClick={() => onAnswerChange(choice)}
            disabled={disabled}
            className={`bg-white border-4 rounded-3xl p-8 text-7xl font-bold transition-colors shadow-lg ${
              userAnswer === choice
                ? 'bg-orange-100 border-orange-600 scale-105'
                : 'border-brown-600 hover:bg-orange-50 text-brown-900'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
