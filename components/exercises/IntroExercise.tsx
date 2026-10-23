'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  beginAudioSequence,
  getAudioSpeed,
  playAudio,
  stopAudio,
  vibrate,
} from '@/lib/audio';
import HodaMascot from '@/components/HodaMascot';
import { splitObjectTokens } from '@/components/art/objects';
import IntroPlain from '@/components/exercises/IntroPlain';
import CountCard, {
  CONTINUE_GATE_HINT,
  INTRO_HELPER,
  countWord,
  isCountingIntro,
} from '@/components/exercises/CountCard';
import type { Exercise } from '@/lib/types';

const INTRO_HEADING = 'سلام فریبا جون! با هم بشماریم.';

interface Props {
  exercise: Exercise;
  onContinue: () => void;
  autoplay?: boolean;
}

type CountGroup = {
  count: number;
  token: string;
  label: string;
};

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      resolve();
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function playClipOrFallback(text: string, signal: AbortSignal, fallbackMs: number) {
  const started = Date.now();
  await playAudio(text, false, signal);
  if (signal.aborted) return;
  const remaining = fallbackMs - (Date.now() - started);
  if (remaining > 0) await sleep(remaining, signal);
}

function countGroupsFrom(exercise: Exercise): CountGroup[] {
  const payload = exercise.payload as { display?: string; labels?: unknown };
  const groups = String(payload.display || '')
    .split(/\s{2,}/)
    .filter(Boolean);
  const labels = Array.isArray(payload.labels)
    ? payload.labels.filter((item): item is string => typeof item === 'string')
    : [];

  return groups.map((group, index) => {
    const parts = splitObjectTokens(group.trim());
    const count = parts.length;
    const token = parts[0] ?? group.trim();
    return {
      count,
      token,
      label: labels[index] ?? `${countWord(count)}`.trim(),
    };
  });
}

