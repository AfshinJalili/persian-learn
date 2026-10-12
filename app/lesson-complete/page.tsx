'use client';

import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getProgress } from '@/lib/progress';
import { formatPersianNumber } from '@/lib/persian';
import type { UserProgress } from '@/lib/types';
import HodaMascot from '@/components/HodaMascot';
import SpeakerButton from '@/components/SpeakerButton';

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5c.6 3.2 5.8 5.6 5.8 11.2A5.8 5.8 0 0 1 12 21.5a5.8 5.8 0 0 1-5.8-5.8c0-3 1.8-4.6 2.8-6 .3 1.8 1.2 2.8 2.2 3.2C10.6 9.6 11 5.6 12 2.5z" fill="#F08A24" />
      <path d="M12 12.2c.4 1.8 3 2.8 3 5.2a3 3 0 0 1-6 0c0-1.6 1-2.6 1.6-3.4.2.9.6 1.3 1 1.5-.1-1.2 0-2.2.4-3.3z" fill="#FFC83D" />
    </svg>
  );
}

export default function LessonCompletePage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [xpEarned, setXpEarned] = useState(10);
  const [lessonTitle, setLessonTitle] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const xp = Number(params.get('xp') ?? '10');
      setXpEarned(Number.isFinite(xp) && xp > 0 ? xp : 10);
      setLessonTitle(params.get('lesson') ?? '');
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

  const title = progress.name ? `آفرین، ${progress.name}!` : 'آفرین!';
  const lessonLine = lessonTitle ? `درس «${lessonTitle}» تمام شد.` : 'درس تمام شد.';
  const spoken = progress.name
    ? `آفرین، ${progress.name}! ${lessonLine}`
    : `آفرین! ${lessonLine}`;

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
        <HodaMascot className="w-[230px] h-[230px]" pose="cheer" />
        <div className="display">{title}</div>
        <div className="flex items-center gap-3">
          <SpeakerButton text={spoken} size="sm" />
          <p className="body-lg">{lessonLine}</p>
        </div>
        <div className="flex gap-3 w-full">
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
      <div className="bottom" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
        <button type="button" onClick={() => router.push('/home')} className="btn btn-primary">
          ادامه
          <ArrowLeft strokeWidth={2.6} />
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.push('/home')}>
          همین درس را دوباره بخوانیم
        </button>
      </div>
    </div>
  );
}
