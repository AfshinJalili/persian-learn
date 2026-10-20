import { readFileSync } from 'fs';
import type { Page } from '@playwright/test';
import { test, expect } from './e2e-audio-stub';
import { auditInkClip, auditSingleArt } from './layout-audit';

// Count cards are opt-in (payload.variant = "count_cards"), never inferred
// from the display. Every other intro keeps the plain layout, and a single
// picture there is drawn at 160px with >= 70% visible ink of its art box.
type Track = { units: { lessons: { id: string; exercises: { type: string; payload: Record<string, unknown> }[] }[] }[] };
const math = JSON.parse(readFileSync('public/content/math.json', 'utf8')) as Track;
const alphabet = JSON.parse(readFileSync('public/content/alphabet.json', 'utf8')) as Track;
const lessonsOf = (t: Track) => t.units.flatMap((u) => u.lessons);
const PICTO = /\p{Extended_Pictographic}/u;

// Every intro whose display is one picture (one grapheme, pictographic).
const SINGLE_PICTURE_INTROS = [...lessonsOf(math), ...lessonsOf(alphabet)].flatMap((lesson) =>
  lesson.exercises.flatMap((ex, index) => {
    if (ex.type !== 'intro') return [];
    const display = String(ex.payload.display ?? '').trim();
    const graphemes = [...new Intl.Segmenter('fa', { granularity: 'grapheme' }).segment(display)];
    return graphemes.length === 1 && PICTO.test(display)
      ? [{ path: `/lesson/${lesson.id}?ex=${index}`, track: lesson.id.startsWith('a') ? 'alphabet' : 'math' }]
      : [];
  })
);

async function seed(page: Page, track: string) {
  await page.goto('/manifest.json');
  await page.evaluate(
    async ({ track, completed }) => {
      const today = new Date().toISOString().split('T')[0];
      const progress = {
        currentTrack: track, onboarded: true, completedLessons: completed, completedUnits: [],
        xp: 400, streak: 3, streakBest: 3, lastActivityDate: today, dailyGoal: 2,
        dailyLessonsCompleted: 1, restDaysUsed: 0, weakItems: [], avatar: 'tulip',
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
    },
    { track, completed: (track === 'math' ? lessonsOf(math) : lessonsOf(alphabet)).map((l) => l.id) }
  );
}

test.describe('intro variants', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('m1l1e1 (flagged count_cards) renders the counting intro', async ({ page }) => {
    await seed(page, 'math');
    await page.goto('/lesson/m1l1?ex=0');
    await expect(page.locator('[data-count-card]')).toHaveCount(3, { timeout: 30000 });
    await expect(page.locator('[data-cc-continue]')).toHaveAttribute('aria-disabled', 'true');
  });

  test('m12l2e1 (☀️  🌙, not flagged) renders as a normal intro', async ({ page }) => {
    await seed(page, 'math');
    await page.goto('/lesson/m12l2?ex=0');
    const cont = page.getByRole('button', { name: 'ادامه' });
    await expect(cont).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-count-card]')).toHaveCount(0);
    await expect(page.locator('.cc-list')).toHaveCount(0);
    await expect(page.locator('[data-cc-continue]')).toHaveCount(0);
    await expect(cont).not.toHaveAttribute('aria-disabled', 'true');
    // No count words («یک») stand in for the sun / moon.
    await expect(page.getByText('یک', { exact: true })).toHaveCount(0);
  });

  test(`single-picture intros draw 160px art with >= 0.70 unclipped ink (${SINGLE_PICTURE_INTROS.length} screens)`, async ({ page }) => {
    test.setTimeout(240000);
    expect(SINGLE_PICTURE_INTROS.length).toBeGreaterThan(10);
    let seeded = '';
    const fails: string[] = [];
    for (const { path, track } of SINGLE_PICTURE_INTROS) {
      if (seeded !== track) {
        await seed(page, track);
        seeded = track;
      }
      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});
      const art = page.locator('.intro-single-art[data-single-art]');
      await expect(art, path).toHaveCount(1, { timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      // Same settle as ink-clip.spec before the pixel audits.
      await page.waitForTimeout(400);
      const box = await art.boundingBox();
      expect(box?.width ?? 0, path).toBeGreaterThanOrEqual(150);
      // Ink-clip first: auditSingleArt scrolls the card into view, and its
      // pixel diff must not race that scroll.
      for (const issue of await auditInkClip(page)) fails.push(`${path}: ${issue.detail}`);
      const results = await auditSingleArt(page);
      expect(results.length, path).toBeGreaterThan(0);
      for (const r of results) {
        console.log(path, r.detail);
        if (r.kind === 'single-art') fails.push(`${path}: ${r.detail}`);
      }
    }
    expect(fails).toEqual([]);
  });
});
