'use client';

import { useEffect, useMemo, useState } from 'react';
import { playAudio } from '@/lib/audio';
import { shuffleSeeded } from '@/lib/shuffle';
import { exerciseHeading } from '@/lib/exercise-copy';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';
import { ObjectArt, looksLikeObjects } from '@/components/art/objects';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function MatchPairsExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);

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

  const objectLayout =
    rightOptions.every(looksLikeObjects) &&
    leftOptions.every((item) => /^[0-9۰-۹]+$/.test(item));

  useEffect(() => {
    setSelected(null);
    setPairs([]);
  }, [exercise.id]);

  const handleLeftClick = async (option: string) => {
    if (disabled) return;
    setSelected(option);
    await playAudio(option);
  };

  const handleRightClick = async (option: string) => {
    if (disabled || !selected) return;

    const newPairs: Array<[string, string]> = [...pairs, [selected, option]];
    setPairs(newPairs);
    setSelected(null);

    if (newPairs.length === answerPairs.length) {
      onAnswerChange(newPairs.map((pair) => pair.join('=')).join('|'));
    }

    await playAudio(option);
  };

  const isLeftUsed = (option: string) => pairs.some(([left]) => left === option);
  const isRightUsed = (option: string) => pairs.some(([, right]) => right === option);
  const pairForRight = (option: string) => pairs.find(([, right]) => right === option);

  void userAnswer;

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
            return (
              <button
                type="button"
                key={option}
                aria-label={option}
                disabled={disabled || !selected || Boolean(placed)}
                onClick={() => handleRightClick(option)}
                className="row-card"
                style={{
                  padding: '12px 16px',
                  borderColor: correct ? 'var(--green-500)' : undefined,
                  background: correct ? 'var(--green-050)' : undefined,
                }}
              >
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  <ObjectArt token={option} size={52} />
                </div>
                {placed ? (
                  <span className={`card ${correct ? 'correct' : ''}`} style={{ width: 84, height: 84, flex: 'none', borderRadius: 20 }}>
                    <span className="glyph" style={{ fontSize: 52 }}>
                      {placed[0]}
                    </span>
                  </span>
                ) : (
                  <span
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 20,
                      border: '3px dashed #767F7A',
                      background: '#F3F1EA',
                      flex: 'none',
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
                  onClick={() => handleLeftClick(option)}
                  className={`card ${selected === option ? 'selected' : ''}`}
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
                onClick={() => handleLeftClick(option)}
                disabled={disabled || isLeftUsed(option)}
                className={`card h-20 w-full ${isLeftUsed(option) ? 'dim' : ''} ${selected === option ? 'selected' : ''}`}
              >
                <span className="text-4xl font-extrabold">{option}</span>
              </button>
            ))}
          </div>
          <div data-match-column="right" className="space-y-3">
            {rightOptions.map((option) => (
              <button
                type="button"
                key={`right-${option}`}
                onClick={() => handleRightClick(option)}
                disabled={disabled || !selected || isRightUsed(option)}
                className={`card h-20 w-full ${isRightUsed(option) ? 'dim' : ''}`}
              >
                <ObjectArt token={option} size={48} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
