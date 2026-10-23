import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Exercise } from '../lib/types';
import IntroExercise from '../components/exercises/IntroExercise';
import { audioUrlForHash, generateAudioId, spokenTextKey } from '../lib/audio-id';
import { setAudioSpeed, stopAudio } from '../lib/audio';

// Locked-Continue cancel races (QA saw «دو» start after Continue in 1 of 21
// WebKit runs). This fake Audio behaves like WebKit's element: play() returns
// a promise the test settles later, pause() while play() is pending rejects
// it with AbortError, and play/playing/ended are separate events, so every
// interleaving of "Continue" with the count-along's clip boundaries can be
// driven deterministically against the real lib/audio player.

type Listener = () => void;
const created: RaceAudio[] = [];

class RaceAudio {
  playbackRate = 1;
  preservesPitch = false;
  mozPreservesPitch = false;
  webkitPreservesPitch = false;
  paused = true;
  currentTime = 0;
  src: string;
  pauseCalls = 0;
  private listeners = new Map<string, Listener[]>();
  private pending: { resolve: () => void; reject: (e: unknown) => void } | null = null;

  constructor(src: string) {
    this.src = src;
    created.push(this);
  }

  addEventListener(type: string, cb: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), cb]);
  }

  private emit(type: string) {
    for (const cb of this.listeners.get(type) ?? []) cb();
  }

  play() {
    this.paused = false;
    return new Promise<void>((resolve, reject) => {
      this.pending = { resolve, reject };
    });
  }

  /** The media pipeline starts: play promise resolves, then play/playing fire. */
  start() {
    const p = this.pending;
    this.pending = null;
    p?.resolve();
    this.emit('play');
    this.emit('playing');
  }

  pause() {
    this.pauseCalls += 1;
    this.paused = true;
    const p = this.pending;
    this.pending = null;
    p?.reject(new DOMException('The operation was aborted.', 'AbortError'));
    this.emit('pause');
  }

  end() {
    this.paused = true;
    this.emit('ended');
  }
}

const textByUrl = new Map<string, string>();
async function mapUrls(texts: string[]) {
  for (const text of texts) textByUrl.set(audioUrlForHash(await generateAudioId(spokenTextKey(text))), text);
}
const said = (a: RaceAudio) => textByUrl.get(a.src) ?? a.src;
const HINT = 'اول کارت‌ها را بزنید';

function countingExercise(): Exercise {
  return {
    id: 'm1l1e1',
    type: 'intro',
    prompt: '🍎',
    audio_script: 'سلام فریبا جون!',
    payload: {
      display: '🍎  🐦🐦  🍇🍇🍇',
      visual: '',
      teaches: [],
      variant: 'count_cards',
      labels: ['یک سیب', 'دو گنجشک', 'سه انار'],
    },
    answer: '',
    distractors: [],
    feedback_correct: '',
    feedback_wrong: '',
  };
}

const wait = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
const ticks = async (n: number) => {
  for (let i = 0; i < n; i += 1) await Promise.resolve();
};

/** Tap «سه انار», let «سه» play through, and get «یک» (the first item) playing. */
async function countAlongAtYek() {
  render(<IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'سه انار' }));
  await waitFor(() => expect(created).toHaveLength(1));
  expect(said(created[0])).toBe('سه');
  act(() => created[0].start());
  act(() => created[0].end());
  await waitFor(() => expect(created).toHaveLength(2));
  expect(said(created[1])).toBe('یک');
  act(() => created[1].start());
  return created[1];
}

/** After Continue: the hint is the only thing that starts, and nothing else sounds. */
async function expectOnlyHintAfter(clickIndex: number) {
  await waitFor(() => expect(said(created.at(-1)!)).toBe(HINT));
  const hint = created.at(-1)!;
  act(() => hint.start());
  // Long past every count-along fallback timer (30ms at speed 20).
  await wait(300);
  expect(created.at(-1)).toBe(hint);
  const sounding = created.filter((a) => !a.paused).map(said);
  expect(sounding).toEqual([HINT]);
  // No count clip was created after the click except one that was already
  // cancelled before it could sound.
  for (const a of created.slice(clickIndex)) {
    if (a !== hint) expect(a.paused).toBe(true);
  }
  expect(screen.getByRole('button', { name: 'سه انار' })).not.toHaveClass('playing');
}

beforeEach(async () => {
  stopAudio();
  created.length = 0;
  setAudioSpeed(20);
  Object.defineProperty(window, 'Audio', { configurable: true, writable: true, value: RaceAudio });
  await mapUrls(['سه', 'یک', 'دو', 'سه انار', HINT]);
});

afterEach(() => {
  cleanup();
  stopAudio();
  setAudioSpeed(1);
});

describe('locked Continue vs the count-along clip boundaries', () => {
  it('mid «یک»: «یک» is paused and «دو» never starts', async () => {
    const yek = await countAlongAtYek();
    const at = created.length;
    fireEvent.click(screen.getByRole('button', { name: 'ادامه' }));
    expect(yek.paused).toBe(true);
    await expectOnlyHintAfter(at);
    expect(created.map(said)).not.toContain('دو');
  });

  // «یک» ends and Continue lands N microtasks later: covers the playAudio
  // settle, the fallback sleep, the loop's next iteration and the async audio
  // id hash for «دو» — every await between one clip and the next.
  it.each([0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 40])(
    'in the gap after «یک» ended (+%i microtasks): «دو» does not sound',
    async (n) => {
      const yek = await countAlongAtYek();
      const at = created.length;
      await act(async () => {
        yek.end();
        await ticks(n);
        fireEvent.click(screen.getByRole('button', { name: 'ادامه' }));
      });
      await expectOnlyHintAfter(at);
    }
  );

  it('in the gap after the fallback timer: «دو» created, Continue before play() settles', async () => {
    const yek = await countAlongAtYek();
    act(() => yek.end());
    await waitFor(() => expect(created.map(said)).toContain('دو'));
    const doo = created.at(-1)!;
    expect(said(doo)).toBe('دو');
    const at = created.length - 1;
    // play() is still pending (WebKit: media not started yet) when Continue lands.
    fireEvent.click(screen.getByRole('button', { name: 'ادامه' }));
    expect(doo.paused).toBe(true);
    // A late start from the media pipeline must not leave «دو» sounding:
    // the stale resolve pauses it again.
    act(() => doo.start());
    await act(async () => ticks(5));
    await expectOnlyHintAfter(at);
  });

  it('«دو»\'s play() resolves only after Continue (no AbortError): it is paused on resolve', async () => {
    const yek = await countAlongAtYek();
    act(() => yek.end());
    await waitFor(() => expect(created.map(said)).toContain('دو'));
    const doo = created.at(-1)!;
    const at = created.length - 1;
    // Make this element ignore the abort (a browser that resolves play()
    // anyway): swallow pause() rejection by resolving first, then click.
    const realPause = doo.pause.bind(doo);
    doo.pause = () => {
      doo.pauseCalls += 1;
      doo.paused = true;
    };
    fireEvent.click(screen.getByRole('button', { name: 'ادامه' }));
    const callsAtClick = doo.pauseCalls;
    expect(callsAtClick).toBeGreaterThan(0);
    doo.pause = realPause;
    act(() => {
      doo.paused = false; // the pipeline started it regardless
      doo.start();
    });
    await act(async () => ticks(5));
    expect(doo.paused).toBe(true);
    expect(doo.pauseCalls).toBeGreaterThan(callsAtClick);
    await expectOnlyHintAfter(at);
  });
});
