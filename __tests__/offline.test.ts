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

  it('uses stale-while-revalidate for lesson routes and app pages', () => {
    expect(offlineStrategy('/lesson/m1l1')).toBe('stale-while-revalidate');
    expect(offlineStrategy('/lesson/a2l1')).toBe('stale-while-revalidate');
    expect(offlineStrategy('/home')).toBe('stale-while-revalidate');
    expect(offlineStrategy('/lesson-complete')).toBe('stale-while-revalidate');
  });
});

describe('service worker', () => {
  const source = readFileSync('public/sw.js', 'utf8');

  it('caches lesson routes and Next.js assets at runtime', () => {
    expect(source).toContain("pathname.startsWith('/_next/static')");
    expect(source).toContain("pathname.startsWith('/lesson/')");
    expect(source).toContain("cache-first");
    expect(source).toContain('stale-while-revalidate');
    expect(offlineStrategy('/_next/static/chunks/app.js')).toBe('cache-first');
    expect(offlineStrategy('/lesson/m1l1')).toBe('stale-while-revalidate');
  });

  it('does not precache audio clips at install', () => {
    expect(source).toContain("pathname.startsWith('/audio/')");
    const precache = source.match(/const urlsToCache = \[([\s\S]*?)\];/)?.[1] ?? '';
    expect(precache).not.toContain('/audio');
    expect(precache).not.toContain('.mp3');
    expect(source).not.toContain('.mp3');
  });
});
