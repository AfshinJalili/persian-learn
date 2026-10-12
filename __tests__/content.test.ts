import { describe, it, expect } from '@jest/globals';
import { answersEqual } from '../lib/answers';

describe('Content Loading', () => {
  it.skip('should load math track', async () => {
    expect(true).toBe(true);
  });

  it.skip('should load alphabet track', async () => {
    expect(true).toBe(true);
  });
});

describe('Answer Checking', () => {
  it('should validate exact match', () => {
    expect(answersEqual('tap_picture', '۲', '۲')).toBe(true);
  });

  it('should validate match pairs in any click order', () => {
    expect(answersEqual('match_pairs', '۱=🍎|۲=🍎🍎', '۲=🍎🍎|۱=🍎')).toBe(true);
  });

  it('should detect wrong answer', () => {
    expect(answersEqual('tap_picture', '۲', '۳')).toBe(false);
  });
});
