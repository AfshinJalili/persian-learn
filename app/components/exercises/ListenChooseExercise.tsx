import { playAudio } from '@/lib/audio';
import type { Exercise } from '@/lib/types';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function ListenChooseExercise({ exercise, userAnswer, onAnswerChange, disabled }: Props) {
  const payload = exercise.payload as { choice_kind: string };
  const options = [exercise.answer, ...exercise.distractors];

  const handleSelect = async (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
    await playAudio(option);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center mb-8">
        <button
          onClick={() => playAudio(exercise.audio_script)}
          className="w-32 h-32 rounded-full bg-[var(--blue-700)] text-white flex items-center justify-center shadow-xl mb-4"
        >
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
        </button>
        <h2 className="text-3xl font-black text-[var(--ink)]">گوش کنید</h2>
      </div>

      <div className="flex-1 flex flex-col gap-6 justify-center">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={disabled}
            className={`
              h-32 rounded-3xl text-8xl font-black transition-all shadow-lg flex items-center justify-center
              ${userAnswer === option ? 'bg-[var(--blue-100)] border-4 border-[var(--blue-700)] scale-105' : 'bg-white border-4 border-[var(--line-strong)]'}
              ${disabled ? 'opacity-50' : 'hover:scale-105'}
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
