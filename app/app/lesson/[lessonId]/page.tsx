'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { getProgress, completeLesson } from '@/lib/progress';
import { loadTrack, getLesson } from '@/lib/content';
import { playAudio, stopAudio, vibrate } from '@/lib/audio';
import type { Exercise, Lesson as LessonType } from '@/lib/types';
import IntroExercise from '@/components/exercises/IntroExercise';
import TapPictureExercise from '@/components/exercises/TapPictureExercise';
import ListenChooseExercise from '@/components/exercises/ListenChooseExercise';
import CountObjectsExercise from '@/components/exercises/CountObjectsExercise';
import TraceLetterExercise from '@/components/exercises/TraceLetterExercise';
import MatchPairsExercise from '@/components/exercises/MatchPairsExercise';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
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
      const lessonData = getLesson(track, lessonId);

      if (!lessonData) {
        router.push('/home');
        return;
      }

      setLesson(lessonData);
      setLoading(false);

      if (lessonData.exercises[0]) {
        setTimeout(() => {
          playAudio(lessonData.exercises[0].audio_script).catch(() => {});
        }, 500);
      }
    }

    load();

    return () => stopAudio();
  }, [lessonId, router]);

  const currentExercise = lesson?.exercises[currentIndex];

  const handleCheck = async () => {
    if (!currentExercise || !userAnswer) return;

    const correct = userAnswer === currentExercise.answer;
    setIsCorrect(correct);
    setAttempts(attempts + 1);
    setShowFeedback(true);

    if (correct) {
      setXpEarned(xpEarned + 10);
      vibrate([50, 50]);
      await playAudio(currentExercise.feedback_correct);
    } else {
      vibrate([100]);
      if (attempts === 0) {
        await playAudio('نزدیک بود! دوباره امتحان کنید.');
      } else {
        setWeakItems([...weakItems, currentExercise.id]);
        await playAudio(`این ${currentExercise.answer} است. بعداً دوباره می‌بینیم.`);
      }
    }
  };

  const handleContinue = async () => {
    setShowFeedback(false);
    setUserAnswer('');
    setAttempts(0);

    if (currentIndex < (lesson?.exercises.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextExercise = lesson?.exercises[currentIndex + 1];
      if (nextExercise) {
        setTimeout(() => {
          playAudio(nextExercise.audio_script).catch(() => {});
        }, 300);
      }
    } else {
      await completeLesson(lessonId, xpEarned, weakItems);
      
      import('canvas-confetti').then((module) => {
        const confetti = module.default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }).catch(() => {});

      setTimeout(async () => {
        await playAudio('آفرین! درس تمام شد.');
        router.push('/lesson-complete');
      }, 500);
    }
  };

  if (loading || !lesson || !currentExercise) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-6xl animate-spin">⏳</div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / lesson.exercises.length) * 100;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/home')}
            className="w-12 h-12 rounded-full bg-white border-2 border-[var(--line-strong)] flex items-center justify-center"
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
            {(currentIndex + 1).toLocaleString('fa-IR')}/{lesson.exercises.length.toLocaleString('fa-IR')}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {currentExercise.type === 'intro' && (
          <IntroExercise
            exercise={currentExercise}
            onContinue={handleContinue}
          />
        )}
        {currentExercise.type === 'tap_picture' && (
          <TapPictureExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onAnswerChange={setUserAnswer}
            disabled={showFeedback}
          />
        )}
        {currentExercise.type === 'listen_choose' && (
          <ListenChooseExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onAnswerChange={setUserAnswer}
            disabled={showFeedback}
          />
        )}
        {currentExercise.type === 'count_objects' && (
          <CountObjectsExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onAnswerChange={setUserAnswer}
            disabled={showFeedback}
          />
        )}
        {currentExercise.type === 'trace_letter' && (
          <TraceLetterExercise
            exercise={currentExercise}
            onComplete={(answer) => {
              setUserAnswer(answer);
              setTimeout(() => {
                setIsCorrect(true);
                setShowFeedback(true);
              }, 100);
            }}
          />
        )}
        {currentExercise.type === 'match_pairs' && (
          <MatchPairsExercise
            exercise={currentExercise}
            userAnswer={userAnswer}
            onAnswerChange={setUserAnswer}
            disabled={showFeedback}
          />
        )}
      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-black/30 flex items-end" onClick={handleContinue}>
          <div
            className={`w-full rounded-t-3xl p-8 shadow-2xl ${
              isCorrect ? 'bg-[var(--green-100)]' : 'bg-[var(--clay-100)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{isCorrect ? '✓' : '🦩'}</div>
              <h2 className={`text-3xl font-black ${isCorrect ? 'text-[var(--green-900)]' : 'text-[var(--clay-800)]'}`}>
                {isCorrect ? 'آفرین!' : attempts > 1 ? 'بعداً دوباره می‌بینیم' : 'نزدیک بود!'}
              </h2>
            </div>
            {!isCorrect && attempts === 0 && (
              <button
                onClick={handleContinue}
                className="w-full h-16 rounded-2xl bg-[var(--clay-800)] text-white text-2xl font-bold shadow-lg"
              >
                دوباره امتحان کنیم
              </button>
            )}
            {(isCorrect || attempts > 0) && (
              <button
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

      {currentExercise.type !== 'intro' && !showFeedback && (
        <div className="p-6 bg-white border-t-2 border-[var(--line)]">
          <button
            onClick={handleCheck}
            disabled={!userAnswer}
            className={`w-full h-16 rounded-2xl text-2xl font-bold shadow-lg transition-all ${
              userAnswer
                ? 'bg-[var(--green-700)] text-white hover:scale-105'
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
