'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  OBJECT_CARD_INNER_FALLBACK,
  OBJECT_CLUSTER_GAP,
  OBJECT_MATCH_GAP,
  objectClusterLayoutForBox,
  type ObjectClusterLayout,
} from '@/components/art/objects';

const SIZE_EPSILON = 1;

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < SIZE_EPSILON;
}

export function useSharedClusterSize<T extends HTMLElement = HTMLElement>(
  counts: number[],
  options?: {
    fallback?: { width: number; height: number };
    layout?: ObjectClusterLayout;
  }
) {
  const nodeRef = useRef<T | null>(null);
  const [attached, setAttached] = useState(0);
  const ref = useCallback((element: T | null) => {
    if (nodeRef.current === element) return;
    nodeRef.current = element;
    setAttached((value) => value + 1);
  }, []);
  const fullest = Math.max(1, ...counts);
  const fallback = options?.fallback ?? OBJECT_CARD_INNER_FALLBACK;
  const layout = options?.layout ?? 'grid';
  const gap = layout === 'match' || layout === 'row' ? OBJECT_MATCH_GAP : OBJECT_CLUSTER_GAP;
  const fallbackWidth = fallback.width;
  const fallbackHeight = fallback.height;
  const [size, setSize] = useState(() =>
    objectClusterLayoutForBox(fullest, fallbackWidth, fallbackHeight, gap, layout).size
  );
  const [box, setBox] = useState(() => ({
    width: fallbackWidth,
    height: fallbackHeight,
    offsetWidth: fallbackWidth,
  }));

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const applyBox = (innerW: number, innerH: number, offsetWidth: number) => {
      if (!Number.isFinite(innerW) || !Number.isFinite(innerH) || innerW < 8 || innerH < 8) {
        setBox((prev) => {
          if (
            nearlyEqual(prev.width, fallbackWidth) &&
            nearlyEqual(prev.height, fallbackHeight) &&
            nearlyEqual(prev.offsetWidth, fallbackWidth)
          ) {
            return prev;
          }
          return { width: fallbackWidth, height: fallbackHeight, offsetWidth: fallbackWidth };
        });
        const fallbackSize = objectClusterLayoutForBox(
          fullest,
          fallbackWidth,
          fallbackHeight,
          gap,
          layout
        ).size;
        setSize((prev) => (prev === fallbackSize ? prev : fallbackSize));
        return;
      }
      const width = Math.round(innerW);
      const height = Math.round(innerH);
      const cardWidth = Math.round(offsetWidth > 8 ? offsetWidth : innerW);
      const nextSize = objectClusterLayoutForBox(
        fullest,
        width,
        height,
        gap,
        layout,
        cardWidth
      ).size;
      setBox((prev) => {
        if (
          nearlyEqual(prev.width, width) &&
          nearlyEqual(prev.height, height) &&
          nearlyEqual(prev.offsetWidth, cardWidth)
        ) {
          return prev;
        }
        return { width, height, offsetWidth: cardWidth };
      });
      setSize((prev) => (prev === nextSize ? prev : nextSize));
    };

    const innerFromNode = (target: HTMLElement) => {
      const style = getComputedStyle(target);
      const padX = Number.parseFloat(style.paddingLeft) || 0;
      const padY = Number.parseFloat(style.paddingTop) || 0;
      const padRight = Number.parseFloat(style.paddingRight) || 0;
      const padBottom = Number.parseFloat(style.paddingBottom) || 0;
      return {
        width: target.clientWidth - padX - padRight,
        height: target.clientHeight - padY - padBottom,
        offsetWidth: target.offsetWidth,
      };
    };

    const innerFromEntry = (entry: ResizeObserverEntry) => {
      const target = entry.target as HTMLElement;
      const boxSize = Array.isArray(entry.contentBoxSize)
        ? entry.contentBoxSize[0]
        : entry.contentBoxSize;
      if (boxSize && boxSize.inlineSize >= 8 && boxSize.blockSize >= 8) {
        return {
          width: boxSize.inlineSize,
          height: boxSize.blockSize,
          offsetWidth: target.offsetWidth,
        };
      }
      return innerFromNode(target);
    };

    const first = innerFromNode(node);
    applyBox(first.width, first.height, first.offsetWidth);

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((item) => item.target === node) ?? entries[0];
      if (!entry) return;
      const next = innerFromEntry(entry);
      applyBox(next.width, next.height, next.offsetWidth);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [attached, fallbackHeight, fallbackWidth, fullest, gap, layout]);

  return { ref, size, box, fullest };
}
