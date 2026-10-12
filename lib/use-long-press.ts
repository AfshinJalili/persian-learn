import { useRef, type MouseEvent, type PointerEvent } from 'react';

export const FAMILY_HELPER_HOLD_MS = 3000;

export function useLongPress(onLongPress: () => void, duration = FAMILY_HELPER_HOLD_MS) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button > 0) return;
      clear();
      timerRef.current = setTimeout(onLongPress, duration);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
    },
  };
}
