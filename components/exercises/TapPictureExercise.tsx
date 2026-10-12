import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import { ObjectArt } from '@/components/art/objects';

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
      <div className="grid2">
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
              className="h-[172px]"
            >
              <ObjectArt token={option} size={116} />
            </ChoiceButton>
          );
        })}
      </div>
    </>
  );
}
