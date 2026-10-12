'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress } from '@/lib/progress';

export default function LessonCompletePage() {
  const [progress, setProgress] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const prog = await getProgress();
      setProgress(prog);
    }

    load();
  }, []);

  if (!progress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6">
      <div className="text-9xl mb-8">🦩</div>
      <h1 className="text-5xl font-black text-[var(--ink)] mb-4 text-center">
        آفرین{progress.name && `, ${progress.name}`}!
      </h1>
      <p className="text-2xl text-[var(--ink-2)] mb-12 text-center">
        درس تمام شد
      </p>

      <div className="grid grid-cols-3 gap-4 mb-12 w-full max-w-md">
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-3xl font-black text-[var(--saffron-400)] mb-1">
            +۱۰
          </div>
          <div className="text-sm text-[var(--ink-2)]">امتیاز</div>
        </div>

        <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
          <div className="text-4xl mb-2">⏱️</div>
          <div className="text-3xl font-black text-[var(--ink)] mb-1">
            ۳ دقیقه
          </div>
          <div className="text-sm text-[var(--ink-2)]">زمان</div>
        </div>

        <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-3xl font-black text-[var(--saffron-400)] mb-1">
            {progress.streak.toLocaleString('fa-IR')}
          </div>
          <div className="text-sm text-[var(--ink-2)]">روز پیاپی</div>
        </div>
      </div>

      <button
        onClick={() => router.push('/home')}
        className="w-full max-w-md h-16 rounded-2xl bg-[var(--green-700)] text-white text-2xl font-bold shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
      >
        <span>ادامه</span>
        <span>←</span>
      </button>
    </div>
  );
}
