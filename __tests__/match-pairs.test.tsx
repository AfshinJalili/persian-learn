import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('MatchPairsExercise object rows', () => {
  it('keeps every apple the same size in a 1-2-3 question', () => {
    const { container } = render(
      <MatchPairsExercise
        exercise={{
          id: 'm1l4e2',
          type: 'match_pairs',
          prompt: '🔗',
          audio_script: 'هر عدد را به تصویری وصل کنید که همان تعداد سیب دارد.',
          payload: {},
          answer: '۱=🍎|۲=🍎🍎|۳=🍎🍎🍎',
          distractors: [],
          feedback_correct: 'ok',
          feedback_wrong: 'no',
        }}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    const clusters = [...container.querySelectorAll('.match-object-apples .object-cluster')];
    const sizes = clusters.map((cluster) => (cluster as HTMLElement).style.getPropertyValue('--object-size'));
    expect(sizes.length).toBe(3);
    expect(new Set(sizes).size).toBe(1);
    expect(sizes[0]).not.toBe('24px');
    const items = [...container.querySelectorAll('.match-object-apples .illus')] as HTMLElement[];
    expect(new Set(items.map((item) => item.style.width)).size).toBe(1);
  });
});
