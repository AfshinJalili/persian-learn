import { test, expect } from './e2e-audio-stub';
import math from '../public/content/math.json';

const GALLERY_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
] as const;

const LESSON_VIEWPORTS = [
  { width: 375, height: 667 },
  { width: 1024, height: 594 },
] as const;

const MATH_M1_M3 = math.units
  .filter((unit) => unit.id === 'm1' || unit.id === 'm2' || unit.id === 'm3')
  .flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      id: lesson.id,
      exercises: lesson.exercises.map((exercise, index) => ({
        index,
        type: exercise.type,
      })),
    }))
  );

const MATH_M1_M3_IDS = MATH_M1_M3.map((lesson) => lesson.id);

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
      '.object-choice-card, .object-count-card, .ten-frame-cell, [data-digit-display], [data-dice-face], [data-object-display], [data-digit-sequence], .match-object-row'
    ) as HTMLElement | null;

  const singles = [...document.querySelectorAll('.object-cluster[data-count="1"] > .illus')]
    .map((item) => {
      const card = cardOf(item);
      if (!card || card.classList.contains('match-object-row')) return null;
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
    const box = digit.getBoundingClientRect();
    const width = Math.max(box.width, box.height);
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

  const itemNodes = [
    ...document.querySelectorAll(
      '.object-cluster > .illus, .ten-frame-cell .illus, [data-digit-display] .glyph, [data-digit-sequence] .glyph'
    ),
  ];

  const sizes = itemNodes
    .filter((item) => item.matches('.object-cluster > .illus, .ten-frame-cell .illus'))
    .map((item) => item.getBoundingClientRect().width);

  const contained = itemNodes.map((item) => {
    const card = cardOf(item);
    if (!card) return { overflow: 0 };
    const itemBox = item.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return {
      overflow: Math.max(
        cardBox.top - itemBox.top,
        itemBox.right - cardBox.right,
        itemBox.bottom - cardBox.bottom,
        cardBox.left - itemBox.left,
        0
      ),
    };
  });

  const sizeSignature = itemNodes
    .map((item) => {
      const box = item.getBoundingClientRect();
      return `${Math.round(box.width)}x${Math.round(box.height)}`;
    })
    .join('|');

  const innerScrolls = [
    ...document.querySelectorAll(
      '.content.content-fit, .match-object-list, .cluster-stack, .picture-grid, .object-count-card'
    ),
  ].map((node) => {
    const el = node as HTMLElement;
    return {
      className: el.className,
      overflow: Math.max(0, el.scrollHeight - el.clientHeight),
    };
  });

  const phone = document.querySelector('.app-phone') as HTMLElement | null;
  const countCard = document.querySelector('.object-count-card') as HTMLElement | null;
  const answers = [
    ...document.querySelectorAll('.grid3, .grid2, .picture-grid, [data-match-tray], .bottom'),
  ] as HTMLElement[];
  const lastAnswer = answers.at(-1);
  const lastBottom = lastAnswer ? lastAnswer.getBoundingClientRect().bottom : 0;
  const dice = [...document.querySelectorAll('[data-dice-face] .object-cluster > .illus')].map(
    (item) => {
      const card = cardOf(item);
      const offset = card?.offsetWidth ?? 0;
      const width = item.getBoundingClientRect().width;
      return { width, inner: offset, ratio: offset > 0 ? width / offset : 0 };
    }
  );

  const rawGlyphs = [...document.querySelectorAll('.object-cluster .glyph')]
    .map((node) => node.textContent ?? '')
    .filter((text) => /\p{Extended_Pictographic}/u.test(text));

  return {
    singles: singles.filter((item) => item.inner >= 8),
    dice,
    matchFills,
    innerScrolls,
    contained,
    sizeSignature,
    minSize: sizes.length ? Math.min(...sizes.map((size) => Math.round(size))) : 0,
    sizeCount: sizes.length,
    viewportHeight: window.innerHeight,
    pageOverflow: Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
      (phone?.scrollHeight ?? 0) - (phone?.clientHeight ?? 0)
    ),
    answersBottom: lastBottom,
    countCardHeight: countCard?.getBoundingClientRect().height ?? 0,
    rawGlyphs,
  };
}

