'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, Home, User } from 'lucide-react';

interface BottomNavProps {
  active: 'home' | 'streak' | 'profile';
}

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();

  return (
    <nav className="nav">
      <button
        type="button"
        className={active === 'home' ? 'active' : ''}
        onClick={() => router.push('/home')}
      >
        <Home strokeWidth={2.6} />
        <span>خانه</span>
      </button>
      <button
        type="button"
        className={active === 'streak' ? 'active' : ''}
        onClick={() => router.push('/streak')}
      >
        <BarChart3 strokeWidth={2.6} />
        <span>پیشرفت</span>
      </button>
      <button
        type="button"
        className={active === 'profile' ? 'active' : ''}
        onClick={() => router.push('/profile')}
      >
        <User strokeWidth={2.6} />
        <span>من</span>
      </button>
    </nav>
  );
}
