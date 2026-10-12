import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { UserProgress, LessonProgress } from './types';

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
    weakItems: [],
    avatar: '',
    name: '',
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
  };
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
    return created;
  }

  return normalizeProgress(progress);
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
  const progress = await getProgress();

  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
  }

  progress.xp += xpEarned;

  const today = new Date().toISOString().split('T')[0];
  if (progress.lastActivityDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (progress.lastActivityDate === yesterday || progress.lastActivityDate === '') {
      progress.streak += 1;
      if (progress.streak > progress.streakBest) {
        progress.streakBest = progress.streak;
      }
    } else {
      const daysSince = Math.floor(
        (Date.now() - new Date(progress.lastActivityDate).getTime()) / 86400000
      );
      if (daysSince <= 3 && progress.restDaysUsed < 2) {
        progress.restDaysUsed += 1;
      } else {
        progress.streak = 1;
        if (progress.streakBest === 0) {
          progress.streakBest = 1;
        }
      }
    }

    progress.lastActivityDate = today ?? '';
    progress.dailyLessonsCompleted = 1;
    progress.restDaysUsed = 0;
  } else {
    progress.dailyLessonsCompleted += 1;
  }

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
