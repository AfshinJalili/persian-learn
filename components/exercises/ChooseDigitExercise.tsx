'use client';

import { singleArtStyle } from '@/components/art/single-art';
import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading, exerciseHeadingClass } from '@/lib/exercise-copy';
import { digitDisplayFontSize, isSequenceDisplay, sequenceTokens } from '@/lib/digit-display';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import {
  DICE_PIP_COUNTS,
  ObjectCluster,
  looksLikeObjects,
  splitObjectTokens,
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
  const diceFace = Boolean(DICE_PIP_COUNTS[display]);
  const objectDisplay = diceFace || looksLikeObjects(display);
  const sequence = !objectDisplay && isSequenceDisplay(display);
  const tokens = sequence ? sequenceTokens(display) : [display];
  const { ref, box } = useSharedClusterSize([
    Math.max(1, objectDisplay ? splitObjectTokens(display).length : tokens.length),
  ]);
  const singleArt = objectDisplay && splitObjectTokens(display).length === 1;
  const fontSize = digitDisplayFontSize(box.width, box.height, box.offsetWidth, tokens.length);

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className={exerciseHeadingClass(exercise)}>{exerciseHeading(exercise)}</h2>
      </div>
      {diceFace ? (
        <div
          ref={ref}
          className="card object-count-card"
          data-dice-face={display}
          data-single-art={singleArt || undefined}
          style={singleArtStyle(singleArt, box.offsetWidth)}
        >
          <ObjectCluster
            token={display}
            boxWidth={box.width}
            boxHeight={box.height}
            cardWidth={box.offsetWidth}
          />
        </div>
      ) : objectDisplay ? (
        <div
          ref={ref}
          className="card object-count-card"
          data-object-display
          data-single-art={singleArt || undefined}
          style={singleArtStyle(singleArt, box.offsetWidth)}
        >
          <ObjectCluster
            tokens={splitObjectTokens(display)}
            boxWidth={box.width}
            boxHeight={box.height}
            cardWidth={box.offsetWidth}
          />
        </div>
      ) : sequence ? (
        <div ref={ref} className="card object-count-card" data-digit-sequence>
          <span className="digit-sequence" style={{ fontSize }}>
            {tokens.map((token, index) => (
              <span key={`${token}-${index}`} className="glyph">
                {token}
              </span>
            ))}
          </span>
        </div>
      ) : (
        <div ref={ref} className="card object-count-card" data-digit-display>
          <span className="glyph" style={{ fontSize }}>
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
