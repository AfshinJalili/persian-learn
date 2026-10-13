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

const AUDIO = '/audio/0bca6c7cfc6f2a1e8b791f0ee5e020b0.mp3';

async function controlled(page: import('@playwright/test').Page) {
  await page.goto('/home');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

test('a range request caches the full audio file and ranges are served offline', async ({
  page,
  context,
}) => {
  await controlled(page);

  const online = await page.evaluate(async (src) => {
    const full = new Uint8Array(await (await fetch(src, { cache: 'no-store', headers: { 'x-probe': '1' } })).arrayBuffer());
    const res = await fetch(src, { headers: { Range: 'bytes=0-99' } });
    const part = new Uint8Array(await res.arrayBuffer());
    const cacheName = (await caches.keys()).find((n) => n.startsWith('persian-learn-'))!;
    const cached = await (await caches.open(cacheName)).match(src);
    return {
      size: full.length,
      status: res.status,
      contentRange: res.headers.get('Content-Range'),
      partOk: part.length === 100 && part.every((b, i) => b === full[i]),
      cachedStatus: cached?.status ?? 0,
      cachedSize: cached ? (await cached.arrayBuffer()).byteLength : 0,
    };
  }, AUDIO);
  expect(online.status).toBe(206);
  expect(online.contentRange).toBe(`bytes 0-99/${online.size}`);
  expect(online.partOk).toBe(true);
  expect(online.cachedStatus).toBe(200);
  expect(online.cachedSize).toBe(online.size);

  await context.setOffline(true);
  const offline = await page.evaluate(async (src) => {
    const cacheName = (await caches.keys()).find((n) => n.startsWith('persian-learn-'))!;
    const full = new Uint8Array(await (await (await caches.open(cacheName)).match(src))!.arrayBuffer());
    const size = full.length;
    const mid = await fetch(src, { headers: { Range: 'bytes=1000-1999' } });
    const midBytes = new Uint8Array(await mid.arrayBuffer());
    const open = await fetch(src, { headers: { Range: `bytes=${size - 10}-` } });
    const suffix = await fetch(src, { headers: { Range: 'bytes=-50' } });
    const whole = await fetch(src);
    const bad = await fetch(src, { headers: { Range: `bytes=${size + 5}-` } });
    // A real <audio> element (which sends Range) must load offline too.
    const audio = new Audio(src);
    const loaded = await new Promise<boolean>((resolve) => {
      audio.addEventListener('loadedmetadata', () => resolve(true));
      audio.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(false), 8000);
    });
    return {
      size,
      mid: {
        status: mid.status,
        range: mid.headers.get('Content-Range'),
        length: mid.headers.get('Content-Length'),
        accept: mid.headers.get('Accept-Ranges'),
        ok: midBytes.length === 1000 && midBytes.every((b, i) => b === full[1000 + i]),
      },
      open: { status: open.status, range: open.headers.get('Content-Range'), len: (await open.arrayBuffer()).byteLength },
      suffix: { status: suffix.status, range: suffix.headers.get('Content-Range'), len: (await suffix.arrayBuffer()).byteLength },
      whole: { status: whole.status, len: (await whole.arrayBuffer()).byteLength },
      bad: bad.status,
      loaded,
    };
  }, AUDIO);
  await context.setOffline(false);
  const n = offline.size;
  expect(offline.mid).toEqual({ status: 206, range: `bytes 1000-1999/${n}`, length: '1000', accept: 'bytes', ok: true });
  expect(offline.open).toEqual({ status: 206, range: `bytes ${n - 10}-${n - 1}/${n}`, len: 10 });
  expect(offline.suffix).toEqual({ status: 206, range: `bytes ${n - 50}-${n - 1}/${n}`, len: 50 });
  expect(offline.whole).toEqual({ status: 200, len: n });
  expect(offline.bad).toBe(416);
  expect(offline.loaded).toBe(true);
});

test('audio saved by the legacy worker survives the upgrade', async ({ page, context }) => {
  test.setTimeout(60000);
  await page.request.get('/__test/legacy-sw/on');
  await controlled(page);
  // Save a full audio file in the legacy cache, as the old worker would have.
  await page.evaluate(async (src) => {
    const res = await fetch(src, { cache: 'no-store', headers: { 'x-probe': '1' } });
    await (await caches.open('persian-learn-v2')).put(src, res);
  }, AUDIO);
  await page.request.get('/__test/legacy-sw/off');
  await page.goto('/home');
  await expect
    .poll(() => page.evaluate(() => caches.keys()).catch(() => ['persian-learn-v2']), { timeout: 20000 })
    .not.toContain('persian-learn-v2');
  await page.waitForTimeout(1500);
  await page.waitForLoadState('load');

  const carried = await page.evaluate(async (src) => {
    const names = await caches.keys();
    const hit = await caches.match(src);
    return { names, status: hit?.status ?? 0 };
  }, AUDIO);
  expect(carried.names.some((n) => n.startsWith('persian-learn-'))).toBe(true);
  expect(carried.status).toBe(200);

  await context.setOffline(true);
  const offline = await page.evaluate(async (src) => {
    const res = await fetch(src, { headers: { Range: 'bytes=0-9' } });
    return { status: res.status, len: (await res.arrayBuffer()).byteLength };
  }, AUDIO);
  await context.setOffline(false);
  expect(offline).toEqual({ status: 206, len: 10 });
});
