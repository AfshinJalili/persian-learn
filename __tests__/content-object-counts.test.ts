import { describe, expect, it } from '@jest/globals';
import { splitObjectTokens } from '../components/art/objects';
import alphabet from '../public/content/alphabet.json';
import math from '../public/content/math.json';

interface Exercise {
  id: string;
  type: string;
  answer: string;
  distractors: string[];
  payload: Record<string, unknown>;
}

const ALL_TEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function objectCountsOnScreen(exercise: Exercise): number[] {
  if (exercise.type === 'tap_picture' || exercise.type === 'listen_choose') {
    return [exercise.answer, ...exercise.distractors].map((token) => splitObjectTokens(token).length);
  }
  if (exercise.type === 'compare_more_less') {
    return [String(exercise.payload.left ?? ''), String(exercise.payload.right ?? '')].map(
      (token) => splitObjectTokens(token).length
    );
  }
  if (exercise.type === 'match_pairs') {
    return exercise.answer.split('|').map((pair) => splitObjectTokens(pair.split('=')[1] ?? '').length);
  }
  return [];
}

describe('real lesson object counts', () => {
  const exercises = [
    ...math.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.exercises)),
    ...alphabet.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.exercises)),
  ] as Exercise[];

  it('does not put counts 1 through 10 side by side on one screen', () => {
    const hits = exercises.filter((exercise) => {
      const counts = new Set(objectCountsOnScreen(exercise));
      return ALL_TEN.every((count) => counts.has(count));
    });
    expect(hits.map((exercise) => exercise.id)).toEqual([]);
  });
});
