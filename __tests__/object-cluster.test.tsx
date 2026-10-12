import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  OBJECT_CLUSTER_MIN_SIZE,
  OBJECT_SINGLE_WIDTH_RATIO,
  ObjectCluster,
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
    expect(objectClusterLayoutForBox(3, 81, 140)).toMatchObject({ cols: 1, rows: 3, size: 41 });
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

  it('fills a wide match-pair box with a best-fit grid above 32px', () => {
    const six = objectClusterLayoutForBox(6, 220, 72, 4, 'match');
    const ten = objectClusterLayoutForBox(10, 220, 72, 4, 'match');
    expect(six).toMatchObject({ cols: 5, rows: 2 });
    expect(six.size).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
    expect(ten).toMatchObject({ cols: 5, rows: 2 });
    expect(ten.size).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
    expect((5 * six.size + 16) / 220).toBeGreaterThanOrEqual(0.65);
  });

  it('fills four and five match-pair items across the row when they stay at 32px', () => {
    expect(objectClusterLayoutForBox(4, 220, 72, 4, 'match')).toMatchObject({
      cols: 4,
      rows: 1,
    });
    expect(objectClusterLayoutForBox(5, 220, 72, 4, 'match')).toMatchObject({
      cols: 5,
      rows: 1,
    });
    expect(objectClusterLayoutForBox(4, 220, 72, 4, 'match').size).toBeGreaterThanOrEqual(
      OBJECT_CLUSTER_MIN_SIZE
    );
    expect(objectClusterLayoutForBox(5, 220, 72, 4, 'match').size).toBeGreaterThanOrEqual(
      OBJECT_CLUSTER_MIN_SIZE
    );
    expect(objectClusterLayoutForBox(5, 120, 72, 4, 'match')).toMatchObject({
      cols: 3,
      rows: 2,
    });
  });

  it('sizes a single math item to about 70% of the measured content width', () => {
    expect(objectClusterLayoutForBox(1, 100, 140).size).toBe(70);
    expect(objectClusterLayoutForBox(1, 81, 40).size).toBe(Math.floor(81 * OBJECT_SINGLE_WIDTH_RATIO));
    expect(objectClusterLayoutForBox(1, 40, 140).size).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
  });

  it('lets alphabet picture items fill the measured content box', () => {
    expect(objectClusterLayoutForBox(1, 97, 140, 8, 'picture').size).toBe(97);
    expect(objectClusterLayoutForBox(1, 97, 140, 8, 'picture').size).toBeGreaterThan(
      objectClusterLayoutForBox(1, 97, 140).size
    );
  });

  it('stacks three items in one column in a tall 81x140 card', () => {
    const { container } = render(
      <ObjectCluster token="🔵🔵🔵" boxWidth={81} boxHeight={140} />
    );
    const cluster = container.querySelector('.object-cluster');
    expect(cluster).toHaveAttribute('data-count', '3');
    expect(cluster).toHaveAttribute('data-layout', 'grid');
    expect(cluster?.children).toHaveLength(3);
    expect((cluster as HTMLElement).style.getPropertyValue('--object-cols')).toBe('1');
    expect((cluster as HTMLElement).style.getPropertyValue('--object-rows')).toBe('3');
    expect((cluster as HTMLElement).style.getPropertyValue('--object-size')).toBe('41px');
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
