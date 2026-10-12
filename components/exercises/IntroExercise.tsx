import type { Exercise } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { personalizeIntroScript } from '@/lib/learner';
import SpeakerButton from '@/components/SpeakerButton';
import { ObjectArt } from '@/components/art/objects';

interface Props {
  exercise: Exercise;
  onContinue: () => void;
}

export default function IntroExercise({ exercise, onContinue }: Props) {
  const payload = exercise.payload as { display: string; visual?: string };
  const groups = String(payload.display || '')
    .split(/\s{2,}/)
    .filter(Boolean);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <SpeakerButton text={exercise.audio_script} size="xl" />
      <div className="flex flex-col items-center justify-center gap-4">
        {groups.map((group, index) => (
          <ObjectArt key={`${group}-${index}`} token={group.trim()} size={72} />
        ))}
      </div>
      {payload.visual ? <ObjectArt token={payload.visual} size={96} /> : null}
      <p className="body-lg">{personalizeIntroScript(exercise.audio_script)}</p>
      <button type="button" onClick={onContinue} className="btn btn-primary">
        ادامه
        <ArrowLeft strokeWidth={2.6} />
      </button>
    </div>
  );
}
