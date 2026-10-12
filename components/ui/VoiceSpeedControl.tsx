'use client';

import { AUDIO_SPEEDS, playAudio, setAudioSpeed } from '@/lib/audio';
import { homeGreeting } from '@/lib/learner';
import SpeakerIcon from '@/components/ui/SpeakerIcon';
import TurtleIcon from '@/components/ui/TurtleIcon';

function snapSpeed(value: number): number {
  return AUDIO_SPEEDS.reduce((best, rate) =>
    Math.abs(rate - value) < Math.abs(best - value) ? rate : best
  );
}

function RabbitIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="12" cy="9" rx="3.2" ry="8" fill="#E8D0B0" />
      <ellipse cx="20" cy="9" rx="3.2" ry="8" fill="#E8D0B0" />
      <ellipse cx="12" cy="8" rx="1.4" ry="5" fill="#F4C2C2" />
      <ellipse cx="20" cy="8" rx="1.4" ry="5" fill="#F4C2C2" />
      <circle cx="16" cy="20" r="8" fill="#F3D7B3" />
      <circle cx="13.2" cy="18.5" r="1.4" fill="#1B2A22" />
      <circle cx="18.8" cy="18.5" r="1.4" fill="#1B2A22" />
      <path d="M14 23.2q2 1.8 4 0" stroke="#6B4226" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
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
        <span className="speed-end">
          <TurtleIcon size={32} />
          آهسته
        </span>
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
        <span className="speed-end">
          <RabbitIcon />
          تند
        </span>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          playAudio(homeGreeting()).catch(() => {});
        }}
      >
        <SpeakerIcon />
        نمونه را بشنوید
      </button>
    </div>
  );
}
