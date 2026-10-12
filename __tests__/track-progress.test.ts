import { describe, expect, it } from '@jest/globals';
import { countTrackLessons, trackCompletionPercent } from '../lib/content';
import math from '../public/content/math.json';
import alphabet from '../public/content/alphabet.json';
import type { Track } from '../lib/types';

const mathTrack = math as Track;
const alphabetTrack = alphabet as Track;

describe('track progress from real lesson counts', () => {
  it('uses 57 math lessons rather than 50×2 percent', () => {
    expect(countTrackLessons(mathTrack)).toBe(57);
    const fifty = Array.from({ length: 50 }, (_, i) => `m-fake-${i}`);
    const completed = mathTrack.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)).slice(0, 50);
    expect(trackCompletionPercent(fifty, mathTrack)).toBe(0);
    expect(trackCompletionPercent(completed, mathTrack)).toBeCloseTo((50 / 57) * 100);
    expect(trackCompletionPercent(completed, mathTrack)).toBeLessThan(100);
  });

  it('reaches 100% only when every alphabet lesson is done', () => {
    const total = countTrackLessons(alphabetTrack);
    expect(total).toBeGreaterThan(50);
    const almost = alphabetTrack.units
      .flatMap((unit) => unit.lessons.map((lesson) => lesson.id))
      .slice(0, total - 10);
    expect(trackCompletionPercent(almost, alphabetTrack)).toBeCloseTo(((total - 10) / total) * 100);
    expect(trackCompletionPercent(almost, alphabetTrack)).toBeLessThan(100);
  });
});
