'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { playOptionAudio } from '@/lib/spoken-option';
import { canonicalizePairs } from '@/lib/answers';
import { shuffleSeeded } from '@/lib/shuffle';
import { exerciseHeading, exerciseHeadingClass } from '@/lib/exercise-copy';
import { maybePlayMatchUndoHint } from '@/lib/match-undo-hint';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import { PlacedItem, PlacedUndoBadge } from '@/components/PlacedUndoBadge';
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
  picking,
  locked,
  box,
  onSelect,
  onUndo,
  onSlotDrop,
}: {
  option: string;
  placed: [string, string] | undefined;
  picking: boolean;
  locked: boolean;
  box: { width: number; height: number; offsetWidth: number };
  onSelect: (side: Side, option: string) => void;
  onUndo: (right: string) => void;
  onSlotDrop: (option: string, event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <div
      className={`row-card match-object-row ${picking ? 'selected' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onSlotDrop(option, event)}
    >
      <button
        type="button"
        aria-label={option}
        data-match-slot={option}
        disabled={locked}
        onClick={() => onSelect('right', option)}
        className="match-object-apples"
      >
        <ObjectCluster
          token={option}
          layout="row"
          boxWidth={box.width}
          boxHeight={box.height}
          cardWidth={box.offsetWidth}
        />
      </button>
      <PlacedItem>
        {placed ? (
          <>
            <button
              type="button"
              aria-label={placed[0]}
              data-match-placed={placed[0]}
              disabled={locked}
              onClick={() => onSelect('left', placed[0])}
              className="card match-digit-slot match-digit-slot-placed"
            >
              <span className="glyph">{placed[0]}</span>
            </button>
            <PlacedUndoBadge
              value={placed[0]}
              locked={locked}
              onUndo={() => onUndo(option)}
            />
          </>
        ) : (
          <span className="match-digit-slot match-digit-slot-empty" />
        )}
      </PlacedItem>
    </div>
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
  const selectedRef = useRef<Selection | null>(null);
  const wasDisabled = useRef(disabled);

  const answerPairs = useMemo(
    () => exercise.answer.split('|').map((pair) => pair.split('=') as [string, string]),
    [exercise.answer]
  );

  const leftOptions = useMemo(() => answerPairs.map(([left]) => left), [answerPairs]);
  const rightOptions = useMemo(
    () => shuffleSeeded(
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

  const resetPlacement = () => {
    selectedRef.current = null;
    setSelected(null);
    setPairs([]);
  };

  useEffect(() => {
    resetPlacement();
  }, [exercise.id]);

  useEffect(() => {
    if (wasDisabled.current && !disabled && userAnswer === '') {
      resetPlacement();
    }
    wasDisabled.current = disabled;
  }, [disabled, userAnswer]);

  const isLeftUsed = (option: string) => pairs.some(([left]) => left === option);
  const isRightUsed = (option: string) => pairs.some(([, right]) => right === option);
  const pairForRight = (option: string) => pairs.find(([, right]) => right === option);

  const rememberSelection = (next: Selection | null) => {
    selectedRef.current = next;
    setSelected(next);
  };

  const publishPairs = (next: Array<[string, string]>, keep?: Selection | null) => {
    const wasComplete = pairs.length === answerPairs.length;
    setPairs(next);
    rememberSelection(next.length === answerPairs.length ? null : (keep ?? null));
    if (next.length === answerPairs.length) {
      onAnswerChange(canonicalizePairs(next.map((pair) => pair.join('=')).join('|')));
      return;
    }
    if (wasComplete || userAnswer !== '') {
      onAnswerChange('');
    }
  };

  const placePair = (left: string, right: string) => {
    if (disabled) return;
    const occupant = pairForRight(right);
    if (occupant?.[0] === left) {
      rememberSelection({ side: 'left', value: left });
      return;
    }
    const next = pairs.filter(([value, slot]) => value !== left && slot !== right);
    next.push([left, right]);
    maybePlayMatchUndoHint();
    publishPairs(next);
  };

  const undoByRight = (right: string) => {
    if (disabled) return;
    publishPairs(pairs.filter(([, value]) => value !== right));
  };

  const undoByLeft = (left: string) => {
    if (disabled) return;
    publishPairs(pairs.filter(([value]) => value !== left));
  };

  const handleSelect = (side: Side, option: string) => {
    if (disabled) return;
    if (side === 'left' && isLeftUsed(option) && !objectLayout) {
      undoByLeft(option);
      return;
    }
    if (side === 'right' && isRightUsed(option)) {
      const current = selectedRef.current;
      if (objectLayout && current?.side === 'left') {
        placePair(current.value, option);
        return;
      }
      if (objectLayout) {
        const placed = pairForRight(option);
        if (placed) rememberSelection({ side: 'left', value: placed[0] });
        return;
      }
      undoByRight(option);
      return;
    }

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

  const handleSlotDrop = (option: string, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (disabled) return;
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
              const picking = selected?.side === 'right' && selected.value === option;
              return (
                <MatchObjectRow
                  key={option}
                  option={option}
                  placed={placed}
                  picking={picking}
                  locked={disabled}
                  box={applesBox}
                  onSelect={handleSelect}
                  onUndo={undoByRight}
                  onSlotDrop={handleSlotDrop}
                />
              );
            })}
          </div>
          <div className="match-digit-tray" data-match-tray>
            {leftOptions.map((option) =>
              isLeftUsed(option) ? (
                <span
                  key={option}
                  className="match-digit-chip match-digit-chip-used"
                  data-match-digit-slot={option}
                />
              ) : (
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
              )
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div data-match-column="left" className="space-y-3">
            {leftOptions.map((option) => {
              const used = isLeftUsed(option);
              const card = (
                <button
                  type="button"
                  aria-label={option}
                  data-match-placed={used ? option : undefined}
                  onClick={() => handleSelect('left', option)}
                  draggable={!disabled && !used}
                  onDragStart={(event) => handleDigitDragStart(option, event)}
                  disabled={disabled}
                  className={`card h-20 w-full ${used ? 'dim' : ''} ${selected?.side === 'left' && selected.value === option ? 'selected' : ''}`}
                >
                  {looksLikeObjects(option) ? (
                    <ObjectArt token={option} size={48} />
                  ) : (
                    <span className="glyph text-[36px] font-extrabold">{option}</span>
                  )}
                </button>
              );
              if (!used) return <span key={`left-${option}`}>{card}</span>;
              return (
                <PlacedItem key={`left-${option}`} className="match-pair-placed">
                  {card}
                  <PlacedUndoBadge
                    value={option}
                    locked={disabled}
                    onUndo={() => undoByLeft(option)}
                  />
                </PlacedItem>
              );
            })}
          </div>
          <div data-match-column="right" className="space-y-3">
            {rightOptions.map((option) => {
              const used = isRightUsed(option);
              const card = (
                <button
                  type="button"
                  aria-label={option}
                  onClick={() => handleSelect('right', option)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleSlotDrop(option, event)}
                  disabled={disabled}
                  className={`card h-20 w-full ${used ? 'dim' : ''} ${selected?.side === 'right' && selected.value === option ? 'selected' : ''}`}
                >
                  {looksLikeObjects(option) ? (
                    <ObjectArt token={option} size={48} />
                  ) : (
                    <span className="glyph text-[36px] font-extrabold">{option}</span>
                  )}
                </button>
              );
              if (!used) return <span key={`right-${option}`}>{card}</span>;
              return (
                <PlacedItem key={`right-${option}`} className="match-pair-placed">
                  {card}
                  <PlacedUndoBadge
                    value={option}
                    locked={disabled}
                    onUndo={() => undoByRight(option)}
                  />
                </PlacedItem>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
