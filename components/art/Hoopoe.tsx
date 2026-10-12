interface HoopoeProps {
  className?: string;
  pose?: 'idle' | 'cheer';
}

const IDLE = (
  <>
    <path d="M158 118l38-16-4 30z" fill="#2B2B2B" />
    <path d="M170 113l4 14M182 108l4 18" stroke="#FFF4E6" strokeWidth="4" />
    <path d="M106 162l-6 22M128 162l4 22" stroke="#8A5A3C" strokeWidth="6" strokeLinecap="round" />
    <path d="M92 184h14M126 184h14" stroke="#8A5A3C" strokeWidth="5" strokeLinecap="round" />
    <g transform="rotate(-58 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(-34 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(-10 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(14 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(38 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <ellipse cx="118" cy="128" rx="52" ry="40" fill="#E9A15E" />
    <ellipse cx="100" cy="140" rx="32" ry="24" fill="#F7D9B0" />
    <ellipse cx="132" cy="124" rx="34" ry="20" fill="#2B2B2B" />
    <path d="M118 108v32M132 105v38M146 108v32" stroke="#FFF4E6" strokeWidth="5" />
    <circle cx="74" cy="84" r="31" fill="#E9A15E" />
    <path d="M47 88q-24 6-42 22q22-8 43-12z" fill="#3B2A20" />
    <circle cx="66" cy="79" r="10" fill="#fff" />
    <circle cx="63.5" cy="80" r="6" fill="#1B2A22" />
    <circle cx="61.5" cy="77.5" r="2.2" fill="#fff" />
    <circle cx="84" cy="96" r="7" fill="#F28B6B" opacity=".55" />
    <path d="M60 100q6 5 13 2" stroke="#3B2A20" strokeWidth="3" fill="none" strokeLinecap="round" />
  </>
);

const CHEER = (
  <>
    <path d="M158 118l38-16-4 30z" fill="#2B2B2B" />
    <path d="M170 113l4 14M182 108l4 18" stroke="#FFF4E6" strokeWidth="4" />
    <path d="M106 162l-6 22M128 162l4 22" stroke="#8A5A3C" strokeWidth="6" strokeLinecap="round" />
    <path d="M92 184h14M126 184h14" stroke="#8A5A3C" strokeWidth="5" strokeLinecap="round" />
    <g transform="rotate(-66 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(-40 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(-14 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(12 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(38 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <g transform="rotate(62 80 70)">
      <rect x="72" y="2" width="16" height="70" rx="8" fill="#E9A15E" />
      <rect x="72" y="2" width="16" height="16" rx="8" fill="#2B2B2B" />
      <rect x="72" y="15" width="16" height="6" fill="#FFF4E6" />
    </g>
    <ellipse cx="118" cy="128" rx="52" ry="40" fill="#E9A15E" />
    <ellipse cx="100" cy="140" rx="32" ry="24" fill="#F7D9B0" />
    <g transform="rotate(-40 128 118)">
      <ellipse cx="140" cy="112" rx="36" ry="17" fill="#2B2B2B" />
      <path d="M122 98v28M136 96v32M150 98v28" stroke="#FFF4E6" strokeWidth="5" />
    </g>
    <circle cx="74" cy="84" r="31" fill="#E9A15E" />
    <path d="M47 88q-24 6-42 22q22-8 43-12z" fill="#3B2A20" />
    <circle cx="66" cy="79" r="10" fill="#fff" />
    <circle cx="63.5" cy="80" r="6" fill="#1B2A22" />
    <circle cx="61.5" cy="77.5" r="2.2" fill="#fff" />
    <path d="M58 70q8-6 16 0" stroke="#1B2A22" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="84" cy="96" r="7" fill="#F28B6B" opacity=".55" />
    <path d="M60 100q6 5 13 2" stroke="#3B2A20" strokeWidth="3" fill="none" strokeLinecap="round" />
  </>
);

export default function Hoopoe({ className = 'w-48 h-48', pose = 'idle' }: HoopoeProps) {
  return (
    <svg viewBox="0 0 200 200" width="200" height="200" aria-label="هُدی" className={className} role="img">
      {pose === 'cheer' ? CHEER : IDLE}
    </svg>
  );
}
