import { servedAudioPlan } from '@/lib/audio-plan-source';

// Built once at build time: just the audio plan's version (~100 bytes). The
// service worker checks this on every page load and fetches the full
// /audio-plan.json only when the version is new to this phone.
export const dynamic = 'force-static';

export function GET() {
  return Response.json({ version: servedAudioPlan().version }, { headers: { 'Cache-Control': 'no-cache' } });
}
