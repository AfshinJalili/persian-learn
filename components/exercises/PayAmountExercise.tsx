'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import { formatDisplayValue, formatPersianNumber } from '@/lib/persian';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface PayAmountExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

function BillVisual({ value, count = 1 }: { value: number; count?: number }) {
  const colors: Record<number, string> = {
    10000: 'from-purple-200 to-purple-300 border-purple-600',
    50000: 'from-green-200 to-green-300 border-green-600',
    100000: 'from-blue-200 to-blue-300 border-blue-600',
  };

  return (
    <div className="relative w-full max-w-[240px]">
      <div
        className={`bg-gradient-to-br ${colors[value] ?? 'from-stone-200 to-stone-300 border-stone-600'} border-4 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center h-24`}
      >
        <div className="text-2xl font-bold text-gray-800">
          {formatPersianNumber(value)} تومان
        </div>
      </div>
      {count > 1 && (
        <div className="absolute -top-3 -right-3 bg-[var(--clay-400)] text-[var(--ink)] rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold border-4 border-white shadow-lg">
          ×{formatPersianNumber(count)}
        </div>
      )}
    </div>
  );
}

export default function PayAmountExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: PayAmountExerciseProps) {
  const { item, price, wallet } = exercise.payload as {
    item: string;
    price: string | number;
    wallet: number[];
  };
  const choices = exerciseChoices(exercise);

  const walletCounts = (wallet || []).reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-[60px]">{item}</div>
      </div>
      <div className="text-3xl font-bold text-brown-900">قیمت: {formatDisplayValue(price)}</div>

      <div className="bg-cream-100 border-4 border-brown-600 rounded-3xl p-6 w-full">
        <div className="text-2xl font-bold text-brown-900 mb-4 text-center">کیف پول شما:</div>
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(walletCounts).map(([value, count]) => (
            <BillVisual key={value} value={Number(value)} count={count} />
          ))}
        </div>
      </div>

      <div className="text-2xl font-bold text-brown-900">چطور پرداخت کنیم؟</div>

      <div className="grid grid-cols-1 gap-4 w-full">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice}
            selected={userAnswer === choice}
            disabled={disabled}
            name={choice}
            peers={choices}
            onClick={() => onAnswerChange(choice)}
            className="p-6 text-3xl"
          >
            {choice}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
