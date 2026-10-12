import { describe, expect, it } from '@jest/globals';
import {
  digitDisplayFontSize,
  isSequenceDisplay,
  sequenceTokens,
} from '../lib/digit-display';

describe('digit display fitting', () => {
  it('treats spaced numerals and ؟ as a sequence', () => {
    expect(isSequenceDisplay('۷ ۸ ۹ ؟')).toBe(true);
    expect(isSequenceDisplay('۱۰ ۹ ؟ ۷')).toBe(true);
    expect(isSequenceDisplay('۱۰')).toBe(false);
    expect(isSequenceDisplay('۸')).toBe(false);
    expect(sequenceTokens('۷ ۸ ۹ ؟')).toEqual(['۷', '۸', '۹', '؟']);
  });

  it('caps a single numeral to the inner box so it cannot overflow the card', () => {
    expect(digitDisplayFontSize(250, 140, 282, 1)).toBe(140);
    expect(digitDisplayFontSize(250, 220, 282, 1)).toBe(Math.floor(282 * 0.7));
  });

  it('fits a four-token sequence inside the card instead of using 70% of card width', () => {
    const size = digitDisplayFontSize(300, 200, 332, 4);
    expect(size).toBeLessThanOrEqual(300 / 4);
    expect(size).toBeGreaterThanOrEqual(28);
    expect(size).toBeLessThan(332 * 0.5);
  });
});
