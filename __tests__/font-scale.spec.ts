import { test, expect } from './e2e-audio-stub';
import type { Browser, Page } from '@playwright/test';
import math from '../public/content/math.json';
import alphabet from '../public/content/alphabet.json';
import { auditLayout, auditUnderBar, auditSingleArt } from './layout-audit';

// Fariba's phone uses a very large system font. Two ways that reaches the page:
//  - "font": the root font size grows (Chrome's text-size setting, iOS
//    Dynamic Type / Safari text size): html { font-size: 130% | 150% | 200% }.
//  - "zoom": Android Chrome's default since Page Zoom folds the OS font scale
//    into page zoom, so the CSS viewport shrinks (360px phone at 1.5x = 240px).
// Every screen must keep text inside its boxes, never overlap, never scroll
// sideways and keep 48px taps. Vertical scrolling is allowed.
const VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 412, height: 915 },
] as const;
// Normal font (1x) is included so the Check-bar / roadmap / number-line
// floors that fail even without a large system font are covered.
const SCALES = [1, 1.3, 1.5, 2] as const;
const MODES = ['font', 'zoom'] as const;

const SHOT_DIR = process.env.FONTSCALE_SHOT_DIR;

const allMath = math.units.flatMap((u) => u.lessons.map((l) => l.id));
const allAlpha = alphabet.units.flatMap((u) => u.lessons.map((l) => l.id));

type Screen = { name: string; path: string; track?: 'math' | 'alphabet'; greeting?: boolean; answer?: boolean };
const SCREENS: Screen[] = [
  { name: 'greeting', path: '/home', greeting: true },
  { name: 'home', path: '/home' },
  { name: 'home-alphabet', path: '/home', track: 'alphabet' },
  { name: 'profile', path: '/profile' },
  { name: 'profile-alphabet', path: '/profile', track: 'alphabet' },
  { name: 'streak', path: '/streak' },
  { name: 'lesson-complete', path: '/lesson-complete?xp=10&lesson=%DB%B1%20%D8%AA%D8%A7%20%DB%B3&id=m1l1' },
  { name: 'intro', path: '/lesson/m1l1?ex=0' },
  { name: 'tap-picture', path: '/lesson/m1l1?ex=1' },
  { name: 'count-single', path: '/lesson/m1l3?ex=1' },
  { name: 'count', path: '/lesson/m1l3?ex=3' },
  { name: 'count-feedback', path: '/lesson/m1l3?ex=3', answer: true },
  { name: 'listen-choose', path: '/lesson/m1l3?ex=6' },
  { name: 'choose-digit', path: '/lesson/m1l3?ex=7' },
  { name: 'dice', path: '/lesson/m2l3?ex=1' },
  { name: 'hand', path: '/lesson/m2l4?ex=1' },
  { name: 'match', path: '/lesson/m1l4?ex=1' },
  { name: 'match-6', path: '/lesson/m1l5?ex=6' },
  { name: 'number-line', path: '/lesson/m3l5?ex=3' },
  { name: 'claps', path: '/lesson/a1l2?ex=1', track: 'alphabet' },
  { name: 'same-diff', path: '/lesson/a1l4?ex=1', track: 'alphabet' },
  { name: 'letter-match-a2', path: '/lesson/a2l2?ex=2', track: 'alphabet' },
  { name: 'index-hand', path: '/lesson/m2l4?ex=2' },
  { name: 'onion', path: '/lesson/m1l5?ex=9' },
  { name: 'equation', path: '/lesson/m4l1?ex=6' },
  { name: 'compare', path: '/lesson/m5l1?ex=1' },
  { name: 'ten-frame', path: '/lesson/m6l1?ex=1' },
  { name: 'count-money', path: '/lesson/m10l1?ex=1' },
  { name: 'pay-amount', path: '/lesson/m10l3?ex=1' },
  { name: 'make-change', path: '/lesson/m11l2?ex=1' },
  { name: 'read-clock', path: '/lesson/m12l1?ex=1' },
  { name: 'alpha-intro', path: '/lesson/a1l1?ex=0', track: 'alphabet' },
  { name: 'alpha-tap', path: '/lesson/a1l1?ex=1', track: 'alphabet' },
  { name: 'letter-match', path: '/lesson/a1l1?ex=5', track: 'alphabet' },
  { name: 'trace', path: '/lesson/a2l1?ex=1', track: 'alphabet' },
  { name: 'build-word', path: '/lesson/a2l1?ex=8', track: 'alphabet' },
  { name: 'break-points', path: '/lesson/a2l2?ex=8', track: 'alphabet' },
];

async function seed(page: Page, track: 'math' | 'alphabet', unlocked: boolean) {
  // Seed from a page that does not run the app, so the app's first-run
  // default progress cannot land after (and overwrite) the seed.
  await page.goto('/manifest.json');
  await page.evaluate(async ({ track, completed, unlocked }) => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack: track, onboarded: true, completedLessons: completed, completedUnits: [],
      xp: 400, streak: 3, streakBest: 3, lastActivityDate: today, dailyGoal: 2,
      dailyLessonsCompleted: 1, restDaysUsed: 0, weakItems: [], avatar: 'tulip',
      name: 'فریبا جون', startDate: '2026-01-01T00:00:00.000Z', speechRate: 1,
      autoplay: false, activityDates: [today],
    };
    sessionStorage.clear();
    if (unlocked) sessionStorage.setItem('pl-audio-unlocked', '1');
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
  }, { track, completed: track === 'math' ? allMath.slice(0, -1) : allAlpha.slice(0, -1), unlocked });
}

