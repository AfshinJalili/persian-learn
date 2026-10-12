import { test, expect } from './e2e-audio-stub';

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
] as const;

const MATH_BEFORE_M3L2 = [
  'm1l1',
  'm1l2',
  'm1l3',
  'm1l4',
  'm1l5',
  'm2l1',
  'm2l2',
  'm2l3',
  'm2l4',
  'm2l5',
  'm3l1',
];

async function seedProgress(
  page: import('@playwright/test').Page,
  overrides: { currentTrack?: 'math' | 'alphabet'; completedLessons?: string[] } = {}
) {
  await page.goto('/');
  await page.evaluate(async (value) => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack: value.currentTrack ?? 'math',
      onboarded: true,
      completedLessons: value.completedLessons ?? [],
      completedUnits: [],
      xp: 400,
      streak: 3,
      streakBest: 3,
      lastActivityDate: today,
      dailyGoal: 2,
      dailyLessonsCompleted: 1,
      restDaysUsed: 0,
      weakItems: [],
      avatar: 'tulip',
      name: 'فریبا جون',
      startDate: '2026-01-01T00:00:00.000Z',
      speechRate: 1,
      autoplay: true,
      activityDates: [today],
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
        const db = req.result;
        const tx = db.transaction('progress', 'readwrite');
        tx.objectStore('progress').put(progress, 'current');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error ?? new Error('progress write failed'));
      };
      req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
    });
  }, overrides);
  await page.reload();
}

function measurePage() {
  const cardOf = (item: Element) =>
    item.closest(
      '.object-choice-card, .object-count-card, .ten-frame-cell, [data-digit-display], [data-dice-face]'
    ) as HTMLElement | null;

  const singles = [...document.querySelectorAll('.object-cluster[data-count="1"] > .illus')]
    .map((item) => {
      const card = cardOf(item);
      if (!card) return null;
      const offset = card.offsetWidth;
      const width = item.getBoundingClientRect().width;
      return {
        width,
        inner: offset,
        ratio: offset > 0 ? width / offset : 0,
      };
    })
    .filter((item): item is { width: number; inner: number; ratio: number } => Boolean(item));

  const digit = document.querySelector('[data-digit-display] .glyph') as HTMLElement | null;
  if (digit) {
    const card = cardOf(digit);
    const offset = card?.offsetWidth ?? 0;
    const width = digit.getBoundingClientRect().width;
    singles.push({ width, inner: offset, ratio: offset > 0 ? width / offset : 0 });
  }

  const matchFills = [...document.querySelectorAll('.match-object-apples .object-cluster')].map(
    (cluster) => {
      const node = cluster as HTMLElement;
      const apples = node.closest('.match-object-apples') as HTMLElement | null;
      const size = Number.parseInt(node.style.getPropertyValue('--object-size') || '0', 10);
      const cols = Number.parseInt(node.style.getPropertyValue('--object-cols') || '0', 10);
      const gap = Number.parseFloat(getComputedStyle(node).gap) || 4;
      const clusterWidth = cols * size + Math.max(0, cols - 1) * gap;
      const count = Number.parseInt(node.getAttribute('data-count') || '0', 10);
      return {
        count,
        size,
        fill: apples && apples.clientWidth > 0 ? clusterWidth / apples.clientWidth : 0,
      };
    }
  );

  const sizes = [
    ...document.querySelectorAll('.object-cluster > .illus, .ten-frame-cell .illus'),
  ].map((item) => item.getBoundingClientRect().width);

  const innerScrolls = [...document.querySelectorAll('.content, .match-object-list, .cluster-stack')].map(
    (node) => {
      const el = node as HTMLElement;
      const overflowY = getComputedStyle(el).overflowY;
      const canScroll =
        (overflowY === 'auto' || overflowY === 'scroll') &&
        !el.classList.contains('content-fit') &&
        !el.classList.contains('match-object-list');
      return {
        className: el.className,
        overflow: canScroll ? el.scrollHeight - el.clientHeight : 0,
      };
    }
  );

  return {
    singles: singles.filter((item) => item.inner >= 8),
    matchFills,
    innerScrolls,
    minSize: sizes.length ? Math.min(...sizes.map((size) => Math.round(size))) : 0,
    sizeCount: sizes.length,
  };
}

