'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import { formatPersianNumber } from '@/lib/persian';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface NumberLineExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function NumberLineExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: NumberLineExerciseProps) {
  const { min, max, start, move } = exercise.payload as {
    min: number;
    max: number;
    start: number;
    move: number;
  };
  const choices = exerciseChoices(exercise);
  const numbers: number[] = [];
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 10;
  for (let i = safeMin; i <= safeMax; i += 1) {
    numbers.push(i);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">{exercise.prompt}</div>
      </div>

      <div className="bg-cream-100 border-4 border-brown-600 rounded-3xl p-4 w-full overflow-x-auto">
        <div className="flex justify-between text-lg font-bold text-brown-700 mb-3">
          <span>کمتر</span>
          <span>بیشتر ←</span>
        </div>
        <div className="relative min-w-[320px]">
          <div className="absolute inset-x-0 top-3 h-1 bg-brown-600" />
          <div className="relative flex justify-between">
            {numbers.map((num) => (
              <div key={num} className="flex flex-col items-center w-7">
                <div
                  className={`w-4 h-4 rounded-full mb-2 ${
                    num === start ? 'bg-[var(--green-600)] ring-4 ring-green-300' : 'bg-brown-600'
                  }`}
                />
                <div className="text-sm font-bold text-brown-900">
                  {formatPersianNumber(num)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-2xl text-center text-brown-700">
          شروع: {formatPersianNumber(start ?? 0)}
          {' • '}
          حرکت: {move > 0 ? '+' : ''}
          {formatPersianNumber(move ?? 0)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice}
            selected={userAnswer === choice}
            disabled={disabled}
            onClick={() => onAnswerChange(choice)}
            className="p-4 text-5xl leading-none"
          >
            {choice}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
