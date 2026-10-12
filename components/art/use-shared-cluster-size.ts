'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import {
  OBJECT_CARD_INNER_FALLBACK,
  OBJECT_CLUSTER_GAP,
  OBJECT_MATCH_GAP,
  objectClusterLayoutForBox,
  type ObjectClusterLayout,
} from '@/components/art/objects';

const MEASURE_SELECTOR = '.object-choice-card, .object-count-card, .match-object-apples';

export function useSharedClusterSize<T extends HTMLElement = HTMLDivElement>(
  counts: number[],
  options?: {
    fallback?: { width: number; height: number };
    layout?: ObjectClusterLayout;
  }
) {
  const ref = useRef<T | null>(null);
  const fullest = Math.max(1, ...counts);
  const fallback = options?.fallback ?? OBJECT_CARD_INNER_FALLBACK;
  const layout = options?.layout ?? 'grid';
  const gap = layout === 'match' ? OBJECT_MATCH_GAP : OBJECT_CLUSTER_GAP;
  const fallbackWidth = fallback.width;
  const fallbackHeight = fallback.height;
  const [size, setSize] = useState(() =>
    objectClusterLayoutForBox(fullest, fallbackWidth, fallbackHeight, gap, layout).size
  );
  const [box, setBox] = useState(() => ({ width: fallbackWidth, height: fallbackHeight }));

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const measure = () => {
      const card = (root.matches(MEASURE_SELECTOR)
        ? root
        : root.querySelector(MEASURE_SELECTOR)) as HTMLElement | null;
      const node = card ?? root;
      const style = getComputedStyle(node);
      const padX = Number.parseFloat(style.paddingLeft) || 0;
      const padY = Number.parseFloat(style.paddingTop) || 0;
      const padRight = Number.parseFloat(style.paddingRight) || 0;
      const padBottom = Number.parseFloat(style.paddingBottom) || 0;
      const innerW = node.clientWidth - padX - padRight;
      const innerH = node.clientHeight - padY - padBottom;
      if (!Number.isFinite(innerW) || !Number.isFinite(innerH) || innerW < 8 || innerH < 8) {
        setBox({ width: fallbackWidth, height: fallbackHeight });
        setSize(
          objectClusterLayoutForBox(
            fullest,
            fallbackWidth,
            fallbackHeight,
            gap,
            layout
          ).size
        );
        return;
      }
      const nextBox = { width: innerW, height: innerH };
      setBox(nextBox);
      setSize(objectClusterLayoutForBox(fullest, innerW, innerH, gap, layout).size);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    const card = root.querySelector(MEASURE_SELECTOR);
    if (card && card !== root) observer.observe(card);
    return () => observer.disconnect();
  }, [fallbackHeight, fallbackWidth, fullest, gap, layout]);

  return { ref, size, box, fullest };
}
