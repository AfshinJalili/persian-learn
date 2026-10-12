import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  DICE_PIP_COUNTS,
  ObjectArt,
  looksLikeObjects,
  splitObjectTokens,
} from '../components/art/objects';
import math from '../content/math.json';

jest.mock('@/lib/audio', () => ({
  playAudio: jest.fn(() => Promise.resolve()),
}));

function countingTokens(): string[] {
  const tokens = new Set<string>();
  for (const unit of math.units) {
    for (const lesson of unit.lessons) {
      for (const exercise of lesson.exercises) {
        const counting =
          exercise.type === 'choose_digit' ||
          exercise.type === 'tap_picture' ||
          exercise.type === 'listen_choose' ||
          exercise.type === 'count_objects' ||
          exercise.type === 'match_pairs' ||
          exercise.type === 'compare_more_less' ||
          exercise.type === 'intro' ||
          exercise.type === 'ten_frame';
        if (!counting) continue;
        const payload = exercise.payload as Record<string, unknown>;
        const values: Array<unknown> = [
          payload.display,
          payload.visual,
          payload.left,
          payload.right,
          payload.objects,
        ];
        if (exercise.type === 'match_pairs') {
          for (const pair of String(exercise.answer).split('|')) {
            values.push(pair.split('=')[1]);
          }
        } else if (exercise.type !== 'compare_more_less') {
          values.push(exercise.answer, ...exercise.distractors);
        }
        for (const value of values) {
          if (typeof value !== 'string' || !looksLikeObjects(value)) continue;
          const parts = splitObjectTokens(value);
          if (parts.length === 0) continue;
          if (/[\s|=-]/.test(value) && parts.length > 1) continue;
          if (!parts.every((part) => looksLikeObjects(part))) continue;
          if (parts.every((part) => part in DICE_PIP_COUNTS) && parts.length > 1) continue;
          tokens.add(value);
        }
      }
    }
  }
  return [...tokens];
}

describe('counting display art', () => {
  it('never renders a raw emoji glyph', () => {
    const tokens = countingTokens();
    expect(tokens.length).toBeGreaterThan(10);
    for (const token of tokens) {
      const { container, unmount } = render(<ObjectArt token={token} size={72} />);
      const raw = [...container.querySelectorAll('.glyph')].filter((node) =>
        /\p{Extended_Pictographic}/u.test(node.textContent ?? '')
      );
      expect({ token, glyphs: raw.map((node) => node.textContent) }).toEqual({
        token,
        glyphs: [],
      });
      expect({ token, hasSvg: Boolean(container.querySelector('svg')) }).toEqual({
        token,
        hasSvg: true,
      });
      unmount();
    }
  });
});
