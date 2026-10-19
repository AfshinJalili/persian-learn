import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildAudioPlan } from '@/lib/audio-plan';

// Built once at build time: which audio clips each lesson plays. The service
// worker uses it to warm the audio cache, the lessons she is on first.
export const dynamic = 'force-static';

const read = (...parts: string[]) =>
  JSON.parse(readFileSync(join(process.cwd(), 'public', ...parts), 'utf8'));

export function GET() {
  const plan = buildAudioPlan(
    { math: read('content', 'math.json'), alphabet: read('content', 'alphabet.json') },
    read('audio', 'manifest.json'),
    (key) => createHash('sha256').update(key, 'utf8').digest('hex').slice(0, 32)
  );
  return Response.json(plan, { headers: { 'Cache-Control': 'no-cache' } });
}
