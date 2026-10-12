'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import { formatPersianNumber } from '@/lib/persian';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface CountMoneyExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

function billLabel(value: number): string {
  return `${formatPersianNumber(value)} تومان`;
}

function BillVisual({ value }: { value: number }) {
  const colors: Record<number, string> = {
    10000: 'from-purple-200 to-purple-300 border-purple-600',
    50000: 'from-green-200 to-green-300 border-green-600',
    100000: 'from-blue-200 to-blue-300 border-blue-600',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[value] ?? 'from-stone-200 to-stone-300 border-stone-600'} border-4 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center w-full max-w-[240px] h-24`}
    >
      <div className="text-3xl font-bold text-gray-800">{billLabel(value)}</div>
    </div>
  );
}

export default function CountMoneyExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: CountMoneyExerciseProps) {
  const { items } = exercise.payload as { items: number[] };
  const choices = exerciseChoices(exercise);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">{exercise.prompt}</div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center w-full">
        {(items || []).map((value, index) => (
          <BillVisual key={`${value}-${index}`} value={value} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 w-full">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice}
            selected={userAnswer === choice}
            disabled={disabled}
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
