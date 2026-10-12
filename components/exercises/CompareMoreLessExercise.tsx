'use client';

import { playAudio } from '@/lib/audio';
import { playOptionAudio } from '@/lib/spoken-option';
import { comparePrompt } from '@/lib/compare';
import { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import { ObjectCluster } from '@/components/art/objects';

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

  const select = (value: string, token: string) => {
    if (disabled) return;
    onAnswerChange(value);
    if (value === 'equal') {
      playAudio('یکسان هستند').catch(() => {});
      return;
    }
    playOptionAudio(token, [left, right]).catch(() => {});
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
          onClick={() => select('left', left)}
          disabled={disabled}
          className={`card object-choice-card ${userAnswer === 'left' ? 'selected' : ''}`}
        >
          <ObjectCluster token={left} />
        </button>
        <button
          type="button"
          onClick={() => select('right', right)}
          disabled={disabled}
          className={`card object-choice-card ${userAnswer === 'right' ? 'selected' : ''}`}
        >
          <ObjectCluster token={right} />
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
