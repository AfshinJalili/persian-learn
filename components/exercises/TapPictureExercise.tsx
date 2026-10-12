import { playAudio } from '@/lib/audio';
import { exerciseChoices } from '@/lib/shuffle';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function TapPictureExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: Props) {
  const payload = exercise.payload as { display: string };
  const options = exerciseChoices(exercise);

  const handleSelect = async (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
    await playAudio(option);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-8">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className="text-3xl font-black text-[var(--ink)]">{payload.display}</h2>
      </div>

      <div className="flex-1 flex flex-col gap-4 justify-center">
        {options.map((option) => (
          <ChoiceButton
            key={option}
            selected={userAnswer === option}
            disabled={disabled}
            onClick={() => handleSelect(option)}
            className="h-40 text-7xl"
          >
            {option}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
