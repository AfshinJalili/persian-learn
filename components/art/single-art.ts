import type { CSSProperties } from 'react';

// The single-art count card's height follows its own measured width (see
// .object-count-card[data-single-art] in globals.css), so the art box can be
// 77% of the card width. Width doesn't depend on height, so there's no loop.
export function singleArtStyle(single: boolean, cardWidth: number): CSSProperties | undefined {
  if (!single || !(cardWidth > 8)) return undefined;
  return { '--single-card-w': `${Math.round(cardWidth)}px` } as CSSProperties;
}
