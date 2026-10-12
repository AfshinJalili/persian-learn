'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading } from '@/lib/exercise-copy';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import {
  DICE_PIP_COUNTS,
  OBJECT_CLUSTER_MIN_SIZE,
  OBJECT_SINGLE_WIDTH_RATIO,
  ObjectCluster,
} from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';

interface ChooseDigitExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  answerState?: 'idle' | 'correct' | 'wrong';
}

export default function ChooseDigitExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
  answerState = 'idle',
}: ChooseDigitExerciseProps) {
  const { display } = exercise.payload as { display: string };
  const choices = exerciseChoices(exercise);
  const diceCount = DICE_PIP_COUNTS[display] ?? 0;
  const { ref, box } = useSharedClusterSize([Math.max(1, diceCount)]);
  const pips = Array.from({ length: diceCount }, () => '🔵');

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2>{exerciseHeading(exercise)}</h2>
      </div>
      {diceCount > 0 ? (
        <div ref={ref} className="card object-count-card" data-dice-face={display}>
          <ObjectCluster
            tokens={pips}
            boxWidth={box.width}
            boxHeight={box.height}
            cardWidth={box.offsetWidth}
          />
        </div>
      ) : (
        <div ref={ref} className="card object-count-card" data-digit-display>
          <span
            className="glyph"
            style={{
              fontSize: Math.max(
                OBJECT_CLUSTER_MIN_SIZE,
                Math.floor(
                  Math.min(
                    (box.offsetWidth > 8 ? box.offsetWidth : box.width) *
                      OBJECT_SINGLE_WIDTH_RATIO,
                    box.width
                  )
                )
              ),
            }}
          >
            {display}
          </span>
        </div>
      )}
      <div className="grid3">
        {choices.map((choice) => {
          const selected = userAnswer === choice;
          const state =
            disabled && answerState !== 'idle' && selected ? answerState : 'idle';
          return (
            <ChoiceButton
              key={choice}
              selected={selected}
              disabled={disabled}
              state={state}
              name={choice}
              peers={choices}
              onClick={() => onAnswerChange(choice)}
              className="h-[120px]"
            >
              <span className="glyph">{choice}</span>
            </ChoiceButton>
          );
        })}
      </div>
    </>
  );
}
