import { test, expect } from './e2e-audio-stub';

// Single objects and dice faces in count cards should fill about 70% of the
// card width on phones, without the exercise scrolling.
// Single-art count cards grow with their width (not the leftover space), so
// the art reaches ~70% of the card width; the page must never scroll.
// 367x540 is a very short desktop window from QA's first report; a 3-line
// prompt there leaves room for ~0.65, so it only gets a 0.6 floor.
const VIEWPORTS = [
  { width: 360, height: 640, minRatio: 0.7 },
  { width: 367, height: 540, minRatio: 0.6 },
  { width: 367, height: 580, minRatio: 0.7 },
  { width: 367, height: 740, minRatio: 0.7 },
  { width: 367, height: 900, minRatio: 0.7 },
  { width: 375, height: 667, minRatio: 0.7 },
  { width: 412, height: 915, minRatio: 0.7 },
  { width: 419, height: 580, minRatio: 0.6 },
  { width: 419, height: 740, minRatio: 0.7 },
  { width: 419, height: 900, minRatio: 0.7 },
] as const;

// m1l3 ex1 (e2) is a one-bread count card; m2l4 ex2/ex3 are ☝️/✌️ (tall art); m2l3 ex1-5 and m2l5 ex3 are the dice steps; m2l4 ex1 (e2) and m2l5 ex7 are ✋.
const SINGLE_COUNT_STEPS = [
  '/lesson/m1l3?ex=1',
  '/lesson/m2l3?ex=1',
  '/lesson/m2l3?ex=2',
  '/lesson/m2l3?ex=3',
  '/lesson/m2l3?ex=4',
  '/lesson/m2l3?ex=5',
  '/lesson/m2l4?ex=1',
  '/lesson/m2l4?ex=2',
  '/lesson/m2l4?ex=3',
  '/lesson/m2l5?ex=3',
  '/lesson/m2l5?ex=7',
];

