'use client';

import { Exercise } from '@/lib/types';
import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading } from '@/lib/exercise-copy';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

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

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2>{exerciseHeading(exercise)}</h2>
      </div>
      <div className="card h-[180px]">
        <div className="glyph" style={{ fontSize: 96 }}>
          {display}
        </div>
      </div>
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
