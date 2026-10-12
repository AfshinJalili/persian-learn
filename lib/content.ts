import type { Track, Unit, Lesson, Exercise } from './types';

let mathContent: Track | null = null;
let alphabetContent: Track | null = null;

export async function loadTrack(trackName: 'math' | 'alphabet'): Promise<Track> {
  if (trackName === 'math' && mathContent) return mathContent;
  if (trackName === 'alphabet' && alphabetContent) return alphabetContent;

  const response = await fetch(`/content/${trackName}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load ${trackName} content`);
  }

  const track = await response.json() as Track;

  if (trackName === 'math') {
    mathContent = track;
  } else {
    alphabetContent = track;
  }

  return track;
}

export function getLesson(track: Track, lessonId: string): Lesson | null {
  for (const unit of track.units) {
    const lesson = unit.lessons.find(l => l.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

export function getUnit(track: Track, unitId: string): Unit | null {
  return track.units.find(u => u.id === unitId) || null;
}

export function getNextLesson(track: Track, completedLessons: string[]): Lesson | null {
  for (const unit of track.units) {
    for (const lesson of unit.lessons) {
      if (!completedLessons.includes(lesson.id)) {
        return lesson;
      }
    }
  }
  return null;
}

export function isLessonUnlocked(track: Track, lessonId: string, completedLessons: string[]): boolean {
  for (const unit of track.units) {
    for (const lesson of unit.lessons) {
      if (lesson.id === lessonId) {
        return true;
      }
      if (!completedLessons.includes(lesson.id)) {
        return false;
      }
    }
  }
  return false;
}

export function resolveLessonAccess(
  track: Track,
  lessonId: string,
  completedLessons: string[]
): Lesson | null {
  const lesson = getLesson(track, lessonId);
  if (!lesson || !isLessonUnlocked(track, lessonId, completedLessons)) {
    return null;
  }
  return lesson;
}

export function getUnitProgress(unit: Unit, completedLessons: string[]): number {
  const completed = unit.lessons.filter(l => completedLessons.includes(l.id)).length;
  return unit.lessons.length > 0 ? (completed / unit.lessons.length) * 100 : 0;
}

export function countTrackLessons(track: Track): number {
  return track.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
}

export function trackCompletionPercent(completedLessons: string[], track: Track): number {
  const total = countTrackLessons(track);
  if (total === 0) {
    return 0;
  }
  const lessonIds = new Set(track.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
  const done = completedLessons.filter((id) => lessonIds.has(id)).length;
  return Math.min(100, (done / total) * 100);
}
