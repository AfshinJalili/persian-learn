import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { buildAudioPlan } from '../lib/audio-plan';
import { homeGreeting } from '../lib/learner';
import { spokenTextKey } from '../lib/audio-id';

const read = (...p: string[]) => JSON.parse(readFileSync(join(__dirname, '..', 'public', ...p), 'utf8'));
const hash = (key: string) => createHash('sha256').update(key, 'utf8').digest('hex').slice(0, 32);
const manifest = read('audio', 'manifest.json');
const plan = buildAudioPlan(
  { math: read('content', 'math.json'), alphabet: read('content', 'alphabet.json') },
  manifest,
  hash
);

describe('audio warm-up plan', () => {
  it('uses the same text -> clip hash as the manifest', () => {
    for (const item of manifest.items.slice(0, 50)) {
      expect(hash(spokenTextKey(item.text))).toBe(item.hash);
    }
  });

  it('lists every manifest clip, and only clips that exist', () => {
    expect(new Set(plan.all).size).toBe(manifest.items.length);
    for (const h of plan.all.slice(0, 50)) {
      expect(existsSync(join(__dirname, '..', 'public', 'audio', `${h}.mp3`))).toBe(true);
    }
  });

  it('maps every lesson, in course order, to clips it plays', () => {
    expect(plan.tracks.math[0].id).toBe('m1l1');
    expect(plan.tracks.alphabet[0].id).toBe('a1l1');
    const known = new Set(plan.all);
    for (const lesson of [...plan.tracks.math, ...plan.tracks.alphabet]) {
      expect(lesson.clips.length).toBeGreaterThan(0);
      for (const clip of lesson.clips) expect(known.has(clip)).toBe(true);
    }
  });

  it('puts the home greeting in the app-shell clips', () => {
    expect(plan.ui).toContain(hash(spokenTextKey(homeGreeting())));
  });
});
