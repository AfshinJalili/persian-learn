import math from '../public/content/math.json';
import { test, expect } from '@playwright/test';

// The worker that shipped before the fix: fixed cache name, stale-while-
// revalidate navigations, no skipWaiting/clients.claim.
// It is served by scripts/sw-test-server.mjs while /__test/legacy-sw is on.
const OLD_MARKER = 'OLD-BUILD-MARKER';

async function seedOnboarded(page: import('@playwright/test').Page, completed: string[] = []) {
  await page.evaluate(async (completedLessons) => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack: 'math', onboarded: true, completedLessons, completedUnits: [],
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
  }, completed);
}

test.describe.configure({ mode: 'serial' });

test.afterEach(async ({ request }) => {
  await request.get('/__test/legacy-sw/off');
  await request.get('/__test/sw-fast-warm/off');
  await request.get('/__test/audio-swap/off');
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
  expect(state.script).toMatch(/\/sw\.js$/);

  // 3. Later navigations come from the network (network-first), not a stale copy.
  await page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find((n) => n.startsWith('persian-learn-'))!);
    await cache.put('/home', new Response('<h1 id="old">STALE</h1>', { headers: { 'Content-Type': 'text/html' } }));
  });
  await page.goto('/home');
  await expect(page.locator('#old')).toHaveCount(0);
  await page.screenshot({ path: '/workspace/pl-fix-artifacts/sw-upgraded-home.png' });
});

type Win = { __marker?: number };

async function deploy(page: import('@playwright/test').Page) {
  await page.request.get('/__test/sw-bump');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update();
  });
}

const marker = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as Win).__marker).catch(() => 1);

test('a deploy during a lesson is applied when she leaves the lesson, not before', async ({
  page,
}) => {
  test.setTimeout(60000);
  await controlled(page);
  await seedOnboarded(page);
  await page.goto('/lesson/m1l1');
  await expect(page.getByRole('button', { name: 'بستن درس' })).toBeVisible();
  await page.evaluate(() => ((window as unknown as Win).__marker = 1));
  let loads = 0;
  page.on('load', () => (loads += 1));

  await deploy(page);
  await page.waitForTimeout(4000);
  expect(await marker(page)).toBe(1); // no reload mid-lesson
  expect(loads).toBe(0);

  // Leaving the lesson with client-side routing (as the app's close button
  // and lesson end do) is a safe point: the update applies then.
  await page.evaluate(() => history.pushState({}, '', '/home'));
  await expect.poll(() => marker(page), { timeout: 15000 }).toBeUndefined();
  await page.waitForTimeout(2500);
  expect(loads).toBe(1);
  await expect(page.locator('.app-phone').first()).toBeVisible();
});

test('a second deploy in the same tab reloads again, with no reload loop', async ({ page }) => {
  test.setTimeout(60000);
  await controlled(page);
  let loads = 0;
  page.on('load', () => (loads += 1));

  for (const round of [1, 2]) {
    await page.evaluate(() => ((window as unknown as Win).__marker = 1));
    await deploy(page);
    await expect.poll(() => marker(page), { timeout: 15000 }).toBeUndefined();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2500);
    expect(loads, `after deploy ${round}`).toBe(round);
  }
  // No further reloads once settled.
  await page.waitForTimeout(3000);
  expect(loads).toBe(2);
  await expect(page.locator('.app-phone').first()).toBeVisible();
});

