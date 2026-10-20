// Served at /sw.js by app/sw.js/route.ts, which replaces __BUILD_ID__ with the
// deployment's build id. The script bytes therefore change on every deploy,
// so browsers (including long-open tabs calling registration.update()) install
// a fresh worker and cache.
const SW_VERSION = '__BUILD_ID__';
const CACHE_PREFIX = 'persian-learn-';
const CACHE_NAME = `${CACHE_PREFIX}${SW_VERSION}`;
// Cache name used by the original worker; seeing it on activate means this is
// the one-time upgrade of an installed client that has no reload hook yet.
const LEGACY_CACHE_NAME = 'persian-learn-v2';
// Small bookkeeping cache (not prefixed, so it survives version cleanup).
const META_CACHE = 'pl-sw-meta';
const PENDING_LEGACY_KEY = '/__sw/pending-legacy-clients';
// Audio clips are content-addressed (/audio/<hash>.mp3), so they live in one
// cache that is kept across deploys instead of being copied into every
// versioned cache (not prefixed, so version cleanup leaves it alone).
const AUDIO_CACHE = 'pl-audio';
const WARM_DONE_KEY = '/__sw/audio-warm-done';
// The filename is a hash of the clip's *text*, so re-synthesized audio keeps
// its URL. Clips are therefore stored under /audio/<id>.mp3?v=<bytes hash>,
// with the bytes hash from /audio-plan.json (`clips`, computed from the files
// at build time). A clip whose audio changed gets a new key; the old bytes are
// deleted. The last plan seen is kept here so playback knows the versions.
const AUDIO_PLAN_KEY = '/__sw/audio-plan';
const CLIP_PATH = /^\/audio\/([0-9a-f]{32})\.mp3$/;
const CLIP_BYTES_HASH_LENGTH = 16;
const urlsToCache = [
  '/',
  '/home',
  '/streak',
  '/profile',
  '/lesson-complete',
  '/manifest.json',
  '/fonts/Vazirmatn-Regular.woff2',
  '/fonts/Vazirmatn-Bold.woff2',
  '/fonts/Vazirmatn-ExtraBold.woff2',
  '/content/math.json',
  '/content/alphabet.json',
];

