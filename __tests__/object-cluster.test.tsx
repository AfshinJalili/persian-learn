import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  ObjectCluster,
  objectClusterColumns,
  objectClusterItemSize,
} from '../components/art/objects';

describe('ObjectCluster', () => {
  it('uses one 24px size and a 5+5 ten-frame for 10', () => {
    expect(objectClusterColumns(1)).toBe(1);
    expect(objectClusterColumns(2)).toBe(2);
    expect(objectClusterColumns(3)).toBe(3);
    expect(objectClusterColumns(4)).toBe(2);
    expect(objectClusterColumns(10)).toBe(5);
    expect(objectClusterItemSize(1)).toBe(24);
    expect(objectClusterItemSize(3)).toBe(24);
    expect(objectClusterItemSize(10)).toBe(24);
  });

  it('renders three items without wrapping to a leftover fourth cell', () => {
    const { container } = render(<ObjectCluster token="🔵🔵🔵" />);
    const cluster = container.querySelector('.object-cluster');
    expect(cluster).toHaveAttribute('data-count', '3');
    expect(cluster?.children).toHaveLength(3);
  });

  it('fits ten items in a five-column grid', () => {
    const { container } = render(<ObjectCluster token={'🔵'.repeat(10)} />);
    const cluster = container.querySelector('.object-cluster');
    expect(cluster).toHaveAttribute('data-count', '10');
    expect(cluster?.children).toHaveLength(10);
    expect((cluster as HTMLElement).style.getPropertyValue('--object-cols')).toBe('5');
    expect((cluster as HTMLElement).style.getPropertyValue('--object-size')).toBe('24px');
  });
});
