export type OfflineStrategy = 'cache-first' | 'stale-while-revalidate' | 'network';

export function offlineStrategy(pathname: string): OfflineStrategy {
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/content/') ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.woff2')
  ) {
    return 'cache-first';
  }

  if (
    pathname === '/' ||
    pathname === '/home' ||
    pathname === '/streak' ||
    pathname === '/profile' ||
    pathname === '/lesson-complete' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/lesson/')
  ) {
    return 'stale-while-revalidate';
  }

  return 'network';
}
