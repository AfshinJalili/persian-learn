'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import { ObjectArt } from '@/components/art/objects';

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

      <div className="ten-frame-grid">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="ten-frame-cell">
            {i < filledCount ? <ObjectArt token={glyph} size={40} /> : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice}
            selected={userAnswer === choice}
            disabled={disabled}
            name={choice}
            peers={choices}
            onClick={() => onAnswerChange(choice)}
            className="px-2 py-6 text-[48px]"
          >
            {choice}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
