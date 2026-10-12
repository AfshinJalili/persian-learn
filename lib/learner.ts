/** Hardcoded learner name. Onboarding no longer asks what to call the user. */
export const LEARNER_NAME = 'فریبا جون';

export function homeGreeting(): string {
  return `سلام ${LEARNER_NAME}! بیایید درس امروز را شروع کنیم.`;
}

export function lessonCompleteTitle(): string {
  return `آفرین، ${LEARNER_NAME}!`;
}

export function lessonCompleteSpoken(lessonLine: string): string {
  return `${lessonCompleteTitle()} ${lessonLine}`;
}
