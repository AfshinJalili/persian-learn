'use client';

import { playAudio } from '@/lib/audio';
import { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';

interface CompareMoreLessExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function CompareMoreLessExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: CompareMoreLessExerciseProps) {
  const { left, right } = exercise.payload as { left: string; right: string; ask: string };

  const select = async (value: string, spoken: string) => {
    if (disabled) return;
    onAnswerChange(value);
    await playAudio(spoken);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">کدام بیشتر است؟</div>
      </div>

      <div className="flex items-stretch gap-4 w-full">
        <button
          type="button"
          onClick={() => select('left', 'این')}
          disabled={disabled}
          className={`flex-1 border-4 rounded-3xl p-6 text-5xl min-h-36 ${
            userAnswer === 'left'
              ? 'bg-[var(--blue-100)] border-[var(--blue-700)]'
              : 'bg-white border-brown-600'
          }`}
        >
          {left}
        </button>

        <button
          type="button"
          onClick={() => select('right', 'این')}
          disabled={disabled}
          className={`flex-1 border-4 rounded-3xl p-6 text-5xl min-h-36 ${
            userAnswer === 'right'
              ? 'bg-[var(--blue-100)] border-[var(--blue-700)]'
              : 'bg-white border-brown-600'
          }`}
        >
          {right}
        </button>
      </div>

      <button
        type="button"
        onClick={() => select('equal', 'یکسان هستند')}
        disabled={disabled}
        className={`w-full border-4 rounded-3xl px-6 py-6 text-3xl font-bold ${
          userAnswer === 'equal'
            ? 'bg-[var(--blue-100)] border-[var(--blue-700)]'
            : 'bg-white border-brown-600'
        }`}
      >
        یکسان هستند
      </button>
    </div>
  );
}