function answerFor(path: string): string {
  const m = /\/lesson\/(\w+)\?ex=(\d+)/.exec(path)!;
  const lesson = [...math.units, ...alphabet.units].flatMap((u) => u.lessons).find((l) => l.id === m[1])!;
  return String(lesson.exercises[Number(m[2])].answer);
}

async function openPage(browser: Browser, mode: 'font' | 'zoom', scale: number, viewport: { width: number; height: number }) {
  const zoom = mode === 'zoom';
  const context = await browser.newContext({
    viewport: zoom
      ? { width: Math.round(viewport.width / scale), height: Math.round(viewport.height / scale) }
      : viewport,
    deviceScaleFactor: zoom ? 2.75 * scale : 2.75,
    isMobile: true,
    hasTouch: true,
    baseURL: `http://localhost:${process.env.PW_PORT || 3000}`,
  });
  const page = await context.newPage();
  if (!zoom) {
    await page.addInitScript((pct) => {
      const apply = () => {
        const style = document.createElement('style');
        style.dataset.fontScale = '1';
        style.textContent = `html { font-size: ${pct}% !important; }`;
        document.documentElement.appendChild(style);
      };
      if (document.documentElement) apply();
      else document.addEventListener('DOMContentLoaded', apply);
    }, scale * 100);
  }
  return { context, page };
}

for (const mode of MODES) {
  for (const viewport of VIEWPORTS) {
    for (const scale of SCALES) {
      if (mode === 'zoom' && scale === 1) continue;
      test(`font scale ${mode} ${scale}x at ${viewport.width}x${viewport.height}: nothing overflows or overlaps`, async ({ browser }) => {
        test.setTimeout(600000);
        const { context, page } = await openPage(browser, mode, scale, viewport);
        // The e2e audio stub lives on the default page fixture; stub here too.
        await page.addInitScript(() => {
          class ImmediateAudio {
            playbackRate = 1; preservesPitch = true; paused = true; currentTime = 0; src = '';
            onended: (() => void) | null = null;
            constructor(src?: string) { this.src = src ?? ''; }
            addEventListener() {} removeEventListener() {}
            play() { this.paused = true; queueMicrotask(() => this.onended?.()); return Promise.resolve(); }
            pause() { this.paused = true; }
          }
          Object.defineProperty(window, 'Audio', { configurable: true, writable: true, value: ImmediateAudio });
          if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
        });
        const failures: string[] = [];
        let seeded = '';
        for (const screen of SCREENS) {
          const track = screen.track ?? 'math';
          const key = `${track}:${screen.greeting ? 'locked' : 'unlocked'}`;
          if (seeded !== key) {
            await seed(page, track, !screen.greeting);
            seeded = key;
          }
          await page.goto(screen.path);
          await page.waitForLoadState('networkidle').catch(() => {});
          if (screen.greeting) {
            await expect(page.locator('div[role="button"][aria-label="شروع"]')).toBeVisible({ timeout: 30000 });
          } else {
            await expect(page.locator('.app-phone .content, .app-phone .home-top').first(), screen.name).toBeVisible({ timeout: 30000 });
          }
          if (screen.answer) {
            await page.locator('.content button', { hasText: answerFor(screen.path) }).first().click();
            await page.getByRole('button', { name: /بررسی/ }).click();
            await expect(page.locator('.sheet')).toBeVisible();
          }
          await page.waitForTimeout(500);
          if (mode === 'font') {
            const root = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
            expect(root, 'root font size').toBeCloseTo(16 * scale, 0);
          }
          const zoom = mode === 'zoom' ? scale : 1;
          const issues = [
            ...(await auditLayout(page, { zoom })),
            ...(await auditUnderBar(page, {
              fit:
                mode === 'font' &&
                scale === 1 &&
                viewport.width >= 360 &&
                viewport.height >= 640 &&
                /^\/lesson\/(m[123]|a[12])/.test(screen.path),
            })),
            ...((await auditSingleArt(page)).filter((i) => i.kind === 'single-art')),
          ];
          if (SHOT_DIR) {
            await page.screenshot({
              path: `${SHOT_DIR}/${mode}-${scale}x-${viewport.width}x${viewport.height}-${screen.name}.png`,
              fullPage: false,
            });
          }
          for (const issue of issues) failures.push(`${screen.name} ${issue.kind}: ${issue.detail}`);
          // Check / Continue must stay reachable (in view after scrolling).
          const action = page.locator('.sheet .btn, .bottom .btn').first();
          if ((await action.count()) > 0) {
            await action.scrollIntoViewIfNeeded();
            const box = await action.boundingBox();
            const vh = page.viewportSize()!.height;
            if (!box || box.y < 0 || box.y + box.height > vh + 1) failures.push(`${screen.name} action button not reachable`);
          }
        }
        await context.close();
        console.log(`${mode} ${scale}x ${viewport.width}x${viewport.height}: ${failures.length} issues`);
        expect(failures, failures.join('\n')).toEqual([]);
      });
    }
  }
}
