import { describe, expect, it } from '@jest/globals';
import { applyLessonCompletion, rollDailyProgress } from '../lib/progress';
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
    speechRate: 1,
    autoplay: true,
    ...overrides,
  };
}

describe('restDaysUsed weekly reset', () => {
  it('keeps rest-day usage after a later same-week lesson', () => {
    const afterGap = applyLessonCompletion(
      progress({ lastActivityDate: '2026-10-10', streak: 1, restDaysUsed: 0 }),
      'm1l1',
      10,
      '2026-10-12'
    );
    expect(afterGap.restDaysUsed).toBe(1);

    const nextDay = applyLessonCompletion(afterGap, 'm1l2', 10, '2026-10-13');
    expect(nextDay.restDaysUsed).toBe(1);
    expect(nextDay.streak).toBe(2);
  });

  it('resets restDaysUsed only when a new Persian week starts', () => {
    const friday = applyLessonCompletion(
      progress({ lastActivityDate: '2026-10-15', streak: 3, restDaysUsed: 2 }),
      'm1l3',
      10,
      '2026-10-16'
    );
    expect(friday.restDaysUsed).toBe(2);

    const saturday = applyLessonCompletion(friday, 'm1l4', 10, '2026-10-17');
    expect(saturday.restDaysUsed).toBe(0);
    expect(saturday.streak).toBe(5);
  });

  it('stops forgiving gaps after two rest days in the same week', () => {
    const firstGap = applyLessonCompletion(
      progress({ lastActivityDate: '2026-10-10', streak: 1, restDaysUsed: 0 }),
      'm1l1',
      10,
      '2026-10-12'
    );
    const secondGap = applyLessonCompletion(firstGap, 'm1l2', 10, '2026-10-14');
    expect(secondGap.restDaysUsed).toBe(2);
    const thirdGap = applyLessonCompletion(secondGap, 'm1l3', 10, '2026-10-16');
    expect(thirdGap.streak).toBe(1);
  });
});

describe('daily counter rollover', () => {
  it('clears yesterday’s daily count when loading progress on a new day', () => {
    const rolled = rollDailyProgress(
      progress({ lastActivityDate: '2026-10-11', dailyLessonsCompleted: 1 }),
      '2026-10-12'
    );
    expect(rolled.dailyLessonsCompleted).toBe(0);
  });

  it('keeps today’s count when last activity is today', () => {
    const rolled = rollDailyProgress(
      progress({ lastActivityDate: '2026-10-12', dailyLessonsCompleted: 2 }),
      '2026-10-12'
    );
    expect(rolled.dailyLessonsCompleted).toBe(2);
  });
});

describe('rest day charging', () => {
  it('charges daysSince-1 rest days for a multi-day gap', () => {
    const next = applyLessonCompletion(
      progress({ lastActivityDate: '2026-10-10', streak: 4, restDaysUsed: 0 }),
      'm1l1',
      10,
      '2026-10-13'
    );
    expect(next.restDaysUsed).toBe(2);
    expect(next.streak).toBe(4);
  });

  it('resets the streak when skipped days exceed the remaining allowance', () => {
    const next = applyLessonCompletion(
      progress({ lastActivityDate: '2026-10-10', streak: 4, restDaysUsed: 1 }),
      'm1l1',
      10,
      '2026-10-13'
    );
    expect(next.streak).toBe(1);
    expect(next.restDaysUsed).toBe(1);
  });
});

describe('lesson XP', () => {
  it('adds the XP actually earned by the completed lesson', () => {
    const next = applyLessonCompletion(progress({ xp: 20 }), 'm1l1', 80, '2026-10-12');
    expect(next.xp).toBe(100);
    expect(next.activityDates).toContain('2026-10-12');
  });
});
