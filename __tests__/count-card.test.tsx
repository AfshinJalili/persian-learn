import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Exercise } from '../lib/types';
import IntroExercise from '../components/exercises/IntroExercise';
import {
  COUNT_CARD_MIN_SIZE,
  countCardLayout,
} from '../components/exercises/CountCard';

const playAudio = jest.fn<(text: string, slow?: boolean, signal?: AbortSignal) => Promise<void>>();
const stopAudio = jest.fn();

jest.mock('@/lib/audio', () => ({
  playAudio: (text: string, slow?: boolean, signal?: AbortSignal) => playAudio(text, slow, signal),
  stopAudio: () => stopAudio(),
  getAudioSpeed: () => 1,
  vibrate: jest.fn(),
}));

function expectedSize(n: number, zoneWidth: number): number {
  const bases = [0, 96, 84, 70, 54, 44, 44, 44, 44, 44, 44];
  const scale = zoneWidth < 184 ? zoneWidth / 184 : 1;
  return Math.max(COUNT_CARD_MIN_SIZE, Math.round(bases[n] * scale));
}

describe('countCardLayout', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'matches the ten-frame table at 184px for n=%s',
    (n) => {
      const layout = countCardLayout(n, 184);
      const table: Record<number, { size: number; step: number; rowStep: number; width: number; height: number }> = {
        1: { size: 96, step: 0, rowStep: 0, width: 96, height: 96 },
        2: { size: 84, step: 66, rowStep: 0, width: 150, height: 88 },
        3: { size: 70, step: 55, rowStep: 0, width: 180, height: 74 },
        4: { size: 54, step: 42, rowStep: 0, width: 180, height: 58 },
        5: { size: 44, step: 34, rowStep: 0, width: 180, height: 48 },
        6: { size: 44, step: 34, rowStep: 38, width: 180, height: 86 },
        7: { size: 44, step: 34, rowStep: 38, width: 180, height: 86 },
        8: { size: 44, step: 34, rowStep: 38, width: 180, height: 86 },
        9: { size: 44, step: 34, rowStep: 38, width: 180, height: 86 },
        10: { size: 44, step: 34, rowStep: 38, width: 180, height: 86 },
      };
      expect(layout).toMatchObject(table[n]);
      expect(layout.positions).toHaveLength(n);
      expect(layout.width).toBeLessThanOrEqual(184);
      expect(layout.height).toBeLessThanOrEqual(96);
      expect(layout.positions[0]).toMatchObject({ right: 0, top: 0 });
      if (n >= 6) {
        expect(layout.positions[5]?.top).toBe(layout.rowStep);
        expect(layout.positions[5]?.right).toBe(0);
      }
    }
  );

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'scales to the 154px zone without overflowing for n=%s',
    (n) => {
      const layout = countCardLayout(n, 154);
      const size = expectedSize(n, 154);
      const step = n === 1 ? 0 : Math.round(size * 0.78);
      const cols = Math.min(5, n);
      expect(layout.size).toBe(size);
      expect(layout.size).toBeGreaterThanOrEqual(COUNT_CARD_MIN_SIZE);
      expect(layout.step).toBe(step);
      expect(layout.positions).toHaveLength(n);
      expect(layout.width).toBeLessThanOrEqual(154);
      expect(layout.height).toBeLessThanOrEqual(96);
      expect(layout.width).toBe(n === 1 ? size : size + step * (cols - 1));
    }
  );
});

function countingExercise(): Exercise {
  return {
    id: 'm1l1e1',
    type: 'intro',
    prompt: '🍎',
    audio_script:
      'سلام فریبا جون! شما عددها را خوب بلدید و هر روز با آن‌ها کار می‌کنید. اینجا آرام و با حوصله شروع می‌کنیم: یک سیب، دو گنجشک، سه انار.',
    payload: {
      display: '🍎  🐦🐦  🍇🍇🍇',
      visual: '',
      teaches: [],
      labels: ['یک سیب', 'دو گنجشک', 'سه انار'],
    },
    answer: '',
    distractors: [],
    feedback_correct: 'خب، حالا تمرین کنیم.',
    feedback_wrong: '',
  };
}

function hangUntilAbort(_text: string, _slow?: boolean, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const onAbort = () => resolve();
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

describe('count-along cancellation', () => {
  beforeEach(() => {
    playAudio.mockReset();
    stopAudio.mockReset();
    playAudio.mockImplementation(hangUntilAbort);
  });

  afterEach(() => {
    cleanup();
  });

  it('cancels the in-flight count-along when another card is tapped', async () => {
    const user = userEvent.setup();
    render(<IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay={false} />);

    await user.click(screen.getByRole('button', { name: 'یک سیب' }));
    expect(playAudio).toHaveBeenCalledWith('یک', false, expect.any(AbortSignal));
    const firstSignal = playAudio.mock.calls[0]?.[2];
    expect(firstSignal?.aborted).toBe(false);

    await user.click(screen.getByRole('button', { name: 'دو گنجشک' }));
    expect(firstSignal?.aborted).toBe(true);
    expect(playAudio).toHaveBeenCalledWith('یک', false, expect.any(AbortSignal));
    expect(playAudio.mock.calls.length).toBeGreaterThan(1);
  });

  it('cancels count-along when leaving the step', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay={false} />
    );

    await user.click(screen.getByRole('button', { name: 'سه انار' }));
    expect(playAudio).toHaveBeenCalled();
    const signal = playAudio.mock.calls[0]?.[2];
    unmount();
    expect(signal?.aborted).toBe(true);
    expect(stopAudio).toHaveBeenCalled();
  });
});
