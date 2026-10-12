'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { unlockAudio, playAudio, stopAudio } from '@/lib/audio';
import { OnboardingGate } from '@/lib/onboarding-gate';
import { getProgress, saveProgress } from '@/lib/progress';
import BackChevron from '@/components/BackChevron';
import HodaMascot from '@/components/HodaMascot';

const AVATARS = ['🌷', '☕', '🌲', '🍇', '☀️', '🌙'];
const NAMES = ['مادر جان', 'خانم جان', 'مامان', 'بانو'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const gateRef = useRef(new OnboardingGate());
  const router = useRouter();

  useEffect(() => {
    if (step === 1 && audioEnabled) {
      playAudio('سلام! من هُدی هستم. خوش آمدید.').catch(() => {});
    }
  }, [step, audioEnabled]);

  const handleAudioUnlock = () => {
    gateRef.current.begin();
    unlockAudio();
    setAudioEnabled(true);
    setStep(1);
    void playAudio('سلام! من هُدی هستم. خوش آمدید.').catch(() => {});
  };

  const handleSoundCheck = async (canHear: boolean) => {
    const token = gateRef.current.begin();
    if (canHear) {
      await playAudio('عالی! حالا بیایید شروع کنیم.');
      if (!gateRef.current.isCurrent(token)) return;
      setStep(2);
    } else {
      await playAudio('لطفاً صدای گوشی خود را بلند کنید.');
    }
  };

  const handleAvatarSelect = async (avatar: string) => {
    const token = gateRef.current.begin();
    setSelectedAvatar(avatar);
    await playAudio('خوب انتخاب کردید!');
    if (!gateRef.current.isCurrent(token)) return;
    setStep(3);
  };

  const handleNameSelect = async (name: string) => {
    const token = gateRef.current.begin();
    setSelectedName(name);
    await playAudio(`خوشحالم که شما را می‌شناسم، ${name}!`);
    if (!gateRef.current.isCurrent(token)) return;
    setStep(4);
  };

  const handleSkipName = () => {
    gateRef.current.begin();
    setStep(4);
  };

  const handleBack = () => {
    gateRef.current.cancel();
    stopAudio();
    setStep((currentStep) => Math.max(currentStep - 1, 0));
  };

  const handleTrackSelect = async (track: 'math' | 'alphabet') => {
    const token = gateRef.current.begin();

    if (track === 'math') {
      await playAudio('عددها را شروع می‌کنیم!');
    } else {
      await playAudio('حروف الفبا را شروع می‌کنیم!');
    }

    if (!gateRef.current.isCurrent(token)) return;

    const progress = await getProgress();
    if (!gateRef.current.isCurrent(token)) return;
    progress.currentTrack = track;
    progress.avatar = selectedAvatar || '🌷';
    progress.name = selectedName;
    progress.onboarded = true;
    await saveProgress(progress);
    if (!gateRef.current.isCurrent(token)) return;

    router.push('/home');
  };

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6">
        <HodaMascot className="w-56 h-56 mb-8" />
        <button
          type="button"
          onClick={handleAudioUnlock}
          className="w-32 h-32 rounded-full bg-[var(--blue-700)] text-white flex items-center justify-center shadow-lg"
          aria-label="شروع"
        >
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </button>
        <p className="text-2xl font-bold text-[var(--ink)] mt-8 text-center">
          برای شنیدن، اینجا بزنید
        </p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 relative">
        <button type="button" onClick={handleBack} aria-label="بازگشت" className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white border-2 border-[var(--line-strong)] text-[var(--ink)] flex items-center justify-center">
          <BackChevron />
        </button>
        <HodaMascot className="w-40 h-40 mb-8" />
        <h1 className="text-4xl font-black text-[var(--ink)] mb-12 text-center">
          صدا را می‌شنوید؟
        </h1>
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => handleSoundCheck(true)}
            className="w-32 h-32 rounded-3xl bg-[var(--green-700)] text-white flex flex-col items-center justify-center shadow-lg"
            aria-label="بله، می‌شنوم"
          >
            <div className="text-5xl mb-2">👂</div>
            <div className="text-xl font-bold">✓</div>
          </button>
          <button
            type="button"
            onClick={() => handleSoundCheck(false)}
            className="w-32 h-32 rounded-3xl bg-[var(--clay-100)] border-4 border-[var(--clay-400)] text-[var(--clay-800)] flex flex-col items-center justify-center shadow-lg"
            aria-label="نه، نمی‌شنوم"
          >
            <div className="text-5xl mb-2">👂</div>
            <div className="text-xl font-bold">✗</div>
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 relative">
        <button type="button" onClick={handleBack} aria-label="بازگشت" className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white border-2 border-[var(--line-strong)] text-[var(--ink)] flex items-center justify-center">
          <BackChevron />
        </button>
        <h1 className="text-3xl font-black text-[var(--ink)] mb-8 text-center">
          یک تصویر برای خودتان انتخاب کنید
        </h1>
        <div className="grid grid-cols-3 gap-6 max-w-md">
          {AVATARS.map((avatar) => (
            <button
              type="button"
              key={avatar}
              onClick={() => handleAvatarSelect(avatar)}
              className="w-24 h-24 rounded-3xl bg-white border-4 border-[var(--line-strong)] text-6xl flex items-center justify-center shadow-lg"
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 relative">
        <button type="button" onClick={handleBack} aria-label="بازگشت" className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white border-2 border-[var(--line-strong)] text-[var(--ink)] flex items-center justify-center">
          <BackChevron />
        </button>
        <div className="text-8xl mb-8">{selectedAvatar}</div>
        <h1 className="text-3xl font-black text-[var(--ink)] mb-8 text-center">
          چه صدایتان کنیم؟
        </h1>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {NAMES.map((name) => (
            <button
              type="button"
              key={name}
              onClick={() => handleNameSelect(name)}
              className="h-16 rounded-2xl bg-white border-4 border-[var(--line-strong)] text-2xl font-bold text-[var(--ink)] shadow"
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            onClick={handleSkipName}
            className="h-16 rounded-2xl text-2xl font-bold text-[var(--ink-2)] underline"
          >
            بعداً
          </button>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 relative">
        <button type="button" onClick={handleBack} aria-label="بازگشت" className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white border-2 border-[var(--line-strong)] text-[var(--ink)] flex items-center justify-center">
          <BackChevron />
        </button>
        <h1 className="text-3xl font-black text-[var(--ink)] mb-12 text-center">
          امروز چه یاد بگیریم؟
        </h1>
        <div className="flex flex-col gap-6 w-full max-w-md">
          <button
            type="button"
            onClick={() => handleTrackSelect('math')}
            className="relative bg-[var(--teal-tint)] rounded-3xl p-8 border-4 border-[var(--teal-700)] shadow-xl text-right"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">🍎</div>
              <h2 className="text-3xl font-black text-[var(--teal-700)]">عددها و حساب</h2>
            </div>
            <p className="text-xl text-[var(--ink-2)]">
              شمردن، اعداد ۰ تا ۱۰، جمع و تفریق ساده
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleTrackSelect('alphabet')}
            className="relative bg-[var(--plum-tint)] rounded-3xl p-8 border-4 border-[var(--plum-700)] shadow-xl text-right"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl font-black text-[var(--plum-700)]">ب</div>
              <h2 className="text-3xl font-black text-[var(--plum-700)]">الفبا و خواندن</h2>
            </div>
            <p className="text-xl text-[var(--ink-2)]">
              حروف فارسی، آواها، و خواندن کلمات ساده
            </p>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