export default function IntroExercise({ exercise, onContinue, autoplay = true }: Props) {
  const counting = isCountingIntro(exercise);
  const groups = counting ? countGroupsFrom(exercise) : [];
  const sequenceRef = useRef<AbortController | null>(null);
  const invitedRef = useRef(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);
  const [inviteFirst, setInviteFirst] = useState(false);
  const [nudgeIndex, setNudgeIndex] = useState<number | null>(null);
  const [heard, setHeard] = useState<Set<number>>(() => new Set());
  const [continuePulse, setContinuePulse] = useState(false);

  const allHeard = groups.length > 0 && heard.size >= groups.length;

  const stopSequence = () => {
    sequenceRef.current?.abort();
    sequenceRef.current = null;
    setPlayingIndex(null);
    setHighlightIndex(null);
    setPulseIndex(null);
  };

  const markHeard = (cardIndex: number) => {
    setHeard((current) => {
      if (current.has(cardIndex)) return current;
      const next = new Set(current);
      next.add(cardIndex);
      return next;
    });
  };

  const runCountAlong = async (cardIndex: number, signal: AbortSignal) => {
    const card = groups[cardIndex];
    if (!card) return;
    setPlayingIndex(cardIndex);
    setPulseIndex(cardIndex);
    setInviteFirst(false);
    setNudgeIndex(null);
    const speed = getAudioSpeed() || 1;
    const perItem = 600 / speed;
    await playClipOrFallback(countWord(card.count), signal, perItem);
    if (signal.aborted) return;
    markHeard(cardIndex);
    setPulseIndex(null);
    for (let item = 0; item < card.count; item += 1) {
      if (signal.aborted) return;
      setHighlightIndex(item);
      await playClipOrFallback(countWord(item + 1), signal, perItem);
    }
    if (signal.aborted) return;
    setHighlightIndex(null);
    await sleep(250 / speed, signal);
    if (signal.aborted) return;
    setPulseIndex(cardIndex);
    await playClipOrFallback(card.label, signal, 300 / speed);
    if (signal.aborted) return;
    setPulseIndex(null);
    setPlayingIndex(null);
  };

  const playCard = (cardIndex: number) => {
    sequenceRef.current?.abort();
    // Registered with the global player: any other playAudio / stopAudio
    // (Continue's gate hint, a speaker button, step navigation) aborts the
    // whole count-along, including its pending timers and queued clips.
    const controller = beginAudioSequence(exercise.id);
    sequenceRef.current = controller;
    vibrate(10);
    void runCountAlong(cardIndex, controller.signal).finally(() => {
      if (sequenceRef.current === controller) {
        sequenceRef.current = null;
        if (controller.signal.aborted) {
          setPlayingIndex(null);
          setHighlightIndex(null);
          setPulseIndex(null);
        }
      }
    });
  };

  const pulseInviteOnce = async (signal: AbortSignal) => {
    if (invitedRef.current || signal.aborted) return;
    invitedRef.current = true;
    setInviteFirst(true);
    await sleep(900 / (getAudioSpeed() || 1), signal);
    if (!signal.aborted) setInviteFirst(false);
  };

  const playHeader = () => {
    stopSequence();
    const controller = beginAudioSequence(exercise.id);
    sequenceRef.current = controller;
    void (async () => {
      await playAudio(exercise.audio_script, false, controller.signal);
      if (controller.signal.aborted) return;
      await playAudio(INTRO_HELPER, false, controller.signal);
      if (controller.signal.aborted) return;
      await pulseInviteOnce(controller.signal);
    })();
  };

  useEffect(() => {
    if (!counting) return undefined;
    const controller = beginAudioSequence(exercise.id);
    sequenceRef.current = controller;

    const start = async () => {
      if (autoplay) {
        await sleep(300, controller.signal);
        if (controller.signal.aborted) return;
        await playAudio(exercise.audio_script, false, controller.signal);
        if (controller.signal.aborted) return;
        await playAudio(INTRO_HELPER, false, controller.signal);
        if (controller.signal.aborted) return;
      }
      await pulseInviteOnce(controller.signal);
    };

    void start();
    return () => {
      sequenceRef.current?.abort();
      sequenceRef.current = null;
      stopAudio();
    };
    // Mount-only: this intro owns the autoplay sequence for the counting cards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id, autoplay, counting]);

  const nudgeNextUnheard = () => {
    const next = groups.findIndex((_, index) => !heard.has(index));
    if (next < 0) return;
    setNudgeIndex(next);
    window.setTimeout(() => {
      setNudgeIndex((current) => (current === next ? null : current));
    }, 900);
  };

  const handleContinue = () => {
    if (allHeard) {
      onContinue();
      return;
    }
    vibrate(10);
    stopSequence();
    nudgeNextUnheard();
    void playAudio(CONTINUE_GATE_HINT, false);
  };

  useEffect(() => {
    if (!allHeard) return undefined;
    setContinuePulse(true);
    const timer = window.setTimeout(() => setContinuePulse(false), 900);
    return () => window.clearTimeout(timer);
  }, [allHeard]);

  if (!counting) {
    return <IntroPlain exercise={exercise} onContinue={onContinue} />;
  }

  return (
    <div className="cc-intro-screen">
      <div className="cc-intro-body">
        <div className="prompt">
          <button
            type="button"
            className="cc-hoda-speaker"
            aria-label="پخش صدا"
            onClick={playHeader}
          >
            <HodaMascot className="cc-hoda" pose="idle" />
          </button>
          <h2>{INTRO_HEADING}</h2>
        </div>
        <div className="cc-list">
          {groups.map((group, index) => (
            <CountCard
              key={`${group.token}-${group.count}-${index}`}
              count={group.count}
              token={group.token}
              label={group.label}
              staggerIndex={index}
              playing={playingIndex === index}
              highlightIndex={playingIndex === index ? highlightIndex : null}
              pulse={pulseIndex === index}
              invite={(inviteFirst && index === 0) || nudgeIndex === index}
              heard={heard.has(index)}
              onPlay={() => playCard(index)}
            />
          ))}
        </div>
        <p className="muted cc-helper">{INTRO_HELPER}</p>
      </div>
      <div className="cc-intro-bottom">
        <button
          type="button"
          onClick={handleContinue}
          className={`btn ${allHeard ? 'btn-primary' : 'btn-disabled'}${continuePulse ? ' cc-continue-pulse' : ''}`}
          aria-disabled={!allHeard}
          data-cc-continue
        >
          ادامه
          <ArrowLeft strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
