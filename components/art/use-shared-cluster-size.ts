'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import {
  objectClusterItemSize,
  objectClusterItemSizeForBox,
} from '@/components/art/objects';

export function useSharedClusterSize<T extends HTMLElement = HTMLDivElement>(counts: number[]) {
  const ref = useRef<T | null>(null);
  const fullest = Math.max(1, ...counts);
  const [size, setSize] = useState(() => objectClusterItemSize(fullest));

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const measure = () => {
      const card = (root.matches('.object-choice-card, .object-count-card')
        ? root
        : root.querySelector('.object-choice-card, .object-count-card')) as HTMLElement | null;
      const box = card ?? root;
      const style = getComputedStyle(box);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const innerW = box.clientWidth - padX;
      const innerH = box.clientHeight - padY;
      if (innerW < 8 || innerH < 8) {
        setSize(objectClusterItemSize(fullest));
        return;
      }
      setSize(objectClusterItemSizeForBox(fullest, innerW, innerH));
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    const card = root.querySelector('.object-choice-card, .object-count-card');
    if (card) observer.observe(card);
    return () => observer.disconnect();
  }, [fullest]);

  return { ref, size, fullest };
}
