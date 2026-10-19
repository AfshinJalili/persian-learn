export const SEQUENCE_FONT_MAX = 72;
export const SEQUENCE_GAP = 16;
export const SEQUENCE_PAD_X = 16;

export function isSequenceDisplay(display: string): boolean {
  return /[\s؟?]/.test(display.trim());
}

export function sequenceTokens(display: string): string[] {
  return display.trim().split(/\s+/).filter(Boolean);
}

export function digitDisplayFontSize(
  innerWidth: number,
  innerHeight: number,
  offsetWidth: number,
  tokenCount: number
): number {
  const widthBasis = offsetWidth > 8 ? offsetWidth : innerWidth;
  if (tokenCount <= 1) {
    return Math.max(
      32,
      // The numeral's line box is 1.1em tall (--lh-numeral), so a short
      // card caps it by height / 1.1 and the digit is never clipped.
      Math.floor(Math.min(widthBasis * 0.7, innerWidth, innerHeight / 1.1))
    );
  }
  const gaps = SEQUENCE_GAP * Math.max(0, tokenCount - 1);
  const usable = Math.max(1, innerWidth - SEQUENCE_PAD_X * 2 - gaps);
  return Math.max(
    1,
    Math.floor(Math.min(SEQUENCE_FONT_MAX, usable / Math.max(1, tokenCount)))
  );
}
