'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface EquationExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function EquationExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: EquationExerciseProps) {
  const { a, op, b, objects } = exercise.payload as {
    a: number;
    op: string;
    b: number;
    objects: string;
  };
  const choices = exerciseChoices(exercise);
  const leftCount = Math.max(0, Number(a) || 0);
  const rightCount = Math.max(0, Number(b) || 0);
  const glyph = objects || '•';

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">{exercise.prompt}</div>
      </div>

      <div className="bg-cream-100 border-4 border-brown-600 rounded-3xl p-6 w-full">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="text-4xl break-all">{glyph.repeat(leftCount) || '∅'}</div>
          <div className="text-5xl font-bold text-brown-900">{op}</div>
          <div className="text-4xl break-all">{glyph.repeat(rightCount) || '∅'}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice}
            selected={userAnswer === choice}
            disabled={disabled}
            onClick={() => onAnswerChange(choice)}
            className="p-6 text-6xl leading-none"
          >
            {choice}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
