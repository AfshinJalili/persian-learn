import { useState } from 'react';
import { playAudio } from '@/lib/audio';
import type { Exercise } from '@/lib/types';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function TenFrameExercise({ exercise, userAnswer, onAnswerChange, disabled }: Props) {
  const payload = exercise.payload as { target: number; showObjects?: boolean };
  const [counters, setCounters] = useState<boolean[]>(Array(10).fill(false));
  const target = payload.target;

  const handleCellClick = (index: number) => {
    if (disabled) return;

    const newCounters = [...counters];
    newCounters[index] = !newCounters[index];
    setCounters(newCounters);

    const count = newCounters.filter(c => c).length;
    onAnswerChange(String(count));
    playAudio(String(count));
  };

  const handleReset = () => {
    setCounters(Array(10).fill(false));
    onAnswerChange('');
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
        <h2 className="text-3xl font-black text-[var(--ink)]">قاب ده‌تایی</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="grid grid-cols-5 gap-2 p-4 bg-white rounded-2xl shadow-lg">
          {counters.map((filled, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={disabled}
              className={`
                w-16 h-16 rounded-xl border-4 transition-all
                ${filled ? 'bg-[var(--green-600)] border-[var(--green-700)]' : 'bg-[var(--surface-2)] border-[var(--line-strong)]'}
                ${disabled ? 'opacity-50' : 'hover:scale-105 active:scale-95'}
              `}
            >
              {filled && <div className="text-3xl">●</div>}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-6xl font-black">
            {counters.filter(c => c).length}
          </div>
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-2xl bg-[var(--clay-100)] border-2 border-[var(--clay-400)] text-[var(--clay-800)] font-bold"
          >
            از اول
          </button>
        </div>
      </div>
    </div>
  );
}
