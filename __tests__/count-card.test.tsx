import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Exercise } from '../lib/types';
import IntroExercise from '../components/exercises/IntroExercise';
import {
  COUNT_CARD_MIN_SIZE,
  COUNT_CARD_SIZES,
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

// Spec §3 table at the 184px design zone: n → [S, step, W, H].
const SPEC_TABLE: Record<number, [number, number, number, number]> = {
  1: [96, 0, 96, 96],
  2: [84, 66, 150, 88],
  3: [70, 55, 180, 74],
  4: [54, 42, 180, 58],
  5: [44, 34, 180, 48],
  6: [44, 34, 180, 86],
  7: [44, 34, 180, 86],
  8: [44, 34, 180, 86],
  9: [44, 34, 180, 86],
  10: [44, 34, 180, 86],
};

describe('countCardLayout', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])('matches the spec table at 184x96 for n=%s', (n) => {
    const layout = countCardLayout(n, 184, 96);
    const [size, step, width, height] = SPEC_TABLE[n];
    expect(layout.size).toBe(size);
    expect(layout.step).toBe(step);
    expect(layout.width).toBe(width);
    expect(layout.height).toBe(height);
    expect(layout.positions).toHaveLength(n);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    'overlap layout stays inside the zone (184, 181, 154) for n=%s',
    (n) => {
      for (const [zoneWidth, zoneHeight] of [
        [184, 96],
        [181, 102],
        [154, 96],
      ]) {
        const layout = countCardLayout(n, zoneWidth, zoneHeight);
        expect(layout.size).toBeGreaterThanOrEqual(COUNT_CARD_MIN_SIZE);
        if (n > 1) expect(layout.size).toBeLessThanOrEqual(COUNT_CARD_SIZES[Math.min(n, 5) - 1]);
        expect(layout.width).toBeLessThanOrEqual(zoneWidth);
        expect(layout.height).toBeLessThanOrEqual(zoneHeight);
        expect(layout.rows).toBe(n > 5 ? 2 : 1);
        expect(layout.cols).toBe(Math.min(n, 5));
        if (n > 1) {
          // 22% overlap: neighbours step by round(S × 0.78), never more.
          expect(layout.step).toBeLessThanOrEqual(Math.round(layout.size * 0.78));
          expect(layout.step).toBeGreaterThan(layout.size * 0.5);
        }
        for (const [index, position] of layout.positions.entries()) {
          const row = index < 5 ? 0 : 1;
          const col = index < 5 ? index : index - 5;
          // RTL start: item 1 (and the bottom row's first item) at the right.
          expect(position.right).toBe(col * layout.step);
          expect(position.top).toBe(row * layout.rowStep + (col % 2 === 1 ? 4 : 0));
          expect(position.right + layout.size).toBeLessThanOrEqual(layout.width);
          expect(position.top + layout.size).toBeLessThanOrEqual(layout.height);
        }
        // First-counted item on top; bottom row over the top row.
        const zs = layout.positions.slice(0, Math.min(n, 5)).map((p) => p.z);
        expect([...zs].sort((a, b) => b - a)).toEqual(zs);
        if (n > 5) expect(layout.positions[5].z).toBeGreaterThan(layout.positions[0].z);
      }
    }
  );

  it('hits the figma floors 96 / 84 / 70 in the 375px zone (181x102)', () => {
    expect(countCardLayout(1, 181, 102).size).toBeGreaterThanOrEqual(96);
    expect(countCardLayout(2, 181, 102).size).toBeGreaterThanOrEqual(84);
    expect(countCardLayout(3, 181, 102).size).toBeGreaterThanOrEqual(70);
  });

  it('scales down with a floor of 36 and tightens the step rather than wrapping', () => {
    const narrow = countCardLayout(5, 120, 96);
    expect(narrow.size).toBe(36);
    expect(narrow.width).toBeLessThanOrEqual(120);
    expect(narrow.rows).toBe(1);
    const ten = countCardLayout(10, 154, 96);
    expect(ten.rows).toBe(2);
    expect(ten.size).toBeLessThan(44);
    expect(ten.width).toBeLessThanOrEqual(154);
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
