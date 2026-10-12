import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import HomePage from '../app/home/page';

const playAudio = jest.fn<(text: string) => Promise<void>>();
const getProgress = jest.fn();
const isAudioUnlocked = jest.fn(() => true);
const isLessonUnlocked = jest.fn((track: unknown, lessonId: string, completed: string[]) => {
  if (completed.includes(lessonId)) return true;
  if (lessonId === 'm1l1') return true;
  if (lessonId === 'm1l2') return completed.includes('m1l1');
  return false;
});

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
        lessons: [
          { id: 'm1l1', title: 'شروع مسیر', exercises: [] },
          { id: 'm1l2', title: 'نگاه', exercises: [] },
          { id: 'm1l3', title: 'جایزه', exercises: [] },
        ],
      },
    ],
  })),
  isLessonUnlocked: (...args: [unknown, string, string[]]) => isLessonUnlocked(...args),
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

describe('Home path nodes', () => {
  beforeEach(() => {
    sessionStorage.clear();
    playAudio.mockReset();
    playAudio.mockResolvedValue(undefined);
    isAudioUnlocked.mockReturnValue(true);
    getProgress.mockResolvedValue({
      currentTrack: 'math',
      onboarded: true,
      completedLessons: ['m1l1'],
      completedUnits: [],
      xp: 10,
      streak: 1,
      streakBest: 1,
      lastActivityDate: '',
      dailyGoal: 2,
      dailyLessonsCompleted: 1,
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

  it('makes شروع and its node one tap target and greys a locked end node', async () => {
    render(<HomePage />);
    const start = await screen.findByRole('button', { name: 'شروع' });
    expect(start.querySelector('.tooltip')).toHaveTextContent('شروع');
    expect(start.querySelector('.node.current')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'جایزه' })).toBeInTheDocument();
    });
    const lockedEnd = screen.getByRole('button', { name: 'جایزه' });
    expect(lockedEnd.querySelector('.node.locked')).toBeTruthy();
    expect(lockedEnd.querySelector('.node.review')).toBeNull();
  });
});
