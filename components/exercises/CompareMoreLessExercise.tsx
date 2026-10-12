'use client';

import { playAudio } from '@/lib/audio';
import { comparePrompt } from '@/lib/compare';
import { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import { ObjectArt } from '@/components/art/objects';

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
  const { left, right, ask } = exercise.payload as { left: string; right: string; ask: string };

  const select = async (value: string, spoken: string) => {
    if (disabled) return;
    onAnswerChange(value);
    await playAudio(spoken);
  };

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2>{comparePrompt(ask)}</h2>
      </div>
      <div className="grid2">
        <button
          type="button"
          onClick={() => select('left', 'این')}
          disabled={disabled}
          className={`card h-40 ${userAnswer === 'left' ? 'selected' : ''}`}
        >
          <ObjectArt token={left} size={96} />
        </button>
        <button
          type="button"
          onClick={() => select('right', 'این')}
          disabled={disabled}
          className={`card h-40 ${userAnswer === 'right' ? 'selected' : ''}`}
        >
          <ObjectArt token={right} size={96} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => select('equal', 'یکسان هستند')}
        disabled={disabled}
        className={`card h-20 w-full ${userAnswer === 'equal' ? 'selected' : ''}`}
      >
        <span className="body-lg font-bold">یکسان هستند</span>
      </button>
    </>
  );
}
