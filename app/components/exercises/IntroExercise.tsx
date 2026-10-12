import { playAudio } from '@/lib/audio';
import type { Exercise } from '@/lib/types';

interface Props {
  exercise: Exercise;
  onContinue: () => void;
}

export default function IntroExercise({ exercise, onContinue }: Props) {
  const payload = exercise.payload as { display: string; visual?: string };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <button
        onClick={() => playAudio(exercise.audio_script)}
        className="w-20 h-20 rounded-full bg-[var(--blue-700)] text-white flex items-center justify-center mb-8 shadow-lg"
      >
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      </button>

      <div className="text-9xl font-black mb-8 text-[var(--ink)]" style={{ fontSize: '160px' }}>
        {payload.display}
      </div>

      {payload.visual && (
        <div className="text-8xl mb-8">
          {payload.visual}
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full max-w-md h-16 rounded-2xl bg-[var(--green-700)] text-white text-2xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
      >
        <span>ادامه</span>
        <span>←</span>
      </button>
    </div>
  );
}
