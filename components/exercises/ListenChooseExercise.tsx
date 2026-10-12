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

export default function ListenChooseExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: Props) {
  const options = exerciseChoices(exercise);

  const handleSelect = async (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
    await playAudio(option);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center mb-8">
        <SpeakerButton text={exercise.audio_script} large />
        <h2 className="text-3xl font-black text-[var(--ink)] mt-4">گوش کنید</h2>
      </div>

      <div className="flex-1 flex flex-col gap-6 justify-center">
        {options.map((option) => (
          <ChoiceButton
            key={option}
            selected={userAnswer === option}
            disabled={disabled}
            onClick={() => handleSelect(option)}
            className="h-32 text-8xl flex items-center justify-center"
          >
            <span style={{ fontSize: '72px', lineHeight: 1.3 }}>{option}</span>
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
