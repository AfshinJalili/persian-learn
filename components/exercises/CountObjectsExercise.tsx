'use client';

import { singleArtStyle } from '@/components/art/single-art';
import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading, exerciseHeadingClass } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import { ObjectCluster, objectArtAspect } from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  answerState?: 'idle' | 'correct' | 'wrong';
}

export default function CountObjectsExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
  answerState = 'idle',
}: Props) {
  const payload = exercise.payload as { objects: string; count: number };
  const options = exerciseChoices(exercise);
  const count = Number.isFinite(payload.count) ? payload.count : 0;
  const objects = Array.from({ length: Math.max(0, count) }, () => payload.objects || '•');
  const { ref, box } = useSharedClusterSize([objects.length]);

  const handleSelect = (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
  };

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className={exerciseHeadingClass(exercise)}>{exerciseHeading(exercise)}</h2>
      </div>
      <div
        ref={ref}
        className="card object-count-card"
        data-single-art={objects.length === 1 || undefined}
        style={singleArtStyle(objects.length === 1, box.offsetWidth, objectArtAspect(objects[0] ?? ''))}
      >
        <ObjectCluster
          tokens={objects}
          boxWidth={box.width}
          boxHeight={box.height}
          cardWidth={box.offsetWidth}
        />
      </div>
      <div className="grid3">
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
              name={option}
              peers={options}
              onClick={() => handleSelect(option)}
              className="h-[120px]"
            >
              <span className="glyph">{option}</span>
            </ChoiceButton>
          );
        })}
      </div>
    </>
  );
}
