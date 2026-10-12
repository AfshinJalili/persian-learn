import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import CompareMoreLessExercise from '../components/exercises/CompareMoreLessExercise';
import type { Exercise } from '../lib/types';

jest.mock('@/lib/audio', () => ({
  playAudio: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/components/SpeakerButton', () => ({
  __esModule: true,
  default: () => <button type="button">speaker</button>,
}));

function exercise(ask: 'more' | 'less'): Exercise {
  return {
    id: 'm5l1e4',
    type: 'compare_more_less',
    prompt: '⚖️',
    audio_script: 'کدام طرف ترازو کمتر دارد؟',
    payload: { left: '🍞🍞', right: '🍞🍞🍞🍞', ask },
    answer: 'left',
    distractors: ['right', 'equal'],
    feedback_correct: 'ok',
    feedback_wrong: 'no',
  };
}

describe('CompareMoreLessExercise', () => {
  it('shows the less prompt when payload.ask is less', () => {
    render(
      <CompareMoreLessExercise
        exercise={exercise('less')}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(screen.getByText('کدام کمتر است؟')).toBeInTheDocument();
    expect(screen.queryByText('کدام بیشتر است؟')).not.toBeInTheDocument();
  });

  it('shows the more prompt when payload.ask is more', () => {
    render(
      <CompareMoreLessExercise
        exercise={exercise('more')}
        userAnswer=""
        onAnswerChange={() => {}}
        disabled={false}
      />
    );
    expect(screen.getByText('کدام بیشتر است؟')).toBeInTheDocument();
  });
});
