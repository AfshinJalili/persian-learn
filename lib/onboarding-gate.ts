/** Generation token so a cancelled onboarding audio callback cannot advance or save. */
export class OnboardingGate {
  private generation = 0;

  begin(): number {
    this.generation += 1;
    return this.generation;
  }

  cancel(): void {
    this.generation += 1;
  }

  isCurrent(token: number): boolean {
    return token === this.generation;
  }
}
