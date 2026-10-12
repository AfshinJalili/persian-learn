import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '../app/profile/page';
import { FAMILY_HELPER_HOLD_MS } from '../lib/use-long-press';

const setAudioSpeed = jest.fn();
const playAudio = jest.fn<() => Promise<void>>();
const saveProgress = jest.fn<(progress: unknown) => Promise<void>>();
const getProgress = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/audio', () => ({
  AUDIO_SPEEDS: [0.9, 1, 1.1, 1.2, 1.3],
  playAudio: () => playAudio(),
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
    playAudio.mockReset();
    saveProgress.mockReset();
    getProgress.mockReset();
    playAudio.mockResolvedValue(undefined);
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

  it('uses a labeled slider and saves the chosen rate', async () => {
    render(<ProfilePage />);
    const slider = await screen.findByRole('slider', { name: 'سرعت صدا' });
    expect(screen.getByText('آهسته')).toBeInTheDocument();
    expect(screen.getByText('تند')).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '1.2' } });
    expect(setAudioSpeed).toHaveBeenCalledWith(1.2);
    expect(saveProgress).toHaveBeenCalledWith(expect.objectContaining({ speechRate: 1.2 }));
  });

  it('plays a sample at the chosen speed', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);
    await user.click(await screen.findByRole('button', { name: 'نمونه را بشنوید' }));
    expect(playAudio).toHaveBeenCalled();
  });

  it('uses large letter tiles and icons on stat headers', async () => {
    render(<ProfilePage />);
    const tile = await screen.findByText('آ');
    expect(tile).toHaveClass('letter-tile');
    expect(screen.getByText('روز پیاپی').closest('.k')?.querySelector('svg')).toBeTruthy();
    expect(screen.getByText('امتیاز').closest('.k')?.querySelector('svg')).toBeTruthy();
    expect(screen.getByText('حرف').closest('.k')?.querySelector('svg')).toBeTruthy();
  });

  it('hides autoplay until a family-helper long-press', async () => {
    render(<ProfilePage />);
    await screen.findByText('سرعت صدا');
    expect(screen.queryByLabelText('پخش خودکار')).not.toBeInTheDocument();

    jest.useFakeTimers();
    fireEvent.pointerDown(screen.getByLabelText('تنظیمات خانواده'), { button: 0 });
    act(() => {
      jest.advanceTimersByTime(FAMILY_HELPER_HOLD_MS);
    });
    jest.useRealTimers();

    expect(screen.getByLabelText('پخش خودکار')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تمام' })).toBeInTheDocument();
  });

  it('closes the family-helper panel with تمام and after leaving the screen', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ProfilePage />);
    await screen.findByText('سرعت صدا');

    jest.useFakeTimers();
    fireEvent.pointerDown(screen.getByLabelText('تنظیمات خانواده'), { button: 0 });
    act(() => {
      jest.advanceTimersByTime(FAMILY_HELPER_HOLD_MS);
    });
    jest.useRealTimers();

    await user.click(screen.getByRole('button', { name: 'تمام' }));
    expect(screen.queryByLabelText('پخش خودکار')).not.toBeInTheDocument();

    jest.useFakeTimers();
    fireEvent.pointerDown(screen.getByLabelText('تنظیمات خانواده'), { button: 0 });
    act(() => {
      jest.advanceTimersByTime(FAMILY_HELPER_HOLD_MS);
    });
    jest.useRealTimers();
    expect(screen.getByLabelText('پخش خودکار')).toBeInTheDocument();
    unmount();

    render(<ProfilePage />);
    await screen.findByText('سرعت صدا');
    expect(screen.queryByLabelText('پخش خودکار')).not.toBeInTheDocument();
  });

  it('keeps empty progress tracks empty and fills 1/6 proportionally', async () => {
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
    const { container } = render(<ProfilePage />);
    await screen.findByText('سرعت صدا');
    const fills = container.querySelectorAll('.track-block .progress > i');
    expect(fills[0]).toHaveAttribute('data-filled', 'true');
    expect((fills[0] as HTMLElement).style.width).toBe(`${(1 / 6) * 100}%`);
    expect(fills[1]).toHaveAttribute('data-filled', 'false');
    expect((fills[1] as HTMLElement).style.width).toBe('0%');
  });
});
