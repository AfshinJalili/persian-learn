import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'fs';
import type { Exercise, Track } from '../lib/types';
import IntroExercise from '../components/exercises/IntroExercise';
import { isCountingIntro } from '../components/exercises/CountCard';
import { audioUrlForHash, generateAudioId, spokenTextKey } from '../lib/audio-id';
import { beginAudioSequence, playAudio, setAudioSpeed, stopAudio } from '../lib/audio';

// Real lib/audio (not mocked): the count-along must go through the single
// global player so Continue's hint, any other clip, or navigation cancels it.

const created: HeldAudio[] = [];

class HeldAudio {
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
    created.push(this);
  }

  addEventListener(type: string, cb: () => void) {
    if (type === 'ended') this.ended = cb;
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  end() {
    this.paused = true;
    this.ended?.();
  }
}

async function urlFor(text: string) {
  return audioUrlForHash(await generateAudioId(spokenTextKey(text)));
}

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

beforeEach(() => {
  stopAudio();
  created.length = 0;
  setAudioSpeed(20); // count-along fallback timers: 600 / 20 = 30ms
  Object.defineProperty(window, 'Audio', { configurable: true, writable: true, value: HeldAudio });
});

afterEach(() => {
  cleanup();
  stopAudio();
  setAudioSpeed(1);
});

describe('global audio sequence', () => {
  it('is aborted by any other playAudio, but not by its own clips', async () => {
    const seq = beginAudioSequence();
    const own = playAudio('یک', false, seq.signal);
    await waitFor(() => expect(created).toHaveLength(1));
    expect(seq.signal.aborted).toBe(false);
    void playAudio('اول کارت‌ها را بزنید');
    expect(seq.signal.aborted).toBe(true);
    await own;
  });

  it('is aborted by stopAudio (navigation / unmount) and by a newer sequence', () => {
    const first = beginAudioSequence();
    const second = beginAudioSequence();
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    stopAudio();
    expect(second.signal.aborted).toBe(true);
  });
});

describe('count-along cancel on Continue', () => {
  it('Continue mid count-along stops the count; only «اول کارت‌ها را بزنید» plays after', async () => {
    const user = userEvent.setup();
    render(<IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay={false} />);
    const card = screen.getByRole('button', { name: 'سه انار' });

    await user.click(card);
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0].src).toBe(await urlFor('سه'));
    created[0].end();
    // Count-along moves on to «یک».
    await waitFor(() => expect(created).toHaveLength(2));
    expect(created[1].src).toBe(await urlFor('یک'));
    expect(card).toHaveClass('playing');

    await user.click(screen.getByRole('button', { name: 'ادامه' }));
    const hint = await urlFor('اول کارت‌ها را بزنید');
    await waitFor(() => expect(created.at(-1)?.src).toBe(hint));
    expect(created[1].paused).toBe(true);
    const hintIndex = created.length - 1;

    // Long past every pending count timer: nothing else starts, the hint
    // keeps playing, and the card is no longer in its playing state.
    await wait(400);
    expect(created).toHaveLength(hintIndex + 1);
    expect(created[hintIndex].paused).toBe(false);
    expect(card).not.toHaveClass('playing');

    created[hintIndex].end();
    await wait(200);
    expect(created).toHaveLength(hintIndex + 1);
  });

  it('a speaker / any other clip also cancels the queued count', async () => {
    const user = userEvent.setup();
    render(<IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay={false} />);
    await user.click(screen.getByRole('button', { name: 'دو گنجشک' }));
    await waitFor(() => expect(created).toHaveLength(1));

    await act(async () => {
      void playAudio('سلام');
    });
    await waitFor(() => expect(created).toHaveLength(2));
    created[1].end();
    await wait(300);
    expect(created).toHaveLength(2);
  });

  it('navigation (stopAudio) cancels pending count timers', async () => {
    const user = userEvent.setup();
    render(<IntroExercise exercise={countingExercise()} onContinue={() => {}} autoplay={false} />);
    await user.click(screen.getByRole('button', { name: 'سه انار' }));
    await waitFor(() => expect(created).toHaveLength(1));
    act(() => stopAudio());
    await wait(300);
    expect(created).toHaveLength(1);
  });
});

describe('count-card intro is opt-in from content', () => {
  const math = JSON.parse(readFileSync('public/content/math.json', 'utf8')) as Track;
  const intros = math.units
    .flatMap((u) => u.lessons)
    .flatMap((l) => l.exercises)
    .filter((e) => e.type === 'intro');
  const byId = (id: string) => intros.find((e) => e.id === id)!;

  it('only m1l1e1 is flagged count_cards; m12l2e1 (☀️  🌙) is not', () => {
    expect(isCountingIntro(byId('m1l1e1'))).toBe(true);
    expect(isCountingIntro(byId('m12l2e1'))).toBe(false);
    expect(intros.filter(isCountingIntro).map((e) => e.id)).toEqual(['m1l1e1']);
  });

  it('m12l2e1 renders as a normal intro (no count cards, no «یک»)', () => {
    render(<IntroExercise exercise={byId('m12l2e1')} onContinue={() => {}} autoplay={false} />);
    expect(document.querySelectorAll('[data-count-card]')).toHaveLength(0);
    expect(document.querySelector('.cc-list')).toBeNull();
    expect(screen.queryByText('یک')).toBeNull();
    expect(screen.getByRole('button', { name: 'ادامه' })).not.toHaveAttribute('aria-disabled');
  });

  it('the heuristic is gone: two picture groups without the flag stay a normal intro', () => {
    const ex = { ...byId('m1l1e1'), payload: { display: '🍎  🐦🐦', visual: '', teaches: [] } };
    expect(isCountingIntro(ex)).toBe(false);
    expect(isCountingIntro({ ...ex, payload: { ...ex.payload, labels: ['یک سیب', 'دو گنجشک'] } })).toBe(false);
  });

  it('m1l1e1 still renders the three count cards', () => {
    render(<IntroExercise exercise={byId('m1l1e1')} onContinue={() => {}} autoplay={false} />);
    expect(document.querySelectorAll('[data-count-card]')).toHaveLength(3);
  });

  it.each(['m6l1e1', 'm6l3e1', 'm8l4e1'])(
    'a lone multi-item group intro (%s) is not drawn at 160px per item',
    (id) => {
      render(<IntroExercise exercise={byId(id)} onContinue={() => {}} autoplay={false} />);
      expect(document.querySelector('[data-single-art]')).toBeNull();
      const items = [...document.querySelectorAll<HTMLElement>('[data-group-art] .illus')];
      expect(items.length).toBeGreaterThan(5);
      for (const item of items) expect(item.style.width).not.toBe('160px');
    }
  );

  it('a single-picture intro draws its art at 160px', () => {
    render(<IntroExercise exercise={byId('m1l2e1')} onContinue={() => {}} autoplay={false} />);
    const box = document.querySelector('.intro-single-art[data-single-art] .illus') as HTMLElement;
    expect(box).not.toBeNull();
    expect(box.style.width).toBe('160px');
  });
});
