import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { generateAudioId, spokenTextKey } from '../lib/audio-id';
import {
  hydrateAudioSpeed,
  getAudioSpeed,
  playAudio,
  playAudioSequence,
  setAudioSpeed,
  stopAudio,
} from '../lib/audio';

jest.mock('../lib/audio-id', () => {
  const actual = jest.requireActual('../lib/audio-id') as typeof import('../lib/audio-id');
  return {
    ...actual,
    generateAudioId: jest.fn((text: string) => actual.generateAudioId(text)),
  };
});

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
  private playing: (() => void) | null = null;
  private loaded: (() => void) | null = null;

  constructor(src: string) {
    this.src = src;
  }

  addEventListener(type: string, cb: () => void) {
    if (type === 'ended') this.ended = cb;
    if (type === 'playing') this.playing = cb;
    if (type === 'loadedmetadata') this.loaded = cb;
  }

  play() {
    this.playbackRate = 1;
    this.paused = false;
    this.loaded?.();
    this.playing?.();
    queueMicrotask(() => {
      this.paused = true;
      this.ended?.();
    });
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

class HoldAudio {
  playbackRate = 1;
  preservesPitch = false;
  mozPreservesPitch = false;
  webkitPreservesPitch = false;
  paused = true;
  currentTime = 0;
  src: string;
  playCalls = 0;

  constructor(src: string) {
    this.src = src;
  }

  addEventListener() {}

  play() {
    this.playCalls += 1;
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
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
    expect(manifest.items.length).toBe(2627);
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

  it('guards sessionStorage reads and writes with try/catch', () => {
    expect(audioSource).toMatch(/function persistUnlock\(\) \{\s*try \{[\s\S]*sessionStorage\.setItem/);
    expect(audioSource).toMatch(/function readPersistedUnlock\(\): boolean \{\s*try \{[\s\S]*sessionStorage\.getItem/);
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

  it('reapplies playbackRate after play() resets it', async () => {
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
    setAudioSpeed(0.9);
    await playAudio('سلام');
    expect(created[0]?.playbackRate).toBe(0.9);
  });
});

describe('single global audio player', () => {
  const mockedId = generateAudioId as unknown as jest.Mock<Promise<string>, [string]>;

  beforeEach(() => {
    stopAudio();
    mockedId.mockReset();
    mockedId.mockImplementation((text: string) => {
      const actual = jest.requireActual('../lib/audio-id') as typeof import('../lib/audio-id');
      return actual.generateAudioId(text);
    });
  });

  it('rapid advance stops the current clip and never starts the previous one', async () => {
    const firstHash = deferred<string>();
    const secondHash = deferred<string>();
    mockedId.mockReturnValueOnce(firstHash.promise).mockReturnValueOnce(secondHash.promise);

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

    const first = playAudio('سلام درس اول');
    const second = playAudio('سلام درس دوم');
    firstHash.resolve('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    await Promise.resolve();
    await Promise.resolve();
    expect(created).toHaveLength(0);

    secondHash.resolve('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    await second;
    await first;
    expect(created).toHaveLength(1);
    expect(created[0]?.src).toContain('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  it('unmount mid-sequence cancels queued prompt-then-options clips', async () => {
    const created: HoldAudio[] = [];
    class CaptureAudio extends HoldAudio {
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

    const controller = new AbortController();
    const sequence = playAudioSequence(['سلام', 'یک', 'دو'], { signal: controller.signal });

    await new Promise((resolve) => {
      const check = () => {
        if (created.length >= 1) resolve(undefined);
        else setTimeout(check, 0);
      };
      check();
    });
    expect(created).toHaveLength(1);
    expect(created[0]?.playCalls).toBe(1);

    controller.abort();
    await sequence;
    expect(created).toHaveLength(1);
    expect(created[0]?.paused).toBe(true);
  });

  it('a late-resolving promise from an old step never starts playback', async () => {
    const lateHash = deferred<string>();
    mockedId.mockReturnValueOnce(lateHash.promise);

    const created: HoldAudio[] = [];
    class CaptureAudio extends HoldAudio {
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

    const stale = playAudio('صدای مرحله قبل');
    stopAudio();
    lateHash.resolve('cccccccccccccccccccccccccccccccc');
    await stale;
    await Promise.resolve();
    await Promise.resolve();
    expect(created).toHaveLength(0);
  });
});
