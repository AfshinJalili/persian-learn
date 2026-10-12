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
    const clusters = [...container.querySelectorAll('.object-cluster')] as HTMLElement[];
    expect(clusters).toHaveLength(3);
    const sizeByCount = Object.fromEntries(
      clusters.map((cluster) => [
        cluster.getAttribute('data-count'),
        Number.parseInt(cluster.style.getPropertyValue('--object-size') || '0', 10),
      ])
    );
    expect(sizeByCount['1']).toBeGreaterThan(sizeByCount['3']);
    expect(sizeByCount['3']).toBeGreaterThanOrEqual(32);
    expect(sizeByCount['1']).not.toBe(24);
  });

  it('stacks high-count cards so items can stay at 32px', () => {
    const { container } = render(
      <TapPictureExercise
        exercise={tapExercise(['🍎🍎🍎🍎🍎', '🍎🍎🍎🍎🍎🍎🍎'])}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(container.querySelector('.cluster-stack')).toBeTruthy();
    const sizes = [...container.querySelectorAll('.object-cluster')].map((cluster) =>
      Number.parseInt((cluster as HTMLElement).style.getPropertyValue('--object-size') || '0', 10)
    );
    expect(sizes.every((size) => size >= 32)).toBe(true);
    const seven = container.querySelector('[data-count="7"]') as HTMLElement | null;
    expect(seven).toBeTruthy();
    expect(
      Number.parseInt(seven?.style.getPropertyValue('--object-size') || '0', 10)
    ).toBeGreaterThanOrEqual(32);
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
