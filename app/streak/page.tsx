'use client';

import { useEffect, useState } from 'react';
import { getProgress } from '@/lib/progress';
import { formatPersianNumber } from '@/lib/persian';
import { isActiveOnWeekday } from '@/lib/calendar';
import type { UserProgress } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import BottomNav from '@/components/ui/BottomNav';
import { FlameIcon } from '@/components/art/StatIcons';

const DAY_LETTERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export default function StreakPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    async function load() {
      setProgress(await getProgress());
    }
    load();
  }, []);

  if (!progress) {
    return null;
  }

  const iranWeekIndex = (new Date().getDay() + 1) % 7;
  const goal = progress.dailyGoal || 2;
  const done = progress.dailyLessonsCompleted;
  const remaining = Math.max(0, goal - done);
  const title = `${formatPersianNumber(progress.streak)} روز پشت سر هم!`;

  return (
    <div className="app-phone">
      <div className="content center" style={{ paddingTop: 8, gap: 14 }}>
        <div className="relative" style={{ width: 132, height: 132 }}>
          <span className="illus" style={{ width: 132, height: 132 }}>
            <FlameIcon />
          </span>
          <span
            style={{
              position: 'absolute',
              inset: '44px 0 0 0',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 48,
              color: '#fff',
              textShadow: '0 2px 0 #B85A00',
            }}
          >
            {formatPersianNumber(progress.streak)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <SpeakerButton text={title} size="sm" />
          <h1>{title}</h1>
        </div>
        <div className="row-card week-row w-full justify-between" style={{ padding: '12px 14px', gap: 0 }}>
          {DAY_LETTERS.map((letter, index) => {
            const isFilled = isActiveOnWeekday(progress, index);
            const isToday = index === iranWeekIndex;
            return (
              <div key={letter} className="flex flex-col items-center gap-0.5 font-bold">
                <span
                  className="grid place-items-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: isFilled ? '#F08A24' : 'var(--surface-2)',
                    color: '#fff',
                    border: isFilled ? undefined : '3px solid var(--line)',
                    boxShadow: isToday ? '0 0 0 4px #FFC83D' : undefined,
                  }}
                >
                  {isFilled && (
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4.5 12.5l4.8 4.8L19.5 7" />
                    </svg>
                  )}
                </span>
                <span>{letter}</span>
              </div>
            );
          })}
        </div>
        <div className="row-card w-full" style={{ textAlign: 'start' }}>
          <svg viewBox="0 0 100 100" width="96" height="96">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#E6E9E7" strokeWidth="12" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#3E9A00"
              strokeWidth="12"
              strokeDasharray={`${Math.min(1, done / goal) * 251.3} 251.3`}
              strokeLinecap="round"
              transform="rotate(-90 50 50) scale(1 -1) translate(0 -100)"
            />
            <text x="50" y="60" textAnchor="middle" style={{ font: '900 22px Vazirmatn' }} fill="#1B2A22">
              {formatPersianNumber(done)} از {formatPersianNumber(goal)}
            </text>
          </svg>
          <div style={{ flex: '1 1 8rem', minWidth: 0 }}>
            <div className="h2" style={{ fontWeight: 800 }}>
              هدف امروز: {formatPersianNumber(goal)} درس
            </div>
            <div className="muted">
              {remaining === 0 ? 'هدف امروز انجام شد!' : `${formatPersianNumber(remaining)} درس دیگر مانده.`}
            </div>
          </div>
        </div>
        <div className="row-card w-full" style={{ textAlign: 'start', background: '#EEF2FA', borderColor: '#C9D6EE' }}>
          <span style={{ width: 48, color: '#0D4F9E', display: 'grid', flex: 'none' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
              <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
            </svg>
          </span>
          <div style={{ flex: '1 1 8rem', minWidth: 0 }}>
            نگران نباشید! هر هفته ۲ روز استراحت دارید و رشته‌تان قطع نمی‌شود.
          </div>
        </div>
      </div>
      <BottomNav active="streak" />
    </div>
  );
}
