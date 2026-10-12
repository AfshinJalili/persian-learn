import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from '@jest/globals';
import { generateAudioId } from '../lib/audio-id';
import { collectSpokenTexts } from '../scripts/collect-spoken-texts';

describe('missing-audio.json', () => {
  it('lists every spoken text that has no Sulafat clip yet', async () => {
    const texts = collectSpokenTexts();
    const missing: Array<{ text: string; id: string }> = [];
    for (const text of texts) {
      const id = await generateAudioId(text);
      if (!existsSync(join('public', 'audio', `${id}.mp3`))) {
        missing.push({ text, id });
      }
    }

    writeFileSync('scripts/missing-audio.json', `${JSON.stringify(missing, null, 2)}\n`, 'utf8');

    for (const item of missing) {
      await expect(generateAudioId(item.text)).resolves.toBe(item.id);
      expect(existsSync(`public/audio/${item.id}.mp3`)).toBe(false);
    }
  });
});
