import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchPairsExercise from '../components/exercises/MatchPairsExercise';
import type { Exercise } from '../lib/types';

jest.mock('@/lib/audio', () => ({
  playAudio: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/components/SpeakerButton', () => ({
  __esModule: true,
  default: () => <button type="button">speaker</button>,
}));

function exercise(): Exercise {
  return {
    id: 'a1l1e9',
    type: 'match_pairs',
    prompt: 'وصل کنید',
    audio_script: 'هر حرف را به شکل چسبیده وصل کنید.',
    payload: {},
    answer: 'ب=بـ|ن=نـ',
    distractors: [],
    feedback_correct: 'ok',
    feedback_wrong: 'no',
  };
}

describe('MatchPairsExercise selection order', () => {
  it('pairs when the right column is tapped first', async () => {
    const user = userEvent.setup();
    const onAnswerChange = jest.fn();
    render(
      <MatchPairsExercise
        exercise={exercise()}
        userAnswer=""
        onAnswerChange={onAnswerChange}
        disabled={false}
      />
    );

    expect(screen.getByRole('button', { name: 'بـ' })).not.toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'بـ' }));
    await user.click(screen.getByRole('button', { name: 'ب' }));
    await user.click(screen.getByRole('button', { name: 'نـ' }));
    await user.click(screen.getByRole('button', { name: 'ن' }));

    await waitFor(() => {
      expect(onAnswerChange).toHaveBeenCalled();
    });
  });

  it('switches selection when another item in the same column is tapped', async () => {
    const user = userEvent.setup();
    const onAnswerChange = jest.fn();
    render(
      <MatchPairsExercise
        exercise={exercise()}
        userAnswer=""
        onAnswerChange={onAnswerChange}
        disabled={false}
      />
    );

    await user.click(screen.getByRole('button', { name: 'ب' }));
    await user.click(screen.getByRole('button', { name: 'ن' }));
    await user.click(screen.getByRole('button', { name: 'نـ' }));

    expect(onAnswerChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'ب' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'بـ' })).not.toBeDisabled();
  });
});

describe('MatchPairsExercise retry', () => {
  it('clears used pairs when the parent starts a retry', async () => {
    const user = userEvent.setup();
    const onAnswerChange = jest.fn();
    const item = exercise();
    const { rerender } = render(
      <MatchPairsExercise
        exercise={item}
        userAnswer=""
        onAnswerChange={onAnswerChange}
        disabled={false}
      />
    );

    await user.click(screen.getByRole('button', { name: 'ب' }));
    await user.click(screen.getByRole('button', { name: 'بـ' }));
    await user.click(screen.getByRole('button', { name: 'ن' }));
    await user.click(screen.getByRole('button', { name: 'نـ' }));

    await waitFor(() => {
      expect(onAnswerChange).toHaveBeenCalled();
    });

    const matched = String(onAnswerChange.mock.calls.at(-1)?.[0] ?? '');
    rerender(
      <MatchPairsExercise
        exercise={item}
        userAnswer={matched}
        onAnswerChange={onAnswerChange}
        disabled={true}
      />
    );

    expect(screen.getByRole('button', { name: 'ب' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'ن' })).toBeDisabled();

    rerender(
      <MatchPairsExercise
        exercise={item}
        userAnswer=""
        onAnswerChange={onAnswerChange}
        disabled={false}
      />
    );

    expect(screen.getByRole('button', { name: 'ب' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'ن' })).not.toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'ب' }));
    expect(screen.getByRole('button', { name: 'بـ' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'نـ' })).not.toBeDisabled();
  });
});

function appleExercise(): Exercise {
  return {
    id: 'm1l4e2',
    type: 'match_pairs',
    prompt: '🔗',
    audio_script: 'هر عدد را به تصویری وصل کنید که همان تعداد سیب دارد.',
    payload: {},
    answer: '۱=🍎|۲=🍎🍎|۳=🍎🍎🍎',
    distractors: [],
    feedback_correct: 'ok',
    feedback_wrong: 'no',
  };
}

