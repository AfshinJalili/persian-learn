'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProgress } from '@/lib/progress';
import Onboarding from '@/components/Onboarding';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkProgress() {
      const progress = await getProgress();

      if (!progress.onboarded) {
        setNeedsOnboarding(true);
      } else {
        router.replace('/home');
      }

      setLoading(false);
    }

    checkProgress();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="text-6xl mb-4">🦩</div>
          <div className="text-2xl font-bold text-[var(--ink)]">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding />;
  }

  return null;
}
