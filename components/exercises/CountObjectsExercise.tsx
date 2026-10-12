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

  const handleSelect = async (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
    await playAudio(option);
  };

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2>{exerciseHeading(exercise)}</h2>
      </div>
      <div className="card" style={{ height: 250, background: '#FFF8EC' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(count, 3) || 2}, 96px)`,
            gap: '18px 40px',
          }}
        >
          {objects.map((obj, index) => (
            <span key={`${obj}-${index}`} className="relative inline-grid">
              <ObjectArt token={obj} size={96} />
            </span>
          ))}
        </div>
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
