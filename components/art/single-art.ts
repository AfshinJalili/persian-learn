import type { CSSProperties } from 'react';
import { OBJECT_SINGLE_WIDTH_RATIO } from '@/components/art/objects';

// The single-art count card's height follows its own measured width (see
// .object-count-card[data-single-art] in globals.css): the art box is 76% of
// the card width and as tall as the drawing's proportions need, so tall art
// (a raised finger, an onion) is as wide as square art. Width doesn't depend
// on height, so there's no loop.
export function singleArtStyle(single: boolean, cardWidth: number, aspect = 1): CSSProperties | undefined {
  if (!single || !(cardWidth > 8)) return undefined;
  const ratio = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  return {
    '--single-card-w': `${Math.round(cardWidth)}px`,
    '--single-art-h': (OBJECT_SINGLE_WIDTH_RATIO / ratio + 0.01).toFixed(3),
  } as CSSProperties;
}

/**
 * A choice card holding one picture: tall enough that the art box is 76% of
 * the card's width at the drawing's own proportions.
 */
export function singleChoiceStyle(single: boolean, cardWidth: number, chromeY: number, aspect = 1): CSSProperties | undefined {
  if (!single || !(cardWidth > 8)) return undefined;
  const ratio = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  return { minHeight: Math.ceil((cardWidth * OBJECT_SINGLE_WIDTH_RATIO) / ratio + Math.max(chromeY, 24) + 2) };
}
