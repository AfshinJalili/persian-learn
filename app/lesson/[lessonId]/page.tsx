'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProgress, completeLesson } from '@/lib/progress';
import { loadTrack, resolveLessonAccess } from '@/lib/content';
import { playAudio, stopAudio, vibrate } from '@/lib/audio';
import { answersEqual } from '@/lib/answers';
import { feedbackKind } from '@/lib/lesson-feedback';
import type { Lesson as LessonType } from '@/lib/types';
import AudioUnlockOverlay from '@/components/AudioUnlockOverlay';
import ExerciseRenderer from '@/components/exercises/ExerciseRenderer';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
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
      const track = await loadTrack(progress.currentTrack);
      const lessonData = resolveLessonAccess(track, lessonId, progress.completedLessons);

      if (!lessonData) {
        router.push('/home');
        return;
      }

      setLesson(lessonData);
      setLoading(false);

      if (lessonData.exercises[0]) {
        setTimeout(() => {
          playAudio(lessonData.exercises[0].audio_script).catch(() => {});
        }, 400);
      }
    }

    load();

    return () => stopAudio();
  }, [lessonId, router]);

  const currentExercise = lesson?.exercises[currentIndex];

  const handleCheck = async () => {
    if (!currentExercise || !userAnswer) return;

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
    router.push(`/lesson-complete?xp=${xpEarned}`);
  };

  const handleTraced = (answer: string) => {
    setUserAnswer(answer);
    setIsCorrect(true);
    setAttempts(1);
    setXpEarned(xpEarned + 10);
    setShowFeedback(true);
  };

  if (loading || !lesson || !currentExercise) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-6xl">⏳</div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / lesson.exercises.length) * 100;
  const kind = showFeedback ? feedbackKind(isCorrect, attempts - 1) : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <AudioUnlockOverlay phrase={currentExercise.audio_script} />
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="w-12 h-12 min-w-12 rounded-full bg-white border-2 border-[var(--line-strong)] flex items-center justify-center"
            aria-label="بستن درس"
          >
            ✕
          </button>
          <div className="flex-1 h-4 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--green-600)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xl font-bold text-[var(--ink-2)]">
            {(currentIndex + 1).toLocaleString('fa-IR')}/
            {lesson.exercises.length.toLocaleString('fa-IR')}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <ExerciseRenderer
          exercise={currentExercise}
          userAnswer={userAnswer}
          onAnswerChange={setUserAnswer}
          onContinue={handleContinue}
          onTraced={handleTraced}
          disabled={showFeedback}
        />
      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-black/30 flex items-end z-40">
          <div
            className={`w-full rounded-t-3xl p-8 shadow-2xl ${
              isCorrect ? 'bg-[var(--green-100)]' : 'bg-[var(--clay-100)]'
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{isCorrect ? '✓' : '🦩'}</div>
              <h2
                className={`text-3xl font-black ${
                  isCorrect ? 'text-[var(--green-900)]' : 'text-[var(--clay-800)]'
                }`}
              >
                {kind === 'correct'
                  ? 'آفرین!'
                  : kind === 'reveal'
                    ? 'بعداً دوباره می‌بینیم'
                    : 'نزدیک بود!'}
              </h2>
            </div>
            {kind === 'hint' && (
              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-16 rounded-2xl bg-[var(--clay-800)] text-white text-2xl font-bold shadow-lg"
              >
                دوباره امتحان کنیم
              </button>
            )}
            {(kind === 'correct' || kind === 'reveal') && (
              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-16 rounded-2xl bg-[var(--green-700)] text-white text-2xl font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <span>ادامه</span>
                <span>←</span>
              </button>
            )}
          </div>
        </div>
      )}

      {currentExercise.type !== 'intro' &&
        currentExercise.type !== 'trace_letter' &&
        !showFeedback && (
          <div className="p-6 bg-white border-t-2 border-[var(--line)]">
            <button
              type="button"
              onClick={handleCheck}
              disabled={!userAnswer}
              className={`w-full h-16 rounded-2xl text-2xl font-bold shadow-lg ${
                userAnswer
                  ? 'bg-[var(--green-700)] text-white'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              {userAnswer ? '✓ بررسی' : 'اول یک جواب انتخاب کنید'}
            </button>
          </div>
        )}
    </div>
  );
}
