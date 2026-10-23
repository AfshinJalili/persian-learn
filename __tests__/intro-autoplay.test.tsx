import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'fs';
import LessonPage from '../app/lesson/[lessonId]/page';
import type { Lesson, Track } from '../lib/types';
import { INTRO_HELPER } from '../components/exercises/CountCard';
import { audioUrlForHash, generateAudioId, spokenTextKey } from '../lib/audio-id';
import {
  activeAudioSequenceOwner,
  beginAudioSequence,
  playAudio,
  setAudioSpeed,
  stopAudio,
} from '../lib/audio';

// Real lib/audio + real lesson page + real IntroExercise: the page's
// step-entry stop runs *after* the intro's own mount effect (child effects
// first), so it must not cancel the greeting sequence the intro just began.

const created: HeldAudio[] = [];

class HeldAudio {
  playbackRate = 1;
  preservesPitch = false;
  mozPreservesPitch = false;
  webkitPreservesPitch = false;
  paused = true;
  played = false;
  currentTime = 0;
  src: string;
  private ended: (() => void) | null = null;

  constructor(src: string) {
    this.src = src;
    created.push(this);
  }

  addEventListener(type: string, cb: () => void) {
    if (type === 'ended') this.ended = cb;
  }

  play() {
    this.paused = false;
    this.played = true;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  end() {
    this.paused = true;
    this.ended?.();
  }
}

const mockPush = jest.fn();
const mockReplace = jest.fn();
const router = { push: mockPush, replace: mockReplace };
let lessonId = 'm1l1';

jest.mock('next/navigation', () => ({
  useRouter: () => router,
  useParams: () => ({ lessonId }),
}));

const math = JSON.parse(readFileSync('public/content/math.json', 'utf8')) as Track;
const lessonById = (id: string): Lesson =>
  math.units.flatMap((u) => u.lessons).find((l) => l.id === id)!;

jest.mock('@/lib/progress', () => ({
  getProgress: async () => ({
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
  }),
  completeLesson: async () => undefined,
}));

jest.mock('@/lib/content', () => ({
  loadTrack: async () => ({ track: 'math', units: [] }),
  resolveLessonAccess: () => lessonById(lessonId),
}));

jest.mock('@/components/AudioUnlockOverlay', () => ({
  __esModule: true,
  default: () => null,
}));

async function urlFor(text: string) {
  return audioUrlForHash(await generateAudioId(spokenTextKey(text)));
}

const wait = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

beforeEach(() => {
  stopAudio();
  created.length = 0;
  setAudioSpeed(1);
  mockPush.mockReset();
  mockReplace.mockReset();
  Object.defineProperty(window, 'Audio', { configurable: true, writable: true, value: HeldAudio });
});

afterEach(() => {
  cleanup();
  stopAudio();
});

describe('stopAudio keepOwner (step-entry stop)', () => {
  it('keeps the live sequence of that owner, cancels any other', () => {
    const seq = beginAudioSequence('m1l1e1');
    stopAudio({ keepOwner: 'm1l1e1' });
    expect(seq.signal.aborted).toBe(false);
    expect(activeAudioSequenceOwner()).toBe('m1l1e1');
    stopAudio({ keepOwner: 'm1l1e2' });
    expect(seq.signal.aborted).toBe(true);
    expect(activeAudioSequenceOwner()).toBeNull();
  });

  it('a plain stopAudio (Continue / ✕ / back / unmount) still cancels it', () => {
    const seq = beginAudioSequence('m1l1e1');
    stopAudio();
    expect(seq.signal.aborted).toBe(true);
  });

  it('other playback still cancels an owned sequence', () => {
    const seq = beginAudioSequence('m1l1e1');
    void playAudio('اول کارت‌ها را بزنید');
    expect(seq.signal.aborted).toBe(true);
  });
});

describe('m1l1e1 counting intro autoplays inside the lesson page', () => {
  it('plays the greeting, then the helper', async () => {
    lessonId = 'm1l1';
    const intro = lessonById('m1l1').exercises[0];
    expect(intro.id).toBe('m1l1e1');
    render(<LessonPage />);
    await screen.findByText('سلام فریبا جون! با هم بشماریم.');

    const greeting = await urlFor(intro.audio_script);
    await waitFor(() => expect(created).toHaveLength(1), { timeout: 2000 });
    expect(created[0].src).toBe(greeting);
    expect(created[0].played).toBe(true);
    expect(created[0].paused).toBe(false);

    act(() => created[0].end());
    const helper = await urlFor(INTRO_HELPER);
    await waitFor(() => expect(created).toHaveLength(2));
    expect(created[1].src).toBe(helper);
    expect(created[1].played).toBe(true);
    expect(created[0].paused).toBe(true);
    act(() => created[1].end());

    // Tap-a-card invite pulses on the first card after the helper.
    await waitFor(() =>
      expect(document.querySelector('[data-count-card]')?.className ?? '').toMatch(/invite/)
    );
  });

  it('leaving the lesson (✕ / back unmounts the page) cancels the greeting', async () => {
    lessonId = 'm1l1';
    const { unmount } = render(<LessonPage />);
    await waitFor(() => expect(created).toHaveLength(1), { timeout: 2000 });
    unmount();
    expect(created[0].paused).toBe(true);
    await wait(400);
    expect(created).toHaveLength(1);
  });

  it('control: m1l2e1 (normal intro) still autoplays its prompt', async () => {
    lessonId = 'm1l2';
    const intro = lessonById('m1l2').exercises[0];
    render(<LessonPage />);
    await waitFor(() => expect(created).toHaveLength(1), { timeout: 2000 });
    expect(created[0].src).toBe(await urlFor(intro.audio_script));
    expect(created[0].played).toBe(true);
  });
});
