'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Star } from 'lucide-react';
import { getProgress } from '@/lib/progress';
import { loadTrack, isLessonUnlocked } from '@/lib/content';
import type { Track, Lesson, UserProgress } from '@/lib/types';
import { playAudio } from '@/lib/audio';
import { homeGreeting } from '@/lib/learner';
import { formatPersianNumber } from '@/lib/persian';
import AudioUnlockOverlay from '@/components/AudioUnlockOverlay';
import SpeakerButton from '@/components/SpeakerButton';
import BottomNav from '@/components/ui/BottomNav';
import HodaMascot from '@/components/HodaMascot';
import { AvatarArt, PomegranateSvg, resolveAvatarId } from '@/components/art/objects';

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5c.6 3.2 5.8 5.6 5.8 11.2A5.8 5.8 0 0 1 12 21.5a5.8 5.8 0 0 1-5.8-5.8c0-3 1.8-4.6 2.8-6 .3 1.8 1.2 2.8 2.2 3.2C10.6 9.6 11 5.6 12 2.5z" fill="#F08A24" />
      <path d="M12 12.2c.4 1.8 3 2.8 3 5.2a3 3 0 0 1-6 0c0-1.6 1-2.6 1.6-3.4.2.9.6 1.3 1 1.5-.1-1.2 0-2.2.4-3.3z" fill="#FFC83D" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M12 2.8l2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3L2.9 9.4l6.3-.8z" />
    </svg>
  );
}

function nodePosition(index: number, total: number) {
  const pattern = [171, 96, 171, 246, 171];
  const right = pattern[index % pattern.length] ?? 171;
  const top = index * 88;
  const height = Math.max(420, (total - 1) * 88 + 120);
  return { right, top, height };
}

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

      playAudio(homeGreeting()).catch(() => {});
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
      <div className="app-phone center" style={{ justifyContent: 'center' }}>
        <HodaMascot className="w-32 h-32" />
      </div>
    );
  }

  const currentUnit =
    track.units.find((unit) => unit.lessons.some((lesson) => !progress.completedLessons.includes(lesson.id))) ||
    track.units[0];

  const currentLesson = currentUnit.lessons.find((lesson) => !progress.completedLessons.includes(lesson.id));
  const unitNumber = Number(currentUnit.id.replace(/\D/g, '')) || 1;
  const pathHeight = Math.max(420, (currentUnit.lessons.length - 1) * 88 + 120);
  const trackLabel = progress.currentTrack === 'math' ? 'حساب' : 'حرف';

  return (
    <div className="app-phone">
      <AudioUnlockOverlay />
      <div className="home-top">
        <span className="chip" aria-label={`مسیر: ${trackLabel}`}>
          {progress.currentTrack === 'math' ? (
            <span className="illus" style={{ width: 32, height: 32 }}>
              <PomegranateSvg />
            </span>
          ) : (
            <AvatarArt id={resolveAvatarId(progress.avatar)} size={32} />
          )}
          <span style={{ color: progress.currentTrack === 'math' ? 'var(--teal-700)' : 'var(--plum-700)' }}>
            {trackLabel}
          </span>
        </span>
        <span className="chip" aria-label={`${formatPersianNumber(progress.streak)} روز پشت سر هم`}>
          <FlameIcon />
          <span>{formatPersianNumber(progress.streak)}</span>
        </span>
        <span className="chip" aria-label="امتیاز">
          <span style={{ color: '#D98E04', display: 'grid', width: 28 }}>
            <StarIcon />
          </span>
          <span>{formatPersianNumber(progress.xp)}</span>
        </span>
      </div>
      <div className="content" style={{ paddingTop: 16, gap: 16 }}>
        <div className="unit">
          <SpeakerButton text={currentUnit.title} size="sm" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, opacity: 0.95 }}>
              بخش {formatPersianNumber(unitNumber)}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: '38px' }}>{currentUnit.title}</div>
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1, minHeight: pathHeight }}>
          <svg
            style={{ position: 'absolute', inset: 0 }}
            width="342"
            height={pathHeight}
            viewBox={`0 0 342 ${pathHeight}`}
          >
            <path
              d="M171 42 Q248.5 86 246 130 Q168.5 178 171 226 Q173.5 280 96 334 Q93.5 377 171 420"
              fill="none"
              stroke="#D5DCD7"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="2 22"
            />
          </svg>
          {currentUnit.lessons.map((lesson, lessonIndex) => {
            const isCompleted = progress.completedLessons.includes(lesson.id);
            const isCurrent = lesson.id === currentLesson?.id;
            const unlocked = isLessonUnlocked(track, lesson.id, progress.completedLessons);
            const { right, top } = nodePosition(lessonIndex, currentUnit.lessons.length);
            const isReview = !unlocked && lessonIndex === currentUnit.lessons.length - 1;

            let kind = 'locked';
            if (isCompleted) kind = 'done';
            else if (isCurrent) kind = 'current';
            else if (isReview) kind = 'review locked';

            return (
              <div key={lesson.id}>
                <button
                  type="button"
                  onClick={() => handleLessonClick(lesson)}
                  aria-label={isCurrent ? 'شروع' : lesson.title}
                  className={`node ${kind}`}
                  style={{ right, top }}
                >
                  {isCompleted && <Check strokeWidth={2.6} />}
                  {isCurrent && <Star fill="currentColor" stroke="none" />}
                  {!unlocked && !isCompleted && !isCurrent && <Lock strokeWidth={2.6} />}
                </button>
                {isCurrent && (
                  <div className="tooltip" style={{ right: right + 65, top: top + 26 }}>
                    شروع
                  </div>
                )}
              </div>
            );
          })}
          <span className="illus" style={{ width: 112, height: 112, position: 'absolute', right: 4, top: 268 }}>
            <HodaMascot className="w-full h-full" />
          </span>
        </div>
      </div>
      <BottomNav active="home" />
    </div>
  );
}
