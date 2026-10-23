import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildAudioPlan, CLIP_BYTES_HASH_LENGTH, type AudioPlan } from './audio-plan';

// Server-only: builds the audio plan from public/ (content, manifest, clip
// files). Used by the static /audio-plan.json and /audio-plan-version.json
// routes, so both carry the same version.

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

// Hash of the clip's bytes as shipped in public/audio (the cache version).
function clipBytesHash(id: string): string | null {
  try {
    return sha256(readFileSync(join(process.cwd(), 'public', 'audio', `${id}.mp3`))).slice(0, CLIP_BYTES_HASH_LENGTH);
  } catch {
    return null;
  }
}

const read = (...parts: string[]) =>
  JSON.parse(readFileSync(join(process.cwd(), 'public', ...parts), 'utf8'));

let built: AudioPlan | null = null;

export function servedAudioPlan(): AudioPlan {
  built ??= buildAudioPlan(
    { math: read('content', 'math.json'), alphabet: read('content', 'alphabet.json') },
    read('audio', 'manifest.json'),
    (key) => sha256(Buffer.from(key, 'utf8')).slice(0, 32),
    clipBytesHash
  );
  return built;
}