test('a phone left on a lesson by the legacy worker updates when she leaves the lesson', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.request.get('/__test/legacy-sw/on');
  await controlled(page);
  // A legacy-build lesson page: no update hooks, leaves via client-side
  // routing (an RSC fetch for /home, then pushState), like the old app.
  await page.evaluate(async () => {
    const cache = await caches.open('persian-learn-v2');
    await cache.put(
      '/lesson/m1l1',
      new Response(
        `<!doctype html><html><body><h1 id="old">OLD LESSON</h1>
        <button id="leave" onclick="fetch('/home?_rsc=x', { headers: { RSC: '1' } }).then(() => history.pushState({}, '', '/home'))">leave</button>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    );
  });
  await page.goto('/lesson/m1l1');
  await expect(page.locator('#old')).toBeVisible();

  // Deploy the new worker while she is mid-lesson.
  await page.request.get('/__test/legacy-sw/off');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update();
  });
  await expect
    .poll(() => page.evaluate(() => caches.keys()).catch(() => ['persian-learn-v2']), { timeout: 20000 })
    .not.toContain('persian-learn-v2');
  await page.waitForTimeout(3000);
  await expect(page.locator('#old')).toBeVisible(); // not reloaded mid-lesson

  await page.locator('#leave').click();
  await expect(page.locator('#old')).toHaveCount(0, { timeout: 15000 });
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator('.app-phone').first()).toBeVisible();
});

test('lesson pages cached by the legacy worker still open offline after the upgrade', async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await page.request.get('/__test/legacy-sw/on');
  await controlled(page);
  await seedOnboarded(page);
  await page.goto('/lesson/m1l1'); // the legacy worker caches it
  await expect(page.getByRole('button', { name: 'بستن درس' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(async () => Boolean(await (await caches.open('persian-learn-v2')).match('/lesson/m1l1'))))
    .toBe(true);

  await page.request.get('/__test/legacy-sw/off');
  await page.goto('/home');
  await expect
    .poll(() => page.evaluate(() => caches.keys()).catch(() => ['persian-learn-v2']), { timeout: 20000 })
    .not.toContain('persian-learn-v2');
  await page.waitForTimeout(2000);
  await page.waitForLoadState('load');

  await context.setOffline(true);
  await page.goto('/lesson/m1l1');
  await expect(page).toHaveURL(/\/lesson\/m1l1$/);
  await expect(page.getByRole('button', { name: 'بستن درس' })).toBeVisible({ timeout: 15000 });
  await context.setOffline(false);
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
    const cacheName = 'pl-audio';
    const cached = await (await caches.open(cacheName)).match(src, { ignoreSearch: true });
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
    const cacheName = 'pl-audio';
    const full = new Uint8Array(await (await (await caches.open(cacheName)).match(src, { ignoreSearch: true }))!.arrayBuffer());
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
    const hit = await caches.match(src, { ignoreSearch: true });
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

test('finishing a lesson and going home logs no console or network errors', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    const failure = req.failure()?.errorText ?? '';
    // A request the app itself cancels (router abort) is not a failure.
    if (failure.includes('ERR_ABORTED')) return;
    errors.push(`requestfailed: ${req.url()} ${failure}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 500) errors.push(`http ${res.status()}: ${res.url()}`);
  });

  await controlled(page);
  await seedOnboarded(page, ['m1l1', 'm1l2', 'm1l3']);
  await page.goto('/lesson/m1l4');
  await expect(page.getByRole('button', { name: 'بستن درس' })).toBeVisible();
  // Stub audio so steps don't wait on clips.
  await page.evaluate(() => {
    HTMLMediaElement.prototype.play = function play() {
      queueMicrotask(() => this.dispatchEvent(new Event('ended')));
      return Promise.resolve();
    };
  });
  const lesson = math.units.flatMap((unit) => unit.lessons).find((item) => item.id === 'm1l4')!;
  for (const exercise of lesson.exercises) {
    if (exercise.type === 'intro') {
      await page.getByRole('button', { name: /ادامه/ }).click();
      continue;
    }
    if (exercise.type === 'match_pairs') {
      for (const [left, right] of exercise.answer.split('|').map((pair) => pair.split('='))) {
        await page.locator(`[data-match-digit="${left}"]`).click();
        await page.locator(`[data-match-slot="${right}"]`).click();
      }
    } else {
      await page.getByRole('button', { name: exercise.answer, exact: true }).first().click();
    }
    await page.getByRole('button', { name: /بررسی/ }).click();
    await page.getByRole('button', { name: 'ادامه' }).click();
  }
  await expect(page).toHaveURL(/\/lesson-complete/, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.locator('.btn-primary').first().click();
  await expect(page).toHaveURL(/\/home/, { timeout: 15000 });
  await page.waitForTimeout(3000);
  expect(errors).toEqual([]);
});

test('failed or uncached requests always get a Response, never a network error', async ({
  page,
  context,
}) => {
  await controlled(page);
  const failed: string[] = [];
  page.on('requestfailed', (req) => failed.push(`${req.url()} ${req.failure()?.errorText}`));
  await context.setOffline(true);
  const result = await page.evaluate(async () => {
    const out: Record<string, number | string> = {};
    for (const [name, url, init] of [
      ['rsc', '/lesson/m1l4?_rsc=abc', { headers: { RSC: '1' } }],
      ['content', '/content/missing.json', {}],
      ['static', '/_next/static/chunks/missing.js', {}],
      ['audio', '/audio/missing.mp3', { headers: { Range: 'bytes=0-9' } }],
    ] as const) {
      try {
        const res = await fetch(url, init as RequestInit);
        out[name] = res.status;
        if (name === 'rsc') out.rscType = res.headers.get('Content-Type') ?? '';
      } catch (error) {
        out[name] = `threw: ${String(error)}`;
      }
    }
    return out;
  });
  // An offline navigation to a page that was never cached gets a page too.
  const nav = await page.goto('/lesson/m9l9').catch((error) => String(error));
  await context.setOffline(false);
  expect(result).toMatchObject({ rsc: 504, content: 504, static: 504, audio: 504 });
  expect(String(result.rscType)).not.toContain('text/html');
  expect(typeof nav, String(nav)).not.toBe('string');
  expect(failed.filter((line) => !line.includes('ERR_ABORTED'))).toEqual([]);
});

// ---- Audio warm-up after the upgrade ---------------------------------------

type Plan = { version: string; clips: Record<string, string>; ui: string[]; tracks: Record<string, Array<{ id: string; clips: string[] }>>; all: string[] };
const clipPath = (hash: string) => `/audio/${hash}.mp3`;

async function upgradeFromLegacy(page: import('@playwright/test').Page, completed: string[]) {
  // A phone on the v2 worker: v2 tried to cache audio as 206 range responses,
  // which the Cache API rejects, so the only audio it has is what we plant.
  await page.request.get('/__test/legacy-sw/on');
  await controlled(page);
  await seedOnboarded(page, completed);
  // Count only what happens from the upgrade on (v2 forwards Range headers).
  await page.request.get('/__test/audio-hits/reset');
  await page.request.get('/__test/legacy-sw/off');
  await page.goto('/home');
  await expect
    .poll(() => page.evaluate(() => caches.keys()).catch(() => ['persian-learn-v2']), { timeout: 20000 })
    .not.toContain('persian-learn-v2');
  await page.waitForTimeout(1500);
  await page.waitForLoadState('load');
}

function cachedAudio(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const cache = await caches.open('pl-audio');
    return (await cache.keys()).map((req) => new URL(req.url).pathname);
  });
}

