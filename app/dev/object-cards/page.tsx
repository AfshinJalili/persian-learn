'use client';

import {
  ObjectArt,
  ObjectCluster,
  objectClusterItemSizeForBox,
  objectClusterNeedsWideCard,
} from '@/components/art/objects';
import { useSharedClusterSize } from '@/components/art/use-shared-cluster-size';

function FillingCard({
  count,
  token,
  className,
}: {
  count: number;
  token: string;
  className: string;
}) {
  const { ref, size, box } = useSharedClusterSize([count]);
  return (
    <div ref={ref} className={className} data-count={count}>
      <ObjectCluster
        token={token.repeat(count)}
        itemSize={size}
        boxWidth={box.width}
        boxHeight={box.height}
      />
    </div>
  );
}

function CompareRow({ left, right, token }: { left: number; right: number; token: string }) {
  const { ref, size, box } = useSharedClusterSize([left, right]);
  const stacked = objectClusterNeedsWideCard(Math.max(left, right));
  return (
    <div ref={ref} className={stacked ? 'cluster-stack' : 'grid2'} data-compare={`${left}-${right}`}>
      <div className="card object-choice-card">
        <ObjectCluster
          token={token.repeat(left)}
          itemSize={size}
          boxWidth={box.width}
          boxHeight={box.height}
        />
      </div>
      <div className="card object-choice-card">
        <ObjectCluster
          token={token.repeat(right)}
          itemSize={size}
          boxWidth={box.width}
          boxHeight={box.height}
        />
      </div>
    </div>
  );
}

function ThreeCardTypeGallery({
  section,
  title,
  token,
}: {
  section: string;
  title: string;
  token: string;
}) {
  return (
    <section data-gallery-section={section}>
      <h2>{title}</h2>
      <div className="grid3 picture-grid">
        {Array.from({ length: 10 }, (_, index) => (
          <FillingCard
            key={index}
            count={index + 1}
            token={token}
            className={`card object-choice-card${objectClusterNeedsWideCard(index + 1) ? ' gallery-wide' : ''}`}
          />
        ))}
      </div>
    </section>
  );
}

function TenFrame({ count, token }: { count: number; token: string }) {
  return (
    <div className="ten-frame-grid" data-count={count}>
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="ten-frame-cell">
          {index < count ? <ObjectArt token={token} size={40} /> : null}
        </div>
      ))}
    </div>
  );
}

export default function ObjectCardsGalleryPage() {
  const appleSize = objectClusterItemSizeForBox(3, 210, 72, 8, 'row');

  return (
    <div
      className="app-phone object-gallery-page"
      data-object-gallery
      style={{ height: 'auto', maxHeight: 'none', overflow: 'visible' }}
    >
      <div className="content" style={{ paddingTop: 16, gap: 24 }}>
        <ThreeCardTypeGallery section="show_n" title="نشان بده ۱ تا ۱۰" token="🍞" />
        <ThreeCardTypeGallery section="at_a_glance" title="با یک نگاه ۱ تا ۱۰" token="🔵" />
        <ThreeCardTypeGallery section="digit_to_group" title="عدد به دسته ۱ تا ۱۰" token="🌷" />

        <section data-gallery-section="tap_picture">
          <h1>انتخاب تصویر ۱ تا ۱۰</h1>
          <div className="grid3 picture-grid">
            {Array.from({ length: 10 }, (_, index) => (
              <FillingCard
                key={index}
                count={index + 1}
                token="🔵"
                className={`card object-choice-card${objectClusterNeedsWideCard(index + 1) ? ' gallery-wide' : ''}`}
              />
            ))}
          </div>
        </section>

        <section data-gallery-section="count_objects">
          <h2>شمارش ۱ تا ۱۰</h2>
          {Array.from({ length: 10 }, (_, index) => (
            <FillingCard
              key={index}
              count={index + 1}
              token="🍞"
              className="card object-count-card"
            />
          ))}
        </section>

        <section data-gallery-section="listen_choose">
          <h2>شنیدن و انتخاب ۱ تا ۱۰</h2>
          <div className="grid2">
            {Array.from({ length: 10 }, (_, index) => (
              <FillingCard
                key={index}
                count={index + 1}
                token="🍎"
                className={`card object-choice-card${objectClusterNeedsWideCard(index + 1) ? ' gallery-wide' : ''}`}
              />
            ))}
          </div>
        </section>

        <section data-gallery-section="compare_more_less">
          <h2>مقایسه ۱ تا ۱۰</h2>
          {Array.from({ length: 9 }, (_, index) => (
            <CompareRow key={index} left={index + 1} right={index + 2} token="☕" />
          ))}
        </section>

        <section data-gallery-section="match_pairs">
          <h2>وصل کردن ۱ تا ۱۰</h2>
          {Array.from({ length: 10 }, (_, index) => {
            const count = index + 1;
            return (
              <div key={count} className="row-card match-object-row" data-count={count}>
                <div className="match-object-apples">
                  <ObjectCluster
                    token={'🍎'.repeat(count)}
                    itemSize={objectClusterItemSizeForBox(count, 210, 72, 8, 'row')}
                    layout="row"
                  />
                </div>
                <span className="card match-digit-slot">
                  <span className="glyph">{count}</span>
                </span>
              </div>
            );
          })}
          <p className="muted">اندازهٔ مشترک برای سؤال ۱ تا ۳: {appleSize}px</p>
        </section>

        <section data-gallery-section="ten_frame">
          <h2>قاب ده‌تایی ۱ تا ۱۰</h2>
          {Array.from({ length: 10 }, (_, index) => (
            <TenFrame key={index} count={index + 1} token="🔵" />
          ))}
        </section>
      </div>
    </div>
  );
}
