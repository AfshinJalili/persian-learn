import Hoopoe from '@/components/art/Hoopoe';

interface HodaMascotProps {
  className?: string;
  pose?: 'idle' | 'cheer';
}

export default function HodaMascot({ className = 'w-48 h-48', pose = 'idle' }: HodaMascotProps) {
  return <Hoopoe className={className} pose={pose} />;
}
