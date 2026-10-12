import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VoiceSpeedControl from '../components/ui/VoiceSpeedControl';
import { setAudioSpeed } from '../lib/audio';

class CaptureAudio {
  playbackRate = 1;
  preservesPitch = false;
  mozPreservesPitch = false;
  webkitPreservesPitch = false;
  paused = true;
  currentTime = 0;
  src: string;
  static created: CaptureAudio[] = [];
  private playing: (() => void) | null = null;

  constructor(src: string) {
    this.src = src;
    CaptureAudio.created.push(this);
  }

  addEventListener(type: string, cb: () => void) {
    if (type === 'playing') this.playing = cb;
  }

  play() {
    this.playbackRate = 1;
    this.paused = false;
    this.playing?.();
    return Promise.resolve();
  }

  pause() {}
}

describe('voice speed slider', () => {
  it('changes the audio element playbackRate', async () => {
    CaptureAudio.created = [];
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      writable: true,
      value: CaptureAudio,
    });
    setAudioSpeed(1);

    render(<VoiceSpeedControl value={1} onChange={() => {}} />);
    fireEvent.change(screen.getByRole('slider', { name: 'سرعت صدا' }), {
      target: { value: '1.2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'نمونه را بشنوید' }));

    await waitFor(() => {
      expect(CaptureAudio.created.length).toBeGreaterThan(0);
      expect(CaptureAudio.created.at(-1)?.playbackRate).toBe(1.2);
    });
  });
});
