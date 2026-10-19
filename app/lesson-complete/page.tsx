'use client';

import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getProgress } from '@/lib/progress';
import { formatPersianNumber } from '@/lib/persian';
import { lessonCompleteSpoken, lessonCompleteTitle } from '@/lib/learner';
import type { UserProgress } from '@/lib/types';
import HodaMascot from '@/components/HodaMascot';
import SpeakerButton from '@/components/SpeakerButton';
import { FlameIcon } from '@/components/art/StatIcons';

export default function LessonCompletePage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [xpEarned, setXpEarned] = useState(10);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonId, setLessonId] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const xp = Number(params.get('xp') ?? '10');
      setXpEarned(Number.isFinite(xp) && xp > 0 ? xp : 10);
      setLessonTitle(params.get('lesson') ?? '');
      setLessonId(params.get('id') ?? '');
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

  const title = lessonCompleteTitle();
  const lessonLine = lessonTitle ? `درس «${lessonTitle}» تمام شد.` : 'درس تمام شد.';
  const spoken = lessonCompleteSpoken('درس تمام شد.');

  return (
    <div className="app-phone">
      <svg viewBox="0 0 390 300" className="absolute top-0 left-0 w-full h-[300px] pointer-events-none" aria-hidden="true">
        <g opacity=".95">
          <rect x="30" y="40" width="14" height="22" rx="3" fill="#58CC02" transform="rotate(-20 37 51)" />
          <rect x="330" y="60" width="14" height="22" rx="3" fill="#FFC83D" transform="rotate(25 337 71)" />
          <circle cx="80" cy="120" r="8" fill="#0D4F9E" />
          <circle cx="310" cy="150" r="9" fill="#B3243A" />
          <rect x="250" y="24" width="12" height="20" rx="3" fill="#0E6E78" transform="rotate(40 256 34)" />
          <rect x="120" y="20" width="12" height="20" rx="3" fill="#B3243A" transform="rotate(-35 126 30)" />
          <circle cx="200" cy="18" r="6" fill="#58CC02" />
        </g>
      </svg>
      <div className="content center" style={{ paddingTop: 12, gap: 16, position: 'relative' }}>
        <HodaMascot className="w-[230px] h-[230px] max-w-full" pose="cheer" />
        <div className="display">{title}</div>
        <div className="flex flex-wrap justify-center items-center gap-3">
          <SpeakerButton text={spoken} size="sm" />
          <p className="body-lg">{lessonLine}</p>
        </div>
        <div className="stat-row w-full">
          <div className="stat" style={{ borderColor: '#FFC83D' }}>
            <div className="k" style={{ background: '#FFC83D', color: '#1B2A22' }}>امتیاز</div>
            <div className="v">
              <span style={{ color: '#D98E04', display: 'grid' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                  <path d="M12 2.8l2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3L2.9 9.4l6.3-.8z" />
                </svg>
              </span>
              {formatPersianNumber(xpEarned)}+
            </div>
          </div>
          <div className="stat" style={{ borderColor: '#0D4F9E' }}>
            <div className="k" style={{ background: '#0D4F9E', color: '#fff' }}>زمان</div>
            <div className="v">۳ دقیقه</div>
          </div>
          <div className="stat" style={{ borderColor: '#1F6408' }}>
            <div className="k" style={{ background: '#1F6408', color: '#fff' }}>روز پیاپی</div>
            <div className="v">
              <FlameIcon />
              {formatPersianNumber(progress.streak)}
            </div>
          </div>
        </div>
      </div>
      <div className="bottom">
        <button type="button" onClick={() => router.push('/home?focus=next')} className="btn btn-primary">
          ادامه
          <ArrowLeft strokeWidth={2.6} />
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push(lessonId ? `/lesson/${lessonId}` : '/home')}
        >
          همین درس را دوباره بخوانیم
        </button>
      </div>
    </div>
  );
}
