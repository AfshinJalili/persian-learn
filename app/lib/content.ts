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
  let found = false;
  for (const unit of track.units) {
    for (const lesson of unit.lessons) {
      if (lesson.id === lessonId) {
        found = true;
        break;
      }
      if (!completedLessons.includes(lesson.id)) {
        return false;
      }
    }
    if (found) break;
  }
  return true;
}

export function getUnitProgress(unit: Unit, completedLessons: string[]): number {
  const completed = unit.lessons.filter(l => completedLessons.includes(l.id)).length;
  return unit.lessons.length > 0 ? (completed / unit.lessons.length) * 100 : 0;
}
