import { describe, expect, it } from '@jest/globals';
import { collectedActivityDates, daysThisWeek, isSamePersianWeek } from '../lib/calendar';
import type { UserProgress } from '../lib/types';

function progress(overrides: Partial<UserProgress>): UserProgress {
  return {
    currentTrack: 'math',
    onboarded: true,
    completedLessons: [],
    completedUnits: [],
    xp: 0,
    streak: 0,
    streakBest: 0,
    lastActivityDate: '',
    dailyGoal: 1,
    dailyLessonsCompleted: 0,
    restDaysUsed: 0,
    activityDates: [],
    weakItems: [],
    avatar: '',
    name: '',
    startDate: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Persian week activity', () => {
  it('treats Saturday as the start of the week', () => {
    expect(isSamePersianWeek('2026-10-10', '2026-10-16')).toBe(true);
    expect(isSamePersianWeek('2026-10-10', '2026-10-17')).toBe(false);
  });

  it('counts only activity dates inside the current Persian week', () => {
    const monday = new Date(2026, 9, 12);
    const user = progress({
      activityDates: ['2026-10-03', '2026-10-10', '2026-10-11', '2026-10-12'],
      lastActivityDate: '2026-10-12',
      streak: 10,
    });
    expect(daysThisWeek(user, monday)).toBe(3);
  });

  it('infers prior consecutive days from streak when activityDates is empty', () => {
    const monday = new Date(2026, 9, 12);
    const user = progress({
      lastActivityDate: '2026-10-12',
      streak: 10,
    });
    const inferred = collectedActivityDates(user);
    expect(inferred[0]).toBe('2026-10-12');
    expect(daysThisWeek(user, monday)).toBe(3);
  });
});