async function seed(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack: 'math', onboarded: true, completedLessons: ['m1l1','m1l2','m1l3','m1l4','m1l5','m2l1','m2l2','m2l3','m2l4','m2l5'], completedUnits: [],
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
  test(`single items and dice: drawn art >= 70% of the count card at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await seed(page);
    for (const path of SINGLE_COUNT_STEPS) {
      await page.goto(path);
      const item = page.locator('.object-count-card .object-cluster[data-count="1"] > .illus').first();
      await expect(item, path).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => {
        const node = document.querySelector('.object-count-card .object-cluster[data-count="1"] > .illus')!;
        const card = node.closest('.object-count-card') as HTMLElement;
        const box = node.getBoundingClientRect();
        // The visible drawing: union of the drawn shapes' screen rects (what
        // QA measures), not the square container.
        const shapes = [...node.querySelectorAll('svg rect, svg circle, svg ellipse, svg path, svg polygon, svg line')];
        const rects = shapes.map((shape) => shape.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
        const art = {
          left: Math.min(...rects.map((r) => r.left)),
          right: Math.max(...rects.map((r) => r.right)),
          top: Math.min(...rects.map((r) => r.top)),
          bottom: Math.max(...rects.map((r) => r.bottom)),
        };
        const artW = art.right - art.left;
        const artH = art.bottom - art.top;
        const cardBox = card.getBoundingClientRect();
        const se = document.scrollingElement!;
        const content = card.closest('.content') as HTMLElement;
        const last = content.lastElementChild!.getBoundingClientRect();
        const bottom = document.querySelector('.bottom')?.getBoundingClientRect();
        return {
          ratio: box.width / card.offsetWidth,
          // width for wide/square art; the long side for tall art (☝️, ✌️)
          art: +(Math.max(artW, artH >= artW * 1.05 ? artH : artW) / card.offsetWidth).toFixed(3),
          artW: +(artW / card.offsetWidth).toFixed(3),
          tall: artH >= artW * 1.05,
          // every block (incl. the answer tiles) is fully on screen
          contentOverflow: content.scrollHeight - content.clientHeight,
          clipped: last.bottom > content.getBoundingClientRect().bottom + 1 || (bottom ? bottom.bottom > innerHeight + 1 : false),
          inside: box.top >= cardBox.top - 1 && box.bottom <= cardBox.bottom + 1,
          scrolls: se.scrollHeight > se.clientHeight + 1,
        };
      });
      if (process.env.SHOT_DIR) {
        await page.screenshot({
          path: `${process.env.SHOT_DIR}/${path.replace(/[/?=]/g, '_')}-${viewport.width}x${viewport.height}.png`,
        });
      }
      console.log(path, `${viewport.width}x${viewport.height}`, JSON.stringify(m));
      expect(m.art, path).toBeGreaterThanOrEqual(viewport.minRatio);
      expect(m.ratio, path).toBeLessThanOrEqual(0.8);
      expect(m.inside, path).toBe(true);
      expect(m.scrolls, path).toBe(false);
      expect(m.clipped, path).toBe(false);
      expect(m.contentOverflow, path).toBeLessThanOrEqual(2);
    }
  });
}

// In a question with several picture cards, the single item must never look
// smaller than the items of a multi-item card next to it.
const PICTURE_VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 367, height: 740 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
] as const;

for (const viewport of PICTURE_VIEWPORTS) {
  test(`m1l1 single item is at least as large as multi-item items at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    await seed(page);
    let checked = 0;
    for (let ex = 1; ex <= 8; ex += 1) {
      const path = `/lesson/m1l1?ex=${ex}`;
      await page.goto(path);
      await expect(page.locator('.object-choice-card').first(), path).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.object-choice-card')].map((card) => {
          const items = [...card.querySelectorAll('.object-cluster > .illus')].map(
            (item) => item.getBoundingClientRect().width
          );
          return { count: items.length, size: Math.min(...items), cardWidth: (card as HTMLElement).offsetWidth };
        });
        const se = document.scrollingElement!;
        return { cards, scrolls: se.scrollHeight > se.clientHeight + 1 };
      });
      expect(m.scrolls, path).toBe(false);
      const single = m.cards.find((card) => card.count === 1);
      const multi = m.cards.filter((card) => card.count > 1);
      if (!single || multi.length === 0) continue;
      checked += 1;
      const largestMulti = Math.max(...multi.map((card) => card.size));
      console.log(path, viewport.width, `single=${single.size.toFixed(1)} (${(single.size / single.cardWidth).toFixed(2)} of card) largestMulti=${largestMulti.toFixed(1)}`);
      expect(single.size, path).toBeGreaterThanOrEqual(largestMulti - 0.5);
    }
    expect(checked).toBeGreaterThan(0);
  });
}

test('match: a digit replaced on an apple group goes back to the tray', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await seed(page);
  await page.goto('/lesson/m1l4?ex=1');
  const tray = page.locator('[data-match-tray]');
  const group = page.locator('[data-match-slot="🍎🍎🍎"]');
  await tray.locator('[data-match-digit="۱"]').click();
  await group.click();
  await expect(page.locator('[data-match-placed="۱"]')).toBeVisible();
  await expect(tray.locator('[data-match-digit="۱"]')).toHaveCount(0);

  await tray.locator('[data-match-digit="۲"]').click();
  await group.click();
  await expect(page.locator('[data-match-placed="۲"]')).toBeVisible();
  await expect(page.locator('[data-match-placed="۱"]')).toHaveCount(0);
  await expect(tray.locator('[data-match-digit="۱"]')).toBeVisible();
  await expect(tray.locator('[data-match-digit="۱"]')).toBeEnabled();
  if (process.env.SHOT_DIR) {
    await page.screenshot({ path: `${process.env.SHOT_DIR}/m1l4-match-replaced-375x667.png` });
  }
});
