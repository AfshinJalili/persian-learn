'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { vibrate } from '@/lib/audio';
import { playOptionAudio } from '@/lib/spoken-option';
import { canonicalizePairs } from '@/lib/answers';
import { shuffleDeranged } from '@/lib/shuffle';
import { exerciseHeading, exerciseHeadingClass } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import {
  ObjectArt,
  ObjectCluster,
  OBJECT_MATCH_LIST_FALLBACK,
  looksLikeObjects,
  matchApplesBoxFromList,
  splitObjectTokens,
} from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

type Side = 'left' | 'right';
type Selection = { side: Side; value: string };

function MatchObjectRow({
  option,
  placed,
  correct,
  rejecting,
  picking,
  disabled,
  box,
  onSelect,
  onSlotDrop,
}: {
  option: string;
  placed: [string, string] | undefined;
  correct: boolean;
  rejecting: boolean;
  picking: boolean;
  disabled: boolean;
  box: { width: number; height: number; offsetWidth: number };
  onSelect: (side: Side, option: string) => void;
  onSlotDrop: (option: string, event: DragEvent<HTMLButtonElement>) => void;
}) {
  const slotClass = [
    'match-digit-slot',
    placed && !rejecting ? 'card' : '',
    correct ? 'correct' : '',
    rejecting ? 'match-digit-slot-reject' : '',
    !placed ? 'match-digit-slot-empty' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      aria-label={option}
      data-match-slot={option}
      data-match-locked={correct ? 'true' : undefined}
      disabled={disabled || Boolean(placed)}
      onClick={() => onSelect('right', option)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onSlotDrop(option, event)}
      className={`row-card match-object-row ${picking ? 'selected' : ''} ${correct ? 'match-object-row-correct' : ''}`}
    >
      <div className="match-object-apples">
        <ObjectCluster
          token={option}
          layout="row"
          boxWidth={box.width}
          boxHeight={box.height}
          cardWidth={box.offsetWidth}
        />
      </div>
      <span className={slotClass}>
        {placed ? <span className="glyph">{placed[0]}</span> : null}
      </span>
    </button>
  );
}

