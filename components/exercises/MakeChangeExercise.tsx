'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import { formatDisplayValue } from '@/lib/persian';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface MakeChangeExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function MakeChangeExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: MakeChangeExerciseProps) {
  const { item, price, paid } = exercise.payload as {
    item: string;
    price: string | number;
    paid: string | number;
  };
  const choices = exerciseChoices(exercise);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-6xl">{item}</div>
      </div>

      <div className="bg-cream-100 border-4 border-brown-600 rounded-3xl p-6 w-full">
        <div className="flex justify-around items-center gap-4">
          <div className="text-center">
            <div className="text-xl text-brown-600 mb-2">قیمت:</div>
            <div className="text-4xl font-bold text-brown-900">{formatDisplayValue(price)}</div>
          </div>
          <div className="text-5xl text-brown-600">←</div>
          <div className="text-center">
            <div className="text-xl text-brown-600 mb-2">پرداخت شد:</div>
            <div className="text-4xl font-bold text-[var(--green-700)]">{formatDisplayValue(paid)}</div>
          </div>
        </div>
      </div>

      <div className="text-2xl font-bold text-brown-900">چقدر پس بدهیم؟</div>

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
