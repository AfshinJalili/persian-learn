'use client';

import { playAudio } from '@/lib/audio';
import { playOptionAudio } from '@/lib/spoken-option';
import { comparePrompt } from '@/lib/compare';
import { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import { ObjectCluster, objectClusterChoiceGridClass, splitObjectTokens } from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';

interface CompareMoreLessExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

function CompareSide({
  value,
  token,
  selected,
  disabled,
  onSelect,
}: {
  value: 'left' | 'right';
  token: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (value: 'left' | 'right', token: string) => void;
}) {
  const { ref, box } = useSharedClusterSize<HTMLButtonElement>([
    splitObjectTokens(token).length,
  ]);
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(value, token)}
      disabled={disabled}
      className={`card object-choice-card ${selected ? 'selected' : ''}`}
    >
      <ObjectCluster
        token={token}
        boxWidth={box.width}
        boxHeight={box.height}
        cardWidth={box.offsetWidth}
      />
    </button>
  );
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
      <div
        className={objectClusterChoiceGridClass(
          Math.max(splitObjectTokens(left).length, splitObjectTokens(right).length),
          2
        )}
      >
        <CompareSide
          value="left"
          token={left}
          selected={userAnswer === 'left'}
          disabled={disabled}
          onSelect={select}
        />
        <CompareSide
          value="right"
          token={right}
          selected={userAnswer === 'right'}
          disabled={disabled}
          onSelect={select}
        />
      </div>
      <button
        type="button"
        onClick={() => select('equal', 'یکسان هستند')}
        disabled={disabled}
        className={`card min-h-20 h-auto w-full shrink-0 py-2 ${userAnswer === 'equal' ? 'selected' : ''}`}
      >
        <span className="body-lg font-bold">یکسان هستند</span>
      </button>
    </>
  );
}
