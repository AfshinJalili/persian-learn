import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import AudioUnlockOverlay from '../components/AudioUnlockOverlay';
import { playAudio, unlockAudio } from '@/lib/audio';

jest.mock('@/lib/audio', () => ({
  isAudioUnlocked: jest.fn(() => false),
  unlockAudio: jest.fn(),
  playAudio: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/components/HodaMascot', () => ({
  __esModule: true,
  default: () => <div>hoda</div>,
}));

describe('AudioUnlockOverlay', () => {
  it('starts sound when the overlay is tapped anywhere', () => {
    render(<AudioUnlockOverlay phrase="سلام" />);
    fireEvent.click(screen.getByRole('button', { name: 'شروع' }));
    expect(unlockAudio).toHaveBeenCalled();
    expect(playAudio).toHaveBeenCalledWith('سلام');
  });
});
