import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';

interface Props {
  exercise: Exercise;
  onContinue: () => void;
}

export default function IntroExercise({ exercise, onContinue }: Props) {
  const payload = exercise.payload as { display: string; visual?: string };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <SpeakerButton text={exercise.audio_script} large />

      <div className="my-8 flex flex-col items-center justify-center gap-4">
        {String(payload.display || '')
          .split(/\s{2,}/)
          .filter(Boolean)
          .map((group, index) => (
            <div
              key={`${group}-${index}`}
              className="font-black text-[var(--ink)] text-center"
              style={{ fontSize: '72px', lineHeight: '1.3' }}
            >
              {group.trim()}
            </div>
          ))}
      </div>

      {payload.visual ? (
        <div className="text-8xl mb-8">{payload.visual}</div>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        className="w-full max-w-md h-16 rounded-2xl bg-[var(--green-700)] text-white text-2xl font-bold shadow-lg flex items-center justify-center gap-2"
      >
        <span>ادامه</span>
        <span>←</span>
      </button>
    </div>
  );
}
