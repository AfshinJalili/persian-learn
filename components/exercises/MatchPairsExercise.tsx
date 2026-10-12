'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { playOptionAudio } from '@/lib/spoken-option';
import { canonicalizePairs } from '@/lib/answers';
import { shuffleSeeded } from '@/lib/shuffle';
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
        disabled={locked || Boolean(placed)}
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
      {placed ? (
        <button
          type="button"
          aria-label={placed[0]}
          data-match-placed={placed[0]}
          disabled={locked}
          onClick={() => onUndo(option)}
          className="card match-digit-slot"
        >
          <span className="glyph">{placed[0]}</span>
        </button>
      ) : (
        <span className="match-digit-slot match-digit-slot-empty" />
      )}
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

  const publishPairs = (next: Array<[string, string]>) => {
    const wasComplete = pairs.length === answerPairs.length;
    setPairs(next);
    rememberSelection(null);
    if (next.length === answerPairs.length) {
      onAnswerChange(canonicalizePairs(next.map((pair) => pair.join('=')).join('|')));
      return;
    }
    if (wasComplete || userAnswer !== '') {
      onAnswerChange('');
    }
  };

  const placePair = (left: string, right: string) => {
    if (disabled || isLeftUsed(left) || isRightUsed(right)) return;
    publishPairs([...pairs, [left, right]]);
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
    if (side === 'left' && isLeftUsed(option)) {
      undoByLeft(option);
      return;
    }
    if (side === 'right' && isRightUsed(option)) {
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
    if (disabled || isRightUsed(option)) return;
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
            {leftOptions.map((option) => (
              <button
                type="button"
                key={`left-${option}`}
                aria-label={option}
                onClick={() => handleSelect('left', option)}
                draggable={!disabled && !isLeftUsed(option)}
                onDragStart={(event) => handleDigitDragStart(option, event)}
                disabled={disabled}
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
                disabled={disabled}
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
