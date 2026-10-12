'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface TenFrameExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function TenFrameExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: TenFrameExerciseProps) {
  const { count, objects } = exercise.payload as { count: number; objects: string };
  const choices = exerciseChoices(exercise);
  const filledCount = Math.max(0, Math.min(10, Number(count) || 0));
  const glyph = objects || '🔴';

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">{exercise.prompt}</div>
      </div>

      <div className="grid grid-cols-5 gap-2 w-full max-w-sm">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-center border-4 border-brown-600 bg-cream-50 aspect-square rounded-xl"
          >
            {i < filledCount ? <span className="text-4xl">{glyph}</span> : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice}
            selected={userAnswer === choice}
            disabled={disabled}
            onClick={() => onAnswerChange(choice)}
            className="p-6 text-5xl"
          >
            {choice}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