test('after the upgrade, lessons she is on are warmed first, then the rest', async ({ page, request }) => {
  test.setTimeout(120000);
  // Normal (throttled) worker.
  await upgradeFromLegacy(page, ['m1l1', 'm1l2']);
  const plan: Plan = await (await request.get('/audio-plan.json')).json();
  const lesson = (id: string) => [...plan.tracks.math, ...plan.tracks.alphabet].find((l) => l.id === id)!;
  const priority = new Set([...plan.ui, ...lesson('m1l1').clips, ...lesson('m1l2').clips, ...lesson('m1l3').clips].map(clipPath));
  await expect
    .poll(async () => {
      const have = new Set(await cachedAudio(page));
      return [...priority].filter((p) => !have.has(p)).length;
    }, { timeout: 90000, intervals: [1000] })
    .toBe(0);
  // The throttled idle pass is still far from the end of the alphabet course.
  const last = plan.tracks.alphabet[plan.tracks.alphabet.length - 1];
  const have = new Set(await cachedAudio(page));
  const lastCached = last.clips.filter((h) => have.has(clipPath(h))).length;
  expect(lastCached).toBeLessThan(last.clips.length);
});

test('an upgraded profile ends up with every clip cached whole and playable offline', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(240000);
  await request.get('/__test/sw-fast-warm/on');
  await upgradeFromLegacy(page, ['m1l1']);
  const plan: Plan = await (await request.get('/audio-plan.json')).json();
  expect(plan.all.length).toBeGreaterThan(2000);

  await expect
    .poll(async () => plan.all.length - (await cachedAudio(page)).length, { timeout: 200000, intervals: [2000] })
    .toBe(0);
  await expect
    .poll(() => page.evaluate(async () => Boolean(await (await caches.open('pl-sw-meta')).match('/__sw/audio-warm-done'))))
    .toBe(true);

  // Every cached clip, in every cache, is a full 200 response: no 206 partials.
  const audit = await page.evaluate(async () => {
    const bad: string[] = [];
    let audio = 0;
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const req of await cache.keys()) {
        const res = await cache.match(req);
        if (!res || res.status !== 200 || res.headers.has('Content-Range')) bad.push(`${name} ${req.url} ${res?.status}`);
        if (new URL(req.url).pathname.startsWith('/audio/')) audio += 1;
      }
    }
    return { bad, audio };
  });
  expect(audit.bad).toEqual([]);
  expect(audit.audio).toBeGreaterThanOrEqual(plan.all.length);
  // The warm-up asks for whole files. (Chrome's HTTP cache may still send a
  // Range upstream to complete a partial entry left from the v2 days; the
  // worker gets the complete file either way.) Cached bodies are the whole file.
  const hits = await (await request.get('/__test/audio-hits')).json();
  expect(hits.warm).toBeGreaterThanOrEqual(plan.all.length - 60);
  const check = [...new Set([...hits.warmRanged, ...plan.all.filter((_, i) => i % 60 === 0).map(clipPath)])];
  const cachedSizes = await page.evaluate(async (paths) => {
    const cache = await caches.open('pl-audio');
    const out: Record<string, number> = {};
    for (const path of paths) out[path] = (await (await cache.match(path, { ignoreSearch: true }))!.arrayBuffer()).byteLength;
    return out;
  }, check);
  for (const path of check) {
    // Straight from the server, not through the worker.
    const real = (await (await request.get(path)).body()).byteLength;
    expect(cachedSizes[path], path).toBe(real);
  }

  // Offline: clips from a lesson she has not started play through <audio>.
  const sample = [plan.ui[0], plan.tracks.math[10].clips[0], plan.tracks.alphabet[59].clips[0], plan.all[plan.all.length - 1]];
  await context.setOffline(true);
  const offline = await page.evaluate(async (paths) => {
    const out: Array<{ path: string; range: number; loaded: boolean }> = [];
    for (const path of paths) {
      const res = await fetch(path, { headers: { Range: 'bytes=0-9' } });
      const audio = new Audio(path);
      const loaded = await new Promise<boolean>((resolve) => {
        audio.addEventListener('loadedmetadata', () => resolve(true));
        audio.addEventListener('error', () => resolve(false));
        setTimeout(() => resolve(false), 8000);
      });
      out.push({ path, range: res.status, loaded });
    }
    return out;
  }, sample.map(clipPath));
  await context.setOffline(false);
  for (const row of offline) expect(row, row.path).toEqual({ path: row.path, range: 206, loaded: true });
});