function offlineStrategy(pathname) {
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/audio/') ||
    pathname.endsWith('.woff2')
  ) {
    return 'cache-first';
  }

  if (
    pathname.startsWith('/content/') ||
    pathname === '/' ||
    pathname === '/home' ||
    pathname === '/streak' ||
    pathname === '/profile' ||
    pathname === '/lesson-complete' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/lesson/')
  ) {
    return 'network-first';
  }

  return 'network';
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  let response;
  try {
    response = await fetch(request);
  } catch {
    return fallbackResponse(request);
  }
  if (response.status === 200) {
    await cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

// Audio elements send Range requests and get 206 Partial Content back, which
// the Cache API refuses to store. So audio is always cached as the full 200
// file (fetched without Range) and range requests are sliced from it.
function isAudio(pathname) {
  return pathname.startsWith('/audio/');
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec((header || '').trim());
  if (!match || (match[1] === '' && match[2] === '')) {
    return null;
  }
  let start;
  let end;
  if (match[1] === '') {
    const suffix = Number(match[2]);
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start > end || start >= size) {
    return null;
  }
  return { start, end };
}

async function rangeResponse(full, rangeHeader) {
  const blob = await full.blob();
  const size = blob.size;
  const range = parseRange(rangeHeader, size);
  const type = full.headers.get('Content-Type') || 'audio/mpeg';
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}` },
    });
  }
  const body = blob.slice(range.start, range.end + 1, type);
  return new Response(body, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': type,
      'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
      'Content-Length': String(body.size),
      'Accept-Ranges': 'bytes',
    },
  });
}

let audioPlanMemo = null;

function clipVersions(plan) {
  return plan && plan.clips && typeof plan.clips === 'object' ? plan.clips : null;
}

async function rememberAudioPlan(plan) {
  const clips = clipVersions(plan);
  if (!clips) return;
  audioPlanMemo = { version: plan.version, clips };
  const meta = await caches.open(META_CACHE);
  await meta.put(AUDIO_PLAN_KEY, new Response(JSON.stringify(audioPlanMemo))).catch(() => undefined);
}

// Versions from the last plan this worker (or an earlier one) fetched.
async function knownClipVersions() {
  if (!audioPlanMemo) {
    try {
      const meta = await caches.open(META_CACHE);
      const res = await meta.match(AUDIO_PLAN_KEY);
      if (res) audioPlanMemo = await res.json();
    } catch {
      // none yet
    }
  }
  return clipVersions(audioPlanMemo);
}

function clipKey(path, version) {
  return version ? `${path}?v=${version}` : path;
}

function isFull(res) {
  return Boolean(res) && res.status === 200;
}

async function bytesHash(buffer) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, CLIP_BYTES_HASH_LENGTH);
}

// Stores `res` under `key` only if its bytes are that version of the clip.
async function putIfVersion(cache, key, version, res) {
  const buffer = await res.clone().arrayBuffer();
  if ((await bytesHash(buffer)) !== version) return null;
  const stored = new Response(buffer, { status: 200, statusText: 'OK', headers: res.headers });
  await cache.put(key, stored.clone());
  return stored;
}

// Drops every other copy of this clip (unversioned, or another version).
async function evictOtherVersions(cache, path, key) {
  const requests = await cache.keys(path, { ignoreSearch: true, ignoreVary: true });
  for (const req of requests) {
    const url = new URL(req.url);
    if (url.pathname + url.search !== key) await cache.delete(req);
  }
}

async function audioCacheFirst(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const url = new URL(request.url);
  const path = url.pathname;
  const id = CLIP_PATH.exec(path);
  const versions = id ? await knownClipVersions() : null;
  const version = versions ? versions[id[1]] || null : null;
  const key = clipKey(path, version);
  // No plan seen yet: any stored copy of the clip will do.
  let full = await cache.match(key, { ignoreVary: true, ignoreSearch: !version });
  // Old bytes of this clip, served only if the network is out.
  let stale = null;
  if (!isFull(full) && version) {
    // Stored before versioning (or by an older plan): keep it if the bytes
    // are this version, otherwise it is replaced below.
    for (const req of await cache.keys(path, { ignoreSearch: true, ignoreVary: true })) {
      const res = await cache.match(req, { ignoreVary: true });
      if (!isFull(res)) continue;
      const adopted = await putIfVersion(cache, key, version, res).catch(() => null);
      if (adopted) {
        full = adopted;
        await evictOtherVersions(cache, path, key).catch(() => undefined);
        break;
      }
      stale = stale || res;
    }
  }
  if (!isFull(full)) {
    // Saved by an older build in its versioned cache: move it over.
    const older = await caches.match(path, { ignoreVary: true });
    if (isFull(older)) {
      if (!version) {
        full = older;
        await cache.put(key, older.clone()).catch(() => undefined);
      } else {
        const adopted = await putIfVersion(cache, key, version, older).catch(() => null);
        if (adopted) full = adopted;
        else stale = stale || older;
      }
    }
  }
  if (!isFull(full)) {
    // Separate fetch without the Range header so we get (and keep) the whole
    // file. The versioned URL also skips any HTTP-cached older bytes.
    try {
      full = await fetch(key, { credentials: 'same-origin' });
    } catch {
      return stale ? rangeOrFull(stale, request) : fallbackResponse(request);
    }
    if (full.status !== 200) {
      return stale ? rangeOrFull(stale, request) : full;
    }
    if (version) {
      // Only bytes that match the plan are kept (a mid-deploy mismatch is
      // played but not stored).
      const stored = await putIfVersion(cache, key, version, full).catch(() => null);
      if (stored) {
        full = stored;
        await evictOtherVersions(cache, path, key).catch(() => undefined);
      }
    } else {
      await cache.put(key, full.clone()).catch(() => undefined);
    }
  }
  return rangeOrFull(full, request);
}

function rangeOrFull(full, request) {
  const rangeHeader = request.headers.get('Range');
  if (!rangeHeader) {
    return full;
  }
  return rangeResponse(full, rangeHeader);
}

function isRsc(request) {
  return request.headers.get('RSC') === '1' || new URL(request.url).searchParams.has('_rsc');
}

const OFFLINE_HTML =
  '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<body style="font-family:sans-serif;text-align:center;padding:48px 24px">' +
  '<p>اینترنت وصل نیست. لطفاً دوباره امتحان کنید.</p>' +
  '<button onclick="location.reload()" style="font-size:20px;padding:12px 24px">دوباره</button>' +
  '</body></html>';

// Every path answers with a Response (never a rejected promise), so a failed
// or cancelled request can't surface as a service-worker network error.
function fallbackResponse(request) {
  if (request.mode === 'navigate') {
    return new Response(OFFLINE_HTML, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  // A non-OK RSC response makes the Next router fall back to a full page load.
  return new Response('', { status: 504, statusText: 'Offline' });
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      // Awaited so the write finishes inside the fetch event's lifetime.
      await cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    // Network failed or the request was cancelled (e.g. the router moved on).
    const rsc = isRsc(request);
    const cached =
      (await cache.match(request)) ||
      // An RSC request must never get an HTML page back.
      (!rsc ? await cache.match(request, { ignoreSearch: true }) : undefined) ||
      (request.mode === 'navigate'
        ? (await cache.match('/home')) || (await cache.match('/'))
        : undefined);
    return cached || fallbackResponse(request);
  }
}

function isPage(request, response) {
  const type = (response && response.headers.get('Content-Type')) || '';
  return type.includes('text/html');
}

function staticAssetsIn(html) {
  const found = new Set();
  for (const match of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) {
    found.add(match[0]);
  }
  return [...found];
}

async function staleCacheNames() {
  const names = await caches.keys();
  return names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME);
}

// Carry what the old caches held into the new one before they are deleted:
// pages (re-fetched fresh when online, else copied with the old chunks they
// reference), lesson content, fonts, icons and audio. Old /_next/static files
// are only copied when an offline-copied page needs them, so caches don't
// grow without bound across deploys.
async function migrateFrom(oldNames) {
  const target = await caches.open(CACHE_NAME);
  const has = async (key) => Boolean(await target.match(key));
  for (const name of oldNames) {
    const old = await caches.open(name);
    for (const request of await old.keys()) {
      const url = new URL(request.url);
      if (url.origin !== self.location.origin) continue;
      const key = url.pathname + url.search;
      if (url.pathname.startsWith('/_next/static') || (await has(key))) continue;
      const cached = await old.match(request);
      if (!cached || cached.status !== 200) continue;

      if (isPage(request, cached)) {
        let html = null;
        try {
          const fresh = await fetch(key, { cache: 'no-store', credentials: 'same-origin' });
          if (fresh.status === 200) {
            html = await fresh.clone().text();
            await target.put(key, fresh);
          }
        } catch {
          // offline: fall through to copying the old page
        }
        if (html === null) {
          html = await cached.clone().text();
          await target.put(key, cached);
          for (const asset of staticAssetsIn(html)) {
            const oldAsset = await old.match(asset);
            if (oldAsset && !(await has(asset))) await target.put(asset, oldAsset);
          }
        } else {
          for (const asset of staticAssetsIn(html)) {
            if (await has(asset)) continue;
            try {
              const res = await fetch(asset, { credentials: 'same-origin' });
              if (res.status === 200) await target.put(asset, res);
            } catch {
              // fetched on demand later
            }
          }
        }
        continue;
      }
      if (isAudio(url.pathname)) {
        const audio = await caches.open(AUDIO_CACHE);
        // Any version already there wins; an unversioned copy is checked
        // against the plan by the next warm-up (or on first play).
        if (!(await audio.match(url.pathname, { ignoreSearch: true }))) await audio.put(url.pathname, cached);
        continue;
      }
      await target.put(key, cached);
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urlsToCache);
      try {
        await migrateFrom(await staleCacheNames());
      } catch {
        // Anything not migrated is fetched again on demand.
      }
      await self.skipWaiting();
    })()
  );
});

async function readPendingLegacy() {
  const meta = await caches.open(META_CACHE);
  const res = await meta.match(PENDING_LEGACY_KEY);
  return res ? res.json() : [];
}

async function writePendingLegacy(ids) {
  const meta = await caches.open(META_CACHE);
  if (ids.length === 0) {
    await meta.delete(PENDING_LEGACY_KEY);
    return;
  }
  await meta.put(PENDING_LEGACY_KEY, new Response(JSON.stringify(ids)));
}

function inLesson(url) {
  return new URL(url).pathname.startsWith('/lesson/');
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const stale = await staleCacheNames();
      try {
        // Normally done at install; repeated here in case install was cut short.
        await migrateFrom(stale);
      } catch {
        // fetched on demand later
      }
      await Promise.all(stale.map((name) => caches.delete(name)));
      await self.clients.claim();
      // Re-warm the audio cache after activation, in a message event with its
      // own lifetime, so it never holds up activation or page loads.
      self.registration.active?.postMessage({ type: 'WARM_AUDIO' });

      // Pages opened by the original worker have no controllerchange hook, so
      // the worker moves them to the new build itself. Those mid-lesson are
      // remembered and moved when they leave the lesson (see fetch below).
      if (names.includes(LEGACY_CACHE_NAME)) {
        const windows = await self.clients.matchAll({ type: 'window' });
        await writePendingLegacy(windows.map((client) => client.id));
        // client.navigate() can't be awaited here (its fetch waits for this
        // activation to finish), so hand it to a message event on ourselves,
        // which runs after activation with its own waitUntil lifetime.
        self.registration.active?.postMessage({ type: 'RELOAD_LEGACY' });
      }
    })()
  );
});

async function reloadLegacyClients(onlyId) {
  const pending = await readPendingLegacy();
  if (pending.length === 0) return;
  const windows = await self.clients.matchAll({ type: 'window' });
  const alive = new Set(windows.map((client) => client.id));
  const still = [];
  for (const id of pending) {
    if (!alive.has(id)) continue;
    const client = windows.find((item) => item.id === id);
    if ((onlyId && id !== onlyId) || inLesson(client.url)) {
      still.push(id);
      continue;
    }
    await client.navigate(client.url).catch(() => undefined);
  }
  await writePendingLegacy(still);
}

// ---- Audio warm-up -------------------------------------------------------
// Returning users upgraded from the v2 worker have almost no audio cached
// (v2 tried to store 206 range responses, which the Cache API rejects), so
// lessons go silent offline. After each activation, and on every page load
// (ServiceWorkerRegister posts WARM_AUDIO), this fills the audio cache in the
// background from /audio-plan.json:
//   1. priority: app-shell clips, every lesson she has started or completed,
//      and the next lesson in each track she is on;
//   2. idle: the rest of her current track, the other track, then any other
//      clip in the manifest (skipped with Save-Data or low storage).
// Clips are fetched whole (no Range), only 200s are stored, cached clips are
// skipped, and it stops when offline. Being cut off (the browser stops idle
// workers after a few minutes) is fine: the next page load resumes it.
const WARM_CONCURRENCY = 3;
const WARM_PRIORITY_PAUSE_MS = 150;
const WARM_IDLE_PAUSE_MS = 400;
const WARM_IDLE_MIN_FREE_BYTES = 200 * 1024 * 1024;
let warming = null;

function warmAudio() {
  if (!warming) {
    warming = runWarmAudio().finally(() => {
      warming = null;
    });
  }
  return warming;
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(path) {
  try {
    const res = await fetch(path, { cache: 'no-cache', credentials: 'same-origin' });
    if (res.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(path, res.clone()).catch(() => undefined);
      return await res.json();
    }
  } catch {
    // offline: use the copy from last time
  }
  const cached = await caches.match(path);
  return cached ? cached.json() : null;
}

// Saved progress, read without ever creating the app's database: if it does
// not exist yet the upgrade is aborted, so the app still creates it itself.
function readSavedProgress() {
  return new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open('persian-learn');
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => req.transaction && req.transaction.abort();
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
    req.onsuccess = () => {
      const db = req.result;
      const stores = ['progress', 'lessons'].filter((name) => db.objectStoreNames.contains(name));
      if (stores.length < 2) {
        db.close();
        resolve(null);
        return;
      }
      try {
        const tx = db.transaction(stores, 'readonly');
        const progressReq = tx.objectStore('progress').get('current');
        const lessonsReq = tx.objectStore('lessons').getAllKeys();
        tx.oncomplete = () => {
          db.close();
          resolve({ progress: progressReq.result || null, started: lessonsReq.result || [] });
        };
        tx.onerror = () => {
          db.close();
          resolve(null);
        };
      } catch {
        db.close();
        resolve(null);
      }
    };
  });
}

// Clip order: [priority clips, idle clips], each without duplicates.
function warmOrder(plan, saved) {
  const progress = (saved && saved.progress) || {};
  const completed = new Set(progress.completedLessons || []);
  const started = new Set((saved && saved.started) || []);
  const currentTrack = plan.tracks[progress.currentTrack] ? progress.currentTrack : 'math';
  const seen = new Set();
  const priority = [];
  const idle = [];
  const push = (list, clips) => {
    for (const hash of clips) {
      if (seen.has(hash)) continue;
      seen.add(hash);
      list.push(hash);
    }
  };
  push(priority, plan.ui);
  const trackNames = [currentTrack, ...Object.keys(plan.tracks).filter((n) => n !== currentTrack)];
  for (const name of trackNames) {
    const lessons = plan.tracks[name];
    const touched = lessons.some((l) => completed.has(l.id) || started.has(l.id));
    for (const lesson of lessons) {
      if (completed.has(lesson.id) || started.has(lesson.id)) push(priority, lesson.clips);
    }
    if (name === currentTrack || touched) {
      const next = lessons.find((l) => !completed.has(l.id));
      if (next) push(priority, next.clips);
    }
  }
  for (const name of trackNames) {
    for (const lesson of plan.tracks[name]) push(idle, lesson.clips);
  }
  push(idle, plan.all || []);
  return { priority, idle };
}

async function idleAllowed() {
  const connection = self.navigator && self.navigator.connection;
  if (connection && connection.saveData) return false;
  try {
    const { quota, usage } = await self.navigator.storage.estimate();
    if (typeof quota === 'number' && quota - (usage || 0) < WARM_IDLE_MIN_FREE_BYTES) return false;
  } catch {
    // no estimate: assume there is room
  }
  return true;
}

function supersededWorker() {
  const reg = self.registration;
  return Boolean(reg.installing || reg.waiting || (reg.active && self.serviceWorker && reg.active !== self.serviceWorker));
}

// Fetches and stores clips not cached yet. Returns false if it went offline.
async function warmClips(hashes, cached, pauseMs, keyFor, versions) {
  const cache = await caches.open(AUDIO_CACHE);
  const todo = hashes.filter((hash) => !cached.has(keyFor(hash)));
  for (let i = 0; i < todo.length; i += WARM_CONCURRENCY) {
    if (self.navigator && self.navigator.onLine === false) return false;
    // A newer worker is on its way: step aside so this job never holds up its
    // activation. The new worker starts its own warm-up once it is active.
    if (supersededWorker()) return false;
    const batch = todo.slice(i, i + WARM_CONCURRENCY);
    let offline = false;
    await Promise.all(
      batch.map(async (hash) => {
        const key = keyFor(hash);
        try {
          // No Range header: the full file, which is the only thing we store.
          const res = await fetch(key, { credentials: 'same-origin', headers: { 'X-PL-Warm': '1' } });
          if (res.status === 200) {
            const version = versions && versions[hash];
            if (!version) {
              await cache.put(key, res);
              cached.add(key);
            } else if (await putIfVersion(cache, key, version, res)) {
              cached.add(key);
            }
          }
        } catch {
          offline = true;
        }
      })
    );
    if (offline) return false;
    if (i + WARM_CONCURRENCY < todo.length) await sleepMs(pauseMs);
  }
  return true;
}

// Brings pl-audio in line with the plan's clip versions and returns the keys
// that are current. Entries from before versioning (/audio/<id>.mp3) are kept
// under their versioned key when their bytes are the current audio, and
// deleted otherwise; entries for an older version, or for a clip no longer in
// the manifest, are deleted. Returns null if a newer worker took over.
async function reconcileAudioCache(audio, versions) {
  const cached = new Set();
  for (const req of await audio.keys()) {
    if (supersededWorker()) return null;
    const url = new URL(req.url);
    const id = CLIP_PATH.exec(url.pathname);
    if (!id) continue;
    const want = versions[id[1]];
    const key = clipKey(url.pathname, want);
    const have = url.searchParams.get('v');
    if (want && have === want) {
      cached.add(key);
      continue;
    }
    if (want && have === null && !cached.has(key)) {
      const res = await audio.match(req, { ignoreVary: true });
      if (isFull(res) && (await putIfVersion(audio, key, want, res).catch(() => null))) cached.add(key);
    }
    await audio.delete(req);
  }
  return cached;
}

async function runWarmAudio() {
  const plan = await fetchJson('/audio-plan.json');
  if (!plan || !Array.isArray(plan.ui) || !plan.tracks) return;
  await rememberAudioPlan(plan);
  const meta = await caches.open(META_CACHE);
  const done = await meta.match(WARM_DONE_KEY);
  if (done && (await done.text()) === plan.version) return;

  const audio = await caches.open(AUDIO_CACHE);
  const versions = clipVersions(plan);
  const keyFor = (hash) => clipKey(`/audio/${hash}.mp3`, versions && versions[hash]);
  const cached = versions
    ? await reconcileAudioCache(audio, versions)
    : new Set((await audio.keys()).map((req) => new URL(req.url).pathname));
  if (!cached) return;
  const { priority, idle } = warmOrder(plan, await readSavedProgress());
  if (!(await warmClips(priority, cached, WARM_PRIORITY_PAUSE_MS, keyFor, versions))) return;
  if (!(await idleAllowed())) return;
  if (!(await warmClips(idle, cached, WARM_IDLE_PAUSE_MS, keyFor, versions))) return;
  const missing = (plan.all || []).some((hash) => !cached.has(keyFor(hash)));
  if (!missing) await meta.put(WARM_DONE_KEY, new Response(plan.version));
}

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'RELOAD_LEGACY') {
    event.waitUntil(reloadLegacyClients());
    return;
  }
  if (data.type === 'WARM_AUDIO') {
    event.waitUntil(warmAudio().catch(() => undefined));
    return;
  }
  if (data.type === 'GET_VERSION' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

// A legacy page left on a lesson navigates away with client-side routing,
// which fetches the next route's RSC payload. When that request is for a
// non-lesson page, load it as a full document so the new build comes up.
async function maybeMoveLegacyClient(event, url) {
  if (!event.clientId) return;
  const pending = await readPendingLegacy();
  if (!pending.includes(event.clientId)) return;
  const client = await self.clients.get(event.clientId);
  if (!client) return;
  const leavingTo = url.pathname.startsWith('/lesson/') ? null : url.pathname;
  if (leavingTo && !event.request.headers.get('Next-Router-Prefetch')) {
    await writePendingLegacy(pending.filter((id) => id !== event.clientId));
    await client.navigate(leavingTo).catch(() => undefined);
    return;
  }
  if (!inLesson(client.url)) {
    await reloadLegacyClients(event.clientId);
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (request.mode !== 'navigate' && event.clientId) {
    event.waitUntil(maybeMoveLegacyClient(event, url).catch(() => undefined));
  }

  const strategy =
    request.mode === 'navigate' ? 'network-first' : offlineStrategy(url.pathname);
  const safe = (promise) => promise.catch(() => fallbackResponse(request));
  if (strategy === 'cache-first' && isAudio(url.pathname)) {
    event.respondWith(safe(audioCacheFirst(request)));
    return;
  }
  if (strategy === 'cache-first') {
    event.respondWith(safe(cacheFirst(request)));
    return;
  }
  if (strategy === 'network-first') {
    event.respondWith(safe(networkFirst(request)));
  }
});
