import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react';
import ChooseDigitExercise from '../components/exercises/ChooseDigitExercise';
import type { Exercise } from '../lib/types';

jest.mock('@/lib/audio', () => ({
  playAudio: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/components/SpeakerButton', () => ({
  __esModule: true,
  default: () => <button type="button">speaker</button>,
}));

function exercise(overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'payload' | 'answer'>): Exercise {
  return {
    type: 'choose_digit',
    prompt: '؟',
    audio_script: 'test',
    distractors: ['۱', '۲'],
    feedback_correct: 'ok',
    feedback_wrong: 'no',
    ...overrides,
  };
}

describe('ChooseDigitExercise', () => {
  it('renders a numeral sequence that can fit inside the prompt card', () => {
    const { container } = render(
      <ChooseDigitExercise
        exercise={exercise({
          id: 'm3l3e7',
          payload: { display: '۷ ۸ ۹ ؟' },
          answer: '۱۰',
        })}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(container.querySelector('[data-digit-sequence]')).toBeTruthy();
    const sequence = container.querySelector('.digit-sequence') as HTMLElement | null;
    expect(sequence).toBeTruthy();
    expect(sequence?.className).toContain('digit-sequence');
    expect(container.querySelector('[data-digit-display]')).toBeNull();
  });

  it('renders hands as an object cluster instead of a giant glyph', () => {
    const { container } = render(
      <ChooseDigitExercise
        exercise={exercise({
          id: 'm2l4e2',
          payload: { display: '✋' },
          answer: '۵',
        })}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(container.querySelector('[data-object-display] .object-cluster')).toBeTruthy();
    expect(container.querySelector('[data-object-display] .illus[data-glyph="hand"]')).toBeTruthy();
    expect(container.querySelector('[data-digit-display]')).toBeNull();
  });

  it('splits two hands into an object cluster instead of one oversized glyph', () => {
    const { container } = render(
      <ChooseDigitExercise
        exercise={exercise({
          id: 'm3l3e4',
          payload: { display: '✋✋' },
          answer: '۱۰',
          distractors: ['۹', '۸'],
        })}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    const cluster = container.querySelector('[data-object-display] .object-cluster') as HTMLElement | null;
    expect(cluster).toHaveAttribute('data-count', '2');
    expect(container.querySelectorAll('[data-object-display] .illus[data-glyph="hand"]')).toHaveLength(2);
    expect(container.querySelector('[data-digit-display]')).toBeNull();
  });
});
