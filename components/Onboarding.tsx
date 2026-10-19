'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { unlockAudio, playAudio, stopAudio } from '@/lib/audio';
import { LEARNER_NAME, onboardingSpokenWelcome, welcomeBubble } from '@/lib/learner';
import { OnboardingGate } from '@/lib/onboarding-gate';
import { getProgress, saveProgress } from '@/lib/progress';
import BackChevron from '@/components/BackChevron';
import HodaMascot from '@/components/HodaMascot';
import SpeakerButton from '@/components/SpeakerButton';
import { AVATARS, AvatarArt, PomegranateSvg } from '@/components/art/objects';

const WELCOME = onboardingSpokenWelcome();
const AVATAR_PROMPT = 'یک تصویر برای خودتان انتخاب کنید';
const TRACK_PROMPT = 'امروز چه یاد بگیریم؟';

function Dots({ step }: { step: number }) {
  return (
    <div className="dots" dir="rtl">
      <i className={step === 0 ? 'on' : ''} />
      <i className={step === 1 ? 'on' : ''} />
      <i className={step === 2 ? 'on' : ''} />
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState('tulip');
  const [heardWelcome, setHeardWelcome] = useState(false);
  const gateRef = useRef(new OnboardingGate());
  const router = useRouter();

  useEffect(() => {
    if (step === 1) {
      playAudio(AVATAR_PROMPT).catch(() => {});
    }
    if (step === 2) {
      playAudio(TRACK_PROMPT).catch(() => {});
    }
  }, [step]);

  const handleStart = () => {
    gateRef.current.begin();
    unlockAudio();
    stopAudio();
    setStep(1);
  };

  const handleContinueFromAvatar = () => {
    gateRef.current.begin();
    setStep(2);
  };

  const handleBack = () => {
    gateRef.current.cancel();
    stopAudio();
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleTrackSelect = async (track: 'math' | 'alphabet') => {
    const token = gateRef.current.begin();
    stopAudio();
    playAudio(track === 'math' ? 'عددها را شروع می‌کنیم!' : 'حروف الفبا را شروع می‌کنیم!').catch(
      () => {}
    );

    const stored = await getProgress();
    if (!gateRef.current.isCurrent(token)) return;
    stored.currentTrack = track;
    stored.avatar = selectedAvatar || 'tulip';
    stored.name = LEARNER_NAME;
    stored.onboarded = true;
    await saveProgress(stored);
    if (!gateRef.current.isCurrent(token)) return;

    router.push('/home');
  };

  if (step === 0) {
    return (
      <div className="app-phone">
        <div className="content center" style={{ paddingTop: 8 }}>
          <Dots step={0} />
          <div className="mascot-speech">
            <p className="speech-bubble">{welcomeBubble()}</p>
            <HodaMascot className="w-[230px] h-[230px] max-w-full" />
          </div>
          <h1>خوش آمدید</h1>
          <p className="body-lg">با هم، آرام‌آرام عدد و خواندن یاد می‌گیریم.</p>
          <div className="flex items-center gap-4">
            <SpeakerButton text={WELCOME} onPlay={() => setHeardWelcome(true)} />
            <span className="muted" style={{ fontWeight: 700 }}>
              {heardWelcome ? 'دوباره گوش کنید' : 'گوش کنید'}
            </span>
          </div>
        </div>
        <div className="bottom">
          <button type="button" className="btn btn-primary" onClick={handleStart} aria-label="شروع کنیم">
            شروع کنیم
            <ArrowLeft strokeWidth={2.6} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="app-phone">
        <div className="content" style={{ paddingTop: 8, gap: 18 }}>
          <div className="flex items-center justify-between">
            <Dots step={1} />
            <button type="button" className="icon-btn" onClick={handleBack} aria-label="بازگشت">
              <BackChevron />
            </button>
          </div>
          <div className="prompt">
            <SpeakerButton text={AVATAR_PROMPT} />
            <h2>{AVATAR_PROMPT}</h2>
          </div>
          <div className="grid3">
            {AVATARS.map((avatar) => (
              <button
                type="button"
                key={avatar.id}
                aria-label={avatar.emoji}
                onClick={() => {
                  setSelectedAvatar(avatar.id);
                  playAudio(avatar.label).catch(() => {});
                }}
                className={`card ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                style={{ height: 116 }}
              >
                <span
                  className="grid place-items-center rounded-full"
                  style={{ width: 84, height: 84, background: avatar.bg }}
                >
                  <AvatarArt id={avatar.id} size={57} />
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="bottom">
          <button type="button" className="btn btn-primary" onClick={handleContinueFromAvatar}>
            ادامه
            <ArrowLeft strokeWidth={2.6} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-phone">
      <div className="content" style={{ paddingTop: 8 }}>
        <div className="flex items-center justify-between">
          <Dots step={2} />
          <button type="button" className="icon-btn" onClick={handleBack} aria-label="بازگشت">
            <BackChevron />
          </button>
        </div>
        <div className="prompt">
          <SpeakerButton text={TRACK_PROMPT} />
          <h2>{TRACK_PROMPT}</h2>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="row-card"
          style={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 12,
            borderColor: 'var(--teal-700)',
            borderWidth: 3,
            boxShadow: '0 6px 0 var(--teal-700)',
          }}
          onClick={() => handleTrackSelect('math')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') handleTrackSelect('math');
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="grid place-items-center"
              style={{ width: 120, height: 110, borderRadius: 20, background: '#E1F2F3' }}
            >
              <div className="flex">
                <span className="illus" style={{ width: 44, height: 44 }}>
                  <PomegranateSvg />
                </span>
                <span className="illus" style={{ width: 44, height: 44 }}>
                  <PomegranateSvg />
                </span>
                <span className="illus" style={{ width: 44, height: 44 }}>
                  <PomegranateSvg />
                </span>
              </div>
              <div className="glyph" style={{ fontSize: 40, whiteSpace: 'nowrap', color: 'var(--teal-700)' }}>
                ۱ ۲ ۳
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'start' }}>
              <div className="h2" style={{ fontWeight: 800 }}>
                عددها و حساب
              </div>
              <div className="muted">شمردن، پول، ساعت</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SpeakerButton text="عددها و حساب. شمردن، پول، ساعت" size="sm" />
            <span className="btn btn-primary" style={{ flex: 1, background: 'var(--teal-700)', boxShadow: '0 5px 0 #08474D' }}>
              این را می‌خواهم
            </span>
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          className="row-card"
          style={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 12,
            borderColor: 'var(--plum-700)',
            borderWidth: 3,
            boxShadow: '0 6px 0 var(--plum-700)',
          }}
          onClick={() => handleTrackSelect('alphabet')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') handleTrackSelect('alphabet');
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="grid place-items-center"
              style={{ width: 120, height: 110, borderRadius: 20, background: '#F6E6EF' }}
            >
              <div className="glyph" style={{ fontSize: 48, whiteSpace: 'nowrap', color: 'var(--plum-700)' }}>
                ا ب پ
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'start' }}>
              <div className="h2" style={{ fontWeight: 800 }}>
                الفبا و خواندن
              </div>
              <div className="muted">حرف‌ها و کلمه‌های ساده</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SpeakerButton text="الفبا و خواندن. حرف‌ها و کلمه‌های ساده" size="sm" />
            <span className="btn btn-primary" style={{ flex: 1, background: 'var(--plum-700)', boxShadow: '0 5px 0 #4E1A36' }}>
              این را می‌خواهم
            </span>
          </div>
        </div>
        <p className="muted" style={{ textAlign: 'center' }}>
          هر وقت خواستید، می‌توانید عوض کنید.
        </p>
      </div>
    </div>
  );
}
