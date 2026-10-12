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

export function exerciseChoices(exercise: {
  id: string;
  answer: string;
  distractors: string[];
}): string[] {
  return shuffleSeeded([exercise.answer, ...exercise.distractors], exercise.id);
}
