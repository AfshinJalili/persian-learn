export type OfflineStrategy = 'cache-first' | 'network-first' | 'network';

// Mirrors offlineStrategy() in sw/service-worker.js (served at /sw.js).
export function offlineStrategy(pathname: string): OfflineStrategy {
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
