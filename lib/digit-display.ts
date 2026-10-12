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
  const gap = 8;
  const sizeW = (innerWidth - gap * Math.max(0, tokenCount - 1)) / tokenCount;
  return Math.max(28, Math.floor(Math.min(sizeW, innerHeight * 0.85)));
}
