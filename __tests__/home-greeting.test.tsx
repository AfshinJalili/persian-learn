import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import HomePage from '../app/home/page';

const playAudio = jest.fn<(text: string) => Promise<void>>();
const getProgress = jest.fn();
const isAudioUnlocked = jest.fn(() => true);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/audio', () => ({
  playAudio: (text: string) => playAudio(text),
  isAudioUnlocked: () => isAudioUnlocked(),
}));

jest.mock('@/lib/progress', () => ({
  getProgress: () => getProgress(),
}));

jest.mock('@/lib/content', () => ({
  loadTrack: jest.fn(async () => ({
    track: 'math',
    units: [
      {
        id: 'm1',
        title: 'یک، دو، سه',
        emoji: '🍞',
        lessons: [{ id: 'm1l1', title: 'شروع', exercises: [] }],
      },
    ],
  })),
  isLessonUnlocked: () => true,
}));

jest.mock('@/components/AudioUnlockOverlay', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ui/BottomNav', () => ({
  __esModule: true,
  default: () => <nav>nav</nav>,
}));

jest.mock('@/components/SpeakerButton', () => ({
  __esModule: true,
  default: () => <button type="button">speaker</button>,
}));

jest.mock('@/components/HodaMascot', () => ({
  __esModule: true,
  default: () => <div>hoda</div>,
}));

describe('Home greeting audio', () => {
  beforeEach(() => {
    sessionStorage.clear();
    playAudio.mockReset();
    playAudio.mockResolvedValue(undefined);
    isAudioUnlocked.mockReturnValue(true);
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

  it('speaks the named greeting once per app open', async () => {
    const first = render(<HomePage />);
    await waitFor(() => {
      expect(playAudio).toHaveBeenCalledWith('سلام فریبا جون! بیایید درس امروز را شروع کنیم.');
    });
    first.unmount();

    playAudio.mockClear();
    render(<HomePage />);
    await screen.findByText('یک، دو، سه');
    expect(playAudio).not.toHaveBeenCalled();
  });
});
