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

    const applyBox = (innerW: number, innerH: number) => {
      if (!Number.isFinite(innerW) || !Number.isFinite(innerH) || innerW < 8 || innerH < 8) {
        setBox({ width: fallbackWidth, height: fallbackHeight });
        setSize(
          objectClusterLayoutForBox(fullest, fallbackWidth, fallbackHeight, gap, layout).size
        );
        return;
      }
      setBox({ width: innerW, height: innerH });
      setSize(objectClusterLayoutForBox(fullest, innerW, innerH, gap, layout).size);
    };

    const innerFromNode = (node: HTMLElement) => {
      const style = getComputedStyle(node);
      const padX = Number.parseFloat(style.paddingLeft) || 0;
      const padY = Number.parseFloat(style.paddingTop) || 0;
      const padRight = Number.parseFloat(style.paddingRight) || 0;
      const padBottom = Number.parseFloat(style.paddingBottom) || 0;
      if (layout === 'picture') {
        return { width: node.clientWidth, height: node.clientHeight };
      }
      return {
        width: node.clientWidth - padX - padRight,
        height: node.clientHeight - padY - padBottom,
      };
    };

    const innerFromEntry = (entry: ResizeObserverEntry) => {
      const node = entry.target as HTMLElement;
      const box = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;
      if (box && box.inlineSize >= 8 && box.blockSize >= 8) {
        if (layout === 'picture') {
          const style = getComputedStyle(node);
          const padX = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
          const padY = (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);
          return { width: box.inlineSize + padX, height: box.blockSize + padY };
        }
        return { width: box.inlineSize, height: box.blockSize };
      }
      return innerFromNode(node);
    };

    const card = (root.matches(MEASURE_SELECTOR)
      ? root
      : root.querySelector(MEASURE_SELECTOR)) as HTMLElement | null;
    const node = card ?? root;
    const first = innerFromNode(node);
    applyBox(first.width, first.height);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((item) => item.target === node) ?? entries[0];
      if (!entry) return;
      const next = innerFromEntry(entry);
      applyBox(next.width, next.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fallbackHeight, fallbackWidth, fullest, gap, layout]);

  return { ref, size, box, fullest };
}
