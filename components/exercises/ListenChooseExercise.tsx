'use client';

import { playAudio } from '@/lib/audio';
import { exerciseChoices } from '@/lib/shuffle';
import { exerciseHeading, exerciseHeadingClass } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';
import { Fragment, useLayoutEffect, useRef } from 'react';
import {
  ObjectCluster,
  looksLikeObjects,
  objectClusterChoiceGridClass,
  useObjectArtAspect,
  splitObjectTokens,
  type ObjectClusterLayout,
} from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';
import { singleChoiceStyle } from '@/components/art/single-art';
import TurtleIcon from '@/components/ui/TurtleIcon';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  answerState?: 'idle' | 'correct' | 'wrong';
}

/**
 * A text answer (a word or short phrase) on a choice card: as large as the
 * card allows, with its longest word on one line. Phrases wrap between
 * words, never inside one, and the card grows to hold every line.
 */
function ChoiceWord({ text, width }: { text: string; width: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = text.split(/\s+/).filter(Boolean);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.removeProperty('font-size');
      const base = parseFloat(getComputedStyle(el).fontSize) || 16;
      const room = (el.parentElement?.clientWidth ?? 0) -
        (parseFloat(getComputedStyle(el.parentElement!).paddingLeft) || 0) -
        (parseFloat(getComputedStyle(el.parentElement!).paddingRight) || 0) - 4;
      const widest = Math.max(
        1,
        ...[...el.querySelectorAll<HTMLElement>(':scope > .choice-word-part')].map((w) => w.getBoundingClientRect().width)
      );
      if (room > 8 && widest > room) el.style.fontSize = `${Math.max(12, Math.floor(base * (room / widest) * 10) / 10)}px`;
    };
    fit();
    let live = true;
    document.fonts?.ready.then(() => live && fit()).catch(() => {});
    return () => {
      live = false;
    };
  }, [text, width]);
  return (
    <span ref={ref} className="glyph choice-word">
      {words.map((word, index) => (
        <Fragment key={index}>
          {index > 0 ? ' ' : null}
          <span className="choice-word-part">{word}</span>
        </Fragment>
      ))}
    </span>
  );
}

function SizedListenChoice({
  option,
  layout,
  selected,
  disabled,
  state,
  dim,
  peers,
  onSelect,
}: {
  option: string;
  layout: ObjectClusterLayout;
  selected: boolean;
  disabled: boolean;
  state: 'idle' | 'correct' | 'wrong';
  dim: boolean;
  peers: string[];
  onSelect: (option: string) => void;
}) {
  const object = looksLikeObjects(option);
  const { ref, box } = useSharedClusterSize<HTMLButtonElement>(
    [object ? splitObjectTokens(option).length : 1],
    { layout }
  );
  const single = object && splitObjectTokens(option).length === 1;
  const aspect = useObjectArtAspect(single ? option : '');
  return (
    <ChoiceButton
      ref={ref}
      selected={selected}
      disabled={disabled}
      state={state}
      dim={dim}
      name={option}
      peers={peers}
      onClick={() => onSelect(option)}
      className="object-choice-card"
      singleArt={single || undefined}
      style={singleChoiceStyle(single, box.offsetWidth, box.chromeY, aspect)}
    >
      {object ? (
        <ObjectCluster
          token={option}
          layout={layout}
          boxWidth={box.width}
          boxHeight={box.height}
          cardWidth={box.offsetWidth}
        />
      ) : [...option.replace(/\p{M}/gu, '')].length <= 1 ? (
        <span className="glyph" style={{ fontSize: 'min(84px, 20cqi)' }}>
          {option}
        </span>
      ) : (
        // A word or phrase («بابا»): text sized to the card, never handed to
        // ObjectArt (which drew it as a box of wrapped letters and clipped it).
        <ChoiceWord text={option} width={box.width} />
      )}
    </ChoiceButton>
  );
}

export default function ListenChooseExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
  answerState = 'idle',
}: Props) {
  const options = exerciseChoices(exercise);
  const payload = exercise.payload as { choice_kind?: string };
  const isLetter = payload.choice_kind === 'letter' || options.every((option) => option.length <= 2);
  const objectCounts = options.map((option) =>
    looksLikeObjects(option) ? splitObjectTokens(option).length : 1
  );
  const clusterLayout = exercise.id.startsWith('a') ? 'picture' : 'grid';

  const handleSelect = (option: string) => {
    if (disabled) return;
    onAnswerChange(option);
  };

  const handleSlow = () => {
    playAudio(exercise.audio_script, true).catch(() => {});
  };

  return (
    <div className="listen-choose">
      <h2 className={exerciseHeadingClass(exercise)}>{exerciseHeading(exercise)}</h2>
      <SpeakerButton text={exercise.audio_script} size="xl" />
      <button type="button" className="slow-btn" onClick={handleSlow}>
        <TurtleIcon size={28} />
        آهسته‌تر
      </button>
      <div
        className={
          looksLikeObjects(options.join(''))
            ? `${objectClusterChoiceGridClass(Math.max(1, ...objectCounts), options.length)} w-full`
            : isLetter || options.length === 3
              ? 'grid3 w-full'
              : 'grid2 w-full'
        }
      >
        {options.map((option) => {
          const selected = userAnswer === option;
          const state =
            disabled && answerState !== 'idle' && selected ? answerState : 'idle';
          return (
            <SizedListenChoice
              key={option}
              option={option}
              layout={clusterLayout}
              selected={selected}
              disabled={disabled}
              state={state}
              dim={disabled && !selected}
              peers={options}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
