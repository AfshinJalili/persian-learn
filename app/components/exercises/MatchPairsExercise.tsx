import { useState } from 'react';
import { playAudio } from '@/lib/audio';
import type { Exercise } from '@/lib/types';

interface Props {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function MatchPairsExercise({ exercise, userAnswer, onAnswerChange, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);

  const answerPairs = exercise.answer.split('|').map(pair => pair.split('=') as [string, string]);

  const leftOptions = answerPairs.map(([left]) => left);
  const rightOptions = answerPairs.map(([_, right]) => right).sort(() => Math.random() - 0.5);

  const handleLeftClick = async (option: string) => {
    if (disabled) return;
    setSelected(option);
    await playAudio(option);
  };

  const handleRightClick = async (option: string) => {
    if (disabled || !selected) return;

    const newPairs = [...pairs, [selected, option] as [string, string]];
    setPairs(newPairs);
    setSelected(null);

    if (newPairs.length === answerPairs.length) {
      const answerString = newPairs.map(pair => pair.join('=')).join('|');
      onAnswerChange(answerString);
    }

    await playAudio(option);
  };

  const handleRemove = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs);
    onAnswerChange('');
  };

  const isLeftUsed = (option: string) => pairs.some(([left]) => left === option);
  const isRightUsed = (option: string) => pairs.some(([_, right]) => right === option);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => playAudio(exercise.audio_script)}
          className="w-20 h-20 rounded-full bg-[var(--blue-700)] text-white flex items-center justify-center shadow-lg shrink-0"
        >
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
        </button>
        <h2 className="text-3xl font-black text-[var(--ink)]">جفت کردن</h2>
      </div>

      <div className="flex-1">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            {leftOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleLeftClick(option)}
                disabled={disabled || isLeftUsed(option)}
                className={`
                  h-20 rounded-2xl text-4xl font-black transition-all shadow-md w-full
                  ${isLeftUsed(option) ? 'opacity-30' : ''}
                  ${selected === option ? 'bg-[var(--blue-100)] border-4 border-[var(--blue-700)] scale-105' : 'bg-white border-3 border-[var(--line-strong)]'}
                  ${disabled ? 'opacity-50' : 'hover:scale-105'}
                `}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {rightOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleRightClick(option)}
                disabled={disabled || !selected || isRightUsed(option)}
                className={`
                  h-20 rounded-2xl text-4xl font-black transition-all shadow-md w-full
                  ${isRightUsed(option) ? 'opacity-30' : ''}
                  ${!selected ? 'bg-gray-200' : 'bg-white border-3 border-[var(--line-strong)]'}
                  ${disabled ? 'opacity-50' : selected ? 'hover:scale-105' : ''}
                `}
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
                key={index}
                className="flex items-center gap-2 bg-[var(--blue-100)] rounded-2xl p-3"
              >
                <div className="flex-1 text-2xl font-bold text-center">{pair[0]}</div>
                <div className="text-xl">=</div>
                <div className="flex-1 text-2xl font-bold text-center">{pair[1]}</div>
                {!disabled && (
                  <button
                    onClick={() => handleRemove(index)}
                    className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
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
