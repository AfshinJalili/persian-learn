import type { ReactNode } from 'react';

interface ChoiceButtonProps {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  state?: 'idle' | 'correct' | 'wrong';
  dim?: boolean;
  name?: string;
}

export default function ChoiceButton({
  selected,
  disabled,
  onClick,
  children,
  className = '',
  state = 'idle',
  dim = false,
  name,
}: ChoiceButtonProps) {
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
      type="button"
      onClick={onClick}
      disabled={disabled && state === 'idle'}
      aria-label={name}
      className={`card ${extras}`.trim()}
    >
      {children}
    </button>
  );
}
