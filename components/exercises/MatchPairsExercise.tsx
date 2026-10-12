'use client';

import { useEffect, useMemo, useState } from 'react';
import { playAudio } from '@/lib/audio';
import { shuffleSeeded } from '@/lib/shuffle';
import type { Exercise } from '@/lib/types';
import SpeakerButton from '@/components/SpeakerButton';

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

  const handleRemove = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs);
    onAnswerChange('');
  };

  const isLeftUsed = (option: string) => pairs.some(([left]) => left === option);
  const isRightUsed = (option: string) => pairs.some(([, right]) => right === option);

  void userAnswer;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <SpeakerButton text={exercise.audio_script} />
        <h2 className="text-3xl font-black text-[var(--ink)]">جفت کردن</h2>
      </div>

      <div className="flex-1">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            {leftOptions.map((option) => (
              <button
                type="button"
                key={`left-${option}`}
                onClick={() => handleLeftClick(option)}
                disabled={disabled || isLeftUsed(option)}
                className={`h-20 rounded-2xl text-4xl font-black shadow-md w-full ${
                  isLeftUsed(option) ? 'opacity-30' : ''
                } ${
                  selected === option
                    ? 'bg-[var(--blue-100)] border-4 border-[var(--blue-700)]'
                    : 'bg-white border-4 border-[var(--line-strong)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {rightOptions.map((option) => (
              <button
                type="button"
                key={`right-${option}`}
                onClick={() => handleRightClick(option)}
                disabled={disabled || !selected || isRightUsed(option)}
                className={`h-20 rounded-2xl text-4xl font-black shadow-md w-full ${
                  isRightUsed(option) ? 'opacity-30' : ''
                } ${!selected ? 'bg-gray-200' : 'bg-white border-4 border-[var(--line-strong)]'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {pairs.length > 0 && (
          <div className="space-y-2">
            {pairs.map((pair, index) => (
              <div
                key={`${pair[0]}-${pair[1]}-${index}`}
                className="flex items-center gap-2 bg-[var(--blue-100)] rounded-2xl p-3"
              >
                <div className="flex-1 text-2xl font-bold text-center">{pair[0]}</div>
                <div className="text-xl">=</div>
                <div className="flex-1 text-2xl font-bold text-center">{pair[1]}</div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="w-12 h-12 rounded-full bg-[var(--clay-800)] text-white flex items-center justify-center"
                    aria-label="حذف جفت"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
