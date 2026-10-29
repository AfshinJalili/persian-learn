'use client';

import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { playOptionAudio } from '@/lib/spoken-option';

interface ChoiceButtonProps {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  state?: 'idle' | 'correct' | 'wrong';
  dim?: boolean;
  name?: string;
  peers?: string[];
  style?: CSSProperties;
  singleArt?: boolean;
}

const ChoiceButton = forwardRef<HTMLButtonElement, ChoiceButtonProps>(
  function ChoiceButton(
    {
      selected,
      disabled,
      onClick,
      children,
      className = '',
      state = 'idle',
      dim = false,
      name,
      peers,
      style,
      singleArt,
    },
    ref
  ) {
    const extras = [
      selected ? 'selected' : '',
      state === 'correct' ? 'correct' : '',
      state === 'wrong' ? 'wrong' : '',
      dim ? 'dim' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => {
          if (name) {
            playOptionAudio(name, peers).catch(() => {});
          }
          onClick();
        }}
        disabled={disabled && state === 'idle'}
        aria-label={name}
        style={style}
        data-single-art={singleArt || undefined}
        className={`card ${extras}`.trim()}
      >
        {children}
      </button>
    );
  }
);

export default ChoiceButton;
