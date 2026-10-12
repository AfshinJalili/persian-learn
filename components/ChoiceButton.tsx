import type { ReactNode } from 'react';

interface ChoiceButtonProps {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export default function ChoiceButton({
  selected,
  disabled,
  onClick,
  children,
  className = '',
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-3xl font-bold transition-all shadow-lg ${
        selected
          ? 'bg-[var(--blue-100)] border-4 border-[var(--blue-700)] scale-105'
          : 'bg-white border-4 border-[var(--line-strong)]'
      } ${disabled ? 'opacity-50' : 'hover:scale-105'} ${className}`}
    >
      {children}
    </button>
  );
}
