import { describe, expect, it } from '@jest/globals';
import { answersEqual, canonicalizePairs } from '../lib/answers';

describe('match_pairs canonical check', () => {
  it('treats the same pairs in any click order as correct', () => {
    const expected = '۱=🍎|۲=🍎🍎|۳=🍎🍎🍎';
    const clickedOutOfOrder = '۲=🍎🍎|۱=🍎|۳=🍎🍎🍎';
    expect(canonicalizePairs(clickedOutOfOrder)).toBe(canonicalizePairs(expected));
    expect(answersEqual('match_pairs', expected, clickedOutOfOrder)).toBe(true);
  });

  it('rejects a wrong pairing even if the left items match', () => {
    expect(answersEqual('match_pairs', '۱=🍎|۲=🍎🍎', '۱=🍎🍎|۲=🍎')).toBe(false);
  });

  it('still requires an exact match for other exercise types', () => {
    expect(answersEqual('tap_picture', '۲', '۲')).toBe(true);
    expect(answersEqual('tap_picture', '۲', '۳')).toBe(false);
  });
});