test('warming again fetches only clips that are missing', async ({ page, request }) => {
  test.setTimeout(240000);
  await request.get('/__test/sw-fast-warm/on');
  await upgradeFromLegacy(page, []);
  const plan: Plan = await (await request.get('/audio-plan.json')).json();
  await expect
    .poll(async () => plan.all.length - (await cachedAudio(page)).length, { timeout: 200000, intervals: [2000] })
    .toBe(0);
  await page.waitForTimeout(1000);

  // A finished warm-up is remembered: another page load fetches nothing.
  await request.get('/__test/audio-hits/reset');
  await page.evaluate(async () => (await navigator.serviceWorker.ready).active!.postMessage({ type: 'WARM_AUDIO' }));
  await page.waitForTimeout(3000);
  expect((await (await request.get('/__test/audio-hits')).json()).total).toBe(0);

  // Interrupted / evicted: drop the marker and 5 clips; only those 5 come back.
  const dropped = plan.all.slice(100, 105).map(clipPath);
  await page.evaluate(async (paths) => {
    await (await caches.open('pl-sw-meta')).delete('/__sw/audio-warm-done');
    const cache = await caches.open('pl-audio');
    for (const p of paths) await cache.delete(p, { ignoreSearch: true });
  }, dropped);
  await request.get('/__test/audio-hits/reset');
  await page.evaluate(async () => (await navigator.serviceWorker.ready).active!.postMessage({ type: 'WARM_AUDIO' }));
  await expect.poll(async () => (await cachedAudio(page)).length, { timeout: 30000 }).toBe(plan.all.length);
  await page.waitForTimeout(1000);
  const hits = await (await request.get('/__test/audio-hits')).json();
  expect(hits.total).toBe(5);
  expect(Object.keys(hits.paths).sort()).toEqual([...dropped].sort());
});

