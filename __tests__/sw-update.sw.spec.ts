import { test, expect } from '@playwright/test';

// The worker that shipped before the fix: fixed cache name, stale-while-
// revalidate navigations, no skipWaiting/clients.claim.
// It is served by scripts/sw-test-server.mjs while /__test/legacy-sw is on.
const OLD_MARKER = 'OLD-BUILD-MARKER';

async function seedOnboarded(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack: 'math', onboarded: true, completedLessons: [], completedUnits: [],
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
  });
}

test.describe.configure({ mode: 'serial' });

test.afterEach(async ({ request }) => {
  await request.get('/__test/legacy-sw/off');
});

test('a returning user on the old worker gets the new build without a manual reload', async ({
  page,
}) => {
  test.setTimeout(90000);

  // 1. Old world: every /sw.js request gets the legacy worker.
  await page.request.get('/__test/legacy-sw/on');
  await page.goto('/home');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  // Simulate the stale shell the old worker keeps serving.
  const plantStaleShell = () =>
    page.evaluate(async (marker) => {
      const cache = await caches.open('persian-learn-v2');
      await cache.put(
        '/home',
        new Response(`<!doctype html><html><body><h1 id="old">${marker}</h1></body></html>`, {
          headers: { 'Content-Type': 'text/html' },
        })
      );
    }, OLD_MARKER);
  await plantStaleShell();
  await page.goto('/home');
  await expect(page.locator('#old')).toHaveText(OLD_MARKER); // the bug, reproduced

  // 2. Deploy: the real (new) sw.js is served from now on.
  // That visit let the old worker refresh /home in the background, so plant
  // the stale shell again before the deploy.
  await plantStaleShell();
  await page.request.get('/__test/legacy-sw/off');

  // First load after the deploy. The old worker still answers with the stale
  // shell, but the new worker must take over and bring up the new build with
  // no page.reload() from us.
  await page.goto('/home');
  await expect(page.locator('#old')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('.app-phone').first()).toBeVisible({ timeout: 30000 });

  await expect
    .poll(() => page.evaluate(() => caches.keys()).catch(() => ['persian-learn-v2']), {
      timeout: 15000,
    })
    .not.toContain('persian-learn-v2');
  // Let the one-time takeover navigation settle, then the new build must be up.
  await page.waitForTimeout(1500);
  await page.waitForLoadState('load');
  await expect(page.locator('#old')).toHaveCount(0);
  await expect(page.locator('.app-phone').first()).toBeVisible();
  const state = await page.evaluate(async () => ({
    caches: await caches.keys(),
    script: navigator.serviceWorker.controller?.scriptURL ?? '',
  }));
  expect(state.caches).not.toContain('persian-learn-v2');
  expect(state.caches.some((name) => name.startsWith('persian-learn-'))).toBe(true);
  expect(state.script).toMatch(/\/sw\.js\?v=/);

  // 3. Later navigations come from the network (network-first), not a stale copy.
  await page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find((n) => n.startsWith('persian-learn-'))!);
    await cache.put('/home', new Response('<h1 id="old">STALE</h1>', { headers: { 'Content-Type': 'text/html' } }));
  });
  await page.goto('/home');
  await expect(page.locator('#old')).toHaveCount(0);
  await page.screenshot({ path: '/workspace/pl-fix-artifacts/sw-upgraded-home.png' });
});

test('a later deploy reloads the page once, but never in the middle of a lesson', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/home');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  // Mid-lesson: a new worker takes over but the page must not reload.
  await seedOnboarded(page);
  await page.goto('/lesson/m1l1');
  await expect(page.getByRole('button', { name: 'بستن درس' })).toBeVisible();
  await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
  await page.request.get('/__test/sw-bump');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update();
  });
  await page.waitForTimeout(4000);
  expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);

  // Outside a lesson: the next deploy reloads the page exactly once.
  await page.goto('/home');
  await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
  let loads = 0;
  page.on('load', () => (loads += 1));
  await page.request.get('/__test/sw-bump');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update();
  });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __marker?: number }).__marker).catch(() => 1), {
      timeout: 15000,
    })
    .toBeUndefined();
  await page.waitForTimeout(3000);
  expect(loads).toBe(1);
  await expect(page.locator('.app-phone').first()).toBeVisible();
});

test('offline navigation falls back to the cached page', async ({ page, context }) => {
  await page.goto('/home');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.goto('/home');
  await expect(page.locator('.app-phone').first()).toBeVisible();
  await context.setOffline(false);
});
