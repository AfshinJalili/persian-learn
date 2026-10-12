export const SEQUENCE_FONT_MAX = 72;

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
      Math.floor(Math.min(widthBasis * 0.7, innerWidth, innerHeight))
    );
  }
  return Math.max(
    1,
    Math.floor(Math.min(SEQUENCE_FONT_MAX, innerWidth / Math.max(1, tokenCount)))
  );
}
