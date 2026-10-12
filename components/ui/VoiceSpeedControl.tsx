'use client';

import { AUDIO_SPEEDS, playAudio, setAudioSpeed } from '@/lib/audio';
import { homeGreeting } from '@/lib/learner';

function snapSpeed(value: number): number {
  return AUDIO_SPEEDS.reduce((best, rate) =>
    Math.abs(rate - value) < Math.abs(best - value) ? rate : best
  );
}

interface VoiceSpeedControlProps {
  value: number;
  onChange: (rate: number) => void;
}

export default function VoiceSpeedControl({ value, onChange }: VoiceSpeedControlProps) {
  const handleChange = (next: number) => {
    const snapped = snapSpeed(next);
    setAudioSpeed(snapped);
    onChange(snapped);
  };

  return (
    <div
      className="row-card"
      style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--s-4)', padding: 'var(--s-4)' }}
    >
      <span style={{ fontWeight: 700 }}>سرعت صدا</span>
      <div className="speed-slider">
        <span className="speed-end">آهسته</span>
        <input
          type="range"
          min={AUDIO_SPEEDS[0]}
          max={AUDIO_SPEEDS[AUDIO_SPEEDS.length - 1]}
          step={0.1}
          value={value}
          aria-label="سرعت صدا"
          aria-valuemin={AUDIO_SPEEDS[0]}
          aria-valuemax={AUDIO_SPEEDS[AUDIO_SPEEDS.length - 1]}
          aria-valuenow={value}
          aria-valuetext={`${value.toFixed(1)} برابر`}
          onChange={(event) => handleChange(Number(event.target.value))}
        />
        <span className="speed-end">تند</span>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          playAudio(homeGreeting()).catch(() => {});
        }}
      >
        نمونه را بشنوید
      </button>
    </div>
  );
}
