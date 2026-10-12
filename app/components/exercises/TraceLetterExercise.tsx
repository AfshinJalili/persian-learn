import { useState } from 'react';
import { playAudio } from '@/lib/audio';
import type { Exercise } from '@/lib/types';

interface Props {
  exercise: Exercise;
  onComplete: (answer: string) => void;
}

export default function TraceLetterExercise({ exercise, onComplete }: Props) {
  const [traced, setTraced] = useState(false);
  const payload = exercise.payload as { letter: string; forms: string[] };

  const handleTrace = async () => {
    if (traced) return;
    
    setTraced(true);
    await playAudio('آفرین!');
    setTimeout(() => {
      onComplete(payload.letter);
    }, 500);
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
        <h2 className="text-3xl font-black text-[var(--ink)]">با انگشت بکشید</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div 
          className="relative bg-white rounded-3xl p-8 shadow-xl cursor-pointer select-none"
          onClick={handleTrace}
        >
          <div 
            className={`text-9xl font-black transition-all duration-300 ${
              traced ? 'text-[var(--green-700)]' : 'text-[var(--ink-2)]'
            }`}
            style={{ fontSize: '200px', lineHeight: '1.3' }}
          >
            {payload.letter}
          </div>
          
          {!traced && (
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 text-6xl animate-bounce">
              👆
            </div>
          )}
          
          {traced && (
            <div className="absolute top-4 left-4 text-5xl">
              ✓
            </div>
          )}
        </div>

        <p className="text-xl text-[var(--ink-2)] mt-6 text-center">
          روی حرف بزنید تا ادامه دهید
        </p>
      </div>
    </div>
  );
}
