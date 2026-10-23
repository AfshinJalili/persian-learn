import { readFileSync } from 'fs';
import { test, expect, type Page } from '@playwright/test';

// Owner rule for multi-item intros: at 360x640 and up, 1x font, the screen
// fits with no vertical or horizontal scroll, Continue fully on screen at
// load, and every picture and tap target >= 48px. The screens are found by
// sweeping the content (no hard-coded list): every intro with more than one
// picture in its display or its visual, including the count-card intro
// (variant count_cards, m1l1).

type Ex = { id: string; type: string; payload: { display?: string; visual?: string; variant?: string } };
type Track = { units: { lessons: { id: string; exercises: Ex[] }[] }[] };
const tracks: Record<string, Track> = {
  math: JSON.parse(readFileSync('public/content/math.json', 'utf8')),
  alphabet: JSON.parse(readFileSync('public/content/alphabet.json', 'utf8')),
};
const segmenter = new Intl.Segmenter('fa', { granularity: 'grapheme' });
const pictures = (value = '') =>
  [...segmenter.segment(value)].filter((g) => /\p{Extended_Pictographic}/u.test(g.segment)).length;

const MULTI = Object.entries(tracks).flatMap(([track, t]) =>
  t.units
    .flatMap((u) => u.lessons)
    .flatMap((lesson) =>
      lesson.exercises.flatMap((ex, index) =>
        ex.type === 'intro' &&
        (pictures(ex.payload.display) > 1 || pictures(ex.payload.visual) > 1)
          ? [
              {
                track,
                path: `/lesson/${lesson.id}?ex=${index}`,
                id: `${lesson.id}e${index}`,
                cards: ex.payload.variant === 'count_cards',
              },
            ]
          : []
      )
    )
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
    { track, completed: tracks[track].units.flatMap((u) => u.lessons.map((l) => l.id)) }
  );
}

test('the sweep finds the group intros', () => {
  const ids = MULTI.map((m) => m.id);
  for (const id of ['m1l1e0', 'm6l1e0', 'm7l1e0', 'm8l1e0', 'm9l1e0', 'm11l2e0', 'm6l3e0', 'm8l4e0']) {
    expect(ids).toContain(id);
  }
  // The count-card intro is in the sweep, not skipped by its variant.
  expect(MULTI.filter((m) => m.cards).map((m) => m.id)).toEqual(['m1l1e0']);
  expect(ids.length).toBe(29);
});

for (const viewport of [
  { width: 360, height: 640 },
  { width: 375, height: 667 },
]) {
  test.describe(`multi-item intros fit at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    for (const track of ['math', 'alphabet']) {
      const screens = MULTI.filter((m) => m.track === track);
      test(`${track}: ${screens.length} screens, no scroll, Continue on screen, >= 48px`, async ({ page }) => {
        test.setTimeout(30000 + screens.length * 4000);
        await seed(page, track);
        const failures: string[] = [];
        for (const screen of screens) {
          await page.goto(screen.path);
          const columnSelector = screen.cards ? '.cc-intro-screen' : '[data-intro-plain]';
          await page.locator(columnSelector).waitFor();
          if (screen.cards) await page.locator('[data-count-card]').nth(2).waitFor();
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all(
              ['400', '800', '900'].map((w) => document.fonts.load(`${w} 36px Vazirmatn`, 'سلام ۱۲۳').catch(() => {}))
            );
          });
          // Two frames for the fit / in-row-speaker pass after fonts.
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
          await page.waitForTimeout(150);
          const r = await page.evaluate((columnSelector) => {
            const content = document.querySelector('.app-phone .content') as HTMLElement;
            const root = document.scrollingElement as HTMLElement;
            const column = content.querySelector(columnSelector) as HTMLElement;
            const btn = [...column.querySelectorAll('button')].find((b) => b.textContent?.includes('ادامه'))!;
            const b = btn.getBoundingClientRect();
            const taps = [...document.querySelectorAll('.app-phone button')]
              .map((el) => el.getBoundingClientRect())
              .filter((rect) => rect.width > 0)
              .map((rect) => Math.min(rect.width, rect.height));
            const art = [...column.querySelectorAll('.illus')]
              .map((el) => el.getBoundingClientRect())
              .map((rect) => Math.min(rect.width, rect.height));
            const lines = [...column.querySelectorAll('[data-art-term]')].map((term) => {
              const tops = new Set([...term.children].map((c) => Math.round(c.getBoundingClientRect().top)));
              return { items: term.children.length, rows: tops.size, cols: getComputedStyle(term).gridTemplateColumns.split(' ').length };
            });
            return {
              v: content.scrollHeight - content.clientHeight,
              docV: root.scrollHeight - innerHeight,
              h: content.scrollWidth - content.clientWidth,
              docH: root.scrollWidth - innerWidth,
              top: b.top,
              bottom: b.bottom,
              vh: innerHeight,
              minTap: Math.min(...taps),
              minArt: art.length ? Math.min(...art) : 48,
              lines,
            };
          }, columnSelector);
          const bad: string[] = [];
          if (r.v > 0) bad.push(`vertical scroll ${r.v}px`);
          if (r.docV > 0) bad.push(`page scroll ${r.docV}px`);
          if (r.h > 0 || r.docH > 0) bad.push(`horizontal scroll ${Math.max(r.h, r.docH)}px`);
          if (r.top < 0 || r.bottom > r.vh) bad.push(`Continue ${r.top}..${r.bottom} (vh ${r.vh})`);
          if (r.minTap < 48) bad.push(`tap ${r.minTap}px`);
          if (r.minArt < 47.5) bad.push(`picture ${r.minArt}px`);
          // A term (🍎🍎🍎) never breaks across lines unless it is a deliberate grid.
          for (const line of r.lines) {
            if (line.rows > Math.ceil(line.items / line.cols)) bad.push(`term wrapped ${JSON.stringify(line)}`);
          }
          if (bad.length) failures.push(`${screen.id}: ${bad.join(', ')}`);
        }
        expect(failures, failures.join('\n')).toEqual([]);
      });
    }
  });
}
