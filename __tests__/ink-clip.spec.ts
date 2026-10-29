import { test, expect } from './e2e-audio-stub';
import type { Page } from '@playwright/test';
import math from '../public/content/math.json';
import alphabet from '../public/content/alphabet.json';
import { auditInkClip } from './layout-audit';

// Ink-fitted glyphs (clap, same/different marks, clock faces) must never lose
// ink to their clip box: at normal font, large font and page zoom.
const SCREENS = [
  '/lesson/a1l2?ex=1',
  '/lesson/a1l4?ex=1',
  '/lesson/m12l1?ex=3',
  '/lesson/m12l1?ex=8',
  '/lesson/m12l2?ex=4',
  '/lesson/m12l3?ex=9',
  '/lesson/m12l5?ex=3',
];
const CONFIGS = [
  { name: '360x640 1x', width: 360, height: 640, font: 1, zoom: 1 },
  { name: '412x915 1x', width: 412, height: 915, font: 1, zoom: 1 },
  { name: '360x640 font 1.5x', width: 360, height: 640, font: 1.5, zoom: 1 },
  { name: '360x640 zoom 2x', width: 360, height: 640, font: 1, zoom: 2 },
];

const allMath = math.units.flatMap((u) => u.lessons.map((l) => l.id));
const allAlpha = alphabet.units.flatMap((u) => u.lessons.map((l) => l.id));

async function seed(page: Page, track: 'math' | 'alphabet') {
  await page.goto('/manifest.json');
  await page.evaluate(async ({ track, completed }) => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack: track, onboarded: true, completedLessons: completed, completedUnits: [],
      xp: 400, streak: 3, streakBest: 3, lastActivityDate: today, dailyGoal: 2,
      dailyLessonsCompleted: 1, restDaysUsed: 0, weakItems: [], avatar: 'tulip',
      name: 'فریبا جون', startDate: '2026-01-01T00:00:00.000Z', speechRate: 1,
      autoplay: false, activityDates: [today],
    };
    sessionStorage.clear();
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
  }, { track, completed: track === 'math' ? allMath.slice(0, -1) : allAlpha.slice(0, -1) });
}

async function open(page: Page, path: string, font: number) {
  await page.goto(path);
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('.illus[data-ink-fit]').first()).toBeVisible({ timeout: 30000 });
  if (font !== 1) await page.addStyleTag({ content: `html { font-size: ${font * 100}% !important; }` });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

for (const config of CONFIGS) {
  test(`ink-fitted glyphs keep all their ink at ${config.name}`, async ({ browser }) => {
    test.setTimeout(240000);
    const context = await browser.newContext({
      viewport: { width: Math.round(config.width / config.zoom), height: Math.round(config.height / config.zoom) },
      deviceScaleFactor: 2 * config.zoom,
      isMobile: true,
      hasTouch: true,
      baseURL: `http://localhost:${process.env.PW_PORT || 3000}`,
    });
    const page = await context.newPage();
    const failures: string[] = [];
    let seeded = '';
    for (const path of SCREENS) {
      const track = path.includes('/lesson/a') ? 'alphabet' : 'math';
      if (seeded !== track) {
        await seed(page, track);
        seeded = track;
      }
      await open(page, path, config.font);
      const glyphs = await page.locator('.illus[data-ink-fit]').count();
      expect(glyphs, path).toBeGreaterThan(0);
      for (const issue of await auditInkClip(page)) failures.push(`${path} ${issue.detail}`);
    }
    await context.close();
    expect(failures, failures.join('\n')).toEqual([]);
  });
}

test('the ink-clip audit catches a glyph pushed out of its box', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await seed(page, 'alphabet');
  await open(page, '/lesson/a1l4?ex=1', 1);
  expect(await auditInkClip(page)).toEqual([]);
  // Same shape as the 85cd0d2 bug: the glyph drawn ~0.15em above where it was
  // measured, so the clip box cuts off its top.
  await page.addStyleTag({ content: '.illus[data-ink-fit] > .ink-fit { top: 35% !important; }' });
  await page.waitForTimeout(100);
  const issues = await auditInkClip(page);
  expect(issues.length, JSON.stringify(issues)).toBeGreaterThan(0);
  expect(issues.every((i) => i.kind === 'ink-clip')).toBe(true);
});
