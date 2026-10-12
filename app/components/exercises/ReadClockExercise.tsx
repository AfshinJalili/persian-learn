'use client';

import { Exercise } from '@/lib/types';
import { useEffect, useRef } from 'react';

interface ReadClockExerciseProps {
  exercise: Exercise;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}

export default function ReadClockExercise({ exercise, userAnswer, onAnswerChange, disabled }: ReadClockExerciseProps) {
  const { hour, minute, style } = exercise.payload as { hour: number; minute: number; style: string };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const choices = [exercise.answer, ...exercise.distractors];
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFEF7';
    ctx.fill();
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = '#5C4033';
    ctx.font = 'bold 48px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let h = 1; h <= 12; h++) {
      const angle = (h * 30 - 90) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * (radius - 60);
      const y = centerY + Math.sin(angle) * (radius - 60);
      ctx.fillText(h.toString(), x, y);
    }

    const hourAngle = ((hour % 12 + minute / 60) * 30 - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(hourAngle) * (radius * 0.5),
      centerY + Math.sin(hourAngle) * (radius * 0.5)
    );
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    const minuteAngle = (minute * 6 - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(minuteAngle) * (radius * 0.75),
      centerY + Math.sin(minuteAngle) * (radius * 0.75)
    );
    ctx.strokeStyle = '#D2691E';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#5C4033';
    ctx.fill();

  }, [hour, minute]);

  return (
    <div className="flex flex-col items-center gap-12 p-8">
      <div className="text-8xl text-center mb-8">{exercise.prompt}</div>

      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="rounded-3xl shadow-xl border-8 border-brown-600"
      />

      <div className="grid grid-cols-1 gap-6 w-full max-w-2xl">
        {shuffled.map((choice) => (
          <button
            key={choice}
            onClick={() => onAnswerChange(choice)}
            disabled={disabled}
            className={`bg-white border-4 rounded-3xl p-8 text-5xl font-bold transition-colors shadow-lg ${
              userAnswer === choice
                ? 'bg-orange-100 border-orange-600 scale-105'
                : 'border-brown-600 hover:bg-orange-50 text-brown-900'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
