'use client';

import { Exercise } from '@/lib/types';
import { useEffect, useRef } from 'react';
import { exerciseChoices } from '@/lib/shuffle';
import { formatPersianNumber } from '@/lib/persian';
import SpeakerButton from '@/components/SpeakerButton';
import ChoiceButton from '@/components/ChoiceButton';

interface ReadClockExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function ReadClockExercise({
  exercise,
  userAnswer,
  onAnswerChange,
  disabled,
}: ReadClockExerciseProps) {
  const { hour, minute, style } = exercise.payload as {
    hour: number;
    minute: number;
    style: string;
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const choices = exerciseChoices(exercise);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 16;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFEF7';
    ctx.fill();
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#5C4033';
    ctx.font = 'bold 22px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let h = 1; h <= 12; h += 1) {
      const angle = ((h * 30 - 90) * Math.PI) / 180;
      const x = centerX + Math.cos(angle) * (radius - 28);
      const y = centerY + Math.sin(angle) * (radius - 28);
      ctx.fillText(formatPersianNumber(h), x, y);
    }

    const hourAngle = ((((hour % 12) + minute / 60) * 30 - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(hourAngle) * (radius * 0.5),
      centerY + Math.sin(hourAngle) * (radius * 0.5)
    );
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    const minuteAngle = ((minute * 6 - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(minuteAngle) * (radius * 0.75),
      centerY + Math.sin(minuteAngle) * (radius * 0.75)
    );
    ctx.strokeStyle = '#D2691E';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#5C4033';
    ctx.fill();
  }, [hour, minute]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 w-full">
        <SpeakerButton text={exercise.audio_script} />
        <div className="text-3xl font-black">{exercise.prompt}</div>
      </div>

      {style === 'digital' ? (
        <div className="bg-white border-8 border-brown-600 rounded-3xl px-8 py-6 text-6xl font-black">
          {formatPersianNumber(hour)}:{minute.toString().padStart(2, '0').replace(/\d/g, (d) =>
            formatPersianNumber(Number(d))
          )}
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="rounded-3xl shadow-xl border-8 border-brown-600 w-full max-w-[280px] h-auto"
        />
      )}

      <div className="grid grid-cols-1 gap-4 w-full">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice}
            selected={userAnswer === choice}
            disabled={disabled}
            onClick={() => onAnswerChange(choice)}
            className="p-6 text-3xl"
          >
            {choice}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
