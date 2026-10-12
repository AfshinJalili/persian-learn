'use client';

import { ObjectCluster } from '@/components/art/objects';

export default function ObjectCardsGalleryPage() {
  return (
    <div className="app-phone" data-object-gallery>
      <div className="content" style={{ paddingTop: 16, gap: 12 }}>
        <h1>۱ تا ۱۰</h1>
        <div className="grid2">
          {Array.from({ length: 10 }, (_, index) => {
            const count = index + 1;
            return (
              <div key={count} className="card object-choice-card" data-count={count}>
                <ObjectCluster token={'🔵'.repeat(count)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
