'use client';

import { Exercise } from '@/lib/types';

interface MakeChangeExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function MakeChangeExercise({ exercise, userAnswer, onAnswerChange, disabled }: MakeChangeExerciseProps) {
  const { item, price, paid } = exercise.payload as { item: string; price: string; paid: string };
  const choices = [exercise.answer, ...exercise.distractors];
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-4">{item}</div>
      
      <div className="bg-cream-100 border-4 border-brown-600 rounded-3xl p-8 w-full max-w-3xl">
        <div className="flex justify-around items-center">
          <div className="text-center">
            <div className="text-3xl text-brown-600 mb-2">قیمت:</div>
            <div className="text-6xl font-bold text-brown-900">{price}</div>
          </div>
          <div className="text-7xl text-brown-600">←</div>
          <div className="text-center">
            <div className="text-3xl text-brown-600 mb-2">پرداخت شد:</div>
            <div className="text-6xl font-bold text-green-700">{paid}</div>
          </div>
        </div>
      </div>

      <div className="text-4xl font-bold text-brown-900 mb-4">چقدر پس بدهیم؟</div>

      <div className="grid grid-cols-1 gap-6 w-full max-w-2xl">
        {shuffled.map((choice) => (
          <button
            key={choice}
            onClick={() => onAnswerChange(choice)}
            disabled={disabled}
            className={`bg-white border-4 rounded-3xl p-8 text-5xl font-bold transition-colors shadow-lg ${
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
