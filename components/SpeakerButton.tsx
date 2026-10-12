'use client';

import { useState, type MouseEvent } from 'react';
import { playAudio } from '@/lib/audio';
import SpeakerIcon from '@/components/ui/SpeakerIcon';

interface SpeakerButtonProps {
  text: string;
  large?: boolean;
  size?: 'sm' | 'md' | 'xl';
  label?: string;
  className?: string;
}

export default function SpeakerButton({
  text,
  large = false,
  size,
  label = 'پخش صدا',
  className = '',
}: SpeakerButtonProps) {
  const [playing, setPlaying] = useState(false);
  const resolved = size ?? (large ? 'xl' : 'md');

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setPlaying(true);
    try {
      await playAudio(text);
    } catch {
      /* browsers without Persian TTS still continue */
    } finally {
      setPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`speaker ${resolved} ${playing ? 'playing' : ''} ${className}`.trim()}
      aria-label={label}
    >
      <SpeakerIcon />
    </button>
  );
}
