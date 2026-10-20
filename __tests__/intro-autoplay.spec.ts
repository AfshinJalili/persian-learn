import { readFileSync } from 'fs';
import { test, expect, type Page } from '@playwright/test';
import { audioUrlForHash, generateAudioId, spokenTextKey } from '../lib/audio-id';

// Browser check for the step-entry stop: the lesson page's step effect runs
// after the intro's own mount effect, and must not cancel the greeting the
// counting intro just started. Audio is recorded (and ended after a short
// play) so the greeting -> helper order is observable without real output.

type Ex = { id: string; type: string; audio_script: string; payload: Record<string, unknown> };
type Track = { units: { lessons: { id: string; exercises: Ex[] }[] }[] };
const math = JSON.parse(readFileSync('public/content/math.json', 'utf8')) as Track;
const lessons = math.units.flatMap((u) => u.lessons);
const lesson = (id: string) => lessons.find((l) => l.id === id)!;
const HELPER = 'هر کارت را بزنید تا عددش را بشنوید.';

const urlFor = async (text: string) => audioUrlForHash(await generateAudioId(spokenTextKey(text)));

async function recordAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __played: string[] };
    w.__played = [];
    class RecordedAudio {
      playbackRate = 1;
      preservesPitch = true;
      paused = true;
      currentTime = 0;
      src: string;
      private ended: (() => void) | null = null;
      constructor(src?: string) {
        this.src = src ?? '';
      }
      addEventListener(type: string, cb: () => void) {
        if (type === 'ended') this.ended = cb;
      }
      removeEventListener() {}
      play() {
        this.paused = false;
        w.__played.push(new URL(this.src, location.href).pathname);
        setTimeout(() => {
          if (this.paused) return;
          this.paused = true;
          this.ended?.();
        }, 150);
        return Promise.resolve();
      }
      pause() {
        this.paused = true;
      }
    }
    (window as unknown as { Audio: unknown }).Audio = RecordedAudio;
  });
}

async function seed(page: Page, autoplay: boolean) {
  await page.goto('/manifest.json');
  await page.evaluate(
    async ({ completed, autoplay }) => {
      const today = new Date().toISOString().split('T')[0];
      const progress = {
        currentTrack: 'math', onboarded: true, completedLessons: completed, completedUnits: [],
        xp: 400, streak: 3, streakBest: 3, lastActivityDate: today, dailyGoal: 2,
        dailyLessonsCompleted: 1, restDaysUsed: 0, weakItems: [], avatar: 'tulip',
        name: 'فریبا جون', startDate: '2026-01-01T00:00:00.000Z', speechRate: 1,
        autoplay, activityDates: [today],
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
    { completed: lessons.map((l) => l.id), autoplay }
  );
}

const played = (page: Page) => page.evaluate(() => (window as unknown as { __played: string[] }).__played);

test.describe('intro autoplay', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('m1l1e1 counting intro autoplays the greeting, then the helper, then invites a tap', async ({ page }) => {
    await recordAudio(page);
    await seed(page, true);
    await page.goto('/lesson/m1l1?ex=0');
    await expect(page.locator('[data-count-card]')).toHaveCount(3);
    const greeting = await urlFor(lesson('m1l1').exercises[0].audio_script);
    const helper = await urlFor(HELPER);
    await expect.poll(() => played(page), { timeout: 10000 }).toEqual([greeting, helper]);
    // The tap-a-card invite pulse runs at the end of the same sequence.
    await expect(page.locator('[data-count-card]').first()).toHaveClass(/invite/, { timeout: 5000 });
  });

  test('autoplay off: no greeting, but the tap-a-card invite still runs', async ({ page }) => {
    await recordAudio(page);
    await seed(page, false);
    await page.goto('/lesson/m1l1?ex=0');
    await expect(page.locator('[data-count-card]').first()).toHaveClass(/invite/, { timeout: 5000 });
    expect(await played(page)).toEqual([]);
  });

  test('control: m1l2e1 normal intro autoplays its prompt', async ({ page }) => {
    await recordAudio(page);
    await seed(page, true);
    await page.goto('/lesson/m1l2?ex=0');
    const prompt = await urlFor(lesson('m1l2').exercises[0].audio_script);
    await expect.poll(() => played(page), { timeout: 10000 }).toEqual([prompt]);
  });
});

test.describe('group intros fit at 375x667', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  for (const id of ['m6l1', 'm6l3', 'm8l4']) {
    test(`${id}e1: items fitted (48–72px), no horizontal scroll, Continue on screen`, async ({ page }) => {
      await seed(page, false);
      await page.goto(`/lesson/${id}?ex=0`);
      const group = page.locator('[data-group-art] .object-cluster');
      await expect(group).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const content = document.querySelector('.app-phone .content') as HTMLElement;
        const items = [...document.querySelectorAll('[data-group-art] .illus')].map((e) => e.getBoundingClientRect());
        const btn = [...content.querySelectorAll('button')].find((b) => b.textContent?.includes('ادامه'))!;
        const b = btn.getBoundingClientRect();
        return {
          n: items.length,
          minSize: Math.min(...items.map((i) => Math.min(i.width, i.height))),
          maxSize: Math.max(...items.map((i) => Math.max(i.width, i.height))),
          left: Math.min(...items.map((i) => i.left)),
          right: Math.max(...items.map((i) => i.right)),
          hscroll: content.scrollWidth > content.clientWidth + 1,
          docHScroll: document.documentElement.scrollWidth > innerWidth + 1,
          btnBottom: b.bottom,
          btnH: b.height,
          vh: innerHeight,
          vw: innerWidth,
        };
      });
      expect(r.n).toBeGreaterThan(5);
      expect(r.minSize).toBeGreaterThanOrEqual(48);
      expect(r.maxSize).toBeLessThanOrEqual(72);
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.right).toBeLessThanOrEqual(r.vw);
      expect(r.hscroll).toBe(false);
      expect(r.docHScroll).toBe(false);
      expect(r.btnH).toBeGreaterThanOrEqual(48);
      expect(r.btnBottom).toBeLessThanOrEqual(r.vh);
    });
  }
});
