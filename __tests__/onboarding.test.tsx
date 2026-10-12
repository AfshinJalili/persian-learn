import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Onboarding from '../components/Onboarding';

const mockPush = jest.fn();
const playAudio = jest.fn<(text: string, slow?: boolean) => Promise<void>>();
const stopAudio = jest.fn();
const saveProgress = jest.fn<(progress: unknown) => Promise<void>>();
const getProgress = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/audio', () => ({
  unlockAudio: jest.fn(),
  playAudio: (...args: [string, boolean?]) => playAudio(...args),
  stopAudio: () => stopAudio(),
}));

jest.mock('@/lib/progress', () => ({
  getProgress: () => getProgress(),
  saveProgress: (progress: unknown) => saveProgress(progress),
}));

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('Onboarding back navigation', () => {
  beforeEach(() => {
    mockPush.mockReset();
    playAudio.mockReset();
    stopAudio.mockReset();
    saveProgress.mockReset();
    getProgress.mockReset();
    playAudio.mockResolvedValue(undefined);
    saveProgress.mockResolvedValue(undefined);
    getProgress.mockResolvedValue({
      currentTrack: 'math',
      onboarded: false,
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
    });
  });

  it('uses a right-pointing chevron for Back on RTL screens', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);
    await user.click(screen.getByLabelText('شروع'));
    const back = await screen.findByLabelText('بازگشت');
    const path = back.querySelector('path');
    expect(path?.getAttribute('d')).toBe('m9 18 6-6-6-6');
  });

  it('does not advance after Back while sound-check audio is still playing', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    playAudio.mockImplementation(() => pending.promise);

    render(<Onboarding />);
    await user.click(screen.getByLabelText('شروع'));
    pending.resolve();
    await screen.findByText('صدا را می‌شنوید؟');

    const nextAudio = deferred();
    playAudio.mockImplementation(() => nextAudio.promise);
    await user.click(screen.getByLabelText('بله، می‌شنوم'));
    await user.click(screen.getByLabelText('بازگشت'));

    expect(stopAudio).toHaveBeenCalled();
    nextAudio.resolve();
    await waitFor(() => {
      expect(screen.getByText('برای شنیدن، اینجا بزنید')).toBeInTheDocument();
    });
    expect(screen.queryByText('یک تصویر برای خودتان انتخاب کنید')).not.toBeInTheDocument();
  });

  it('does not save or redirect if Back is pressed during track-selection audio', async () => {
    const user = userEvent.setup();
    playAudio.mockResolvedValue(undefined);

    render(<Onboarding />);
    await user.click(screen.getByLabelText('شروع'));
    await screen.findByText('صدا را می‌شنوید؟');
    await user.click(screen.getByLabelText('بله، می‌شنوم'));
    await screen.findByText('یک تصویر برای خودتان انتخاب کنید');
    await user.click(screen.getByText('🌷'));
    await screen.findByText('چه صدایتان کنیم؟');
    await user.click(screen.getByText('بعداً'));
    await screen.findByText('امروز چه یاد بگیریم؟');

    const pending = deferred();
    playAudio.mockImplementation(() => pending.promise);
    await user.click(screen.getByText('عددها و حساب'));
    await user.click(screen.getByLabelText('بازگشت'));
    pending.resolve();

    await waitFor(() => {
      expect(screen.getByText('چه صدایتان کنیم؟')).toBeInTheDocument();
    });
    expect(saveProgress).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
