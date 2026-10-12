'use client';

import { Exercise } from '@/lib/types';

interface PayAmountExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

const BillVisual = ({ value, count = 1 }: { value: number; count?: number }) => {
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
    <div className="relative">
      <div className={`${colors[value]} border-4 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-w-[280px] h-32`}>
        <div className="text-5xl font-bold text-gray-800 mb-2">
          {value === 10000 ? '۱۰٬۰۰۰' : value === 50000 ? '۵۰٬۰۰۰' : '۱۰۰٬۰۰۰'}
        </div>
        <div className="text-xl font-bold text-gray-700">
          {labels[value]}
        </div>
      </div>
      {count > 1 && (
        <div className="absolute -top-3 -right-3 bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-lg">
          ×{count}
        </div>
      )}
    </div>
  );
};

export default function PayAmountExercise({ exercise, userAnswer, onAnswerChange, disabled }: PayAmountExerciseProps) {
  const { item, price, wallet } = exercise.payload as { item: string; price: string; wallet: number[] };
  const choices = [exercise.answer, ...exercise.distractors];
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  const walletCounts = wallet.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-4">{item}</div>
      <div className="text-6xl font-bold text-brown-900 mb-8">قیمت: {price}</div>

      <div className="bg-cream-100 border-4 border-brown-600 rounded-3xl p-8 w-full max-w-3xl">
        <div className="text-4xl font-bold text-brown-900 mb-6 text-center">کیف پول شما:</div>
        <div className="flex flex-wrap gap-6 justify-center">
          {Object.entries(walletCounts).map(([value, count]) => (
            <BillVisual key={value} value={Number(value)} count={count} />
          ))}
        </div>
      </div>

      <div className="text-4xl font-bold text-brown-900 mb-4">چطور پرداخت کنیم؟</div>

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
