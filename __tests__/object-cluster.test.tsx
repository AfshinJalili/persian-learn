import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  ObjectCluster,
  objectClusterColumns,
  objectClusterItemSize,
  objectClusterRows,
  sharedObjectClusterItemSize,
} from '../components/art/objects';

describe('ObjectCluster', () => {
  it('sizes items from the layout that fits the count, not a fixed 24px', () => {
    expect(objectClusterColumns(1)).toBe(1);
    expect(objectClusterColumns(2)).toBe(2);
    expect(objectClusterColumns(3)).toBe(2);
    expect(objectClusterRows(3)).toBe(2);
    expect(objectClusterColumns(4)).toBe(2);
    expect(objectClusterColumns(10)).toBe(5);
    expect(objectClusterItemSize(1)).toBeGreaterThan(24);
    expect(objectClusterItemSize(3)).toBeGreaterThan(24);
    expect(objectClusterItemSize(1)).toBeGreaterThan(objectClusterItemSize(10));
  });

  it('uses the fullest card size so a smaller count cannot hint the answer', () => {
    expect(sharedObjectClusterItemSize([1, 2, 3])).toBe(objectClusterItemSize(3));
    expect(sharedObjectClusterItemSize([1, 2, 3])).toBe(sharedObjectClusterItemSize([3]));
  });

  it('lays three items out as a dice triangle', () => {
    const { container } = render(<ObjectCluster token="🔵🔵🔵" />);
    const cluster = container.querySelector('.object-cluster');
    expect(cluster).toHaveAttribute('data-count', '3');
    expect(cluster).toHaveAttribute('data-layout', 'grid');
    expect(cluster?.children).toHaveLength(3);
    expect((cluster as HTMLElement).style.getPropertyValue('--object-cols')).toBe('2');
    expect((cluster as HTMLElement).style.getPropertyValue('--object-rows')).toBe('2');
  });

  it('applies the computed size on each item', () => {
    const { container } = render(<ObjectCluster token={'🔵'.repeat(10)} itemSize={32} />);
    const cluster = container.querySelector('.object-cluster');
    expect(cluster).toHaveAttribute('data-count', '10');
    expect(cluster?.children).toHaveLength(10);
    expect((cluster as HTMLElement).style.getPropertyValue('--object-cols')).toBe('5');
    expect((cluster as HTMLElement).style.getPropertyValue('--object-size')).toBe('32px');
    expect((cluster as HTMLElement).style.getPropertyValue('--dot')).toBe('32px');
    const item = cluster?.querySelector('.illus') as HTMLElement;
    expect(item.style.width).toBe('32px');
    expect(item.style.height).toBe('32px');
  });
});
