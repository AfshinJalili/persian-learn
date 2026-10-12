'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { getProgress, saveProgress } from '@/lib/progress';
import { loadTrack, trackCompletionPercent } from '@/lib/content';
import type { Track, UserProgress } from '@/lib/types';
import { playAudio, setAudioSpeed } from '@/lib/audio';
import { LEARNER_NAME } from '@/lib/learner';
import { formatPersianNumber } from '@/lib/persian';
import BottomNav from '@/components/ui/BottomNav';
import VoiceSpeedControl from '@/components/ui/VoiceSpeedControl';
import { FlameIcon, LetterIcon, StarIcon } from '@/components/art/StatIcons';
import { AVATARS, AvatarArt, resolveAvatarId } from '@/components/art/objects';

const LETTERS = ['آ', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ذ', 'ر'];

export default function ProfilePage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [mathTrack, setMathTrack] = useState<Track | null>(null);
  const [alphabetTrack, setAlphabetTrack] = useState<Track | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const [prog, math, alphabet] = await Promise.all([
        getProgress(),
        loadTrack('math'),
        loadTrack('alphabet'),
      ]);
      setProgress(prog);
      setMathTrack(math);
      setAlphabetTrack(alphabet);
      setAudioSpeed(prog.speechRate || 1);
    }
    load();
  }, []);

  if (!progress) {
    return null;
  }

  const joinedLabel = new Date(progress.startDate).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
  });
  const mathDone = progress.completedLessons.filter((id) => id.startsWith('m')).length;
  const alphaDone = progress.completedLessons.filter((id) => id.startsWith('a')).length;
  const mathUnits = Math.min(6, Math.max(1, Math.ceil(mathDone / 5) || 1));
  const learnedLetters = Math.min(32, alphaDone);
  const avatarId = resolveAvatarId(progress.avatar);

  const persist = async (next: UserProgress) => {
    await saveProgress(next);
    setProgress(next);
  };

  const switchTrack = async (track: 'math' | 'alphabet') => {
    const next = { ...progress, currentTrack: track };
    await persist(next);
    await playAudio(track === 'math' ? 'عددها و حساب' : 'الفبا و خواندن');
    router.push('/home');
  };

  const cycleAvatar = async () => {
    const index = AVATARS.findIndex((item) => item.id === avatarId);
    const nextAvatar = AVATARS[(index + 1) % AVATARS.length];
    if (!nextAvatar) return;
    await persist({ ...progress, avatar: nextAvatar.id });
  };

  return (
    <div className="app-phone">
      <div className="content" style={{ paddingTop: 4, gap: 10 }}>
        <div className="flex items-center gap-4">
          <span className="grid place-items-center rounded-full" style={{ width: 80, height: 80, background: '#FDE7EA' }}>
            <AvatarArt id={avatarId} size={54} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="h1">{LEARNER_NAME}</div>
            <div className="muted">از {joinedLabel} با ما</div>
          </div>
          <button type="button" className="icon-btn" aria-label="تغییر تصویر" onClick={cycleAvatar}>
            <Pencil strokeWidth={2.6} />
          </button>
        </div>
        <div className="flex gap-2.5">
          <div className="stat" style={{ borderColor: '#1F6408' }}>
            <div className="k" style={{ background: '#1F6408', color: '#fff' }}>
              <FlameIcon />
              روز پیاپی
            </div>
            <div className="v">{formatPersianNumber(progress.streak)}</div>
          </div>
          <div className="stat" style={{ borderColor: '#FFC83D' }}>
            <div className="k" style={{ background: '#FFC83D', color: '#1B2A22' }}>
              <StarIcon />
              امتیاز
            </div>
            <div className="v">{formatPersianNumber(progress.xp)}</div>
          </div>
          <div className="stat" style={{ borderColor: '#7B2A55' }}>
            <div className="k" style={{ background: '#7B2A55', color: '#fff' }}>
              <LetterIcon />
              حرف
            </div>
            <div className="v">{formatPersianNumber(learnedLetters)}</div>
          </div>
        </div>
        <div className="row-card tracks-card">
          <div className="track-block">
            <button
              type="button"
              onClick={() => switchTrack('math')}
              aria-label="مسیر عددها"
              className="flex justify-between font-extrabold w-full"
            >
              <span>عددها و حساب</span>
              <span className="muted">بخش {formatPersianNumber(mathUnits)} از ۶</span>
            </button>
            <div className="progress" style={{ flex: 'none' }}>
              <i
                style={{
                  width: `${mathTrack ? trackCompletionPercent(progress.completedLessons, mathTrack) : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="track-block">
            <button
              type="button"
              onClick={() => switchTrack('alphabet')}
              aria-label="ب الفبا"
              className="flex justify-between font-extrabold w-full"
            >
              <span>الفبا و خواندن</span>
              <span className="muted">{formatPersianNumber(learnedLetters)} حرف از ۳۲</span>
            </button>
            <div className="progress" style={{ flex: 'none' }}>
              <i style={{ width: `${Math.min(100, (learnedLetters / 32) * 100)}%` }} />
            </div>
          </div>
          <div className="letter-grid">
            {LETTERS.map((letter, index) => (
              <span
                key={letter}
                className="letter-tile"
                data-learned={index < learnedLetters ? 'true' : 'false'}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
        <VoiceSpeedControl
          value={progress.speechRate || 1}
          onChange={(rate) => {
            void persist({ ...progress, speechRate: rate });
          }}
        />
        <div className="row-card justify-between" style={{ padding: '10px 16px' }}>
          <span style={{ fontWeight: 700 }}>پخش خودکار صدا</span>
          <button
            type="button"
            className={`toggle ${progress.autoplay ? '' : 'off'}`}
            aria-pressed={progress.autoplay}
            aria-label="پخش خودکار"
            onClick={() => persist({ ...progress, autoplay: !progress.autoplay })}
          />
        </div>
      </div>
      <BottomNav active="profile" />
    </div>
  );
}
