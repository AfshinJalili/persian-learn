import type { ExerciseType } from './types';

export function canonicalizePairs(serialized: string): string {
  return serialized
    .split('|')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [left, right] = pair.split('=');
      return `${left ?? ''}=${right ?? ''}`;
    })
    .sort((a, b) => a.localeCompare(b))
    .join('|');
}

export function answersEqual(type: ExerciseType, expected: string, actual: string): boolean {
  if (type === 'match_pairs') {
    return canonicalizePairs(expected) === canonicalizePairs(actual);
  }
  return expected === actual;
}
