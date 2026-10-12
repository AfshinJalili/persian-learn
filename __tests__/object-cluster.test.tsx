import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  OBJECT_CLUSTER_MIN_SIZE,
  ObjectCluster,
  objectClusterColumns,
  objectClusterItemSize,
  objectClusterItemSizeForBox,
  objectClusterLayoutForBox,
  objectClusterRows,
  sharedObjectClusterItemSize,
} from '../components/art/objects';

describe('ObjectCluster', () => {
  it('picks the tall-card column count that maximizes item size', () => {
    expect(objectClusterLayoutForBox(1, 81, 140)).toMatchObject({ cols: 1, rows: 1, size: 81 });
    expect(objectClusterLayoutForBox(2, 81, 140)).toMatchObject({ cols: 1, rows: 2, size: 66 });
    expect(objectClusterLayoutForBox(3, 81, 140)).toMatchObject({ cols: 1, rows: 3, size: 41 });
    expect(objectClusterLayoutForBox(4, 81, 140)).toMatchObject({ cols: 2, rows: 2, size: 36 });
    expect(objectClusterLayoutForBox(5, 81, 140)).toMatchObject({ cols: 2, rows: 3, size: 36 });
    expect(objectClusterItemSize(1)).toBe(81);
    expect(objectClusterItemSize(5)).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
    expect(objectClusterItemSize(10)).toBeGreaterThanOrEqual(OBJECT_CLUSTER_MIN_SIZE);
  });

  it('wraps a row of more than five items instead of shrinking below 32px', () => {
    expect(objectClusterColumns(10, 'row')).toBe(5);
    expect(objectClusterRows(10, 'row')).toBe(2);
    expect(objectClusterItemSizeForBox(10, 210, 72, 8, 'row')).toBeGreaterThanOrEqual(32);
    expect(objectClusterItemSizeForBox(9, 80, 80)).toBe(32);
  });

  it('uses the fullest card size so a smaller count cannot hint the answer', () => {
    expect(sharedObjectClusterItemSize([1, 2, 3])).toBe(objectClusterItemSize(3));
    expect(sharedObjectClusterItemSize([1, 2, 3])).toBe(sharedObjectClusterItemSize([3]));
    expect(sharedObjectClusterItemSize([1, 2, 3])).toBe(41);
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
