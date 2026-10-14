import { readFileSync } from 'fs';
import { describe, expect, it } from '@jest/globals';
import { offlineStrategy } from '../lib/offline';

describe('offline caching strategy', () => {
  it('uses cache-first for Next.js static chunks', () => {
    expect(offlineStrategy('/_next/static/chunks/app.js')).toBe('cache-first');
    expect(offlineStrategy('/fonts/Vazirmatn-Bold.woff2')).toBe('cache-first');
  });

  it('caches audio clips on demand and does not treat them as app pages', () => {
    expect(offlineStrategy('/audio/c16919cdbe7d610669612c69cacdd4bf.mp3')).toBe('cache-first');
    expect(offlineStrategy('/audio/manifest.json')).toBe('cache-first');
  });

  it('uses network-first for lesson routes, app pages and lesson content', () => {
    expect(offlineStrategy('/lesson/m1l1')).toBe('network-first');
    expect(offlineStrategy('/lesson/a2l1')).toBe('network-first');
    expect(offlineStrategy('/home')).toBe('network-first');
    expect(offlineStrategy('/lesson-complete')).toBe('network-first');
    expect(offlineStrategy('/content/math.json')).toBe('network-first');
  });
});

describe('service worker', () => {
  const source = readFileSync('sw/service-worker.js', 'utf8');

  it('caches lesson routes and Next.js assets at runtime', () => {
    expect(source).toContain("pathname.startsWith('/_next/static')");
    expect(source).toContain("pathname.startsWith('/lesson/')");
    expect(source).toContain("cache-first");
    expect(source).toContain('network-first');
    expect(source).not.toContain('stale-while-revalidate');
    expect(offlineStrategy('/_next/static/chunks/app.js')).toBe('cache-first');
    expect(offlineStrategy('/lesson/m1l1')).toBe('network-first');
  });

  it('does not precache audio clips at install', () => {
    expect(source).toContain("pathname.startsWith('/audio/')");
    const precache = source.match(/const urlsToCache = \[([\s\S]*?)\];/)?.[1] ?? '';
    expect(precache).not.toContain('/audio');
    expect(precache).not.toContain('.mp3');
    expect(source).not.toContain('.mp3');
  });

  it('versions the cache per build and takes over immediately', () => {
    expect(source).toContain("const SW_VERSION = '__BUILD_ID__'");
    expect(source).not.toMatch(/const CACHE_NAME = 'persian-learn-v2'/);
    expect(source).toContain('self.skipWaiting()');
    expect(source).toContain('self.clients.claim()');
    expect(source).toContain('caches.delete');
  });
});
