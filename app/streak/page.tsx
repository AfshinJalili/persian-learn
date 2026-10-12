'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress } from '@/lib/progress';
import { formatPersianNumber } from '@/lib/persian';
import { daysThisWeek, isActiveOnWeekday } from '@/lib/calendar';
import type { UserProgress } from '@/lib/types';

const DAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

export default function StreakPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
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

  const goalProgress = Math.min(progress.dailyLessonsCompleted / progress.dailyGoal, 1) * 100;

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
          <h1 className="text-3xl font-black text-[var(--ink)]">پیشرفت شما</h1>
          <div className="w-12"></div>
        </div>

        <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl text-center">
          <div className="text-8xl mb-4">🔥</div>
          <div className="text-6xl font-black text-[var(--ink)] mb-2">
            {formatPersianNumber(daysThisWeek(progress))}
          </div>
          <div className="text-2xl text-[var(--ink-2)] mb-6">
            روز این هفته
          </div>
          <div className="text-xl text-[var(--ink-2)]">
            بهترین رکورد: {formatPersianNumber(progress.streakBest)} روز
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl">
          <h2 className="text-2xl font-black text-[var(--ink)] mb-6 text-center">
            این هفته
          </h2>
          <div className="flex justify-between gap-2">
            {DAYS.map((day, index) => {
              const iranWeekIndex = (new Date().getDay() + 1) % 7;
              const isToday = index === iranWeekIndex;
              const wasActive = isActiveOnWeekday(progress, index);
              return (
                <div
                  key={day}
                  className={`flex flex-col items-center gap-2 ${
                    isToday ? 'scale-110' : ''
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                      isToday
                        ? 'bg-[var(--saffron-400)] text-[var(--ink)] ring-4 ring-[var(--saffron-400)]/30'
                        : wasActive
                          ? 'bg-[var(--green-600)] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--ink-2)]'
                    }`}
                  >
                    {isToday ? '☀️' : wasActive ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-black text-[var(--ink)] mb-6 text-center">
            هدف امروز
          </h2>
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="none"
                stroke="var(--surface-2)"
                strokeWidth="16"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="none"
                stroke="var(--green-600)"
                strokeWidth="16"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - goalProgress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-black text-[var(--ink)]">
                {formatPersianNumber(progress.dailyLessonsCompleted)}
              </div>
              <div className="text-xl text-[var(--ink-2)]">
                از {formatPersianNumber(progress.dailyGoal)}
              </div>
            </div>
          </div>
          <p className="text-xl text-center text-[var(--ink-2)]">
            {progress.dailyLessonsCompleted >= progress.dailyGoal
              ? 'هدف امروز انجام شد!'
              : `${progress.dailyGoal - progress.dailyLessonsCompleted} درس دیگر مانده`}
          </p>
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
        <button className="flex flex-col items-center gap-1 text-[var(--green-700)]">
          <div className="text-3xl">🔥</div>
          <div className="text-sm font-bold">پیشرفت</div>
        </button>
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center gap-1 text-[var(--ink-2)]"
        >
          <div className="text-3xl">{progress.avatar}</div>
          <div className="text-sm font-bold">من</div>
        </button>
      </nav>
    </div>
  );
}
