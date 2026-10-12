'use client';

import { Exercise } from '@/lib/types';
import { useEffect, useState } from 'react';
import { shuffleSeeded } from '@/lib/shuffle';
import { playOptionAudio } from '@/lib/spoken-option';
import { maybePlayMatchUndoHint } from '@/lib/match-undo-hint';
import SpeakerButton from '@/components/SpeakerButton';
import { PlacedItem, PlacedUndoBadge } from '@/components/PlacedUndoBadge';

interface BuildWordExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function BuildWordExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: BuildWordExerciseProps) {
  const { picture, letters } = exercise.payload as { picture: string; letters: string[] };
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const tiles = shuffleSeeded(letters || [], `${exercise.id}-letters`);

  useEffect(() => {
    setSelectedLetters([]);
    onAnswerChange('');
  }, [exercise.id, onAnswerChange]);

  const handleLetterClick = (letter: string) => {
    if (disabled) return;
    const newSelected = [...selectedLetters, letter];
    setSelectedLetters(newSelected);
    onAnswerChange(newSelected.join(''));
    maybePlayMatchUndoHint();
    playOptionAudio(letter, tiles).catch(() => {});
  };

  const handlePlacedClick = (index: number) => {
    if (disabled) return;
    const next = selectedLetters.filter((_, letterIndex) => letterIndex !== index);
    setSelectedLetters(next);
    onAnswerChange(next.join(''));
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedLetters([]);
    onAnswerChange('');
  };

  void userAnswer;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">{exercise.prompt}</div>
      </div>

      <div className="text-8xl">{picture}</div>

      <div className="bg-white border-8 border-brown-600 rounded-3xl p-6 min-h-[120px] w-full flex items-center justify-center gap-2 flex-wrap">
        {selectedLetters.length === 0 ? (
          <div className="text-2xl text-brown-400">حروف را انتخاب کنید</div>
        ) : (
          selectedLetters.map((letter, index) => (
            <PlacedItem key={`${letter}-${index}`} className="build-placed-wrap">
              <button
                type="button"
                aria-label={letter}
                data-build-placed={letter}
                disabled={disabled}
                onClick={() => handlePlacedClick(index)}
                className="bg-[var(--blue-100)] border-4 border-[var(--blue-700)] rounded-2xl w-16 h-20 min-h-[48px] flex items-center justify-center match-digit-slot-placed"
              >
                <span className="glyph text-5xl font-bold text-brown-900 leading-none">{letter}</span>
              </button>
              <PlacedUndoBadge
                value={letter}
                locked={disabled}
                onUndo={() => handlePlacedClick(index)}
                marker="build"
              />
            </PlacedItem>
          ))
        )}
      </div>

      <div className="flex gap-3 flex-wrap justify-center w-full">
        {tiles.map((letter, index) => (
          <button
            type="button"
            key={`${letter}-${index}`}
            onClick={() => handleLetterClick(letter)}
            disabled={disabled}
            className="bg-white border-4 border-brown-600 rounded-3xl w-16 h-20 flex items-center justify-center shadow-lg"
          >
            <span className="text-5xl font-bold text-brown-900 leading-none">{letter}</span>
          </button>
        ))}
      </div>

      {selectedLetters.length > 0 && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="bg-[var(--clay-100)] border-4 border-[var(--clay-400)] rounded-full px-10 py-3 text-2xl font-bold text-[var(--clay-800)]"
        >
          پاک کردن
        </button>
      )}
    </div>
  );
}
