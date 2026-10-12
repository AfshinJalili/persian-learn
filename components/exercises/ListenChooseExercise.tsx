'use client';

import { playAudio } from '@/lib/audio';
import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import {
  OBJECT_CLUSTER_MIN_SIZE,
  ObjectArt,
  ObjectCluster,
  looksLikeObjects,
  objectClusterChoiceGridClass,
  splitObjectTokens,
} from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';
import TurtleIcon from '@/components/ui/TurtleIcon';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  answerState?: 'idle' | 'correct' | 'wrong';
}

export default function ListenChooseExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
  answerState = 'idle',
}: Props) {
  const options = exerciseChoices(exercise);
  const payload = exercise.payload as { choice_kind?: string };
  const isLetter = payload.choice_kind === 'letter' || options.every((option) => option.length <= 2);
  const objectCounts = options.map((option) =>
    looksLikeObjects(option) ? splitObjectTokens(option).length : 1
  );
  const { ref, box } = useSharedClusterSize(objectCounts);

  const handleSelect = (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
  };

  const handleSlow = () => {
    playAudio(exercise.audio_script, true).catch(() => {});
  };

  return (
    <div className="content-center flex flex-col items-center gap-5">
      <h2>{exerciseHeading(exercise)}</h2>
      <SpeakerButton text={exercise.audio_script} size="xl" />
      <button type="button" className="slow-btn" onClick={handleSlow}>
        <TurtleIcon size={28} />
        آهسته‌تر
      </button>
      <div
        ref={ref}
        className={
          looksLikeObjects(options.join(''))
            ? `${objectClusterChoiceGridClass(Math.max(1, ...objectCounts), options.length)} w-full`
            : isLetter || options.length === 3
              ? 'grid3 w-full'
              : 'grid2 w-full'
        }
      >
        {options.map((option) => {
          const selected = userAnswer === option;
          const state =
            disabled && answerState !== 'idle' && selected ? answerState : 'idle';
          return (
            <ChoiceButton
              key={option}
              selected={selected}
              disabled={disabled}
              state={state}
              dim={disabled && !selected}
              name={option}
              peers={options}
              onClick={() => handleSelect(option)}
              className="object-choice-card"
            >
              {looksLikeObjects(option) ? (
                <ObjectCluster
                  token={option}
                  boxWidth={box.width}
                  boxHeight={box.height}
                />
              ) : option.length <= 2 ? (
                <span className="glyph" style={{ fontSize: 84 }}>
                  {option}
                </span>
              ) : (
                <ObjectArt
                  token={option}
                  size={Math.max(OBJECT_CLUSTER_MIN_SIZE, Math.min(box.width, box.height))}
                />
              )}
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
}
