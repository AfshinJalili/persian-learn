import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LessonCompletePage from '../app/lesson-complete/page';

const mockPush = jest.fn();
const getProgress = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/progress', () => ({
  getProgress: () => getProgress(),
}));

jest.mock('canvas-confetti', () => {
  const fn = Object.assign(jest.fn(), { reset: jest.fn() });
  return { __esModule: true, default: fn };
});

jest.mock('@/components/HodaMascot', () => ({
  __esModule: true,
  default: () => <div>hoda</div>,
}));

jest.mock('@/components/SpeakerButton', () => ({
  __esModule: true,
  default: () => <button type="button">speaker</button>,
}));

describe('LessonCompletePage repeat action', () => {
  beforeEach(() => {
    mockPush.mockReset();
    getProgress.mockReset();
    getProgress.mockResolvedValue({
      currentTrack: 'math',
      onboarded: true,
      completedLessons: ['m1l1'],
      completedUnits: [],
      xp: 10,
      streak: 1,
      streakBest: 1,
      lastActivityDate: '2026-10-12',
      dailyGoal: 2,
      dailyLessonsCompleted: 1,
      restDaysUsed: 0,
      activityDates: ['2026-10-12'],
      weakItems: [],
      avatar: '',
      name: 'آوا',
      startDate: '2026-01-01T00:00:00.000Z',
      speechRate: 1,
      autoplay: true,
    });
    window.history.replaceState({}, '', '/lesson-complete?xp=10&lesson=سلام&id=m1l1');
  });

  it('routes the replay button to the completed lesson', async () => {
    const user = userEvent.setup();
    render(<LessonCompletePage />);
    await user.click(await screen.findByRole('button', { name: 'همین درس را دوباره بخوانیم' }));
    expect(mockPush).toHaveBeenCalledWith('/lesson/m1l1');
  });

  it('sends ادامه to the home roadmap with the next lesson focused', async () => {
    const user = userEvent.setup();
    render(<LessonCompletePage />);
    await user.click(await screen.findByRole('button', { name: 'ادامه' }));
    expect(mockPush).toHaveBeenCalledWith('/home?focus=next');
  });
});
