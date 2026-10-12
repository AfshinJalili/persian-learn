'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface ChooseDigitExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function ChooseDigitExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: ChooseDigitExerciseProps) {
  const { display } = exercise.payload as { display: string };
  const choices = exerciseChoices(exercise);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">{exercise.prompt}</div>
      </div>

      <div className="bg-cream-100 border-8 border-brown-600 rounded-3xl px-10 py-8 shadow-xl">
        <div className="text-[120px] font-bold text-brown-900 leading-none">{display}</div>
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
