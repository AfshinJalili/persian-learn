'use client';

import { Exercise } from '@/lib/types';

interface EquationExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function EquationExercise({ exercise, userAnswer, onAnswerChange, disabled }: EquationExerciseProps) {
  const { a, op, b, objects } = exercise.payload as { a: number; op: string; b: number; objects: string };
  const choices = [exercise.answer, ...exercise.distractors];
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  const renderObjects = (count: number) => {
    return Array(count).fill(objects).join(' ');
  };

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl font-bold text-brown-900 mb-8">{exercise.prompt}</div>

      <div className="bg-cream-100 border-4 border-brown-600 rounded-3xl p-12 w-full max-w-3xl">
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-6xl">{renderObjects(a)}</div>
          <div className="text-8xl font-bold text-brown-900">{op}</div>
          <div className="text-6xl">{renderObjects(b)}</div>
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
