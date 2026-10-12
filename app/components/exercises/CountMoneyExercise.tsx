'use client';

import { Exercise } from '@/lib/types';

interface CountMoneyExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

const BillVisual = ({ value }: { value: number }) => {
  const colors: Record<number, string> = {
    10000: 'bg-gradient-to-br from-purple-200 to-purple-300 border-purple-600',
    50000: 'bg-gradient-to-br from-green-200 to-green-300 border-green-600',
    100000: 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-600',
  };

  const labels: Record<number, string> = {
    10000: 'اسکناس ۱۰ هزار تومانی',
    50000: 'ایران‌چک ۵۰ هزار تومانی',
    100000: 'ایران‌چک ۱۰۰ هزار تومانی',
  };

  return (
    <div className={`${colors[value]} border-4 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-w-[280px] h-32`}>
      <div className="text-5xl font-bold text-gray-800 mb-2">
        {value === 10000 ? '۱۰٬۰۰۰' : value === 50000 ? '۵۰٬۰۰۰' : '۱۰۰٬۰۰۰'}
      </div>
      <div className="text-xl font-bold text-gray-700">
        {labels[value]}
      </div>
    </div>
  );
};

export default function CountMoneyExercise({ exercise, userAnswer, onAnswerChange, disabled }: CountMoneyExerciseProps) {
  const { items } = exercise.payload as { items: number[] };
  const choices = [exercise.answer, ...exercise.distractors];
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-8">{exercise.prompt}</div>

      <div className="flex flex-wrap gap-6 justify-center max-w-4xl">
        {items.map((value, index) => (
          <BillVisual key={index} value={value} />
        ))}
      </div>

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
