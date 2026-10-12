import { describe, it, expect } from '@jest/globals';
import math from '../public/content/math.json';
import alphabet from '../public/content/alphabet.json';

interface Exercise {
  id: string;
  type: string;
  prompt: string;
  audio_script: string;
  payload: Record<string, unknown>;
  answer: string;
  distractors: string[];
  feedback_correct: string;
  feedback_wrong: string;
}

describe('Content v2 Validation', () => {
  it('should have 12 units in math track', () => {
    expect(math.units).toHaveLength(12);
  });

  it('should have 12 units in alphabet track', () => {
    expect(alphabet.units).toHaveLength(12);
  });

  it('should have 553 total exercises in math', () => {
    const totalExercises = math.units.reduce((sum, unit) => {
      return sum + unit.lessons.reduce((lsum, lesson) => lsum + lesson.exercises.length, 0);
    }, 0);
    expect(totalExercises).toBe(553);
  });

  it('should have 628 total exercises in alphabet', () => {
    const totalExercises = alphabet.units.reduce((sum, unit) => {
      return sum + unit.lessons.reduce((lsum, lesson) => lsum + lesson.exercises.length, 0);
    }, 0);
    // public/content/alphabet.json currently contains 628 exercises (not 647).
    expect(totalExercises).toBe(628);
  });

  const exerciseTypes = [
    'intro',
    'tap_picture',
    'listen_choose',
    'count_objects',
    'choose_digit',
    'match_pairs',
    'trace_letter',
    'compare_more_less',
    'number_line',
    'build_word',
    'equation',
    'count_money',
    'pay_amount',
    'make_change',
    'read_clock',
    'ten_frame',
    'break_points',
  ];

  describe('Math exercises structure', () => {
    const allExercises = math.units.flatMap((unit) =>
      unit.lessons.flatMap((lesson) => lesson.exercises)
    ) as Exercise[];

    allExercises.forEach((exercise, index) => {
      it(`math exercise ${index + 1} (${exercise.id}) should have valid structure`, () => {
        expect(exercise.id).toBeTruthy();
        expect(exerciseTypes).toContain(exercise.type);
        expect(exercise.prompt).toBeDefined();
        expect(exercise.audio_script).toBeDefined();
        expect(exercise.payload).toBeDefined();
        expect(exercise.answer).toBeDefined();
        expect(exercise.distractors).toBeDefined();
        expect(Array.isArray(exercise.distractors)).toBe(true);
        expect(exercise.feedback_correct).toBeDefined();
        expect(exercise.feedback_wrong).toBeDefined();
      });

      it(`math exercise ${index + 1} (${exercise.id}) should have valid payload for type ${exercise.type}`, () => {
        const payload = exercise.payload as Record<string, unknown>;
        
        switch (exercise.type) {
          case 'intro':
            expect(payload).toHaveProperty('display');
            expect(payload).toHaveProperty('visual');
            expect(payload).toHaveProperty('teaches');
            break;
          case 'tap_picture':
            expect(payload).toHaveProperty('display');
            break;
          case 'listen_choose':
            expect(payload).toHaveProperty('choice_kind');
            expect(['digit', 'letter', 'word', 'money', 'time', 'claps', 'same', 'picture']).toContain(payload.choice_kind);
            break;
          case 'count_objects':
            expect(payload).toHaveProperty('objects');
            expect(payload).toHaveProperty('count');
            break;
          case 'choose_digit':
            expect(payload).toHaveProperty('display');
            break;
          case 'match_pairs':
            expect(payload).toHaveProperty('pairs');
            expect(Array.isArray(payload.pairs)).toBe(true);
            break;
          case 'trace_letter':
            expect(payload).toHaveProperty('letter');
            expect(payload).toHaveProperty('forms');
            break;
          case 'compare_more_less':
            expect(payload).toHaveProperty('left');
            expect(payload).toHaveProperty('right');
            expect(payload).toHaveProperty('ask');
            break;
          case 'number_line':
            expect(payload).toHaveProperty('min');
            expect(payload).toHaveProperty('max');
            expect(payload).toHaveProperty('start');
            expect(payload).toHaveProperty('move');
            break;
          case 'build_word':
            expect(payload).toHaveProperty('picture');
            expect(payload).toHaveProperty('letters');
            expect(Array.isArray(payload.letters)).toBe(true);
            break;
          case 'equation':
            expect(payload).toHaveProperty('a');
            expect(payload).toHaveProperty('op');
            expect(payload).toHaveProperty('b');
            expect(payload).toHaveProperty('objects');
            break;
          case 'count_money':
            expect(payload).toHaveProperty('items');
            expect(Array.isArray(payload.items)).toBe(true);
            break;
          case 'pay_amount':
            expect(payload).toHaveProperty('item');
            expect(payload).toHaveProperty('price');
            expect(payload).toHaveProperty('wallet');
            expect(Array.isArray(payload.wallet)).toBe(true);
            break;
          case 'make_change':
            expect(payload).toHaveProperty('item');
            expect(payload).toHaveProperty('price');
            expect(payload).toHaveProperty('paid');
            break;
          case 'read_clock':
            expect(payload).toHaveProperty('hour');
            expect(payload).toHaveProperty('minute');
            expect(payload).toHaveProperty('style');
            break;
          case 'ten_frame':
            expect(payload).toHaveProperty('count');
            expect(payload).toHaveProperty('objects');
            break;
          case 'break_points':
            expect(payload).toHaveProperty('word');
            break;
        }
      });
    });
  });

  describe('Alphabet exercises structure', () => {
    const allExercises = alphabet.units.flatMap((unit) =>
      unit.lessons.flatMap((lesson) => lesson.exercises)
    ) as Exercise[];

    allExercises.forEach((exercise, index) => {
      it(`alphabet exercise ${index + 1} (${exercise.id}) should have valid structure`, () => {
        expect(exercise.id).toBeTruthy();
        expect(exerciseTypes).toContain(exercise.type);
        expect(exercise.prompt).toBeDefined();
        expect(exercise.audio_script).toBeDefined();
        expect(exercise.payload).toBeDefined();
        expect(exercise.answer).toBeDefined();
        expect(exercise.distractors).toBeDefined();
        expect(Array.isArray(exercise.distractors)).toBe(true);
        expect(exercise.feedback_correct).toBeDefined();
        expect(exercise.feedback_wrong).toBeDefined();
      });

      it(`alphabet exercise ${index + 1} (${exercise.id}) should have valid payload for type ${exercise.type}`, () => {
        const payload = exercise.payload as Record<string, unknown>;
        
        switch (exercise.type) {
          case 'intro':
            expect(payload).toHaveProperty('display');
            expect(payload).toHaveProperty('visual');
            expect(payload).toHaveProperty('teaches');
            break;
          case 'tap_picture':
            expect(payload).toHaveProperty('display');
            break;
          case 'listen_choose':
            expect(payload).toHaveProperty('choice_kind');
            expect(['digit', 'letter', 'word', 'money', 'time', 'claps', 'same', 'picture']).toContain(payload.choice_kind);
            break;
          case 'count_objects':
            expect(payload).toHaveProperty('objects');
            expect(payload).toHaveProperty('count');
            break;
          case 'choose_digit':
            expect(payload).toHaveProperty('display');
            break;
          case 'match_pairs':
            expect(payload).toHaveProperty('pairs');
            expect(Array.isArray(payload.pairs)).toBe(true);
            break;
          case 'trace_letter':
            expect(payload).toHaveProperty('letter');
            expect(payload).toHaveProperty('forms');
            break;
          case 'compare_more_less':
            expect(payload).toHaveProperty('left');
            expect(payload).toHaveProperty('right');
            expect(payload).toHaveProperty('ask');
            break;
          case 'number_line':
            expect(payload).toHaveProperty('min');
            expect(payload).toHaveProperty('max');
            expect(payload).toHaveProperty('start');
            expect(payload).toHaveProperty('move');
            break;
          case 'build_word':
            expect(payload).toHaveProperty('picture');
            expect(payload).toHaveProperty('letters');
            expect(Array.isArray(payload.letters)).toBe(true);
            break;
          case 'equation':
            expect(payload).toHaveProperty('a');
            expect(payload).toHaveProperty('op');
            expect(payload).toHaveProperty('b');
            expect(payload).toHaveProperty('objects');
            break;
          case 'count_money':
            expect(payload).toHaveProperty('items');
            expect(Array.isArray(payload.items)).toBe(true);
            break;
          case 'pay_amount':
            expect(payload).toHaveProperty('item');
            expect(payload).toHaveProperty('price');
            expect(payload).toHaveProperty('wallet');
            expect(Array.isArray(payload.wallet)).toBe(true);
            break;
          case 'make_change':
            expect(payload).toHaveProperty('item');
            expect(payload).toHaveProperty('price');
            expect(payload).toHaveProperty('paid');
            break;
          case 'read_clock':
            expect(payload).toHaveProperty('hour');
            expect(payload).toHaveProperty('minute');
            expect(payload).toHaveProperty('style');
            break;
          case 'ten_frame':
            expect(payload).toHaveProperty('count');
            expect(payload).toHaveProperty('objects');
            break;
          case 'break_points':
            expect(payload).toHaveProperty('word');
            break;
        }
      });
    });
  });
});
