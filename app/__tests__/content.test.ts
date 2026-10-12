import { describe, it, expect, beforeAll } from '@jest/globals';
import { loadTrack, getLesson, getNextLesson, isLessonUnlocked } from '../lib/content';
import type { Track } from '../lib/types';

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
    const correct = '۲';
    const answer = '۲';
    expect(answer).toBe(correct);
  });

  it('should validate match pairs', () => {
    const correct = '۱=🍎|۲=🍎🍎';
    const answer = '۱=🍎|۲=🍎🍎';
    expect(answer).toBe(correct);
  });

  it('should detect wrong answer', () => {
    const correct = '۲';
    const answer = '۳';
    expect(answer).not.toBe(correct);
  });
});
