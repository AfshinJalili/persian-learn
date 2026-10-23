import { servedAudioPlan } from '@/lib/audio-plan-source';

// Built once at build time: which audio clips each lesson plays. The service
// worker uses it to warm the audio cache, the lessons she is on first. It is
// large (~430 KB), so the worker fetches it only when
// /audio-plan-version.json reports a version it doesn't have.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(servedAudioPlan(), { headers: { 'Cache-Control': 'no-cache' } });
}
