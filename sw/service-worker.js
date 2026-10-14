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

async function audioCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  const key = url.pathname;
  let full = await cache.match(key, { ignoreVary: true });
  if (!full || full.status !== 200) {
    // Separate fetch without the Range header so we get (and keep) the whole file.
    try {
      full = await fetch(key, { credentials: 'same-origin' });
    } catch {
      return fallbackResponse(request);
    }
    if (full.status !== 200) {
      return full;
    }
    await cache.put(key, full.clone()).catch(() => undefined);
  }
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
      await target.put(isAudio(url.pathname) ? url.pathname : key, cached);
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

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'RELOAD_LEGACY') {
    event.waitUntil(reloadLegacyClients());
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
