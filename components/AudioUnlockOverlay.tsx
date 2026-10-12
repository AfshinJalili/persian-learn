'use client';

import { useState } from 'react';
import { isAudioUnlocked, playAudio, unlockAudio } from '@/lib/audio';
import HodaMascot from '@/components/HodaMascot';

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

  const handleUnlock = async () => {
    unlockAudio();
    await playAudio(phrase).catch(() => {});
    setUnlocked(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col items-center justify-center p-6">
      <HodaMascot className="w-48 h-48 mb-8" />
      <button
        type="button"
        onClick={handleUnlock}
        className="w-32 h-32 rounded-full bg-[var(--blue-700)] text-white flex items-center justify-center shadow-lg"
        aria-label="شروع"
      >
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      </button>
      <p className="text-2xl font-bold text-[var(--ink)] mt-8 text-center">
        برای شنیدن، اینجا بزنید
      </p>
    </div>
  );
}
