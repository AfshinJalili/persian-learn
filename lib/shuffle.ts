export function shuffleSeeded<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }

  for (let i = arr.length - 1; i > 0; i -= 1) {
    hash = (Math.imul(hash, 1664525) + 1013904223) | 0;
    const j = Math.abs(hash) % (i + 1);
    const current = arr[i];
    const swap = arr[j];
    if (current === undefined || swap === undefined) {
      continue;
    }
    arr[i] = swap;
    arr[j] = current;
  }

  return arr;
}

export function sameOrder<T>(left: T[], right: T[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

/** Shuffle that is never identical to the original order when there are 2+ items. */
export function shuffleDeranged<T>(items: T[], seed: string): T[] {
  if (items.length < 2) return [...items];
  let shuffled = shuffleSeeded(items, seed);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!sameOrder(shuffled, items)) return shuffled;
    shuffled = shuffleSeeded(items, `${seed}:reroll:${attempt}`);
  }
  const forced = [...items];
  const first = forced[0];
  const second = forced[1];
  if (first !== undefined && second !== undefined) {
    forced[0] = second;
    forced[1] = first;
  }
  return forced;
}

export function exerciseChoices(exercise: {
  id: string;
  answer: string;
  distractors: string[];
}): string[] {
  return shuffleSeeded([exercise.answer, ...exercise.distractors], exercise.id);
}
