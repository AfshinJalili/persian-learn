'use client';

import CountCard from '@/components/exercises/CountCard';

const GALLERY = [
  { count: 1, token: '🍎', label: 'یک سیب' },
  { count: 2, token: '🐦', label: 'دو گنجشک' },
  { count: 3, token: '🍇', label: 'سه انار' },
  { count: 4, token: '🍊', label: 'چهار پرتقال' },
  { count: 5, token: '🐦', label: 'پنج گنجشک' },
  { count: 6, token: '🍎', label: 'شش سیب' },
  { count: 7, token: '🍇', label: 'هفت انار' },
  { count: 8, token: '🍊', label: 'هشت پرتقال' },
  { count: 9, token: '🍎', label: 'نه سیب' },
  { count: 10, token: '🐦', label: 'ده گنجشک' },
] as const;

export default function CountCardsGalleryPage() {
  return (
    <div
      className="app-phone"
      data-count-gallery
      style={{ height: 'auto', maxHeight: 'none', overflow: 'visible' }}
    >
      <div className="content" style={{ padding: '24px', gap: 14, overflow: 'visible' }}>
        <h1>آزمون اندازه: ۱ تا ۱۰</h1>
        <div className="cc-list" style={{ flex: 'none' }}>
          {GALLERY.map((card) => (
            <CountCard
              key={card.count}
              count={card.count}
              token={card.token}
              label={card.label}
              onPlay={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
