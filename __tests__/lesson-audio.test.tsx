import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LessonPage from '../app/lesson/[lessonId]/page';
import type { Exercise, Lesson } from '../lib/types';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const getProgress = jest.fn();
const loadTrack = jest.fn();
const resolveLessonAccess = jest.fn();
const playAudio = jest.fn<(text: string, slow?: boolean, signal?: AbortSignal) => Promise<void>>();
const stopAudio = jest.fn();
const completeLesson = jest.fn();

const router = { push: mockPush, replace: mockReplace };

jest.mock('next/navigation', () => ({
  useRouter: () => router,
  useParams: () => ({ lessonId: 'm1l1' }),
}));

jest.mock('@/lib/progress', () => ({
  getProgress: () => getProgress(),
  completeLesson: (...args: unknown[]) => completeLesson(...args),
}));

jest.mock('@/lib/content', () => ({
  loadTrack: (...args: unknown[]) => loadTrack(...args),
  resolveLessonAccess: (...args: unknown[]) => resolveLessonAccess(...args),
}));

jest.mock('@/lib/audio', () => ({
  playAudio: (text: string, slow?: boolean, signal?: AbortSignal) => playAudio(text, slow, signal),
  stopAudio: () => stopAudio(),
  vibrate: jest.fn(),
}));

jest.mock('@/components/AudioUnlockOverlay', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/exercises/ExerciseRenderer', () => ({
  __esModule: true,
  default: ({
    exercise,
    onContinue,
  }: {
    exercise: { id: string };
    onContinue: () => void;
  }) => (
    <div>
      <div>exercise</div>
      <div>{exercise.id}</div>
      <button type="button" onClick={onContinue}>
        ادامه
      </button>
    </div>
  ),
}));

jest.mock('@/components/SpeakerButton', () => ({
  __esModule: true,
  default: () => <button type="button">speaker</button>,
}));

jest.mock('@/components/HodaMascot', () => ({
  __esModule: true,
  default: () => <div>hoda</div>,
}));

function exercise(id: string, audio: string): Exercise {
  return {
    id,
    type: 'intro',
    prompt: audio,
    audio_script: audio,
    payload: { display: '🍞' },
    answer: '',
    distractors: [],
    feedback_correct: 'آفرین',
    feedback_wrong: '',
  };
}

const lesson: Lesson = {
  id: 'm1l1',
  title: 'شروع',
  exercises: [exercise('m1l1e1', 'سلام درس اول'), exercise('m1l1e2', 'سلام درس دوم')],
};

describe('LessonPage audio cancellation', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockPush.mockReset();
    getProgress.mockReset();
    loadTrack.mockReset();
    resolveLessonAccess.mockReset();
    playAudio.mockReset();
    stopAudio.mockReset();
    completeLesson.mockReset();
    playAudio.mockResolvedValue(undefined);
    completeLesson.mockResolvedValue(undefined);
    loadTrack.mockResolvedValue({ track: 'math', units: [] });
    resolveLessonAccess.mockReturnValue(lesson);
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

  it('unmounting mid-sequence stops playback and never starts the queued prompt', async () => {
    const { unmount } = render(<LessonPage />);
    await waitFor(() => {
      expect(screen.getByText('exercise')).toBeInTheDocument();
    });
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(playAudio).not.toHaveBeenCalled();
    expect(stopAudio).toHaveBeenCalled();
  });

  it('advancing a step stops the current clip before the next prompt is queued', async () => {
    const user = userEvent.setup();
    render(<LessonPage />);
    await waitFor(() => {
      expect(screen.getByText('m1l1e1')).toBeInTheDocument();
    });
    stopAudio.mockClear();
    playAudio.mockClear();
    await user.click(screen.getByRole('button', { name: 'ادامه' }));
    expect(stopAudio).toHaveBeenCalled();
    expect(await screen.findByText('m1l1e2')).toBeInTheDocument();
    await waitFor(() => {
      expect(playAudio).toHaveBeenCalledWith('سلام درس دوم', false, expect.any(AbortSignal));
    });
    expect(playAudio).not.toHaveBeenCalledWith('سلام درس اول', false, expect.any(AbortSignal));
  });
});
