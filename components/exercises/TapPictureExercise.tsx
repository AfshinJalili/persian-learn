'use client';

import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import { ObjectCluster, objectClusterChoiceGridClass, splitObjectTokens } from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  answerState?: 'idle' | 'correct' | 'wrong';
}

export default function TapPictureExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
  answerState = 'idle',
}: Props) {
  const options = exerciseChoices(exercise);
  const counts = options.map((option) => splitObjectTokens(option).length);
  const clusterLayout = exercise.id.startsWith('a') ? 'picture' : 'grid';
  const { ref, box } = useSharedClusterSize(counts, { layout: clusterLayout });

  const handleSelect = (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
  };

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2>{exerciseHeading(exercise)}</h2>
      </div>
      <div
        ref={ref}
        className={objectClusterChoiceGridClass(Math.max(1, ...counts), options.length, 'picture-grid')}
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
              <ObjectCluster
                token={option}
                layout={clusterLayout}
                boxWidth={box.width}
                boxHeight={box.height}
                cardWidth={box.offsetWidth}
              />
            </ChoiceButton>
          );
        })}
      </div>
    </>
  );
}
