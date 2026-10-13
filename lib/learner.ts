/** Hardcoded learner name. Onboarding no longer asks what to call the user. */
export const LEARNER_NAME = 'فریبا جون';

export const HOME_GREETING_STORAGE_KEY = 'pl-home-greeting-played';

export function homeGreeting(): string {
  return `سلام ${LEARNER_NAME}! بیایید درس امروز را شروع کنیم.`;
}

export function onboardingSpokenWelcome(): string {
  return `خوشحالم که شما را می‌شناسم، ${LEARNER_NAME}!`;
}

export function welcomeBubble(): string {
  return `سلام ${LEARNER_NAME}!`;
}

export function lessonCompleteTitle(): string {
  return `آفرین، ${LEARNER_NAME}!`;
}

export function lessonCompleteSpoken(lessonLine: string): string {
  return `${lessonCompleteTitle()} ${lessonLine}`;
}

export function personalizeIntroScript(script: string): string {
  return script.replace(/^سلام،\s*خوش آمدید!/, `سلام ${LEARNER_NAME}!`);
}

/** Returns true the first time in this tab/session, then false. */
export function consumeHomeGreeting(): boolean {
  if (typeof sessionStorage === 'undefined') return true;
  try {
    if (sessionStorage.getItem(HOME_GREETING_STORAGE_KEY) === '1') {
      return false;
    }
    sessionStorage.setItem(HOME_GREETING_STORAGE_KEY, '1');
    return true;
  } catch {
    return true;
  }
}
