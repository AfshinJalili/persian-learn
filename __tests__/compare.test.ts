import { describe, expect, it } from '@jest/globals';
import { compareAsk, comparePrompt } from '../lib/compare';

describe('compare_more_less prompt', () => {
  it('asks which side has more when payload.ask is more', () => {
    expect(compareAsk('more')).toBe('more');
    expect(comparePrompt('more')).toBe('کدام بیشتر است؟');
  });

  it('asks which side has less when payload.ask is less', () => {
    expect(compareAsk('less')).toBe('less');
    expect(comparePrompt('less')).toBe('کدام کمتر است؟');
  });

  it('defaults unknown ask values to more without flipping the stored answer', () => {
    expect(comparePrompt(undefined)).toBe('کدام بیشتر است؟');
    expect(comparePrompt('equal')).toBe('کدام بیشتر است؟');
  });
});
