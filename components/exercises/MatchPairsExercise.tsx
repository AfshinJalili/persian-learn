'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { playOptionAudio } from '@/lib/spoken-option';
import { canonicalizePairs } from '@/lib/answers';
import { shuffleSeeded } from '@/lib/shuffle';
import { exerciseHeading } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import {
  ObjectArt,
  ObjectCluster,
  OBJECT_CLUSTER_GAP,
  OBJECT_CLUSTER_MIN_SIZE,
  looksLikeObjects,
  objectClusterItemSizeForBox,
  objectClusterRows,
  splitObjectTokens,
} from '@/components/art/objects';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

type Side = 'left' | 'right';
type Selection = { side: Side; value: string };

export default function MatchPairsExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: Props) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);
  const selectedRef = useRef<Selection | null>(null);

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
  const appleFullest = Math.max(1, ...appleCounts);
  const appleRows = objectClusterRows(appleFullest, 'row');
  const appleSize = objectClusterItemSizeForBox(
    appleFullest,
    236,
    Math.max(72, appleRows * OBJECT_CLUSTER_MIN_SIZE + Math.max(0, appleRows - 1) * OBJECT_CLUSTER_GAP),
    OBJECT_CLUSTER_GAP,
    'row'
  );

  useEffect(() => {
    selectedRef.current = null;
    setSelected(null);
    setPairs([]);
  }, [exercise.id]);

  useEffect(() => {
    if (userAnswer !== '') return;
    selectedRef.current = null;
    setSelected(null);
    setPairs([]);
  }, [userAnswer]);

  const isLeftUsed = (option: string) => pairs.some(([left]) => left === option);
  const isRightUsed = (option: string) => pairs.some(([, right]) => right === option);
  const pairForRight = (option: string) => pairs.find(([, right]) => right === option);

  const rememberSelection = (next: Selection | null) => {
    selectedRef.current = next;
    setSelected(next);
  };

  const placePair = (left: string, right: string) => {
    if (disabled || isLeftUsed(left) || isRightUsed(right)) return;
    const newPairs: Array<[string, string]> = [...pairs, [left, right]];
    setPairs(newPairs);
    rememberSelection(null);
    if (newPairs.length === answerPairs.length) {
      onAnswerChange(canonicalizePairs(newPairs.map((pair) => pair.join('=')).join('|')));
    }
  };

  const handleSelect = (side: Side, option: string) => {
    if (disabled) return;
    if (side === 'left' && isLeftUsed(option)) return;
    if (side === 'right' && isRightUsed(option)) return;

    playOptionAudio(option, speakPeers).catch(() => {});

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
        <h2>{exerciseHeading(exercise)}</h2>
      </div>
      {objectLayout ? (
        <>
          {rightOptions.map((option) => {
            const placed = pairForRight(option);
            const correct =
              placed && answerPairs.some(([left, right]) => left === placed[0] && right === option);
            const picking = selected?.side === 'right' && selected.value === option;
            return (
              <button
                type="button"
                key={option}
                aria-label={option}
                data-match-slot={option}
                disabled={disabled || Boolean(placed)}
                onClick={() => handleSelect('right', option)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleSlotDrop(option, event)}
                className={`row-card match-object-row ${picking ? 'selected' : ''}`}
                style={{
                  padding: '12px 16px',
                  borderColor: correct ? 'var(--green-500)' : undefined,
                  background: correct ? 'var(--green-050)' : undefined,
                }}
              >
                <div className="match-object-apples">
                  <ObjectCluster token={option} itemSize={appleSize} layout="row" />
                </div>
                {placed ? (
                  <span className={`card match-digit-slot ${correct ? 'correct' : ''}`}>
                    <span className="glyph" style={{ fontSize: 52 }}>
                      {placed[0]}
                    </span>
                  </span>
                ) : (
                  <span
                    className="match-digit-slot"
                    style={{
                      border: '3px dashed #767F7A',
                      background: '#F3F1EA',
                    }}
                  />
                )}
              </button>
            );
          })}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              padding: 12,
              borderRadius: 24,
              background: 'var(--surface-2)',
              minHeight: 116,
              alignItems: 'center',
            }}
          >
            {leftOptions.map((option) =>
              isLeftUsed(option) ? (
                <span
                  key={option}
                  style={{ width: 88, height: 88, borderRadius: 20, border: '3px dashed var(--line)' }}
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
                  className={`card ${selected?.side === 'left' && selected.value === option ? 'selected' : ''}`}
                  style={{ width: 88, height: 88, borderRadius: 20 }}
                >
                  <span className="glyph" style={{ fontSize: 52 }}>
                    {option}
                  </span>
                </button>
              )
            )}
          </div>
        </>
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
