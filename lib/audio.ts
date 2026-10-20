import { audioUrlForHash, generateAudioId, spokenTextKey } from './audio-id';

export const AUDIO_SPEEDS = [0.9, 1, 1.1, 1.2, 1.3] as const;
export type AudioSpeed = (typeof AUDIO_SPEEDS)[number];

let currentAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;
let audioSpeed = 1.0;
let playGeneration = 0;

function persistUnlock() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pl-audio-unlocked', '1');
    }
  } catch {
    /* private mode / blocked storage */
  }
}

function readPersistedUnlock(): boolean {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem('pl-audio-unlocked') === '1';
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined' && readPersistedUnlock()) {
  audioUnlocked = true;
}

export function unlockAudio() {
  audioUnlocked = true;
  persistUnlock();
}

export function isAudioUnlocked(): boolean {
  if (audioUnlocked) return true;
  audioUnlocked = readPersistedUnlock();
  return audioUnlocked;
}

export function setAudioSpeed(speed: number) {
  audioSpeed = speed;
}

export function getAudioSpeed(): number {
  return audioSpeed;
}

export function hydrateAudioSpeed(rate: number | undefined | null) {
  if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
    audioSpeed = rate;
    return;
  }
  audioSpeed = 1;
}

function haltCurrent() {
  const audio = currentAudio;
  currentAudio = null;
  if (!audio) return;
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    /* not seekable until loaded */
  }
}

let activeSequence: AbortController | null = null;

/**
 * Register a multi-clip sequence (e.g. the count-along) as the one global
 * owner of playback. Pass the returned controller's signal to every
 * playAudio call in the sequence and to its timers: any other playAudio,
 * stopAudio or a newer sequence aborts it, so queued clips and pending
 * timers never talk over whatever came next.
 */
export function beginAudioSequence(): AbortController {
  cancelAudioSequence();
  const controller = new AbortController();
  activeSequence = controller;
  return controller;
}

/** Abort the registered sequence (if any) without touching other playback. */
export function cancelAudioSequence() {
  const controller = activeSequence;
  activeSequence = null;
  controller?.abort();
}

function haltPlayback() {
  playGeneration += 1;
  haltCurrent();
  finishPlayback();
}

export function stopAudio() {
  cancelAudioSequence();
  haltPlayback();
}

export async function playAudio(
  text: string,
  slow: boolean = false,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) return;

  // New playback from anyone but the registered sequence cancels that
  // sequence outright (not just its current clip).
  if (!activeSequence || activeSequence.signal !== signal) cancelAudioSequence();
  haltPlayback();
  const token = playGeneration;

  const onAbort = () => {
    if (token === playGeneration) stopAudio();
  };
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const speed = slow ? 0.75 : audioSpeed;
    const key = spokenTextKey(text);
    if (!key) {
      return;
    }

    const audioId = await generateAudioId(key);
    if (token !== playGeneration || signal?.aborted) {
      return;
    }

    const audioPath = audioUrlForHash(audioId);
    try {
      await playAudioFile(audioPath, speed, token);
    } catch {
      /* missing Sulafat clip: stay silent — never use device TTS */
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

export async function playAudioSequence(
  texts: string[],
  options?: { slow?: boolean; signal?: AbortSignal }
): Promise<void> {
  const slow = options?.slow ?? false;
  const signal = options?.signal;
  for (const text of texts) {
    if (signal?.aborted) return;
    await playAudio(text, slow, signal);
  }
}

let settlePlayback: (() => void) | null = null;

function finishPlayback() {
  const settle = settlePlayback;
  settlePlayback = null;
  settle?.();
}

function applyPlaybackRate(audio: HTMLAudioElement, rate: number) {
  audio.playbackRate = rate;
  audio.preservesPitch = true;
  const prefixed = audio as HTMLAudioElement & {
    mozPreservesPitch?: boolean;
    webkitPreservesPitch?: boolean;
  };
  prefixed.mozPreservesPitch = true;
  prefixed.webkitPreservesPitch = true;
}

function playAudioFile(path: string, rate: number, token: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (token !== playGeneration) {
      resolve();
      return;
    }
    settlePlayback = resolve;
    try {
      currentAudio = new Audio(path);
    } catch (err) {
      settlePlayback = null;
      reject(err);
      return;
    }
    const audio = currentAudio;
    const keepRate = () => applyPlaybackRate(audio, rate);
    keepRate();
    audio.addEventListener('loadedmetadata', keepRate);
    audio.addEventListener('playing', keepRate);
    audio.addEventListener('durationchange', keepRate);

    audio.addEventListener('ended', () => {
      if (token !== playGeneration) return;
      if (currentAudio === audio) currentAudio = null;
      finishPlayback();
    });

    audio.addEventListener('error', (err) => {
      if (token !== playGeneration) return;
      if (currentAudio === audio) currentAudio = null;
      settlePlayback = null;
      reject(err);
    });

    audio
      .play()
      .then(() => {
        if (token !== playGeneration) {
          audio.pause();
          return;
        }
        keepRate();
      })
      .catch((err) => {
        if (token !== playGeneration) {
          resolve();
          return;
        }
        if (currentAudio === audio) currentAudio = null;
        settlePlayback = null;
        reject(err);
      });
  });
}

export function isPlaying(): boolean {
  return Boolean(currentAudio && !currentAudio.paused);
}

export { generateAudioId } from './audio-id';

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
