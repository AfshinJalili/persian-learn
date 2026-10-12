import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import Hoopoe from '../components/art/Hoopoe';

describe('Hoopoe', () => {
  it('does not paint cheek blush in either pose', () => {
    const idle = render(<Hoopoe pose="idle" />);
    expect(idle.container.querySelector('[fill="#F28B6B"]')).toBeNull();
    idle.unmount();

    const cheer = render(<Hoopoe pose="cheer" />);
    expect(cheer.container.querySelector('[fill="#F28B6B"]')).toBeNull();
  });
});
