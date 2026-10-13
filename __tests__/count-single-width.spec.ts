import { test, expect } from './e2e-audio-stub';

// Single objects and dice faces in count cards should fill about 70% of the
// card width on phones, without the exercise scrolling.
// minRatio < 0.62 only where the screen is too short to fit 70% without
// scrolling; there the item is capped by the card height instead.
const VIEWPORTS = [
  { width: 360, height: 740, minRatio: 0.62 },
  { width: 375, height: 667, minRatio: 0.62 },
  { width: 412, height: 915, minRatio: 0.62 },
  { width: 360, height: 640, minRatio: 0.55 },
] as const;

const SINGLE_COUNT_STEPS = ['/lesson/m2l3?ex=1', '/lesson/m2l3?ex=4', '/lesson/m2l4?ex=1'];

async function seed(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack: 'math', onboarded: true, completedLessons: ['m1l1','m1l2','m1l3','m1l4','m1l5','m2l1','m2l2','m2l3','m2l4'], completedUnits: [],
      xp: 400, streak: 3, streakBest: 3, lastActivityDate: today, dailyGoal: 2,
      dailyLessonsCompleted: 1, restDaysUsed: 0, weakItems: [], avatar: 'tulip',
      name: 'فریبا جون', startDate: '2026-01-01T00:00:00.000Z', speechRate: 1,
      autoplay: true, activityDates: [today],
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
}

for (const viewport of VIEWPORTS) {
  test(`single items and dice fill ~70% of the count card at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await seed(page);
    for (const path of SINGLE_COUNT_STEPS) {
      await page.goto(path);
      const item = page.locator('.object-count-card .object-cluster[data-count="1"] > .illus').first();
      await expect(item, path).toBeVisible();
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => {
        const node = document.querySelector('.object-count-card .object-cluster[data-count="1"] > .illus')!;
        const card = node.closest('.object-count-card') as HTMLElement;
        const box = node.getBoundingClientRect();
        const cardBox = card.getBoundingClientRect();
        const se = document.scrollingElement!;
        return {
          ratio: box.width / card.offsetWidth,
          inside: box.top >= cardBox.top - 1 && box.bottom <= cardBox.bottom + 1,
          scrolls: se.scrollHeight > se.clientHeight + 1,
        };
      });
      if (process.env.SHOT_DIR) {
        await page.screenshot({
          path: `${process.env.SHOT_DIR}/${path.replace(/[/?=]/g, '_')}-${viewport.width}x${viewport.height}.png`,
        });
      }
      console.log(path, viewport.width, JSON.stringify(m));
      expect(m.ratio, path).toBeGreaterThanOrEqual(viewport.minRatio);
      expect(m.ratio, path).toBeLessThanOrEqual(0.75);
      expect(m.inside, path).toBe(true);
      expect(m.scrolls, path).toBe(false);
    }
  });
}
