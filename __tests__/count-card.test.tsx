import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Exercise } from '../lib/types';
import IntroExercise from '../components/exercises/IntroExercise';
import {
  COUNT_CARD_GAP_MIN,
  COUNT_CARD_MIN_SIZE,
  countCardLayout,
} from '../components/exercises/CountCard';

const playAudio = jest.fn<(text: string, slow?: boolean, signal?: AbortSignal) => Promise<void>>();
const stopAudio = jest.fn();
const getAudioSpeed = jest.fn(() => 1);

jest.mock('@/lib/audio', () => ({
  playAudio: (text: string, slow?: boolean, signal?: AbortSignal) => playAudio(text, slow, signal),
  stopAudio: () => stopAudio(),
  getAudioSpeed: () => getAudioSpeed(),
  vibrate: jest.fn(),
}));

function itemBoxes(n: number, zoneWidth: number) {
  const layout = countCardLayout(n, zoneWidth, 120);
  return layout.positions.map((position) => ({
    left: position.right,
    right: position.right + layout.size,
    top: position.top,
    bottom: position.top + layout.size,
    size: layout.size,
  }));
}

describe('countCardLayout', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'keeps equal item sizes and at least 8px gaps for n=%s',
    (n) => {
      for (const zoneWidth of [208, 192, 184, 154]) {
        const layout = countCardLayout(n, zoneWidth);
        expect(layout.size).toBeGreaterThanOrEqual(COUNT_CARD_MIN_SIZE);
        expect(layout.positions).toHaveLength(n);
        expect(new Set(layout.positions.map(() => layout.size)).size).toBe(1);
        if (n >= 6) {
          expect(layout.rows).toBe(2);
          expect(layout.cols).toBe(5);
          expect(layout.positions[5]?.top).toBe(layout.size + layout.gap);
          expect(layout.positions[5]?.right).toBe(0);
        } else {
          expect(layout.rows).toBe(1);
          expect(layout.cols).toBe(n);
        }
        if (n > 1) {
          expect(layout.gap).toBeGreaterThanOrEqual(COUNT_CARD_GAP_MIN);
          expect(layout.step).toBe(layout.size + layout.gap);
        }
        const boxes = itemBoxes(n, zoneWidth);
        for (let i = 0; i < boxes.length; i += 1) {
          for (let j = i + 1; j < boxes.length; j += 1) {
            const a = boxes[i];
            const b = boxes[j];
            const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlapX > 0 && overlapY > 0) {
              throw new Error(`items ${i} and ${j} overlap at zone ${zoneWidth}`);
            }
            const sameRow = a.top === b.top;
            const sameCol = a.left === b.left;
            if (sameRow) {
              const gap = Math.max(a.left, b.left) - Math.min(a.right, b.right);
              expect(gap).toBeGreaterThanOrEqual(COUNT_CARD_GAP_MIN);
            }
            if (sameCol && n > 5) {
              const gap = Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom);
              expect(gap).toBeGreaterThanOrEqual(COUNT_CARD_GAP_MIN);
            }
          }
        }
      }
    }
  );

  it('uses a 5+5 ten-frame for counts 6-10', () => {
    const layout = countCardLayout(10, 208);
    expect(layout.cols).toBe(5);
    expect(layout.rows).toBe(2);
    expect(layout.gap).toBe(12);
    expect(layout.size).toBeGreaterThanOrEqual(32);
    expect(layout.width).toBe(5 * layout.size + 4 * layout.gap);
    expect(layout.height).toBe(2 * layout.size + layout.gap);
  });
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
    getAudioSpeed.mockReturnValue(1);
    playAudio.mockImplementation(hangUntilAbort);
  });

  afterEach(() => {
    cleanup();
  });

  it('cancels the in-flight count-along when another card is tapped', async () => {
    const user = userEvent.setup();
    render(<IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay={false} />);

    await user.click(screen.getByRole('button', { name: 'سه انار' }));
    expect(playAudio.mock.calls[0]?.[0]).toBe('سه');
    expect(playAudio).toHaveBeenCalledWith('سه', false, expect.any(AbortSignal));
    const firstSignal = playAudio.mock.calls[0]?.[2];
    expect(firstSignal?.aborted).toBe(false);

    await user.click(screen.getByRole('button', { name: 'دو گنجشک' }));
    expect(firstSignal?.aborted).toBe(true);
    expect(playAudio).toHaveBeenCalledWith('دو', false, expect.any(AbortSignal));
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

describe('Continue gating', () => {
  beforeEach(() => {
    playAudio.mockReset();
    stopAudio.mockReset();
    getAudioSpeed.mockReturnValue(20);
    playAudio.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('autoplay says the tap-the-card hint', async () => {
    render(<IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay />);
    await waitFor(() => {
      expect(playAudio).toHaveBeenCalledWith(
        'هر کارت را بزنید تا عددش را بشنوید.',
        false,
        expect.any(AbortSignal)
      );
    });
  });

  it('marks a card heard after its first clip even if the rest is cancelled', async () => {
    const user = userEvent.setup();
    let first = true;
    playAudio.mockImplementation((text, slow, signal) => {
      if (first) {
        first = false;
        return Promise.resolve();
      }
      return hangUntilAbort(text, slow, signal);
    });
    render(<IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay={false} />);

    await user.click(screen.getByRole('button', { name: 'یک سیب' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'یک سیب' })).toHaveAttribute('data-heard', 'true');
    });

    await user.click(screen.getByRole('button', { name: 'دو گنجشک' }));
    expect(screen.getByRole('button', { name: 'یک سیب' })).toHaveAttribute('data-heard', 'true');
    expect(screen.getByRole('button', { name: 'ادامه' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps ادامه soft-disabled until every card has been heard', async () => {
    const user = userEvent.setup();
    const onContinue = jest.fn();
    render(
      <IntroExercise exercise={countingExercise()} onContinue={onContinue} autoplay={false} />
    );

    const continueBtn = screen.getByRole('button', { name: 'ادامه' });
    expect(continueBtn).not.toBeDisabled();
    expect(continueBtn).toHaveAttribute('aria-disabled', 'true');

    await user.click(continueBtn);
    expect(onContinue).not.toHaveBeenCalled();
    expect(playAudio.mock.calls.some((call) => call[0] === 'اول کارت‌ها را بزنید')).toBe(true);
    expect(screen.getByRole('button', { name: 'یک سیب' })).toHaveClass('invite');

    await user.click(screen.getByRole('button', { name: 'یک سیب' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'یک سیب' })).toHaveAttribute('data-heard', 'true');
    });
    expect(continueBtn).toHaveAttribute('aria-disabled', 'true');

    await user.click(screen.getByRole('button', { name: 'دو گنجشک' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'دو گنجشک' })).toHaveAttribute('data-heard', 'true');
    });
    expect(continueBtn).toHaveAttribute('aria-disabled', 'true');

    await user.click(screen.getByRole('button', { name: 'سه انار' }));
    await waitFor(() => {
      expect(continueBtn).toHaveAttribute('aria-disabled', 'false');
    });
    expect(screen.getByRole('button', { name: 'سه انار' })).toHaveAttribute('data-heard', 'true');
    await user.click(continueBtn);
    expect(onContinue).toHaveBeenCalled();
  });
});
