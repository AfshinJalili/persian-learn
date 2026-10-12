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

  it('advances from Start immediately without waiting for audio', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    playAudio.mockImplementation(() => pending.promise);

    render(<Onboarding />);
    await user.click(screen.getByRole('button', { name: /شروع/ }));

    expect(await screen.findByText('یک تصویر برای خودتان انتخاب کنید')).toBeInTheDocument();
    expect(stopAudio).toHaveBeenCalled();
    expect(screen.queryByText('خوش آمدید')).not.toBeInTheDocument();
  });

  it('uses a right-pointing chevron for Back on RTL screens', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);
    await user.click(screen.getByRole('button', { name: /شروع/ }));
    const back = await screen.findByLabelText('بازگشت');
    const path = back.querySelector('path');
    expect(path?.getAttribute('d')).toBe('m9 18 6-6-6-6');
  });

  it('returns to welcome and stops speech when Back is pressed on the avatar step', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);
    await user.click(screen.getByRole('button', { name: /شروع/ }));
    await screen.findByText('یک تصویر برای خودتان انتخاب کنید');
    await user.click(screen.getByLabelText('بازگشت'));

    expect(stopAudio).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('خوش آمدید')).toBeInTheDocument();
    });
    expect(screen.queryByText('یک تصویر برای خودتان انتخاب کنید')).not.toBeInTheDocument();
  });

  it('does not ask for a name and saves فریبا جون', async () => {
    const user = userEvent.setup();
    render(<Onboarding />);
    await user.click(screen.getByRole('button', { name: /شروع/ }));
    await screen.findByText('یک تصویر برای خودتان انتخاب کنید');
    expect(screen.queryByText('شما را چه صدا کنیم؟')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'بعداً' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ادامه' }));
    await screen.findByText('امروز چه یاد بگیریم؟');
    await user.click(screen.getByText('عددها و حساب'));

    await waitFor(() => {
      expect(saveProgress).toHaveBeenCalled();
    });
    expect(saveProgress.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ name: 'فریبا جون', onboarded: true, currentTrack: 'math' })
    );
  });

  it('does not save or redirect if Back is pressed before track selection finishes saving', async () => {
    const user = userEvent.setup();
    playAudio.mockResolvedValue(undefined);

    render(<Onboarding />);
    await user.click(screen.getByRole('button', { name: /شروع/ }));
    await screen.findByText('یک تصویر برای خودتان انتخاب کنید');
    await user.click(screen.getByRole('button', { name: 'ادامه' }));
    await screen.findByText('امروز چه یاد بگیریم؟');

    const pending = deferred<Record<string, unknown>>();
    getProgress.mockImplementation(() => pending.promise);
    await user.click(screen.getByText('عددها و حساب'));
    await user.click(screen.getByLabelText('بازگشت'));
    pending.resolve({
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

    await waitFor(() => {
      expect(screen.getByText('یک تصویر برای خودتان انتخاب کنید')).toBeInTheDocument();
    });
    expect(saveProgress).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
