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

export default function CountObjectsExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className="text-3xl font-black text-[var(--ink)]">چند؟</h2>
      </div>

      <div className="bg-white rounded-3xl p-8 mb-6 flex flex-wrap justify-center items-center gap-4 min-h-48 shadow-lg">
        {objects.map((obj, i) => (
          <div key={`${obj}-${i}`} className="text-6xl">
            {obj}
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        {options.map((option) => (
          <ChoiceButton
            key={option}
            selected={userAnswer === option}
            disabled={disabled}
            onClick={() => handleSelect(option)}
            className="w-28 h-28 text-7xl"
          >
            {option}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