export default function MatchPairsExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: Props) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);
  const [rejecting, setRejecting] = useState<[string, string] | null>(null);
  const selectedRef = useRef<Selection | null>(null);
  const bounceTimerRef = useRef<number | null>(null);

  const answerPairs = useMemo(
    () => exercise.answer.split('|').map((pair) => pair.split('=') as [string, string]),
    [exercise.answer]
  );

  const leftInAnswerOrder = useMemo(
    () => answerPairs.map(([left]) => left),
    [answerPairs]
  );
  const leftOptions = useMemo(
    () => shuffleDeranged(leftInAnswerOrder, `${exercise.id}-left`),
    [leftInAnswerOrder, exercise.id]
  );
  const rightOptions = useMemo(
    () => shuffleDeranged(
      answerPairs.map(([, right]) => right),
      `${exercise.id}-right`
    ),
    [answerPairs, exercise.id]
  );

  const speakPeers = useMemo(
    () => [...leftOptions, ...rightOptions],
    [leftOptions, rightOptions]
  );

  const objectLayout =
    rightOptions.every(looksLikeObjects) &&
    leftOptions.every((item) => /^[0-9۰-۹]+$/.test(item));
  const appleCounts = rightOptions.map((option) => splitObjectTokens(option).length);
  const { ref, box } = useSharedClusterSize(appleCounts, {
    fallback: OBJECT_MATCH_LIST_FALLBACK,
    layout: 'row',
  });
  const applesBox = matchApplesBoxFromList(box, rightOptions.length);

  const clearBounce = () => {
    if (bounceTimerRef.current != null) {
      window.clearTimeout(bounceTimerRef.current);
      bounceTimerRef.current = null;
    }
    setRejecting(null);
  };

  useEffect(() => {
    selectedRef.current = null;
    setSelected(null);
    setPairs([]);
    clearBounce();
  }, [exercise.id]);

  useEffect(() => {
    if (userAnswer !== '') return;
    selectedRef.current = null;
    setSelected(null);
    setPairs([]);
    clearBounce();
  }, [userAnswer]);

  useEffect(() => {
    return () => {
      if (bounceTimerRef.current != null) window.clearTimeout(bounceTimerRef.current);
    };
  }, []);

  const isCorrectPair = (left: string, right: string) =>
    answerPairs.some(([answerLeft, answerRight]) => answerLeft === left && answerRight === right);

  const isLeftUsed = (option: string) =>
    pairs.some(([left]) => left === option) || rejecting?.[0] === option;
  const isRightUsed = (option: string) =>
    pairs.some(([, right]) => right === option) || rejecting?.[1] === option;
  const pairForRight = (option: string): [string, string] | undefined =>
    pairs.find(([, right]) => right === option) ??
    (rejecting?.[1] === option ? rejecting : undefined);

  const rememberSelection = (next: Selection | null) => {
    selectedRef.current = next;
    setSelected(next);
  };

  const placePair = (left: string, right: string) => {
    if (disabled || isLeftUsed(left) || isRightUsed(right)) return;
    rememberSelection(null);
    if (!isCorrectPair(left, right)) {
      setRejecting([left, right]);
      vibrate([25, 40, 25]);
      if (bounceTimerRef.current != null) window.clearTimeout(bounceTimerRef.current);
      bounceTimerRef.current = window.setTimeout(() => {
        setRejecting((current) =>
          current && current[0] === left && current[1] === right ? null : current
        );
        bounceTimerRef.current = null;
      }, 420);
      return;
    }
    const newPairs: Array<[string, string]> = [...pairs, [left, right]];
    setPairs(newPairs);
    vibrate([40, 30, 40]);
    if (newPairs.length === answerPairs.length) {
      onAnswerChange(canonicalizePairs(newPairs.map((pair) => pair.join('=')).join('|')));
    }
  };

  const handleSelect = (side: Side, option: string) => {
    if (disabled) return;
    if (side === 'left' && isLeftUsed(option)) return;
    if (side === 'right' && isRightUsed(option)) return;

    if (side === 'left') {
      playOptionAudio(option, speakPeers).catch(() => {});
    }

    const current = selectedRef.current;
    if (!current || current.side === side) {
      rememberSelection({ side, value: option });
      return;
    }

    const left = side === 'left' ? option : current.value;
    const right = side === 'right' ? option : current.value;
    placePair(left, right);
  };

  const handleDigitDragStart = (option: string, event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('text/plain', option);
    event.dataTransfer.effectAllowed = 'copyMove';
    rememberSelection({ side: 'left', value: option });
  };

  const handleSlotDrop = (option: string, event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const digit = event.dataTransfer.getData('text/plain') || (
      selectedRef.current?.side === 'left' ? selectedRef.current.value : ''
    );
    if (!digit) return;
    playOptionAudio(digit, speakPeers).catch(() => {});
    placePair(digit, option);
  };

  return (
    <>
      <div className="prompt">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className={exerciseHeadingClass(exercise)}>{exerciseHeading(exercise)}</h2>
      </div>
      {objectLayout ? (
        <div className="match-pairs-board">
          <div ref={ref} className="match-object-list">
            {rightOptions.map((option) => {
              const placed = pairForRight(option);
              const locked = Boolean(
                placed && pairs.some(([left, right]) => left === placed[0] && right === option)
              );
              const correct = Boolean(locked && placed && isCorrectPair(placed[0], option));
              const picking = selected?.side === 'right' && selected.value === option;
              return (
                <MatchObjectRow
                  key={option}
                  option={option}
                  placed={placed}
                  correct={correct}
                  rejecting={rejecting?.[1] === option}
                  picking={picking}
                  disabled={disabled}
                  box={applesBox}
                  onSelect={handleSelect}
                  onSlotDrop={handleSlotDrop}
                />
              );
            })}
          </div>
          <div className="match-digit-tray" data-match-tray>
            {leftOptions
              .filter((option) => !isLeftUsed(option))
              .map((option) => (
                <button
                  type="button"
                  key={option}
                  aria-label={option}
                  data-match-digit={option}
                  draggable={!disabled}
                  onClick={() => handleSelect('left', option)}
                  onDragStart={(event) => handleDigitDragStart(option, event)}
                  className={`card match-digit-chip ${selected?.side === 'left' && selected.value === option ? 'selected' : ''}`}
                >
                  <span className="glyph">{option}</span>
                </button>
              ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div data-match-column="left" className="space-y-3">
            {leftOptions.map((option) => (
              <button
                type="button"
                key={`left-${option}`}
                aria-label={option}
                onClick={() => handleSelect('left', option)}
                draggable={!disabled && !isLeftUsed(option)}
                onDragStart={(event) => handleDigitDragStart(option, event)}
                disabled={disabled || isLeftUsed(option)}
                className={`card h-20 w-full ${isLeftUsed(option) ? 'dim' : ''} ${selected?.side === 'left' && selected.value === option ? 'selected' : ''}`}
              >
                {looksLikeObjects(option) ? (
                  <ObjectArt token={option} size={48} />
                ) : (
                  <span className="text-4xl font-extrabold">{option}</span>
                )}
              </button>
            ))}
          </div>
          <div data-match-column="right" className="space-y-3">
            {rightOptions.map((option) => (
              <button
                type="button"
                key={`right-${option}`}
                aria-label={option}
                onClick={() => handleSelect('right', option)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleSlotDrop(option, event)}
                disabled={disabled || isRightUsed(option)}
                className={`card h-20 w-full ${isRightUsed(option) ? 'dim' : ''} ${selected?.side === 'right' && selected.value === option ? 'selected' : ''}`}
              >
                {looksLikeObjects(option) ? (
                  <ObjectArt token={option} size={48} />
                ) : (
                  <span className="text-4xl font-extrabold">{option}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
