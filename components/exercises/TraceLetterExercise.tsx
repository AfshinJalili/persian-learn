'use client';

import { useEffect, useState } from 'react';
import { playAudio } from '@/lib/audio';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';

interface Props {
  exercise: Exercise;
  onComplete: (answer: string) => void;
}

export default function TraceLetterExercise({ exercise, onComplete }: Props) {
  const [traced, setTraced] = useState(false);
  const payload = exercise.payload as { letter: string; forms: string[] };
  const letter = payload.letter || exercise.answer;

  useEffect(() => {
    setTraced(false);
  }, [exercise.id]);

  const handleTrace = async () => {
    if (traced) return;

    setTraced(true);
    await playAudio('آفرین!');
    setTimeout(() => {
      onComplete(letter);
    }, 400);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className="text-3xl font-black text-[var(--ink)]">با انگشت بکشید</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          type="button"
          className="relative bg-white rounded-3xl p-8 shadow-xl"
          onClick={handleTrace}
        >
          <div
            className={`font-black transition-all duration-300 ${
              traced ? 'text-[var(--green-700)]' : 'text-[var(--ink-2)]'
            }`}
            style={{ fontSize: '160px', lineHeight: '1.3' }}
          >
            {letter}
          </div>

          {!traced && (
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 text-6xl animate-bounce">
              👆
            </div>
          )}

          {traced && <div className="absolute top-4 left-4 text-5xl">✓</div>}
        </button>

        <p className="text-xl text-[var(--ink-2)] mt-6 text-center">
          روی حرف بزنید تا ادامه دهید
        </p>
      </div>
    </div>
  );
}
