import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { buildAudioPlan, CLIP_BYTES_HASH_LENGTH } from '../lib/audio-plan';
import { homeGreeting } from '../lib/learner';
import { spokenTextKey } from '../lib/audio-id';

const read = (...p: string[]) => JSON.parse(readFileSync(join(__dirname, '..', 'public', ...p), 'utf8'));
const hash = (key: string) => createHash('sha256').update(key, 'utf8').digest('hex').slice(0, 32);
const manifest = read('audio', 'manifest.json');
const tracks = { math: read('content', 'math.json'), alphabet: read('content', 'alphabet.json') };
const clipFile = (id: string) => join(__dirname, '..', 'public', 'audio', `${id}.mp3`);
const bytesHash = (id: string) =>
  existsSync(clipFile(id))
    ? createHash('sha256').update(readFileSync(clipFile(id))).digest('hex').slice(0, CLIP_BYTES_HASH_LENGTH)
    : null;
const plan = buildAudioPlan(tracks, manifest, hash, bytesHash);

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

  it('versions every clip by a hash of its audio bytes', () => {
    expect(Object.keys(plan.clips).sort()).toEqual([...plan.all].sort());
    for (const id of plan.all.filter((_, i) => i % 40 === 0)) {
      const real = createHash('sha256').update(readFileSync(clipFile(id))).digest('hex');
      expect(plan.clips[id]).toBe(real.slice(0, 16));
    }
  });

  it('changes the plan version when a clip is re-synthesized or swapped for another phrase', () => {
    const [first, second] = plan.all;
    // Same clip set, one clip's audio regenerated.
    const resynth = buildAudioPlan(tracks, manifest, hash, (id) =>
      id === first ? '0123456789abcdef' : bytesHash(id)
    );
    expect(resynth.version).not.toBe(plan.version);
    expect(resynth.clips[first]).toBe('0123456789abcdef');
    // Same voice and clip count, one phrase replaced by another.
    const swapped = {
      ...manifest,
      items: manifest.items.map((item: { hash: string; text: string }) =>
        item.hash === second ? { hash: 'f'.repeat(32), text: 'x' } : item
      ),
    };
    const replaced = buildAudioPlan(tracks, swapped, hash, (id) =>
      id === 'f'.repeat(32) ? 'fedcba9876543210' : bytesHash(id)
    );
    expect(replaced.all.length).toBe(plan.all.length);
    expect(replaced.version).not.toBe(plan.version);
    // Nothing changed: same version (no needless re-warm).
    expect(buildAudioPlan(tracks, manifest, hash, bytesHash).version).toBe(plan.version);
  });

  it('leaves out manifest clips whose file is missing', () => {
    const [gone] = plan.all;
    const without = buildAudioPlan(tracks, manifest, hash, (id) => (id === gone ? null : bytesHash(id)));
    expect(without.all).not.toContain(gone);
    expect(without.clips[gone]).toBeUndefined();
  });
});
