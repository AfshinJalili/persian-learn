import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { UserProgress, LessonProgress } from './types';
import { addDays, isSamePersianWeek, todayDateString, diffDays } from './calendar';
import { hydrateAudioSpeed } from './audio';
import { LEARNER_NAME } from './learner';

interface ProgressDB extends DBSchema {
  progress: {
    key: string;
    value: UserProgress;
  };
  lessons: {
    key: string;
    value: LessonProgress;
  };
}

let db: IDBPDatabase<ProgressDB> | null = null;

function defaultProgress(): UserProgress {
  return {
    currentTrack: 'math',
    onboarded: false,
    completedLessons: [],
    completedUnits: [],
    xp: 0,
    streak: 0,
    streakBest: 0,
    lastActivityDate: '',
    dailyGoal: 2,
    dailyLessonsCompleted: 0,
    restDaysUsed: 0,
    activityDates: [],
    weakItems: [],
    avatar: '',
    name: LEARNER_NAME,
    startDate: new Date().toISOString(),
    speechRate: 1,
    autoplay: true,
  };
}

function normalizeProgress(progress: UserProgress): UserProgress {
  return {
    ...defaultProgress(),
    ...progress,
    onboarded: progress.onboarded ?? progress.completedLessons.length > 0,
    avatar: progress.avatar ?? '',
    activityDates: progress.activityDates ?? [],
  };
}

export function rollDailyProgress(progress: UserProgress, today: string): UserProgress {
  if (progress.lastActivityDate === today) {
    return progress;
  }
  if (progress.dailyLessonsCompleted === 0) {
    return progress;
  }
  return { ...progress, dailyLessonsCompleted: 0 };
}

export function applyLessonCompletion(
  progress: UserProgress,
  lessonId: string,
  xpEarned: number,
  today: string
): UserProgress {
  const next: UserProgress = {
    ...progress,
    completedLessons: [...progress.completedLessons],
    activityDates: [...(progress.activityDates ?? [])],
    weakItems: progress.weakItems.map((item) => ({ ...item })),
  };

  if (!next.completedLessons.includes(lessonId)) {
    next.completedLessons.push(lessonId);
  }

  next.xp += xpEarned;

  if (!next.activityDates.includes(today)) {
    next.activityDates.push(today);
  }

  if (next.lastActivityDate !== today) {
    if (next.lastActivityDate && !isSamePersianWeek(next.lastActivityDate, today)) {
      next.restDaysUsed = 0;
    }

    const yesterday = addDays(today, -1);
    if (next.lastActivityDate === yesterday || next.lastActivityDate === '') {
      next.streak += 1;
      if (next.streak > next.streakBest) {
        next.streakBest = next.streak;
      }
    } else {
      const daysSince = diffDays(next.lastActivityDate, today);
      const skipped = Math.max(0, daysSince - 1);
      const remaining = 2 - next.restDaysUsed;
      if (skipped > 0 && skipped <= remaining) {
        next.restDaysUsed += skipped;
      } else {
        next.streak = 1;
        if (next.streakBest === 0) {
          next.streakBest = 1;
        }
      }
    }

    next.lastActivityDate = today;
    next.dailyLessonsCompleted = 1;
  } else {
    next.dailyLessonsCompleted += 1;
  }

  return next;
}

async function getDB() {
  if (db) return db;

  db = await openDB<ProgressDB>('persian-learn', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('progress')) {
        database.createObjectStore('progress');
      }
      if (!database.objectStoreNames.contains('lessons')) {
        database.createObjectStore('lessons');
      }
    },
  });

  return db;
}

export async function getProgress(): Promise<UserProgress> {
  const database = await getDB();
  const progress = await database.get('progress', 'current');

  if (!progress) {
    const created = defaultProgress();
    await saveProgress(created);
    hydrateAudioSpeed(created.speechRate);
    return created;
  }

  const normalized = normalizeProgress(progress);
  const rolled = rollDailyProgress(normalized, todayDateString());
  if (rolled.dailyLessonsCompleted !== normalized.dailyLessonsCompleted) {
    await saveProgress(rolled);
  }
  hydrateAudioSpeed(rolled.speechRate);
  return rolled;
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  const database = await getDB();
  await database.put('progress', normalizeProgress(progress), 'current');
}

export async function completeLesson(
  lessonId: string,
  xpEarned: number,
  weakItems: string[]
): Promise<UserProgress> {
  const today = todayDateString();
  const progress = applyLessonCompletion(await getProgress(), lessonId, xpEarned, today);

  for (const exerciseId of weakItems) {
    const existing = progress.weakItems.find((w) => w.exerciseId === exerciseId);
    if (existing) {
      existing.missCount += 1;
      existing.lastSeen = new Date().toISOString();
    } else {
      progress.weakItems.push({
        exerciseId,
        missCount: 1,
        lastSeen: new Date().toISOString(),
      });
    }
  }

  await saveProgress(progress);
  return progress;
}

export async function saveLessonProgress(lessonProgress: LessonProgress): Promise<void> {
  const database = await getDB();
  await database.put('lessons', lessonProgress, lessonProgress.lessonId);
}

export async function getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
  const database = await getDB();
  const lessonProgress = await database.get('lessons', lessonId);
  return lessonProgress || null;
}

export async function clearLessonProgress(lessonId: string): Promise<void> {
  const database = await getDB();
  await database.delete('lessons', lessonId);
}

export async function resetProgress(): Promise<void> {
  const database = await getDB();
  await database.delete('progress', 'current');
  db = null;
}