test.describe('Object fill at phone widths', () => {
  for (const viewport of GALLERY_VIEWPORTS) {
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

    test(`alphabet tap-picture stays near the full card inner box at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await seedProgress(page, { currentTrack: 'alphabet', completedLessons: [] });
      await page.goto('/lesson/a1l1?ex=1');
      await expect(page.locator('.object-cluster').first()).toBeVisible();
      const stats = await page.evaluate(measurePage);
      const info = await page.evaluate(() => {
        const cluster = document.querySelector('.object-cluster') as HTMLElement | null;
        const card = cluster?.closest('.object-choice-card') as HTMLElement | null;
        const item = cluster?.querySelector('.illus');
        const style = card ? getComputedStyle(card) : null;
        const padX =
          (Number.parseFloat(style?.paddingLeft || '0') || 0) +
          (Number.parseFloat(style?.paddingRight || '0') || 0);
        const innerWidth = (card?.clientWidth ?? 0) - padX;
        return {
          layout: cluster?.getAttribute('data-layout'),
          size: Number.parseInt(cluster?.style.getPropertyValue('--object-size') || '0', 10),
          itemW: item?.getBoundingClientRect().width ?? 0,
          innerWidth,
        };
      });
      expect(info.layout).toBe('picture');
      expect(info.size).toBeGreaterThan(info.innerWidth * 0.7);
      expect(info.size).toBeLessThanOrEqual(info.innerWidth);
      expect(stats.singles.length).toBeGreaterThan(0);
      for (const item of stats.singles) {
        expect(item.ratio).toBeGreaterThan(0.7);
      }
      for (const item of stats.contained) {
        expect(item.overflow).toBeLessThanOrEqual(2);
      }
      for (const scroller of stats.innerScrolls) {
        expect(scroller.overflow, scroller.className).toBeLessThanOrEqual(2);
      }
    });
  }

  for (const viewport of LESSON_VIEWPORTS) {
    test(`math lessons m1-m3 stay in-card, stable, and unscrollable at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      test.setTimeout(600000);
      await page.setViewportSize(viewport);
      await seedProgress(page, { completedLessons: MATH_M1_M3_IDS });

      for (const lesson of MATH_M1_M3) {
        for (const exercise of lesson.exercises) {
          const path = `/lesson/${lesson.id}?ex=${exercise.index}`;
          await page.goto(path);
          await expect(page.locator('.app-phone .prompt, .app-phone h2, .app-phone .content').first()).toBeVisible();
          const hasItems = page.locator(
            '.object-cluster, [data-digit-display], [data-digit-sequence], [data-dice-face], [data-object-display], [data-match-tray]'
          );
          await page.waitForTimeout(200);
          const first = await page.evaluate(measurePage);
          expect(first.pageOverflow, path).toBeLessThanOrEqual(2);
          expect(first.answersBottom, path).toBeLessThanOrEqual(viewport.height + 2);
          expect(first.rawGlyphs, path).toEqual([]);
          if (first.countCardHeight > 0) {
            expect(first.countCardHeight, path).toBeLessThanOrEqual(viewport.height * 0.55 + 2);
          }
          for (const scroller of first.innerScrolls) {
            expect(scroller.overflow, `${path} ${scroller.className}`).toBeLessThanOrEqual(2);
          }
          if ((await hasItems.count()) === 0) {
            continue;
          }
          await expect(hasItems.first()).toBeVisible();
          await page.waitForTimeout(300);
          const stats = await page.evaluate(measurePage);
          expect(stats.sizeSignature, path).toBe(first.sizeSignature);
          expect(stats.pageOverflow, path).toBeLessThanOrEqual(2);
          expect(stats.answersBottom, path).toBeLessThanOrEqual(viewport.height + 2);
          expect(stats.rawGlyphs, path).toEqual([]);
          if (stats.countCardHeight > 0) {
            expect(stats.countCardHeight, path).toBeLessThanOrEqual(viewport.height * 0.55 + 2);
          }
          if (stats.sizeCount > 0) {
            expect(stats.minSize, path).toBeGreaterThanOrEqual(32);
          }
          for (const item of stats.singles) {
            expect(item.width, path).toBeGreaterThanOrEqual(32);
            expect(item.ratio, path).toBeGreaterThanOrEqual(0.65);
          }
          for (const item of stats.dice) {
            expect(item.width, path).toBeGreaterThanOrEqual(32);
            expect(item.ratio, path).toBeGreaterThanOrEqual(0.65);
          }
          for (const item of stats.contained) {
            expect(item.overflow, path).toBeLessThanOrEqual(2);
          }
          for (const scroller of stats.innerScrolls) {
            expect(scroller.overflow, `${path} ${scroller.className}`).toBeLessThanOrEqual(2);
          }
          const list = page.locator(
            '.picture-grid, .match-object-list, .cluster-stack, .object-count-card'
          );
          if ((await list.count()) > 0) {
            const listBox = await list.first().boundingBox();
            const phoneBox = await page.locator('.app-phone').boundingBox();
            expect((listBox?.x ?? 99) - (phoneBox?.x ?? 0), path).toBeLessThanOrEqual(26);
          }
          const numeral = page.locator('.prompt-numeral');
          if ((await numeral.count()) > 0) {
            const fontSize = await numeral.evaluate((el) =>
              Number.parseFloat(getComputedStyle(el).fontSize)
            );
            expect(fontSize, path).toBeGreaterThanOrEqual(48);
          }
          if (path === '/lesson/m1l1?ex=2') {
            const three = page.locator('.object-cluster[data-count="3"]');
            await expect(three).toHaveAttribute('data-layout', 'grid');
            const cols = await three.evaluate((el) =>
              (el as HTMLElement).style.getPropertyValue('--object-cols')
            );
            expect(cols, path).toBe('2');
          }
          for (const row of stats.matchFills.filter((item) => item.count >= 6)) {
            expect(row.size, path).toBeGreaterThanOrEqual(32);
            expect(row.fill, path).toBeGreaterThanOrEqual(0.6);
          }
          if (exercise.type === 'match_pairs') {
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
      }
    });
  }
});
