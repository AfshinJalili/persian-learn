import { audioContentHash, audioUrlForHash, spokenTextKey } from './audio-id';

let currentAudio: HTMLAudioElement | null = null;
let speechSynthesis: SpeechSynthesis | null = null;
let audioUnlocked = false;
let audioSpeed = 1.0;

if (typeof window !== 'undefined') {
  speechSynthesis = window.speechSynthesis;
}

export function unlockAudio() {
  audioUnlocked = true;
}

export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

export function setAudioSpeed(speed: number) {
  audioSpeed = speed;
}

export function getAudioSpeed(): number {
  return audioSpeed;
}

export async function playAudio(text: string, slow: boolean = false): Promise<void> {
  stopAudio();

  const speed = slow ? 0.75 : audioSpeed;
  const key = spokenTextKey(text);
  if (!key) {
    return;
  }

  const hash = await audioContentHash(key);
  const audioPath = audioUrlForHash(hash);

  try {
    await playAudioFile(audioPath, speed);
    return;
  } catch {
    /* fall through to device TTS */
  }

  return playWithSpeechSynthesis(key, speed);
}

function playAudioFile(path: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    currentAudio = new Audio(path);
    currentAudio.playbackRate = rate;

    currentAudio.addEventListener('ended', () => {
      currentAudio = null;
      resolve();
    });

    currentAudio.addEventListener('error', (err) => {
      currentAudio = null;
      reject(err);
    });

    currentAudio.play().catch(reject);
  });
}

function playWithSpeechSynthesis(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!speechSynthesis) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fa-IR';
    utterance.rate = rate;

    const voices = speechSynthesis.getVoices();
    const persianVoice = voices.find(
      (v) => v.lang.startsWith('fa') || v.name.includes('Persian') || v.name.includes('Farsi')
    );

    if (persianVoice) {
      utterance.voice = persianVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    try {
      speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (speechSynthesis) {
    speechSynthesis.cancel();
  }
}

export function isPlaying(): boolean {
  if (currentAudio && !currentAudio.paused) {
    return true;
  }

  if (speechSynthesis && speechSynthesis.speaking) {
    return true;
  }

  return false;
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
