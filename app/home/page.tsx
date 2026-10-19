'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Star, Trophy } from 'lucide-react';
import { getProgress } from '@/lib/progress';
import { loadTrack, isLessonUnlocked } from '@/lib/content';
import type { Track, Lesson, UserProgress } from '@/lib/types';
import { isAudioUnlocked, playAudio } from '@/lib/audio';
import { consumeHomeGreeting, homeGreeting } from '@/lib/learner';
import { formatPersianNumber } from '@/lib/persian';
import AudioUnlockOverlay from '@/components/AudioUnlockOverlay';
import SpeakerButton from '@/components/SpeakerButton';
import BottomNav from '@/components/ui/BottomNav';
import HodaMascot from '@/components/HodaMascot';
import { FlameIcon, StarIcon } from '@/components/art/StatIcons';
import { AvatarArt, PomegranateSvg, resolveAvatarId } from '@/components/art/objects';

function nodeKind(args: {
  isCompleted: boolean;
  isCurrent: boolean;
  unlocked: boolean;
  isLast: boolean;
}): 'done' | 'current' | 'milestone' | 'locked' {
  if (args.isCompleted) return 'done';
  if (args.isCurrent) return 'current';
  if (args.isLast && args.unlocked) return 'milestone';
  return 'locked';
}

function NodeGlyph({
  kind,
  isLast,
}: {
  kind: ReturnType<typeof nodeKind>;
  isLast: boolean;
}) {
  switch (kind) {
    case 'done':
      return <Check strokeWidth={2.6} />;
    case 'current':
      return isLast ? <Trophy strokeWidth={2.2} /> : <Star fill="currentColor" stroke="none" />;
    case 'milestone':
      return <Trophy strokeWidth={2.2} />;
    case 'locked':
      return <Lock strokeWidth={2.6} />;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

// Node positions are laid out on a 342px-wide design path and scaled to the
// real width, so the path never spills sideways on narrow or zoomed screens.
const PATH_WIDTH = 342;

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
  const [focusNext, setFocusNext] = useState(false);
  const currentLessonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const prog = await getProgress();
      setProgress(prog);

      const trackData = await loadTrack(prog.currentTrack);
      setTrack(trackData);
      setFocusNext(new URLSearchParams(window.location.search).get('focus') === 'next');
      setLoading(false);

      if (isAudioUnlocked() && consumeHomeGreeting()) {
        playAudio(homeGreeting()).catch(() => {});
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const node = currentLessonRef.current;
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [loading, track, progress]);

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
  const currentIndex = currentLesson
    ? currentUnit.lessons.findIndex((lesson) => lesson.id === currentLesson.id)
    : -1;
  const currentRight =
    currentIndex >= 0 ? nodePosition(currentIndex, currentUnit.lessons.length).right : 0;
  const hideMascot = currentRight >= 220;
  const unitNumber = Number(currentUnit.id.replace(/\D/g, '')) || 1;
  const pathHeight = Math.max(420, (currentUnit.lessons.length - 1) * 88 + 120);
  const trackLabel = progress.currentTrack === 'math' ? 'حساب' : 'حرف';

  return (
    <div className="app-phone">
      <AudioUnlockOverlay phrase={homeGreeting()} sessionOnce />
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
          <span style={{ color: '#D98E04', display: 'grid', width: 32 }}>
            <StarIcon />
          </span>
          <span>{formatPersianNumber(progress.xp)}</span>
        </span>
      </div>
      <div className="content" style={{ paddingTop: 16, gap: 16 }}>
        <div className="unit">
          <SpeakerButton text={currentUnit.title} size="sm" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, opacity: 0.95 }}>
              بخش {formatPersianNumber(unitNumber)}
            </div>
            <div style={{ fontSize: '1.625rem', fontWeight: 800, lineHeight: 1.45 }}>{currentUnit.title}</div>
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1, minHeight: pathHeight }}>
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            width="342"
            height={pathHeight}
            viewBox={`0 0 342 ${pathHeight}`}
            preserveAspectRatio="none"
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
            const isLast = lessonIndex === currentUnit.lessons.length - 1;
            const kind = nodeKind({ isCompleted, isCurrent, unlocked, isLast });
            const flipTooltip = isCurrent && right >= 220;

            return (
              <button
                key={lesson.id}
                type="button"
                ref={isCurrent ? currentLessonRef : undefined}
                data-next-lesson={isCurrent ? 'true' : undefined}
                onClick={() => handleLessonClick(lesson)}
                aria-label={isCurrent ? 'شروع' : lesson.title}
                className={`path-hit${flipTooltip ? ' tooltip-flip' : ''}`}
                style={{ right: `${(right / PATH_WIDTH) * 100}%`, top }}
              >
                <span className={`node ${kind}${isCurrent && focusNext ? ' pulse' : ''}`}>
                  <NodeGlyph kind={kind} isLast={isLast} />
                </span>
                {isCurrent && <span className="tooltip">شروع</span>}
              </button>
            );
          })}
          {hideMascot ? null : (
            <span className="illus" style={{ width: 112, height: 112, position: 'absolute', right: '1%', top: 292 }}>
              <HodaMascot className="w-full h-full" />
            </span>
          )}
        </div>
      </div>
      <BottomNav active="home" />
    </div>
  );
}
