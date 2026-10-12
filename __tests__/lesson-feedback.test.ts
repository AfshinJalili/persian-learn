import { describe, expect, it } from '@jest/globals';
import { feedbackKind } from '../lib/lesson-feedback';
import { exerciseChoices, shuffleSeeded } from '../lib/shuffle';

describe('feedbackKind', () => {
  it('marks a matching answer as correct', () => {
    expect(feedbackKind(true, 0)).toBe('correct');
    expect(feedbackKind(true, 4)).toBe('correct');
  });

  it('gives a hint on the first miss', () => {
    expect(feedbackKind(false, 0)).toBe('hint');
  });

  it('reveals the answer on the second miss', () => {
    expect(feedbackKind(false, 1)).toBe('reveal');
  });
});

describe('shuffleSeeded', () => {
  it('is stable for the same seed', () => {
    const items = ['آ', 'ب', 'پ', 'ت'];
    expect(shuffleSeeded(items, 'a1')).toEqual(shuffleSeeded(items, 'a1'));
  });

  it('does not always put the answer first', () => {
    const firsts = new Set(
      ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'].map(
        (id) => exerciseChoices({ id, answer: '۱', distractors: ['۲', '۳'] })[0]
      )
    );
    expect(firsts.size).toBeGreaterThan(1);
  });
});
