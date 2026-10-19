import { test, expect } from './e2e-audio-stub';

// Screenshots of the counting intro for review. Only runs when
// INTRO_SHOT_DIR is set: INTRO_SHOT_DIR=/tmp/shots npx playwright test intro-shots
const DIR = process.env.INTRO_SHOT_DIR;

const SHOTS = [
  { name: 'intro-375x667-normal', viewport: { width: 375, height: 667 }, font: 1, mode: 'font' },
  { name: 'intro-360x640-font2x', viewport: { width: 360, height: 640 }, font: 2, mode: 'font' },
  { name: 'intro-360x640-zoom2x', viewport: { width: 360, height: 640 }, font: 2, mode: 'zoom' },
  { name: 'intro-412x915-normal', viewport: { width: 412, height: 915 }, font: 1, mode: 'font' },
] as const;

test.describe('counting intro screenshots', () => {
  test.skip(!DIR, 'set INTRO_SHOT_DIR to capture');
  for (const shot of SHOTS) {
    test(shot.name, async ({ browser }) => {
      const zoom = shot.mode === 'zoom';
      const context = await browser.newContext({
        viewport: zoom
          ? { width: Math.round(shot.viewport.width / shot.font), height: Math.round(shot.viewport.height / shot.font) }
          : shot.viewport,
        deviceScaleFactor: zoom ? 2 * shot.font : 2,
        isMobile: true,
        hasTouch: true,
        baseURL: 'http://localhost:3000',
      });
      const page = await context.newPage();
      if (!zoom && shot.font !== 1) {
        await page.addInitScript((pct) => {
          const apply = () => {
            const style = document.createElement('style');
            style.textContent = `html { font-size: ${pct}% !important; }`;
            document.documentElement.appendChild(style);
          };
          if (document.documentElement) apply();
          else document.addEventListener('DOMContentLoaded', apply);
        }, shot.font * 100);
      }
      await page.addInitScript(() => {
        class SilentAudio {
          playbackRate = 1; preservesPitch = true; paused = true; currentTime = 0; src = '';
          onended: (() => void) | null = null;
          constructor(src?: string) { this.src = src ?? ''; }
          addEventListener() {} removeEventListener() {}
          play() { queueMicrotask(() => this.onended?.()); return Promise.resolve(); }
          pause() {}
        }
        Object.defineProperty(window, 'Audio', { configurable: true, writable: true, value: SilentAudio });
      });
      await page.goto('/manifest.json');
      await page.evaluate(async () => {
        const today = new Date().toISOString().split('T')[0];
        const progress = {
          currentTrack: 'math', onboarded: true, completedLessons: [], completedUnits: [], xp: 0, streak: 0,
          streakBest: 0, lastActivityDate: today, dailyGoal: 2, dailyLessonsCompleted: 0, restDaysUsed: 0,
          weakItems: [], avatar: 'tulip', name: 'فریبا جون', startDate: '2026-01-01T00:00:00.000Z',
          speechRate: 1, autoplay: false, activityDates: [today],
        };
        sessionStorage.setItem('pl-audio-unlocked', '1');
        await new Promise<void>((resolve, reject) => {
          const req = indexedDB.open('persian-learn', 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress');
            if (!db.objectStoreNames.contains('lessons')) db.createObjectStore('lessons');
          };
          req.onsuccess = () => {
            const tx = req.result.transaction('progress', 'readwrite');
            tx.objectStore('progress').put(progress, 'current');
            tx.oncomplete = () => { req.result.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        });
      });
      await page.goto('/lesson/m1l1?ex=0');
      await expect(page.locator('[data-count-card]').first()).toBeVisible({ timeout: 30000 });
      await page.addStyleTag({ content: 'nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }' });
      await page.waitForTimeout(1200);
      if (process.env.INTRO_SCROLL) await page.locator('[data-count-card]').nth(Number(process.env.INTRO_SCROLL)).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${DIR}/${shot.name}.png` });
      await page.screenshot({ path: `${DIR}/${shot.name}-full.png`, fullPage: true });
      await context.close();
    });
  }
});
