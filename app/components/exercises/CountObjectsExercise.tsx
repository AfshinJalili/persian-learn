import { playAudio } from '@/lib/audio';
import type { Exercise } from '@/lib/types';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function CountObjectsExercise({ exercise, userAnswer, onAnswerChange, disabled }: Props) {
  const payload = exercise.payload as { objects: string; count: number };
  const options = [exercise.answer, ...exercise.distractors];

  const objects = Array(payload.count).fill(payload.objects);

  const handleSelect = async (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
    await playAudio(option);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => playAudio(exercise.audio_script)}
          className="w-20 h-20 rounded-full bg-[var(--blue-700)] text-white flex items-center justify-center shadow-lg shrink-0"
        >
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
        </button>
        <h2 className="text-3xl font-black text-[var(--ink)]">چند؟</h2>
      </div>

      <div className="bg-white rounded-3xl p-8 mb-6 flex flex-wrap justify-center items-center gap-4 min-h-48 shadow-lg">
        {objects.map((obj, i) => (
          <div key={i} className="text-6xl">
            {obj}
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={disabled}
            className={`
              w-28 h-28 rounded-3xl text-7xl font-black transition-all shadow-lg
              ${userAnswer === option ? 'bg-[var(--blue-100)] border-4 border-[var(--blue-700)] scale-110' : 'bg-white border-4 border-[var(--line-strong)]'}
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
