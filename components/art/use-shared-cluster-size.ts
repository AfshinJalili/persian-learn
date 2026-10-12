'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import {
  OBJECT_CARD_INNER_FALLBACK,
  objectClusterItemSize,
  objectClusterLayoutForBox,
} from '@/components/art/objects';

export function useSharedClusterSize<T extends HTMLElement = HTMLDivElement>(counts: number[]) {
  const ref = useRef<T | null>(null);
  const fullest = Math.max(1, ...counts);
  const [size, setSize] = useState(() => objectClusterItemSize(fullest));
  const [box, setBox] = useState(OBJECT_CARD_INNER_FALLBACK);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const measure = () => {
      const card = (root.matches('.object-choice-card, .object-count-card')
        ? root
        : root.querySelector('.object-choice-card, .object-count-card')) as HTMLElement | null;
      const node = card ?? root;
      const style = getComputedStyle(node);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const innerW = node.clientWidth - padX;
      const innerH = node.clientHeight - padY;
      if (innerW < 8 || innerH < 8) {
        setBox(OBJECT_CARD_INNER_FALLBACK);
        setSize(objectClusterItemSize(fullest));
        return;
      }
      const nextBox = { width: innerW, height: innerH };
      setBox(nextBox);
      setSize(objectClusterLayoutForBox(fullest, innerW, innerH).size);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    const card = root.querySelector('.object-choice-card, .object-count-card');
    if (card) observer.observe(card);
    return () => observer.disconnect();
  }, [fullest]);

  return { ref, size, box, fullest };
}
