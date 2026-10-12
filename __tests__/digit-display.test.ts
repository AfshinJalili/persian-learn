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

  it('fits a four-token sequence with padding and gaps instead of a tight 70% cap', () => {
    expect(digitDisplayFontSize(300, 200, 332, 4)).toBe(60);
    expect(digitDisplayFontSize(200, 200, 232, 4)).toBe(35);
    expect(digitDisplayFontSize(400, 200, 432, 4)).toBe(72);
  });
});
