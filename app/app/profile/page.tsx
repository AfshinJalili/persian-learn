'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress, saveProgress } from '@/lib/progress';

export default function ProfilePage() {
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

  const startDate = new Date(progress.startDate);
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/home')}
            className="w-12 h-12 rounded-full bg-white border-2 border-[var(--line-strong)] flex items-center justify-center"
          >
            ←
          </button>
          <h1 className="text-3xl font-black text-[var(--ink)]">من</h1>
          <div className="w-12"></div>
        </div>

        <div className="bg-white rounded-3xl p-8 mb-6 shadow-xl text-center">
          <div className="text-9xl mb-4">{progress.avatar}</div>
          <h2 className="text-3xl font-black text-[var(--ink)] mb-2">
            {progress.name || 'سلام'}
          </h2>
          <p className="text-xl text-[var(--ink-2)]">
            از {monthNames[startDate.getMonth()]} {startDate.getFullYear().toLocaleString('fa-IR')} با ما
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-black text-[var(--saffron-400)] mb-1">
              {progress.streak.toLocaleString('fa-IR')}
            </div>
            <div className="text-sm text-[var(--ink-2)]">روز پیاپی</div>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-black text-[var(--saffron-400)] mb-1">
              {progress.xp.toLocaleString('fa-IR')}
            </div>
            <div className="text-sm text-[var(--ink-2)]">امتیاز</div>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="text-4xl mb-2">📚</div>
            <div className="text-3xl font-black text-[var(--ink)] mb-1">
              {progress.completedLessons.length.toLocaleString('fa-IR')}
            </div>
            <div className="text-sm text-[var(--ink-2)]">درس</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-black text-[var(--ink)] mb-6">
            پیشرفت شما
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🍎</div>
                  <div className="text-xl font-bold text-[var(--teal-700)]">عددها و حساب</div>
                </div>
              </div>
              <div className="h-4 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--teal-700)] transition-all duration-500"
                  style={{ width: '35%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-[var(--plum-700)]">ب</div>
                  <div className="text-xl font-bold text-[var(--plum-700)]">الفبا و خواندن</div>
                </div>
              </div>
              <div className="h-4 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--plum-700)] transition-all duration-500"
                  style={{ width: '20%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[var(--line)] flex items-center justify-around h-20 shadow-xl">
        <button
          onClick={() => router.push('/home')}
          className="flex flex-col items-center gap-1 text-[var(--ink-2)]"
        >
          <div className="text-3xl">🏠</div>
          <div className="text-sm font-bold">خانه</div>
        </button>
        <button
          onClick={() => router.push('/streak')}
          className="flex flex-col items-center gap-1 text-[var(--ink-2)]"
        >
          <div className="text-3xl">🔥</div>
          <div className="text-sm font-bold">پیشرفت</div>
        </button>
        <button className="flex flex-col items-center gap-1 text-[var(--green-700)]">
          <div className="text-3xl">{progress.avatar}</div>
          <div className="text-sm font-bold">من</div>
        </button>
      </nav>
    </div>
  );
}
