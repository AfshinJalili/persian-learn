import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  ObjectCluster,
  objectClusterColumns,
  objectClusterItemSize,
} from '../components/art/objects';

describe('ObjectCluster', () => {
  it('uses a padded grid that shrinks 2 and 3 items', () => {
    expect(objectClusterColumns(1)).toBe(1);
    expect(objectClusterColumns(2)).toBe(2);
    expect(objectClusterColumns(3)).toBe(3);
    expect(objectClusterColumns(4)).toBe(2);
    expect(objectClusterColumns(10)).toBe(5);
    expect(objectClusterItemSize(2)).toBeLessThan(objectClusterItemSize(1));
    expect(objectClusterItemSize(3)).toBeLessThan(objectClusterItemSize(1));
    expect(objectClusterItemSize(3)).toBeLessThanOrEqual(objectClusterItemSize(2));
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
    expect(cluster).toHaveStyle({ gridTemplateColumns: 'repeat(5, 28px)' });
  });
});