// ---- Clip versions (audio bytes hash in the cache key) ----------------------

function clipKeys(page: import('@playwright/test').Page, path: string) {
  return page.evaluate(async (src) => {
    const cache = await caches.open('pl-audio');
    return (await cache.keys(src, { ignoreSearch: true })).map((req) => new URL(req.url).search).sort();
  }, path);
}

async function playBytes(page: import('@playwright/test').Page, path: string) {
  return page.evaluate(async (src) => {
    const res = await fetch(src, { headers: { Range: 'bytes=0-' } });
    const bytes = new Uint8Array(await res.arrayBuffer());
    const audio = new Audio(src);
    const loaded = await new Promise<boolean>((resolve) => {
      audio.addEventListener('loadedmetadata', () => resolve(true));
      audio.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(false), 8000);
    });
    return { status: res.status, bytes: Array.from(bytes), loaded };
  }, path);
}

async function planSeen(page: import('@playwright/test').Page) {
  await expect
    .poll(() => page.evaluate(async () => Boolean(await (await caches.open('pl-sw-meta')).match('/__sw/audio-plan'))), {
      timeout: 20000,
    })
    .toBe(true);
}

// A deploy reloads a page that isn't mid-lesson; wait for that reload.
async function deployAndReload(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    (window as unknown as Win).__marker = 1;
  });
  await deploy(page);
  await expect.poll(() => marker(page), { timeout: 30000 }).toBeUndefined();
  await page.waitForLoadState('load');
}

// Clips at the end of the alphabet course: the throttled idle pass is minutes
// away from them, so only playback (or reconciling) touches them here.
function lateClips(plan: Plan, n: number) {
  const lessons = plan.tracks.alphabet.slice(-3);
  const early = new Set([...plan.ui, ...plan.tracks.math.slice(0, 3).flatMap((l) => l.clips)]);
  return [...new Set(lessons.flatMap((l) => l.clips))].filter((h) => !early.has(h)).slice(-n);
}

