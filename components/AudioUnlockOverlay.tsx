'use client';

import { useState } from 'react';
import { isAudioUnlocked, playAudio, unlockAudio } from '@/lib/audio';
import { consumeHomeGreeting, homeGreeting } from '@/lib/learner';
import HodaMascot from '@/components/HodaMascot';
import SpeakerIcon from '@/components/ui/SpeakerIcon';

interface AudioUnlockOverlayProps {
  phrase?: string;
  sessionOnce?: boolean;
}

export default function AudioUnlockOverlay({
  phrase = homeGreeting(),
  sessionOnce = false,
}: AudioUnlockOverlayProps) {
  const [unlocked, setUnlocked] = useState(isAudioUnlocked());

  if (unlocked) {
    return null;
  }

  const handleUnlock = () => {
    unlockAudio();
    setUnlocked(true);
    if (sessionOnce && !consumeHomeGreeting()) {
      return;
    }
    playAudio(phrase).catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col items-center justify-center p-6"
      role="button"
      tabIndex={0}
      aria-label="شروع"
      onClick={handleUnlock}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleUnlock();
        }
      }}
    >
      <HodaMascot className="w-40 h-40 mb-6" />
      <span className="speaker xl" aria-hidden="true">
        <SpeakerIcon />
      </span>
      <p className="body-lg font-bold mt-6 text-center">برای شنیدن، اینجا بزنید</p>
    </div>
  );
}
