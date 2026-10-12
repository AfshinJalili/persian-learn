import { describe, expect, it } from '@jest/globals';
import { isLessonUnlocked, resolveLessonAccess } from '../lib/content';
import type { Track } from '../lib/types';

const track: Track = {
  track: 'math',
  units: [
    {
      id: 'u1',
      title: 'one',
      emoji: '1',
      goal: '',
      lessons: [
        { id: 'm1l1', title: 'first', exercises: [] },
        { id: 'm1l2', title: 'second', exercises: [] },
      ],
    },
    {
      id: 'u2',
      title: 'two',
      emoji: '2',
      goal: '',
      lessons: [{ id: 'm2l1', title: 'third', exercises: [] }],
    },
  ],
};

describe('isLessonUnlocked', () => {
  it('unlocks the first lesson with no completions', () => {
    expect(isLessonUnlocked(track, 'm1l1', [])).toBe(true);
    expect(resolveLessonAccess(track, 'm1l1', [])?.id).toBe('m1l1');
  });

  it('keeps later lessons locked until the previous ones are done', () => {
    expect(isLessonUnlocked(track, 'm1l2', [])).toBe(false);
    expect(isLessonUnlocked(track, 'm2l1', ['m1l1'])).toBe(false);
    expect(resolveLessonAccess(track, 'm1l2', [])).toBeNull();
  });

  it('unlocks the next lesson after the prior one is completed', () => {
    expect(isLessonUnlocked(track, 'm1l2', ['m1l1'])).toBe(true);
    expect(isLessonUnlocked(track, 'm2l1', ['m1l1', 'm1l2'])).toBe(true);
    expect(resolveLessonAccess(track, 'm2l1', ['m1l1', 'm1l2'])?.id).toBe('m2l1');
  });

  it('treats a missing lesson id as locked so a direct URL cannot open it', () => {
    expect(isLessonUnlocked(track, 'm9l9', ['m1l1', 'm1l2', 'm2l1'])).toBe(false);
    expect(resolveLessonAccess(track, 'm9l9', ['m1l1', 'm1l2', 'm2l1'])).toBeNull();
  });
});
