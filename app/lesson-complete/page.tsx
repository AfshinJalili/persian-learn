'use client';

import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress } from '@/lib/progress';
import { formatPersianNumber } from '@/lib/persian';
import type { UserProgress } from '@/lib/types';
import HodaMascot from '@/components/HodaMascot';

export default function LessonCompletePage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const prog = await getProgress();
      setProgress(prog);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.35 },
        });
      } catch {
        /* decorative */
      }
    }

    load();
    return () => {
      confetti.reset();
    };
  }, []);

  if (!progress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6">
      <HodaMascot className="w-40 h-40 mb-6" />
      <h1 className="text-4xl font-black text-[var(--ink)] mb-4 text-center">
        آفرین{progress.name ? `، ${progress.name}` : ''}!
      </h1>
      <p className="text-2xl text-[var(--ink-2)] mb-10 text-center">درس تمام شد</p>

      <div className="grid grid-cols-3 gap-3 mb-10 w-full max-w-md">
        <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-3xl font-black text-[var(--saffron-400)] mb-1">
            +{formatPersianNumber(10)}
          </div>
          <div className="text-sm text-[var(--ink-2)]">امتیاز</div>
        </div>

        <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
          <div className="text-4xl mb-2">⏱️</div>
          <div className="text-3xl font-black text-[var(--ink)] mb-1">
            {formatPersianNumber(3)}
          </div>
          <div className="text-sm text-[var(--ink-2)]">دقیقه</div>
        </div>

        <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-3xl font-black text-[var(--saffron-400)] mb-1">
            {formatPersianNumber(progress.streak)}
          </div>
          <div className="text-sm text-[var(--ink-2)]">روز پیاپی</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push('/home')}
        className="w-full max-w-md h-16 rounded-2xl bg-[var(--green-700)] text-white text-2xl font-bold shadow-xl flex items-center justify-center gap-2"
      >
        <span>ادامه</span>
        <span>←</span>
      </button>
    </div>
  );
}
