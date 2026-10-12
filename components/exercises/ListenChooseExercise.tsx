import { playAudio } from '@/lib/audio';
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
        <svg viewBox="0 0 32 24" aria-hidden="true">
          <path d="M8 18a9.5 8.5 0 0 1 19 0z" fill="currentColor" />
          <path d="M12.5 17.5l2-5h6l2 5M14.5 12.5l3-3.4 3 3.4" fill="none" stroke="#E3EEFB" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="5" cy="15" r="3.4" fill="currentColor" />
          <path d="M7 16.5l2 1" stroke="currentColor" strokeWidth="2.4" />
          <rect x="10" y="17" width="4" height="4.5" rx="1.6" fill="currentColor" />
          <rect x="21" y="17" width="4" height="4.5" rx="1.6" fill="currentColor" />
          <path d="M27 17.5l3 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="4" cy="14" r=".9" fill="#E3EEFB" />
        </svg>
        آهسته‌تر
      </button>
      <div className={isLetter || options.length === 3 ? 'grid3 w-full' : 'grid2 w-full'}>
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
              className="h-[150px]"
            >
              {option.length <= 2 ? (
                <span className="glyph" style={{ fontSize: 84 }}>
                  {option}
                </span>
              ) : (
                <ObjectArt token={option} size={72} />
              )}
            </ChoiceButton>
          );
        })}
      </div>
    </div>
  );
}
