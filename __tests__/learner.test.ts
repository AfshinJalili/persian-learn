import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  LEARNER_NAME,
  consumeHomeGreeting,
  homeGreeting,
  onboardingSpokenWelcome,
  personalizeIntroScript,
  welcomeBubble,
} from '../lib/learner';

describe('learner greetings', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('names Fariba in the welcome bubble and spoken onboarding clip', () => {
    expect(welcomeBubble()).toBe(`سلام ${LEARNER_NAME}!`);
    expect(onboardingSpokenWelcome()).toContain(LEARNER_NAME);
    expect(homeGreeting()).toBe(`سلام ${LEARNER_NAME}! بیایید درس امروز را شروع کنیم.`);
  });

  it('plays the home greeting only once per session', () => {
    expect(consumeHomeGreeting()).toBe(true);
    expect(consumeHomeGreeting()).toBe(false);
    expect(consumeHomeGreeting()).toBe(false);
  });

  it('rewrites generic intro welcomes to use her name', () => {
    expect(personalizeIntroScript('سلام، خوش آمدید! شما عددها را خوب بلدید.')).toBe(
      `سلام ${LEARNER_NAME}! شما عددها را خوب بلدید.`
    );
    expect(personalizeIntroScript(`سلام ${LEARNER_NAME}! شما عددها را خوب بلدید.`)).toBe(
      `سلام ${LEARNER_NAME}! شما عددها را خوب بلدید.`
    );
  });
});