test('a re-synthesized clip evicts the old cached audio and the next play fetches the new one', async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  await controlled(page);
  await planSeen(page);
  const plan: Plan = await (await request.get('/audio-plan.json')).json();
  const [id] = lateClips(plan, 1);
  const from = plan.all.find((h) => h !== id && plan.clips[h] !== plan.clips[id])!;
  const path = clipPath(id);
  const oldBytes = Array.from(await (await request.get(path)).body());
  const newBytes = Array.from(await (await request.get(clipPath(from))).body());

  // First play: stored under its bytes hash.
  const first = await playBytes(page, path);
  expect(first.bytes).toEqual(oldBytes);
  expect(await clipKeys(page, path)).toEqual([`?v=${plan.clips[id]}`]);

  // Deploy with that clip re-synthesized (same text, so same URL; new bytes).
  const swap = await (await request.get(`/__test/audio-swap/on?id=${id}&from=${from}`)).json();
  const swapped: Plan = await (await request.get('/audio-plan.json')).json();
  expect(swapped.clips[id]).toBe(swap.v);
  expect(swapped.version).not.toBe(plan.version);
  await deployAndReload(page);
  // The new worker's warm-up drops the old bytes.
  await expect.poll(() => clipKeys(page, path), { timeout: 30000 }).not.toContain(`?v=${plan.clips[id]}`);

  await request.get('/__test/audio-hits/reset');
  const next = await playBytes(page, path);
  expect(next.bytes).toEqual(newBytes);
  expect(next.loaded).toBe(true);
  const hits = await (await request.get('/__test/audio-hits')).json();
  expect(hits.paths[path]).toBe(1);
  expect(await clipKeys(page, path)).toEqual([`?v=${swap.v}`]);
  const cached = await page.evaluate(async (key) => {
    const res = await (await caches.open('pl-audio')).match(key);
    return res ? Array.from(new Uint8Array(await res.arrayBuffer())) : [];
  }, `${path}?v=${swap.v}`);
  expect(cached).toEqual(newBytes);
});

test('clips cached before versioning are kept if current, replaced if not, and dropped if gone', async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  await controlled(page);
  await planSeen(page);
  const plan: Plan = await (await request.get('/audio-plan.json')).json();
  const [good, bad] = lateClips(plan, 2);
  const other = plan.all.find((h) => h !== bad && plan.clips[h] !== plan.clips[bad])!;
  const goodBytes = Array.from(await (await request.get(clipPath(good))).body());
  const badRealBytes = Array.from(await (await request.get(clipPath(bad))).body());
  const wrongBytes = Array.from(await (await request.get(clipPath(other))).body());
  const gone = `/audio/${'0'.repeat(32)}.mp3`;
  // What a phone updated from #8 holds: clips under the bare URL. One with
  // the current bytes, one with older bytes, one no longer in the manifest.
  await page.evaluate(
    async ({ entries }) => {
      const cache = await caches.open('pl-audio');
      for (const [path, bytes] of entries) {
        await cache.put(path, new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'audio/mpeg' } }));
      }
      await (await caches.open('pl-sw-meta')).put('/__sw/audio-warm-done', new Response('avalai:old:2634'));
    },
    {
      entries: [
        [clipPath(good), goodBytes],
        [clipPath(bad), wrongBytes],
        [gone, wrongBytes],
      ] as Array<[string, number[]]>,
    }
  );
  await request.get('/__test/audio-hits/reset');
  await deployAndReload(page);

  await expect.poll(() => clipKeys(page, clipPath(good)), { timeout: 30000 }).toEqual([`?v=${plan.clips[good]}`]);
  await expect.poll(() => clipKeys(page, clipPath(bad)), { timeout: 30000 }).toEqual([]);
  expect(await clipKeys(page, gone)).toEqual([]);
  // The current one was re-keyed in place, not downloaded again.
  let hits = await (await request.get('/__test/audio-hits')).json();
  expect(hits.paths[clipPath(good)]).toBeUndefined();

  // The stale one plays the current audio, fetched once.
  const played = await playBytes(page, clipPath(bad));
  expect(played.bytes).toEqual(badRealBytes);
  hits = await (await request.get('/__test/audio-hits')).json();
  expect(hits.paths[clipPath(bad)]).toBe(1);
  expect(await clipKeys(page, clipPath(bad))).toEqual([`?v=${plan.clips[bad]}`]);
});

