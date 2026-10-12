'use client';

import { Exercise } from '@/lib/types';

interface ChooseDigitExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function ChooseDigitExercise({ exercise, userAnswer, onAnswerChange, disabled }: ChooseDigitExerciseProps) {
  const { display } = exercise.payload as { display: string };
  const choices = [exercise.answer, ...exercise.distractors];
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-8">{exercise.prompt}</div>

      <div className="bg-cream-100 border-8 border-brown-600 rounded-3xl p-16 shadow-2xl">
        <div className="text-[200px] font-bold text-brown-900 leading-none">
          {display}
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
