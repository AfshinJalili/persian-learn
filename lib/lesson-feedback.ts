export type FeedbackKind = 'correct' | 'hint' | 'reveal';

export function feedbackKind(correct: boolean, previousAttempts: number): FeedbackKind {
  if (correct) {
    return 'correct';
  }
  if (previousAttempts === 0) {
    return 'hint';
  }
  return 'reveal';
}
