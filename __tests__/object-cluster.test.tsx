import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  OBJECT_CLUSTER_MIN_SIZE,
  OBJECT_MATCH_SINGLE_MAX,
  OBJECT_SINGLE_WIDTH_RATIO,
  ObjectCluster,
  matchApplesBoxFromList,
  objectClusterColumns,
  objectClusterItemSize,
  objectClusterItemSizeForBox,
  objectClusterLayoutForBox,
  objectClusterRows,
} from '../components/art/objects';

describe('ObjectCluster', () => {
  it('picks the tall-card column count that maximizes item size', () => {
    expect(objectClusterLayoutForBox(1, 81, 140)).toMatchObject({
      cols: 1,
      rows: 1,
      size: Math.floor(81 * OBJECT_SINGLE_WIDTH_RATIO),
    });
    expect(objectClusterLayoutForBox(2, 81, 140)).toMatchObject({ cols: 1, rows: 2, size: 66 });
    expect(objectClusterLayoutForBox(3, 81, 140)).toMatchObject({ cols: 2, rows: 2, size: 36 });
    expect(objectClusterLayoutForBox(4, 81, 140)).toMatchObject({ cols: 2, rows: 2, size: 36 });
    expect(objectClusterLayoutForBox(5, 81, 140)).toMatchObject({ cols: 2, rows: 3, size: 36 });
    expect(objectClusterItemSize(1)).toBe(Math.floor(81 * OBJECT_SINGLE_WIDTH_RATIO));
    expect(objectClusterItemSize(5)).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
    expect(objectClusterItemSize(10)).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
  });

  it('wraps a row of more than five items instead of shrinking below 32px', () => {
    expect(objectClusterColumns(10, 'row')).toBe(5);
    expect(objectClusterRows(10, 'row')).toBe(2);
    expect(objectClusterItemSizeForBox(10, 210, 72, 8, 'row')).toBeGreaterThanOrEqual(32);
    expect(objectClusterItemSizeForBox(9, 80, 80)).toBe(32);
  });

  it('fills a wide match-pair box with a row layout above 32px', () => {
    const six = objectClusterLayoutForBox(6, 220, 72, 4, 'row');
    const ten = objectClusterLayoutForBox(10, 220, 72, 4, 'row');
    expect(six).toMatchObject({ cols: 6, rows: 1 });
    expect(six.size).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
    expect(ten).toMatchObject({ cols: 5, rows: 2 });
    expect(ten.size).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
    expect((6 * six.size + 20) / 220).toBeGreaterThanOrEqual(0.65);
    const capped = objectClusterLayoutForBox(6, 250, 84, 4, 'row');
    expect(capped).toMatchObject({ cols: 6, rows: 1 });
    expect(capped.size).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
    expect((6 * capped.size + 20) / 250).toBeGreaterThanOrEqual(0.65);
  });

  it('fills four and five match-pair items across the row at 32px or larger', () => {
    expect(objectClusterLayoutForBox(4, 220, 72, 4, 'row')).toMatchObject({
      cols: 4,
      rows: 1,
    });
    expect(objectClusterLayoutForBox(5, 220, 72, 4, 'row')).toMatchObject({
      cols: 5,
      rows: 1,
    });
    expect(objectClusterLayoutForBox(4, 220, 72, 4, 'row').size).toBeGreaterThanOrEqual(
      OBJECT_CLUSTER_MIN_SIZE
    );
    expect(objectClusterLayoutForBox(5, 220, 72, 4, 'row').size).toBeGreaterThanOrEqual(
      OBJECT_CLUSTER_MIN_SIZE
    );
    expect((4 * objectClusterLayoutForBox(4, 220, 72, 4, 'row').size + 12) / 220).toBeGreaterThanOrEqual(
      0.65
    );
  });

  it('caps a single match-pair item so a hand cannot grow with the list height', () => {
    expect(objectClusterLayoutForBox(1, 250, 208, 4, 'row', 300).size).toBeLessThanOrEqual(
      OBJECT_MATCH_SINGLE_MAX
    );
    const apples = matchApplesBoxFromList({ width: 342, height: 280, offsetWidth: 342 }, 3);
    expect(apples.height).toBeLessThan(208);
    expect(objectClusterLayoutForBox(1, apples.width, apples.height, 4, 'row', apples.offsetWidth).size).toBeLessThanOrEqual(
      OBJECT_MATCH_SINGLE_MAX
    );
  });

  it('sizes a single math item to 70% of the card offset width, capped by the inner box', () => {
    expect(objectClusterLayoutForBox(1, 81, 140, 8, 'grid', 103).size).toBe(72);
    expect(objectClusterLayoutForBox(1, 100, 140).size).toBe(70);
    expect(objectClusterLayoutForBox(1, 81, 40, 8, 'grid', 81).size).toBe(40);
    expect(objectClusterLayoutForBox(1, 40, 140).size).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
  });

  it('lets alphabet picture items fill the inner box without using the 70% math cap', () => {
    expect(objectClusterLayoutForBox(1, 97, 140, 8, 'picture').size).toBe(97);
    expect(objectClusterLayoutForBox(1, 97, 80, 8, 'picture').size).toBe(97);
    expect(objectClusterLayoutForBox(1, 97, 140, 8, 'picture').size).toBeGreaterThan(
      objectClusterLayoutForBox(1, 97, 140).size
    );
  });

  it('lays three items in a dice triangle instead of a single column', () => {
    const { container } = render(
      <ObjectCluster token="🔵🔵🔵" boxWidth={81} boxHeight={140} />
    );
    const cluster = container.querySelector('.object-cluster');
    expect(cluster).toHaveAttribute('data-count', '3');
    expect(cluster).toHaveAttribute('data-layout', 'grid');
    expect(cluster?.children).toHaveLength(3);
    expect((cluster as HTMLElement).style.getPropertyValue('--object-cols')).toBe('2');
    expect((cluster as HTMLElement).style.getPropertyValue('--object-rows')).toBe('2');
    expect((cluster as HTMLElement).style.getPropertyValue('--object-size')).toBe('36px');
  });

  it('uses a two-column dice layout when that is larger than a stack', () => {
    const layout = objectClusterLayoutForBox(3, 97, 140);
    expect(layout.cols).toBe(2);
    expect(layout.rows).toBe(2);
    expect(layout.size).toBeGreaterThanOrEqual(41);
    const { container } = render(
      <ObjectCluster token="🔵🔵🔵" boxWidth={97} boxHeight={140} />
    );
    const cluster = container.querySelector('.object-cluster') as HTMLElement;
    expect(cluster.style.getPropertyValue('--object-cols')).toBe('2');
  });

  it('renders hand tokens as SVG drawings instead of emoji glyphs', () => {
    const tokens = ['☝️', '✌️', '✋', '👆', '☝️\u{1F3FB}', '✌'];
    for (const token of tokens) {
      const { container, unmount } = render(
        <ObjectCluster token={token} boxWidth={120} boxHeight={120} />
      );
      const item = container.querySelector('.illus') as HTMLElement | null;
      expect(item).toHaveAttribute('data-glyph', 'hand');
      expect(container.querySelector('svg')).toBeTruthy();
      expect(container.querySelector('.glyph')).toBeNull();
      unmount();
    }
  });

  it('renders dice faces as a single pip SVG instead of emoji glyphs', () => {
    const tokens = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    for (const token of tokens) {
      const { container, unmount } = render(
        <ObjectCluster token={token} boxWidth={120} boxHeight={120} />
      );
      const cluster = container.querySelector('.object-cluster') as HTMLElement | null;
      expect(cluster).toHaveAttribute('data-count', '1');
      expect(container.querySelector('svg')).toBeTruthy();
      expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
      expect(container.querySelector('.glyph')).toBeNull();
      unmount();
    }
  });

  it('applies the computed size on each item', () => {
    const { container } = render(<ObjectCluster token={'🔵'.repeat(10)} itemSize={32} />);
    const cluster = container.querySelector('.object-cluster');
    expect(cluster).toHaveAttribute('data-count', '10');
    expect(cluster?.children).toHaveLength(10);
    expect((cluster as HTMLElement).style.getPropertyValue('--object-size')).toBe('32px');
    expect((cluster as HTMLElement).style.getPropertyValue('--dot')).toBe('32px');
    const item = cluster?.querySelector('.illus') as HTMLElement;
    expect(item.style.width).toBe('32px');
    expect(item.style.height).toBe('32px');
  });
});
