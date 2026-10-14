import { test, expect } from './e2e-audio-stub';
import math from '../public/content/math.json';
import alphabet from '../public/content/alphabet.json';

// Every match-pairs step must stay playable on short and tall phones: rows
// keep a >= 48px tap target and every tap places a chip.
const VIEWPORTS = [
  { width: 367, height: 540 },
  { width: 360, height: 640 },
  { width: 419, height: 800 },
  { width: 367, height: 800 },
] as const;

const tracks = [
  { track: 'math', lessons: math.units.flatMap((unit) => unit.lessons) },
  { track: 'alphabet', lessons: alphabet.units.flatMap((unit) => unit.lessons) },
];
const lessons = tracks.flatMap((t) => t.lessons);
const steps = tracks.flatMap(({ track, lessons }) => lessons.flatMap((lesson) =>
  lesson.exercises
    .map((exercise, index) => ({ track, lesson: lesson.id, index, exercise }))
    .filter((step) => step.exercise.type === 'match_pairs')
));
const allIds = lessons.map((lesson) => lesson.id);

async function seed(page: import('@playwright/test').Page, currentTrack: string) {
  await page.goto('/');
  await page.evaluate(async ({ completedLessons, currentTrack }) => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack, onboarded: true, completedLessons, completedUnits: [],
      xp: 0, streak: 1, streakBest: 1, lastActivityDate: today, dailyGoal: 2,
      dailyLessonsCompleted: 0, restDaysUsed: 0, weakItems: [], avatar: 'tulip',
      name: 'فریبا جون', startDate: '2026-01-01T00:00:00.000Z', speechRate: 1,
      autoplay: false, activityDates: [today],
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
  }, { completedLessons: allIds, currentTrack });
}

for (const viewport of VIEWPORTS) {
  test(`every match-pairs step can be completed at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(300000);
    await page.setViewportSize(viewport);
    let seeded = '';
    let minRow = Infinity;
    let minTarget = Infinity;
    for (const step of steps) {
      if (seeded !== step.track) { await seed(page, step.track); seeded = step.track; }
      const path = `/lesson/${step.lesson}?ex=${step.index}`;
      await page.goto(path);
      await expect(page.getByRole('button', { name: /بررسی/ }), path).toBeVisible({ timeout: 30000 });
      const pairs = step.exercise.answer.split('|').map((pair) => pair.split('='));
      const objectLayout = (await page.locator('[data-match-tray]').count()) > 0;

      if (objectLayout) {
        const sizes = await page.evaluate(() => ({
          rows: [...document.querySelectorAll('.match-object-row')].map((r) => r.getBoundingClientRect().height),
          slots: [...document.querySelectorAll('[data-match-slot]')].map((r) => r.getBoundingClientRect().height),
        }));
        for (const h of sizes.rows) expect(h, `${path} row`).toBeGreaterThanOrEqual(48);
        for (const h of sizes.slots) expect(h, `${path} slot`).toBeGreaterThanOrEqual(48);
        minRow = Math.min(minRow, ...sizes.rows);
        minTarget = Math.min(minTarget, ...sizes.slots);
        for (const [left, right] of pairs) {
          await page.locator(`[data-match-digit="${left}"]`).click();
          await page.locator(`[data-match-slot="${right}"]`).click();
          const row = page.locator('.match-object-row', { has: page.locator(`[data-match-slot="${right}"]`) });
          await expect(row.locator(`[data-match-placed="${left}"]`), `${path} ${left}→${right}`).toBeVisible();
        }
      } else {
        const heights = await page.evaluate(() =>
          [...document.querySelectorAll('[data-match-column] button[aria-label]')].map((b) => b.getBoundingClientRect().height)
        );
        for (const h of heights) expect(h, `${path} card`).toBeGreaterThanOrEqual(48);
        minTarget = Math.min(minTarget, ...heights);
        let placed = 0;
        for (const [left, right] of pairs) {
          await page.locator(`[data-match-column="left"] button[aria-label="${left}"]`).click();
          await page.locator(`[data-match-column="right"] button[aria-label="${right}"]`).click();
          placed += 2;
          await expect(page.locator('.match-pair-placed'), `${path} ${left}→${right}`).toHaveCount(placed);
        }
      }
      await page.getByRole('button', { name: /بررسی/ }).click();
      await expect(page.locator('.sheet.correct'), path).toBeVisible();
    }
    console.log(`${viewport.width}x${viewport.height} steps=${steps.length} minRow=${minRow} minTarget=${minTarget}`);
  });
}
