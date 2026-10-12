'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react';
import { getProgress, completeLesson } from '@/lib/progress';
import { loadTrack, resolveLessonAccess } from '@/lib/content';
import { playAudio, stopAudio, vibrate } from '@/lib/audio';
import { answersEqual } from '@/lib/answers';
import { feedbackKind } from '@/lib/lesson-feedback';
import type { Lesson as LessonType } from '@/lib/types';
import AudioUnlockOverlay from '@/components/AudioUnlockOverlay';
import ExerciseRenderer from '@/components/exercises/ExerciseRenderer';
import SpeakerButton from '@/components/SpeakerButton';
import HodaMascot from '@/components/HodaMascot';
import { formatPersianNumber } from '@/lib/persian';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const startIndex =
    typeof window === 'undefined'
      ? 0
      : Number(new URLSearchParams(window.location.search).get('ex') || '0') || 0;

  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [weakItems, setWeakItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const progress = await getProgress();
      if (!progress.onboarded) {
        router.replace('/');
        return;
      }
      const track = await loadTrack(progress.currentTrack);
      const lessonData = resolveLessonAccess(track, lessonId, progress.completedLessons);

      if (!lessonData) {
        router.push('/home');
        return;
      }

      setLesson(lessonData);
      setCurrentIndex(Math.min(startIndex, lessonData.exercises.length - 1));
      setLoading(false);

      const first = lessonData.exercises[Math.min(startIndex, lessonData.exercises.length - 1)];
      if (first && progress.autoplay !== false) {
        setTimeout(() => {
          playAudio(first.audio_script).catch(() => {});
        }, 400);
      }
    }

    load();

    return () => stopAudio();
  }, [lessonId, router, startIndex]);

  const currentExercise = lesson?.exercises[currentIndex];
  const progressPct = useMemo(() => {
    if (!lesson) return 0;
    return ((currentIndex + 1) / lesson.exercises.length) * 100;
  }, [currentIndex, lesson]);

  const handleCheck = async () => {
    if (!currentExercise) return;
    if (!userAnswer) {
      await playAudio('اول یک جواب انتخاب کنید');
      return;
    }

    const correct = answersEqual(currentExercise.type, currentExercise.answer, userAnswer);
    const kind = feedbackKind(correct, attempts);
    setIsCorrect(correct);
    setAttempts(attempts + 1);
    setShowFeedback(true);

    if (kind === 'correct') {
      setXpEarned(xpEarned + 10);
      vibrate([50, 50]);
      await playAudio(currentExercise.feedback_correct);
      return;
    }

    vibrate([100]);
    if (kind === 'hint') {
      await playAudio(currentExercise.feedback_wrong || 'نزدیک بود! دوباره امتحان کنید.');
      return;
    }

    setWeakItems([...weakItems, currentExercise.id]);
    await playAudio(`این ${currentExercise.answer} است. بعداً دوباره می‌بینیم.`);
  };

  const handleContinue = async () => {
    if (!lesson || !currentExercise) return;

    const kind =
      currentExercise.type === 'intro'
        ? 'correct'
        : feedbackKind(isCorrect, Math.max(0, attempts - 1));

    if (kind === 'hint') {
      setShowFeedback(false);
      setUserAnswer('');
      return;
    }

    setShowFeedback(false);
    setUserAnswer('');
    setAttempts(0);

    const exercises =
      kind === 'reveal' ? [...lesson.exercises, currentExercise] : lesson.exercises;
    if (kind === 'reveal') {
      setLesson({ ...lesson, exercises });
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < exercises.length) {
      setCurrentIndex(nextIndex);
      const nextExercise = exercises[nextIndex];
      if (nextExercise) {
        setTimeout(() => {
          playAudio(nextExercise.audio_script).catch(() => {});
        }, 300);
      }
      return;
    }

    await completeLesson(lessonId, xpEarned, weakItems);
    await playAudio('آفرین! درس تمام شد.');
    router.push(
      `/lesson-complete?xp=${xpEarned}&lesson=${encodeURIComponent(lesson.title)}&id=${encodeURIComponent(lessonId)}`
    );
  };

  const handleTraced = (answer: string) => {
    setUserAnswer(answer);
  };

  if (loading || !lesson || !currentExercise) {
    return (
      <div className="app-phone center" style={{ justifyContent: 'center' }}>
        <div className="body-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  const kind = showFeedback ? feedbackKind(isCorrect, attempts - 1) : null;
  const hideCheck =
    currentExercise.type === 'intro' || showFeedback;

  return (
    <div className="app-phone">
      <AudioUnlockOverlay phrase={currentExercise.audio_script} />
      <div className="lesson-top">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="icon-btn"
          aria-label="بستن درس"
        >
          <X strokeWidth={2.6} />
        </button>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progressPct)}>
          <i className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="content" style={{ paddingTop: 20, overflowY: 'auto' }}>
        <ExerciseRenderer
          exercise={currentExercise}
          userAnswer={userAnswer}
          onAnswerChange={setUserAnswer}
          onContinue={handleContinue}
          onTraced={handleTraced}
          disabled={showFeedback}
          answerState={showFeedback ? (isCorrect ? 'correct' : 'wrong') : 'idle'}
        />
      </div>

      {showFeedback && (
        <>
          <div className="scrim" />
          <div className={`sheet ${isCorrect ? 'correct' : 'retry'}`}>
            <div className="sheet-head">
              <span className="sheet-icon" style={isCorrect ? { color: 'var(--green-700)' } : undefined}>
                {isCorrect ? (
                  <Check strokeWidth={2.6} />
                ) : (
                  <HodaMascot className="w-[60px] h-[60px]" />
                )}
              </span>
              <div style={{ flex: 1 }}>
                <div className="h1">
                  {kind === 'correct'
                    ? 'آفرین!'
                    : kind === 'reveal'
                      ? 'بعداً دوباره می‌بینیم'
                      : 'نزدیک بود!'}
                </div>
                <div className="body-lg">
                  {kind === 'correct'
                    ? currentExercise.feedback_correct
                    : kind === 'reveal'
                      ? `این ${currentExercise.answer} است.`
                      : currentExercise.feedback_wrong || 'با هم دوباره بشماریم.'}
                </div>
              </div>
              <SpeakerButton
                size="sm"
                text={
                  kind === 'correct'
                    ? currentExercise.feedback_correct
                    : currentExercise.feedback_wrong || 'نزدیک بود! دوباره امتحان کنید.'
                }
              />
            </div>
            {kind === 'correct' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 24 }}>
                <span style={{ color: '#D98E04', display: 'grid', width: 30 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                    <path d="M12 2.8l2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3L2.9 9.4l6.3-.8z" />
                  </svg>
                </span>
                {formatPersianNumber(10)}+ امتیاز
              </div>
            )}
            {kind === 'hint' && (
              <div className="hint">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.8a6.6 6.6 0 0 0-3.9 11.9c.8.6 1.2 1.4 1.2 2.3V18h5.4v-1c0-.9.4-1.7 1.2-2.3A6.6 6.6 0 0 0 12 2.8z" fill="#FFC83D" stroke="#7A3410" strokeWidth="1.8" />
                  <path d="M9.6 20.6h4.8" stroke="#7A3410" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>{currentExercise.feedback_wrong || 'انگشت‌تان را روی هر مورد بگذارید و بشمارید.'}</span>
              </div>
            )}
            {kind === 'hint' ? (
              <button type="button" onClick={handleContinue} className="btn btn-retry">
                <RotateCcw strokeWidth={2.6} />
                دوباره امتحان کنیم
              </button>
            ) : (
              <button type="button" onClick={handleContinue} className="btn btn-primary">
                ادامه
                <ArrowLeft strokeWidth={2.6} />
              </button>
            )}
          </div>
        </>
      )}

      {!hideCheck && (
        <div className="bottom">
          <button
            type="button"
            onClick={handleCheck}
            className={`btn ${userAnswer ? 'btn-primary' : 'btn-disabled'}`}
            disabled={!userAnswer}
            aria-disabled={!userAnswer}
          >
            بررسی
          </button>
        </div>
      )}
    </div>
  );
}
