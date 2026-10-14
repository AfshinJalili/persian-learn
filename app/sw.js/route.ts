import { readFileSync } from 'fs';
import { join } from 'path';

// Serves the service worker with this deployment's build id baked in, so its
// bytes change on every deploy and browsers pick up the new worker.
export const dynamic = 'force-static';

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';

export function GET() {
  const source = readFileSync(join(process.cwd(), 'sw', 'service-worker.js'), 'utf8');
  return new Response(source.replace(/__BUILD_ID__/g, BUILD_ID), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
