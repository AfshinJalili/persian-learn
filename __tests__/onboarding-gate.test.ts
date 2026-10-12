import { describe, expect, it } from '@jest/globals';
import { OnboardingGate } from '../lib/onboarding-gate';

describe('OnboardingGate', () => {
  it('lets the current audio callback finish', async () => {
    const gate = new OnboardingGate();
    const token = gate.begin();
    await Promise.resolve();
    expect(gate.isCurrent(token)).toBe(true);
  });

  it('invalidates a pending callback after Back so it cannot save or advance', async () => {
    const gate = new OnboardingGate();
    const token = gate.begin();
    let saved = false;
    let advanced = false;

    const pending = Promise.resolve().then(() => {
      if (!gate.isCurrent(token)) return;
      saved = true;
      advanced = true;
    });

    gate.cancel();
    await pending;

    expect(saved).toBe(false);
    expect(advanced).toBe(false);
    expect(gate.isCurrent(token)).toBe(false);
  });

  it('does not let an older token steal the next step', () => {
    const gate = new OnboardingGate();
    const first = gate.begin();
    const second = gate.begin();
    expect(gate.isCurrent(first)).toBe(false);
    expect(gate.isCurrent(second)).toBe(true);
  });
});
