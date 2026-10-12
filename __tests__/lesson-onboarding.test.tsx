import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, waitFor } from '@testing-library/react';
import LessonPage from '../app/lesson/[lessonId]/page';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const getProgress = jest.fn();
const loadTrack = jest.fn();
const resolveLessonAccess = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useParams: () => ({ lessonId: 'm1l1' }),
}));

jest.mock('@/lib/progress', () => ({
  getProgress: () => getProgress(),
  completeLesson: jest.fn(),
}));

jest.mock('@/lib/content', () => ({
  loadTrack: (...args: unknown[]) => loadTrack(...args),
  resolveLessonAccess: (...args: unknown[]) => resolveLessonAccess(...args),
}));

jest.mock('@/lib/audio', () => ({
  playAudio: jest.fn(() => Promise.resolve()),
  stopAudio: jest.fn(),
  vibrate: jest.fn(),
}));

jest.mock('@/components/AudioUnlockOverlay', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/exercises/ExerciseRenderer', () => ({
  __esModule: true,
  default: () => <div>exercise</div>,
}));

jest.mock('@/components/SpeakerButton', () => ({
  __esModule: true,
  default: () => <button type="button">speaker</button>,
}));

jest.mock('@/components/HodaMascot', () => ({
  __esModule: true,
  default: () => <div>hoda</div>,
}));

describe('LessonPage onboarding gate', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockPush.mockReset();
    getProgress.mockReset();
    loadTrack.mockReset();
    resolveLessonAccess.mockReset();
    getProgress.mockResolvedValue({
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
      name: '',
      startDate: '2026-01-01T00:00:00.000Z',
      speechRate: 1,
      autoplay: true,
    });
  });

  it('redirects to / when progress is not onboarded', async () => {
    render(<LessonPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
    expect(loadTrack).not.toHaveBeenCalled();
  });
});
