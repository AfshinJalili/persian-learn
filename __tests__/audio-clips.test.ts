import { existsSync, readdirSync, readFileSync } from 'fs';
import { describe, expect, it } from '@jest/globals';
import { generateAudioId } from '../lib/audio-id';

type Manifest = {
  voice: string;
  count: number;
  items: Array<{ hash: string; text: string }>;
};

const manifest = JSON.parse(readFileSync('public/audio/manifest.json', 'utf8')) as Manifest;
const mp3s = readdirSync('public/audio').filter((name) => name.endsWith('.mp3'));

describe('Sulafat audio clips', () => {
  it('ships one MP3 per manifest item', () => {
    expect(manifest.voice).toContain('Sulafat');
    expect(manifest.count).toBe(manifest.items.length);
    expect(mp3s).toHaveLength(manifest.items.length);
    for (const item of manifest.items) {
      expect(existsSync(`public/audio/${item.hash}.mp3`)).toBe(true);
    }
  });

  it('uses generateAudioId hashes for every clip', async () => {
    for (const item of manifest.items) {
      await expect(generateAudioId(item.text)).resolves.toBe(item.hash);
    }
  });
});
