'use client';

import { useState } from 'react';
import { isAudioUnlocked, playAudio, unlockAudio } from '@/lib/audio';
import HodaMascot from '@/components/HodaMascot';
import SpeakerIcon from '@/components/ui/SpeakerIcon';

interface AudioUnlockOverlayProps {
  phrase?: string;
}

export default function AudioUnlockOverlay({
  phrase = 'سلام! من هُدی هستم. خوش آمدید.',
}: AudioUnlockOverlayProps) {
  const [unlocked, setUnlocked] = useState(isAudioUnlocked());

  if (unlocked) {
    return null;
  }

  const handleUnlock = () => {
    unlockAudio();
    setUnlocked(true);
    playAudio(phrase).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col items-center justify-center p-6">
      <HodaMascot className="w-40 h-40 mb-6" />
      <button
        type="button"
        onClick={handleUnlock}
        className="speaker xl"
        aria-label="شروع"
      >
        <SpeakerIcon />
      </button>
      <p className="body-lg font-bold mt-6 text-center">برای شنیدن، اینجا بزنید</p>
    </div>
  );
}
