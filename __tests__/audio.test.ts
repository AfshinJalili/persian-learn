import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { generateAudioId, spokenTextKey } from '../lib/audio-id';
import { hydrateAudioSpeed, getAudioSpeed, playAudio, setAudioSpeed } from '../lib/audio';

type Manifest = {
  items: Array<{ hash: string; text: string }>;
};

const manifest = JSON.parse(readFileSync('public/audio/manifest.json', 'utf8')) as Manifest;

function mockMissingAudioAndTts() {
  const speak = jest.fn();
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak,
      cancel: jest.fn(),
      getVoices: () => [],
      speaking: false,
    },
  });

  class MissingAudio {
    playbackRate = 1;
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
  Object.defineProperty(window, 'Audio', {
    configurable: true,
    writable: true,
    value: MissingAudio,
  });
}

describe('generateAudioId', () => {
  it('matches SHA-256 keys in the audio manifest', async () => {
    expect(manifest.items.length).toBeGreaterThan(0);
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

describe('playAudio fallback', () => {
  beforeEach(() => {
    setAudioSpeed(1);
    mockMissingAudioAndTts();
  });

  it('falls back to speechSynthesis when the MP3 is missing', async () => {
    await playAudio('سلام');
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = (window.speechSynthesis.speak as jest.Mock).mock.calls[0]?.[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('سلام');
    expect(utterance.lang).toBe('fa-IR');
  });
});

describe('hydrateAudioSpeed', () => {
  beforeEach(() => {
    setAudioSpeed(1);
    mockMissingAudioAndTts();
  });

  it('loads the saved speech rate before anything plays', async () => {
    hydrateAudioSpeed(0.8);
    expect(getAudioSpeed()).toBe(0.8);
    await playAudio('سلام');
    const utterance = (window.speechSynthesis.speak as jest.Mock).mock.calls.at(-1)?.[0] as SpeechSynthesisUtterance;
    expect(utterance.rate).toBe(0.8);
  });
});
