'use client';

import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading, exerciseHeadingClass, exerciseHeadingStyle } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import {
  ObjectCluster,
  objectClusterChoiceGridClass,
  splitObjectTokens,
  type ObjectClusterLayout,
} from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  answerState?: 'idle' | 'correct' | 'wrong';
}

function SizedPictureChoice({
  option,
  layout,
  selected,
  disabled,
  state,
  dim,
  peers,
  onSelect,
}: {
  option: string;
  layout: ObjectClusterLayout;
  selected: boolean;
  disabled: boolean;
  state: 'idle' | 'correct' | 'wrong';
  dim: boolean;
  peers: string[];
  onSelect: (option: string) => void;
}) {
  const { ref, box } = useSharedClusterSize([splitObjectTokens(option).length], { layout });
  return (
    <ChoiceButton
      ref={ref}
      selected={selected}
      disabled={disabled}
      state={state}
      dim={dim}
      name={option}
      peers={peers}
      onClick={() => onSelect(option)}
      className="object-choice-card"
    >
      <ObjectCluster
        token={option}
        layout={layout}
        boxWidth={box.width}
        boxHeight={box.height}
        cardWidth={box.offsetWidth}
      />
    </ChoiceButton>
  );
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

  const handleSelect = (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
  };

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className={exerciseHeadingClass(exercise)} style={exerciseHeadingStyle(exercise)}>
          {exerciseHeading(exercise)}
        </h2>
      </div>
      <div
        className={objectClusterChoiceGridClass(Math.max(1, ...counts), options.length, 'picture-grid')}
      >
        {options.map((option) => {
          const selected = userAnswer === option;
          const state =
            disabled && answerState !== 'idle' && selected ? answerState : 'idle';
          return (
            <SizedPictureChoice
              key={option}
              option={option}
              layout={clusterLayout}
              selected={selected}
              disabled={disabled}
              state={state}
              dim={disabled && !selected}
              peers={options}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    </>
  );
}
