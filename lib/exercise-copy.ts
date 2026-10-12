import type { Exercise } from '@/lib/types';

export function exerciseHeading(exercise: Exercise): string {
  if (exercise.type === 'trace_letter') {
    const letter = (exercise.payload as { letter?: string }).letter || exercise.answer;
    return `حرف «${letter}» را با انگشت بکشید`;
  }
  const prompt = exercise.prompt?.trim() ?? '';
  if (!prompt || prompt === '؟' || prompt === '🔊' || /^[\u{1F300}-\u{1FAFF}\s]+$/u.test(prompt)) {
    return exercise.audio_script;
  }
  return prompt;
}

export function exerciseHeadingClass(exercise: Exercise): string | undefined {
  return /^[0-9۰-۹]{1,2}$/.test(exerciseHeading(exercise)) ? 'prompt-numeral' : undefined;
}
