import { describe, expect, it } from '@jest/globals';
import { spokenOption } from '../lib/spoken-option';

describe('spokenOption', () => {
  it('speaks the Persian word for a picture, not the emoji', () => {
    expect(spokenOption('☕')).toBe('چای');
    expect(spokenOption('🍞')).toBe('نان');
    expect(spokenOption('🍎')).toBe('سیب');
  });

  it('speaks a count plus the word for repeated pictures', () => {
    expect(spokenOption('☕☕')).toBe('دو چای');
    expect(spokenOption('🍞🍞🍞')).toBe('سه نان');
  });

  it('speaks number words for digits', () => {
    expect(spokenOption('۲')).toBe('دو');
    expect(spokenOption('10')).toBe('ده');
    expect(spokenOption('۰')).toBe('صفر');
  });

  it('speaks letter names, including joined forms', () => {
    expect(spokenOption('ب')).toBe('به');
    expect(spokenOption('بـ')).toBe('به');
    expect(spokenOption('آ')).toBe('الف');
    expect(spokenOption('ج')).toBe('جیم');
  });

  it('keeps real words as-is', () => {
    expect(spokenOption('نان')).toBe('نان');
    expect(spokenOption('چای')).toBe('چای');
  });

  it('uses finger-count peers so a hand can mean five', () => {
    expect(spokenOption('✋', ['✌️✌️', '✌️☝️'])).toBe('پنج');
    expect(spokenOption('✋', ['🤝', '🥣'])).toBe('دست');
  });

  it('stays silent for unknown symbols', () => {
    expect(spokenOption('🙂')).toBe('');
    expect(spokenOption('')).toBe('');
  });
});