test.describe('Object fill at phone widths', () => {
  for (const viewport of VIEWPORTS) {
    test(`gallery singles fill the card inner box at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dev/object-cards');
      await expect(page.locator('[data-object-gallery]')).toBeVisible();
      await page.waitForTimeout(300);

      const sections = [
        'show_n',
        'at_a_glance',
        'digit_to_group',
        'tap_picture',
        'count_objects',
        'listen_choose',
        'compare_more_less',
        'match_pairs',
        'ten_frame',
      ];

      for (const section of sections) {
        const stats = await page
          .locator(`[data-gallery-section="${section}"]`)
          .evaluate((root) => {
            if (root.getAttribute('data-gallery-section') === 'match_pairs') {
              return [...root.querySelectorAll('.match-object-apples .object-cluster')].map((cluster) => {
                const node = cluster as HTMLElement;
                const apples = node.closest('.match-object-apples') as HTMLElement | null;
                const size = Number.parseInt(node.style.getPropertyValue('--object-size') || '0', 10);
                const cols = Number.parseInt(node.style.getPropertyValue('--object-cols') || '0', 10);
                const gap = Number.parseFloat(getComputedStyle(node).gap) || 4;
                const clusterWidth = cols * size + Math.max(0, cols - 1) * gap;
                const count = Number.parseInt(node.getAttribute('data-count') || '0', 10);
                return {
                  width: size,
                  inner: apples?.clientWidth ?? 0,
                  ratio: apples && apples.clientWidth > 0 ? clusterWidth / apples.clientWidth : 0,
                  count,
                };
              });
            }
            const cardOf = (item: Element) =>
              item.closest('.object-choice-card, .object-count-card, .ten-frame-cell') as HTMLElement | null;
            const singles = [
              ...root.querySelectorAll(
                '.object-cluster[data-count="1"] > .illus, [data-count="1"] .object-cluster > .illus, [data-count="1"].ten-frame-grid .illus'
              ),
            ];
            const unique = [...new Set(singles)];
            return unique.map((item) => {
              const card = cardOf(item) ?? (item.closest('[data-count="1"]') as HTMLElement | null);
              const offset = card?.offsetWidth ?? 0;
              const width = item.getBoundingClientRect().width;
              return { width, inner: offset, ratio: offset > 0 ? width / offset : 0, count: 1 };
            });
          });
        expect(stats.length, section).toBeGreaterThan(0);
        for (const item of stats) {
          expect(item.width, section).toBeGreaterThanOrEqual(32);
          if (section === 'ten_frame' || (section === 'match_pairs' && item.count < 6)) {
            continue;
          }
          expect(item.ratio, section).toBeGreaterThanOrEqual(0.65);
        }
      }

      const minSize = await page.evaluate(() => {
        const items = [...document.querySelectorAll('.object-cluster > .illus, .ten-frame-cell .illus')];
        return Math.min(...items.map((item) => Math.round(item.getBoundingClientRect().width)));
      });
      expect(minSize).toBeGreaterThanOrEqual(32);
    });

    test(`math lessons fill singles and keep the match tray above بررسی at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await seedProgress(page, { completedLessons: MATH_BEFORE_M3L2 });

      const lessons = [
        { path: '/lesson/m1l1?ex=1', hasTray: false },
        { path: '/lesson/m1l1?ex=2', hasTray: false },
        { path: '/lesson/m1l2?ex=1', hasTray: false },
        { path: '/lesson/m1l3?ex=1', hasTray: false },
        { path: '/lesson/m1l4?ex=1', hasTray: true },
        { path: '/lesson/m2l3?ex=1', hasTray: false },
        { path: '/lesson/m2l4?ex=8', hasTray: true },
        { path: '/lesson/m3l2?ex=2', hasTray: false },
        { path: '/lesson/m3l2?ex=8', hasTray: true },
      ];

      for (const lesson of lessons) {
        await page.goto(lesson.path);
        await expect(
          page.locator('.object-cluster, [data-digit-display], [data-dice-face], [data-match-tray]').first()
        ).toBeVisible();
        await page.waitForTimeout(300);
        const stats = await page.evaluate(measurePage);
        expect(stats.minSize, lesson.path).toBeGreaterThanOrEqual(32);
        expect(stats.sizeCount, lesson.path).toBeGreaterThan(0);
        for (const item of stats.singles) {
          expect(item.width, lesson.path).toBeGreaterThanOrEqual(32);
          expect(item.ratio, lesson.path).toBeGreaterThanOrEqual(0.65);
        }
        for (const scroller of stats.innerScrolls) {
          expect(scroller.overflow, `${lesson.path} ${scroller.className}`).toBeLessThanOrEqual(2);
        }
        const list = page.locator('.picture-grid, .match-object-list, .cluster-stack, .object-count-card').first();
        const listBox = await list.boundingBox();
        expect(listBox?.x ?? 99, lesson.path).toBeLessThanOrEqual(26);
        const numeral = page.locator('.prompt-numeral');
        if ((await numeral.count()) > 0) {
          const fontSize = await numeral.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
          expect(fontSize, lesson.path).toBeGreaterThanOrEqual(48);
        }
        if (lesson.path.includes('m1l1?ex=2')) {
          const three = page.locator('.object-cluster[data-count="3"]');
          await expect(three).toHaveAttribute('data-layout', 'grid');
          const cols = await three.evaluate((el) =>
            (el as HTMLElement).style.getPropertyValue('--object-cols')
          );
          expect(cols, lesson.path).toBe('2');
        }
        for (const row of stats.matchFills.filter((item) => item.count >= 6)) {
          expect(row.size, lesson.path).toBeGreaterThanOrEqual(32);
          expect(row.fill, lesson.path).toBeGreaterThanOrEqual(0.6);
        }

        if (lesson.hasTray) {
          const tray = page.locator('[data-match-tray]');
          const check = page.getByRole('button', { name: /بررسی/ });
          await expect(tray).toBeVisible();
          await expect(check).toBeVisible();
          const trayBox = await tray.boundingBox();
          const checkBox = await check.boundingBox();
          expect(trayBox).toBeTruthy();
          expect(checkBox).toBeTruthy();
          expect(trayBox!.y + trayBox!.height).toBeLessThanOrEqual(checkBox!.y + 1);
        }
      }
    });

    test(`alphabet tap-picture stays near the full card inner box at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await seedProgress(page, { currentTrack: 'alphabet', completedLessons: [] });
      await page.goto('/lesson/a1l1?ex=1');
      await page.waitForTimeout(400);
      const stats = await page.evaluate(measurePage);
      expect(stats.singles.length).toBeGreaterThan(0);
      for (const item of stats.singles) {
        expect(item.width).toBeGreaterThanOrEqual(90);
        expect(item.ratio).toBeGreaterThanOrEqual(0.9);
      }
      for (const scroller of stats.innerScrolls) {
        expect(scroller.overflow, scroller.className).toBeLessThanOrEqual(2);
      }
    });
  }
});
