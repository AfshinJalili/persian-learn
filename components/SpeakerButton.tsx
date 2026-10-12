import { playAudio } from '@/lib/audio';

interface SpeakerButtonProps {
  text: string;
  large?: boolean;
  label?: string;
}

export default function SpeakerButton({
  text,
  large = false,
  label = 'پخش صدا',
}: SpeakerButtonProps) {
  const sizeClass = large ? 'w-32 h-32' : 'w-20 h-20 min-w-20 min-h-20';
  const iconClass = large ? 'w-16 h-16' : 'w-10 h-10';

  return (
    <button
      type="button"
      onClick={() => {
        playAudio(text).catch(() => {});
      }}
      className={`${sizeClass} rounded-full bg-[var(--blue-700)] text-white flex items-center justify-center shadow-lg shrink-0`}
      aria-label={label}
    >
      <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      </svg>
    </button>
  );
}
