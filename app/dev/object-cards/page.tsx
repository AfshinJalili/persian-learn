'use client';

import { ObjectCluster, objectClusterItemSizeForBox } from '@/components/art/objects';
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
  const { ref, size } = useSharedClusterSize([count]);
  return (
    <div ref={ref} className={className} data-count={count}>
      <ObjectCluster token={token.repeat(count)} itemSize={size} />
    </div>
  );
}

function CompareRow({ left, right, token }: { left: number; right: number; token: string }) {
  const { ref, size } = useSharedClusterSize([left, right]);
  return (
    <div ref={ref} className="grid2" data-compare={`${left}-${right}`}>
      <div className="card object-choice-card">
        <ObjectCluster token={token.repeat(left)} itemSize={size} />
      </div>
      <div className="card object-choice-card">
        <ObjectCluster token={token.repeat(right)} itemSize={size} />
      </div>
    </div>
  );
}

function TenFrame({ count, token }: { count: number; token: string }) {
  return (
    <div className="grid grid-cols-5 gap-2 w-full" data-count={count}>
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-center border-4 aspect-square rounded-xl"
          style={{ borderColor: 'var(--line-strong)', background: '#fff8ec' }}
        >
          {index < count ? <ObjectCluster token={token} itemSize={28} /> : null}
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
        <section data-gallery-section="tap_picture">
          <h1>انتخاب تصویر ۱ تا ۱۰</h1>
          <div className="grid2">
            {Array.from({ length: 10 }, (_, index) => (
              <FillingCard
                key={index}
                count={index + 1}
                token="🔵"
                className="card object-choice-card"
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
                className="card object-choice-card"
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
