import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react';
import TapPictureExercise from '../components/exercises/TapPictureExercise';
import type { Exercise } from '../lib/types';

jest.mock('@/lib/audio', () => ({
  playAudio: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/components/SpeakerButton', () => ({
  __esModule: true,
  default: () => <button type="button">speaker</button>,
}));

function tapExercise(distractors: string[]): Exercise {
  return {
    id: 'm1l2e2',
    type: 'tap_picture',
    prompt: '🔊',
    audio_script: 'با یک نگاه: کدام دسته سه‌تایی است؟',
    payload: { display: '🔊' },
    answer: '🔵🔵🔵',
    distractors,
    feedback_correct: 'ok',
    feedback_wrong: 'no',
  };
}

describe('TapPictureExercise', () => {
  it('puts three picture choices on one row', () => {
    const { container } = render(
      <TapPictureExercise
        exercise={tapExercise(['🔵', '🔵🔵'])}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(container.querySelector('.grid3.picture-grid')).toBeTruthy();
    expect(container.querySelector('.grid2')).toBeNull();
  });

  it('keeps two picture choices in a two-column grid', () => {
    const { container } = render(
      <TapPictureExercise
        exercise={tapExercise(['🔵🔵'])}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(container.querySelector('.grid2')).toBeTruthy();
    expect(container.querySelector('.grid3')).toBeNull();
  });
});
