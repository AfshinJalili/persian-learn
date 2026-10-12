import { audioUrlForHash, generateAudioId, spokenTextKey } from './audio-id';

let currentAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;
let audioSpeed = 1.0;

function persistUnlock() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('pl-audio-unlocked', '1');
  }
}

function readPersistedUnlock(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem('pl-audio-unlocked') === '1';
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

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

export async function playAudio(text: string, slow: boolean = false): Promise<void> {
  stopAudio();

  const speed = slow ? 0.75 : audioSpeed;
  const key = spokenTextKey(text);
  if (!key) {
    return;
  }

  const audioId = await generateAudioId(key);
  const audioPath = audioUrlForHash(audioId);

  try {
    await playAudioFile(audioPath, speed);
    return;
  } catch {
    /* missing MP3, decode error, or autoplay block — use device TTS */
  }

  return playWithSpeechSynthesis(key, speed);
}

let settlePlayback: (() => void) | null = null;

function finishPlayback() {
  const settle = settlePlayback;
  settlePlayback = null;
  settle?.();
}

function playAudioFile(path: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    settlePlayback = resolve;
    try {
      currentAudio = new Audio(path);
    } catch (err) {
      settlePlayback = null;
      reject(err);
      return;
    }
    currentAudio.playbackRate = rate;

    currentAudio.addEventListener('ended', () => {
      currentAudio = null;
      finishPlayback();
    });

    currentAudio.addEventListener('error', (err) => {
      currentAudio = null;
      settlePlayback = null;
      reject(err);
    });

    currentAudio.play().catch((err) => {
      currentAudio = null;
      settlePlayback = null;
      reject(err);
    });
  });
}

function playWithSpeechSynthesis(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    settlePlayback = resolve;
    const speech = getSpeechSynthesis();
    if (!speech) {
      finishPlayback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fa-IR';
    utterance.rate = rate;

    const voices = speech.getVoices();
    const persianVoice = voices.find(
      (v) => v.lang.startsWith('fa') || v.name.includes('Persian') || v.name.includes('Farsi')
    );

    if (persianVoice) {
      utterance.voice = persianVoice;
    }

    utterance.onend = () => finishPlayback();
    utterance.onerror = () => finishPlayback();

    try {
      speech.speak(utterance);
    } catch {
      finishPlayback();
    }
  });
}

export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  const speech = getSpeechSynthesis();
  if (speech) {
    speech.cancel();
  }

  finishPlayback();
}

export function isPlaying(): boolean {
  if (currentAudio && !currentAudio.paused) {
    return true;
  }

  const speech = getSpeechSynthesis();
  if (speech && speech.speaking) {
    return true;
  }

  return false;
}

export { generateAudioId } from './audio-id';

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
