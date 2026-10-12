import { test as base } from '@playwright/test';

/** End MP3s immediately so e2e does not wait on clip duration. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      class ImmediateAudio {
        playbackRate = 1;
        paused = true;
        currentTime = 0;
        src = '';
        onended: (() => void) | null = null;
        private endedListener: (() => void) | null = null;

        constructor(src?: string) {
          this.src = src ?? '';
        }

        addEventListener(type: string, cb: () => void) {
          if (type === 'ended') this.endedListener = cb;
        }

        removeEventListener() {}

        play() {
          this.paused = false;
          queueMicrotask(() => {
            this.paused = true;
            this.endedListener?.();
            this.onended?.();
          });
          return Promise.resolve();
        }

        pause() {
          this.paused = true;
        }
      }

      Object.defineProperty(window, 'Audio', {
        configurable: true,
        writable: true,
        value: ImmediateAudio,
      });
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
