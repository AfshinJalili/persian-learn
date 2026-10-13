// Cache version comes from the registration URL (/sw.js?v=<build id>), which
// changes on every deploy, so each deploy installs a fresh worker and cache.
const SW_VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE_PREFIX = 'persian-learn-';
const CACHE_NAME = `${CACHE_PREFIX}${SW_VERSION}`;
// Cache name used by the original worker; seeing it on activate means this is
// the one-time upgrade of an installed client that has no reload hook yet.
const LEGACY_CACHE_NAME = 'persian-learn-v2';
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
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached =
      (await cache.match(request)) ||
      (await cache.match(request, { ignoreSearch: true })) ||
      (request.mode === 'navigate' ? await cache.match('/home') : undefined);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

async function carryOverAudio(oldNames) {
  const target = await caches.open(CACHE_NAME);
  for (const name of oldNames) {
    const old = await caches.open(name);
    for (const request of await old.keys()) {
      if (new URL(request.url).pathname.startsWith('/audio/')) {
        const response = await old.match(request);
        if (response) {
          await target.put(request, response);
        }
      }
    }
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const stale = names.filter(
        (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME
      );
      try {
        await carryOverAudio(stale);
      } catch {
        // Audio is re-downloaded on demand if carrying it over fails.
      }
      await Promise.all(stale.map((name) => caches.delete(name)));
      await self.clients.claim();

      // Pages opened by the original worker have no controllerchange hook, so
      // move them to the new build once (skipping anyone mid-lesson). Not
      // awaited: the navigation's fetch waits for activation to finish.
      if (names.includes(LEGACY_CACHE_NAME)) {
        setTimeout(reloadLegacyPages, 0);
      }
    })()
  );
});

async function reloadLegacyPages() {
  const windows = await self.clients.matchAll({ type: 'window' });
  await Promise.all(
    windows
      .filter((client) => !new URL(client.url).pathname.startsWith('/lesson/'))
      .map((client) => client.navigate(client.url).catch(() => undefined))
  );
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

  const strategy =
    request.mode === 'navigate' ? 'network-first' : offlineStrategy(url.pathname);
  if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (strategy === 'network-first') {
    event.respondWith(networkFirst(request));
  }
});
