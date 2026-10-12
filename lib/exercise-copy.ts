import type { Exercise } from '@/lib/types';

export function exerciseHeading(exercise: Exercise): string {
  const prompt = exercise.prompt?.trim() ?? '';
  if (!prompt || prompt === '؟' || prompt === '🔊' || /^[\u{1F300}-\u{1FAFF}\s]+$/u.test(prompt)) {
    return exercise.audio_script;
  }
  return prompt;
}
