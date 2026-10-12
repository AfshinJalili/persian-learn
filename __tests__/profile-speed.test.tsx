import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '../app/profile/page';
import { AUDIO_SPEEDS } from '../lib/audio';

const setAudioSpeed = jest.fn();
const saveProgress = jest.fn<(progress: unknown) => Promise<void>>();
const getProgress = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/audio', () => ({
  AUDIO_SPEEDS: [0.9, 1, 1.1, 1.2, 1.3],
  playAudio: jest.fn(() => Promise.resolve()),
  setAudioSpeed: (speed: number) => setAudioSpeed(speed),
}));

jest.mock('@/lib/progress', () => ({
  getProgress: () => getProgress(),
  saveProgress: (progress: unknown) => saveProgress(progress),
}));

jest.mock('@/lib/content', () => ({
  loadTrack: jest.fn(async () => ({ track: 'math', units: [] })),
  trackCompletionPercent: () => 0,
}));

jest.mock('@/components/ui/BottomNav', () => ({
  __esModule: true,
  default: () => <nav>nav</nav>,
}));

describe('Profile voice speed', () => {
  beforeEach(() => {
    setAudioSpeed.mockReset();
    saveProgress.mockReset();
    getProgress.mockReset();
    saveProgress.mockResolvedValue(undefined);
    getProgress.mockResolvedValue({
      currentTrack: 'math',
      onboarded: true,
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
      avatar: 'tulip',
      name: 'فریبا جون',
      startDate: '2026-01-01T00:00:00.000Z',
      speechRate: 1,
      autoplay: true,
    });
  });

  it('offers 0.9x through 1.3x and saves the chosen rate', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);
    for (const rate of AUDIO_SPEEDS) {
      expect(await screen.findByRole('button', { name: `${rate.toFixed(1)} برابر` })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: '1.2 برابر' }));
    expect(setAudioSpeed).toHaveBeenCalledWith(1.2);
    expect(saveProgress).toHaveBeenCalledWith(expect.objectContaining({ speechRate: 1.2 }));
  });
});
