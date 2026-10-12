import { describe, expect, it } from '@jest/globals';
import { createHash } from 'crypto';
import { audioContentHash, spokenTextKey } from '../lib/audio-id';

describe('audio content hash', () => {
  it('normalizes Arabic yeh/kaf before hashing', () => {
    expect(spokenTextKey('يک')).toBe('یک');
  });

  it('matches Python hashlib.sha256 hex[:32]', async () => {
    const text = 'سلام! من هُدی هستم. خوش آمدید.';
    const key = spokenTextKey(text);
    const expected = createHash('sha256').update(key, 'utf8').digest('hex').slice(0, 32);
    await expect(audioContentHash(text)).resolves.toBe(expected);
  });
});
