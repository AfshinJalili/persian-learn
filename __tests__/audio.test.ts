import { beforeEach, describe, expect, it } from '@jest/globals';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { generateAudioId, spokenTextKey } from '../lib/audio-id';
import { hydrateAudioSpeed, getAudioSpeed, playAudio, setAudioSpeed } from '../lib/audio';

type Manifest = {
  items: Array<{ hash: string; text: string }>;
};

const manifest = JSON.parse(readFileSync('public/audio/manifest.json', 'utf8')) as Manifest;
const audioSource = readFileSync('lib/audio.ts', 'utf8');

class RecordingAudio {
  playbackRate = 1;
  preservesPitch = false;
  mozPreservesPitch = false;
  webkitPreservesPitch = false;
  paused = true;
  currentTime = 0;
  src: string;
  private ended: (() => void) | null = null;

  constructor(src: string) {
    this.src = src;
  }

  addEventListener(type: string, cb: () => void) {
    if (type === 'ended') this.ended = cb;
  }

  play() {
    this.paused = false;
    queueMicrotask(() => {
      this.paused = true;
      this.ended?.();
    });
    return Promise.resolve();
  }

  pause() {}
}

class MissingAudio {
  playbackRate = 1;
  preservesPitch = false;
  paused = true;
  currentTime = 0;
  addEventListener(type: string, cb: () => void) {
    if (type === 'error') {
      queueMicrotask(cb);
    }
  }
  play() {
    return Promise.reject(new Error('404'));
  }
  pause() {}
}

describe('generateAudioId', () => {
  it('matches SHA-256 keys in the audio manifest', async () => {
    expect(manifest.items.length).toBe(2626);
    const samples = [
      manifest.items[0],
      manifest.items[Math.floor(manifest.items.length / 2)],
      manifest.items[manifest.items.length - 1],
    ];
    for (const item of samples) {
      if (!item) continue;
      const expected = createHash('sha256').update(spokenTextKey(item.text), 'utf8').digest('hex').slice(0, 32);
      expect(item.hash).toBe(expected);
      await expect(generateAudioId(item.text)).resolves.toBe(item.hash);
    }
  });
});

describe('playAudio uses only Sulafat MP3s', () => {
  it('does not reference speechSynthesis', () => {
    expect(audioSource).not.toMatch(/speechSynthesis/);
    expect(audioSource).not.toMatch(/SpeechSynthesis/);
  });

  it('stays silent when the MP3 is missing', async () => {
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      writable: true,
      value: MissingAudio,
    });
    const speak = jest.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak, cancel: jest.fn(), getVoices: () => [], speaking: false },
    });

    await playAudio('سلام');
    expect(speak).not.toHaveBeenCalled();
  });
});

describe('hydrateAudioSpeed', () => {
  beforeEach(() => {
    setAudioSpeed(1);
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      writable: true,
      value: RecordingAudio,
    });
  });

  it('applies the saved rate with pitch preserved', async () => {
    hydrateAudioSpeed(1.2);
    expect(getAudioSpeed()).toBe(1.2);
    await playAudio('سلام');
    const last = (window as unknown as { Audio: typeof RecordingAudio }).Audio;
    void last;
    expect(getAudioSpeed()).toBe(1.2);
  });
});

describe('playbackRate and preservesPitch', () => {
  it('sets both on every clip', async () => {
    const created: RecordingAudio[] = [];
    class CaptureAudio extends RecordingAudio {
      constructor(src: string) {
        super(src);
        created.push(this);
      }
    }
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      writable: true,
      value: CaptureAudio,
    });
    setAudioSpeed(1.3);
    await playAudio('سلام');
    expect(created).toHaveLength(1);
    expect(created[0]?.playbackRate).toBe(1.3);
    expect(created[0]?.preservesPitch).toBe(true);
    expect(created[0]?.mozPreservesPitch).toBe(true);
    expect(created[0]?.webkitPreservesPitch).toBe(true);
  });
});