describe('MatchPairsExercise object rows', () => {
  it('sizes match-pair items from the list container and caps a single item', () => {
    const { container } = render(
      <MatchPairsExercise
        exercise={appleExercise()}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(container.querySelector('.match-object-list')).toBeTruthy();
    const clusters = [...container.querySelectorAll('.match-object-apples .object-cluster')] as HTMLElement[];
    expect(clusters).toHaveLength(3);
    const sizeByCount = Object.fromEntries(
      clusters.map((cluster) => [
        cluster.getAttribute('data-count'),
        Number.parseInt(cluster.style.getPropertyValue('--object-size') || '0', 10),
      ])
    );
    expect(sizeByCount['1']).toBeLessThanOrEqual(96);
    expect(sizeByCount['3']).toBeGreaterThanOrEqual(32);
    expect(clusters.every((cluster) => cluster.getAttribute('data-layout') === 'row')).toBe(true);
  });

  it('pairs a number onto a slot when the number is tapped first', async () => {
    const user = userEvent.setup();
    const onAnswerChange = jest.fn();
    render(
      <MatchPairsExercise
        exercise={appleExercise()}
        userAnswer=""
        onAnswerChange={onAnswerChange}
        disabled={false}
      />
    );

    await user.click(screen.getByRole('button', { name: '۱' }));
    await user.click(screen.getByRole('button', { name: '🍎' }));
    await user.click(screen.getByRole('button', { name: '۲' }));
    await user.click(screen.getByRole('button', { name: '🍎🍎' }));
    await user.click(screen.getByRole('button', { name: '۳' }));
    await user.click(screen.getByRole('button', { name: '🍎🍎🍎' }));

    await waitFor(() => {
      expect(onAnswerChange).toHaveBeenCalled();
    });
  });

  it('pairs a number onto a slot when the number is dragged', async () => {
    const onAnswerChange = jest.fn();
    render(
      <MatchPairsExercise
        exercise={appleExercise()}
        userAnswer=""
        onAnswerChange={onAnswerChange}
        disabled={false}
      />
    );

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, value: string) {
        this.data[type] = value;
      },
      getData(type: string) {
        return this.data[type] ?? '';
      },
      effectAllowed: 'all',
    };

    fireEvent.dragStart(screen.getByRole('button', { name: '۱' }), { dataTransfer });
    fireEvent.dragOver(screen.getByRole('button', { name: '🍎' }), { dataTransfer });
    fireEvent.drop(screen.getByRole('button', { name: '🍎' }), { dataTransfer });
    fireEvent.dragStart(screen.getByRole('button', { name: '۲' }), { dataTransfer });
    fireEvent.drop(screen.getByRole('button', { name: '🍎🍎' }), { dataTransfer });
    fireEvent.dragStart(screen.getByRole('button', { name: '۳' }), { dataTransfer });
    fireEvent.drop(screen.getByRole('button', { name: '🍎🍎🍎' }), { dataTransfer });

    await waitFor(() => {
      expect(onAnswerChange).toHaveBeenCalled();
    });
  });

  it('wraps 8-10 objects at 32px or larger instead of one shrinking row', () => {
    const { container } = render(
      <MatchPairsExercise
        exercise={{
          id: 'm3l3e9',
          type: 'match_pairs',
          prompt: '🔗',
          audio_script: 'هر عدد را به تصویری وصل کنید که همان تعداد نان دارد.',
          payload: {},
          answer: '۸=🍞🍞🍞🍞🍞🍞🍞🍞|۹=🍞🍞🍞🍞🍞🍞🍞🍞🍞|۱۰=🍞🍞🍞🍞🍞🍞🍞🍞🍞🍞',
          distractors: [],
          feedback_correct: 'ok',
          feedback_wrong: 'no',
        }}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    const clusters = [...container.querySelectorAll('.match-object-apples .object-cluster')] as HTMLElement[];
    expect(clusters).toHaveLength(3);
    const ten = clusters.find((cluster) => cluster.getAttribute('data-count') === '10');
    expect(ten).toHaveAttribute('data-layout', 'row');
    expect(ten?.style.getPropertyValue('--object-cols')).toBe('5');
    expect(ten?.style.getPropertyValue('--object-rows')).toBe('2');
    const size = Number.parseInt(ten?.style.getPropertyValue('--object-size') ?? '0', 10);
    expect(size).toBeGreaterThanOrEqual(32);
  });

  it('lays 6 objects in a filled 5x2 row instead of a compact grid with empty cells', () => {
    const { container } = render(
      <MatchPairsExercise
        exercise={{
          id: 'm3l1e9',
          type: 'match_pairs',
          prompt: '🔗',
          audio_script: 'هر عدد را به تصویری وصل کنید که همان تعداد پرتقال دارد.',
          payload: {},
          answer: '۴=🍊🍊🍊🍊|۵=🍊🍊🍊🍊🍊|۶=🍊🍊🍊🍊🍊🍊',
          distractors: [],
          feedback_correct: 'ok',
          feedback_wrong: 'no',
        }}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    const clusters = [...container.querySelectorAll('.match-object-apples .object-cluster')] as HTMLElement[];
    const six = clusters.find((cluster) => cluster.getAttribute('data-count') === '6');
    expect(six).toHaveAttribute('data-layout', 'row');
    expect(six?.style.getPropertyValue('--object-cols')).toBe('5');
    expect(six?.style.getPropertyValue('--object-rows')).toBe('2');
    const size = Number.parseInt(six?.style.getPropertyValue('--object-size') ?? '0', 10);
    expect(size).toBeGreaterThanOrEqual(32);
  });

  it('fills five apples across the row at 32px or larger', () => {
    const { container } = render(
      <MatchPairsExercise
        exercise={{
          id: 'm2l1e9',
          type: 'match_pairs',
          prompt: '🔗',
          audio_script: 'هر عدد را به تصویری وصل کنید که همان تعداد سیب دارد.',
          payload: {},
          answer: '۴=🍎🍎🍎🍎|۵=🍎🍎🍎🍎🍎',
          distractors: [],
          feedback_correct: 'ok',
          feedback_wrong: 'no',
        }}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    const tray = container.querySelector('[data-match-tray]');
    const list = container.querySelector('.match-object-list');
    expect(tray).toBeTruthy();
    expect(list?.nextElementSibling).toBe(tray);
    const five = container.querySelector('[data-count="5"]') as HTMLElement | null;
    expect(five).toHaveAttribute('data-layout', 'row');
    expect(five?.style.getPropertyValue('--object-cols')).toBe('5');
    expect(five?.style.getPropertyValue('--object-rows')).toBe('1');
    const size = Number.parseInt(five?.style.getPropertyValue('--object-size') ?? '0', 10);
    expect(size).toBeGreaterThanOrEqual(32);
  });

  it('uses the object tray layout for finger pairs', () => {
    const { container } = render(
      <MatchPairsExercise
        exercise={{
          id: 'm2l4e9',
          type: 'match_pairs',
          prompt: '🔗',
          audio_script: 'هر عدد را به انگشت‌هایش وصل کنید.',
          payload: {},
          answer: '۱=☝️|۲=✌️|۵=✋',
          distractors: [],
          feedback_correct: 'ok',
          feedback_wrong: 'no',
        }}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(container.querySelector('[data-match-tray]')).toBeTruthy();
    expect(container.querySelectorAll('.match-object-row')).toHaveLength(3);
    const sizes = [...container.querySelectorAll('.match-object-apples .object-cluster')].map((cluster) =>
      Number.parseInt((cluster as HTMLElement).style.getPropertyValue('--object-size') || '0', 10)
    );
    expect(sizes.every((size) => size >= 32)).toBe(true);
  });
});
