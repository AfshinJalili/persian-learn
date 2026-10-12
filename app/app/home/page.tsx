'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress } from '@/lib/progress';
import { loadTrack, isLessonUnlocked } from '@/lib/content';
import type { Track, Unit, Lesson } from '@/lib/types';
import { playAudio } from '@/lib/audio';
import { formatPersianNumber } from '@/lib/persian';

export default function HomePage() {
  const [progress, setProgress] = useState<any>(null);
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

  const handleLessonClick = (lesson: Lesson, unit: Unit) => {
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
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{progress.avatar}</div>
            <div>
              <div className="text-xl font-bold">{progress.name || 'سلام'}</div>
              <div className="text-lg text-[var(--ink-2)]">
                {formatPersianNumber(progress.streak)} روز این هفته
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
              <div className="text-lg opacity-90">بخش {currentUnit.id.replace(/\D/g, '')}</div>
              <h2 className="text-2xl font-black">{currentUnit.title}</h2>
            </div>
          </div>
        </div>

        <div className="space-y-12 relative">
          <svg className="absolute top-0 right-1/2 h-full w-2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 0 }}>
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="var(--line)" strokeWidth="4" strokeDasharray="8,4" />
          </svg>

          {track.units.map((unit, unitIndex) => (
            <div key={unit.id} className="relative">
              {unit.lessons.map((lesson, lessonIndex) => {
                const isCompleted = progress.completedLessons.includes(lesson.id);
                const isCurrent = lesson.id === currentLesson?.id;
                const unlocked = isLessonUnlocked(track, lesson.id, progress.completedLessons);
                const position = lessonIndex % 3 === 0 ? 'center' : lessonIndex % 3 === 1 ? 'right' : 'left';

                let nodeClass = 'mx-auto';
                if (position === 'right') {
                  nodeClass = 'mr-auto ml-0';
                } else if (position === 'left') {
                  nodeClass = 'ml-auto mr-0';
                }

                return (
                  <div key={lesson.id} className={`relative ${nodeClass}`} style={{ maxWidth: '120px', zIndex: 1 }}>
                    <button
                      onClick={() => handleLessonClick(lesson, unit)}
                      disabled={!unlocked}
                      className={`
                        w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black
                        transition-all duration-300 shadow-lg
                        ${isCompleted ? 'bg-[var(--green-600)] text-white' : ''}
                        ${isCurrent ? 'bg-[var(--green-700)] text-white scale-110 animate-pulse' : ''}
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
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--green-700)] text-white px-4 py-2 rounded-full text-lg font-bold">
                        شروع
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
