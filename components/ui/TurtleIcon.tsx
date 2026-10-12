export default function TurtleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <ellipse cx="15" cy="17" rx="10" ry="7.5" fill="#3E9A00" />
      <path d="M9 13.5c2-4 10-4 12 0" fill="#2E7D0F" />
      <circle cx="25.5" cy="16" r="4.2" fill="#5B8C3A" />
      <circle cx="27" cy="14.8" r="1.1" fill="#1B2A22" />
      <path
        d="M7 21.5l-4 3M12 23.5l-1.2 4M19 23.5l1.2 4M24 21.5l4 3"
        stroke="#6B4226"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
