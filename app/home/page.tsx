'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress } from '@/lib/progress';
import { loadTrack, isLessonUnlocked } from '@/lib/content';
import type { Track, Lesson, UserProgress } from '@/lib/types';
import { playAudio } from '@/lib/audio';
import { formatPersianNumber } from '@/lib/persian';
import { daysThisWeek } from '@/lib/calendar';
import AudioUnlockOverlay from '@/components/AudioUnlockOverlay';

export default function HomePage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const prog = await getProgress();
      setProgress(prog);

      const trackData = await loadTrack(prog.currentTrack);
      setTrack(trackData);
      setLoading(false);

      if (prog.name) {
        playAudio(`سلام ${prog.name}! بیایید درس امروز را شروع کنیم.`).catch(() => {});
      } else {
        playAudio('سلام! بیایید درس امروز را شروع کنیم.').catch(() => {});
      }
    }

    load();
  }, []);

  const handleLessonClick = (lesson: Lesson) => {
    if (!progress || !track) return;

    const unlocked = isLessonUnlocked(track, lesson.id, progress.completedLessons);
    
    if (!unlocked) {
      playAudio('اول درس قبلی را تمام کنیم').catch(() => {});
      return;
    }

    router.push(`/lesson/${lesson.id}`);
  };

  if (loading || !progress || !track) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-6xl animate-spin">⏳</div>
      </div>
    );
  }

  const currentUnit = track.units.find(u => 
    u.lessons.some(l => !progress.completedLessons.includes(l.id))
  ) || track.units[0];

  const currentLesson = currentUnit.lessons.find(l => 
    !progress.completedLessons.includes(l.id)
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-36">
      <AudioUnlockOverlay />
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{progress.avatar}</div>
            <div>
              <div className="text-xl font-bold">{progress.name || 'سلام'}</div>
              <div className="text-lg text-[var(--ink-2)]">
                {formatPersianNumber(daysThisWeek(progress))} روز این هفته
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--saffron-400)]">
            <span className="text-3xl">🔥</span>
            <span className="text-2xl font-black">{formatPersianNumber(progress.streak)}</span>
          </div>
        </div>

        <div className="bg-[var(--green-700)] rounded-3xl p-6 mb-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => playAudio(currentUnit.title)}
              className="w-14 h-14 rounded-full bg-[var(--blue-700)] flex items-center justify-center ring-4 ring-white"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </button>
            <div>
              <div className="text-lg opacity-90">
                بخش {formatPersianNumber(Number(currentUnit.id.replace(/\D/g, '')) || 1)}
              </div>
              <h2 className="text-2xl font-black">{currentUnit.title}</h2>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-6 py-2">
          <div className="absolute top-8 bottom-8 left-1/2 w-1 -translate-x-1/2 bg-[var(--line)] rounded-full" />

          {currentUnit.lessons.map((lesson, lessonIndex) => {
            const isCompleted = progress.completedLessons.includes(lesson.id);
            const isCurrent = lesson.id === currentLesson?.id;
            const unlocked = isLessonUnlocked(track, lesson.id, progress.completedLessons);
            const zigzag =
              lessonIndex % 3 === 0 ? 'self-center' : lessonIndex % 3 === 1 ? 'self-start' : 'self-end';

            return (
              <div key={lesson.id} className={`relative z-10 ${zigzag} flex flex-col items-center`}>
                <button
                  type="button"
                  onClick={() => handleLessonClick(lesson)}
                  disabled={!unlocked}
                  aria-label={lesson.title}
                  className={`
                    w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-black
                    shadow-lg
                    ${isCompleted ? 'bg-[var(--green-600)] text-white' : ''}
                    ${isCurrent ? 'bg-[var(--green-700)] text-white scale-110' : ''}
                    ${!unlocked && !isCompleted && !isCurrent ? 'bg-gray-300 text-gray-500' : ''}
                    ${unlocked && !isCompleted && !isCurrent ? 'bg-white border-4 border-[var(--line-strong)]' : ''}
                  `}
                >
                  {isCompleted && '✓'}
                  {isCurrent && '⭐'}
                  {!unlocked && !isCompleted && !isCurrent && '🔒'}
                  {unlocked && !isCompleted && !isCurrent && formatPersianNumber(lessonIndex + 1)}
                </button>
                {isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleLessonClick(lesson)}
                    className="mt-3 bg-[var(--green-700)] text-white px-5 py-2 rounded-full text-lg font-bold"
                  >
                    شروع
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[var(--line)] flex items-center justify-around h-20 shadow-xl">
        <button className="flex flex-col items-center gap-1 text-[var(--green-700)]">
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
