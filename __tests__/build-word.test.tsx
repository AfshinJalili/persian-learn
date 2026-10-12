import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BuildWordExercise from '../components/exercises/BuildWordExercise';
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
    id: 'a1l2e8',
    type: 'build_word',
    prompt: 'بسازید',
    audio_script: 'با حرف‌ها واژه بسازید.',
    payload: { picture: '🍞', letters: ['ن', 'ا', 'ن'] },
    answer: 'نان',
    distractors: [],
    feedback_correct: 'ok',
    feedback_wrong: 'no',
  };
}

describe('BuildWordExercise undo', () => {
  it('returns a placed letter before check', async () => {
    const user = userEvent.setup();
    const onAnswerChange = jest.fn();
    const { container } = render(
      <BuildWordExercise
        exercise={exercise()}
        userAnswer=""
        onAnswerChange={onAnswerChange}
        disabled={false}
      />
    );

    const tray = screen.getByRole('button', { name: 'ا' });
    const noonTiles = screen.getAllByRole('button', { name: 'ن' });
    await user.click(noonTiles[0] as HTMLElement);
    await user.click(tray);
    expect(onAnswerChange).toHaveBeenLastCalledWith('نا');
    expect(container.querySelector('[data-build-placed="ا"]')).toBeTruthy();

    await user.click(container.querySelector('[data-build-placed="ا"]') as HTMLElement);
    expect(container.querySelector('[data-build-placed="ا"]')).toBeNull();
    expect(onAnswerChange).toHaveBeenLastCalledWith('ن');

    await user.click(screen.getByRole('button', { name: 'ا' }));
    expect(container.querySelector('[data-build-placed="ا"]')).toBeTruthy();
    expect(onAnswerChange).toHaveBeenLastCalledWith('نا');
  });

  it('does not undo a placed letter after check', async () => {
    const user = userEvent.setup();
    const onAnswerChange = jest.fn();
    const { container, rerender } = render(
      <BuildWordExercise
        exercise={exercise()}
        userAnswer=""
        onAnswerChange={onAnswerChange}
        disabled={false}
      />
    );

    const noonTiles = screen.getAllByRole('button', { name: 'ن' });
    await user.click(noonTiles[0] as HTMLElement);
    expect(container.querySelector('[data-build-placed="ن"]')).toBeTruthy();

    rerender(
      <BuildWordExercise
        exercise={exercise()}
        userAnswer="ن"
        onAnswerChange={onAnswerChange}
        disabled={true}
      />
    );

    const placed = container.querySelector('[data-build-placed="ن"]') as HTMLButtonElement;
    expect(placed).toBeDisabled();
    onAnswerChange.mockClear();
    fireEvent.click(placed);
    expect(container.querySelector('[data-build-placed="ن"]')).toBeTruthy();
    expect(onAnswerChange).not.toHaveBeenCalled();
  });
});
