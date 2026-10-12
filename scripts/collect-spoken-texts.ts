import { readFileSync } from 'fs';
import { join } from 'path';
import { spokenOption } from '../lib/spoken-option';
import { homeGreeting, lessonCompleteSpoken, LEARNER_NAME, onboardingSpokenWelcome } from '../lib/learner';
import { spokenTextKey } from '../lib/audio-id';
import { MATCH_UNDO_HINT } from '../lib/match-undo-hint';

const ROOT = join(__dirname, '..');

const UI_PHRASES = [
  'سلام! من هُدی هستم. خوش آمدید.',
  onboardingSpokenWelcome(),
  'عالی! حالا بیایید شروع کنیم.',
  'لطفاً صدای گوشی خود را بلند کنید.',
  'خوب انتخاب کردید!',
  'عددها را شروع می‌کنیم!',
  'حروف الفبا را شروع می‌کنیم!',
  'سلام! بیایید درس امروز را شروع کنیم.',
  'اول درس قبلی را تمام کنیم',
  'عددها و حساب',
  'الفبا و خواندن',
  'آفرین!',
  'آفرین! درس تمام شد.',
  'نزدیک بود! دوباره امتحان کنید.',
  'یکسان هستند',
  'این',
  'یک تصویر برای خودتان انتخاب کنید',
  'امروز چه یاد بگیریم؟',
  'اول یک جواب انتخاب کنید',
  'عددها و حساب. شمردن، پول، ساعت',
  'الفبا و خواندن. حرف‌ها و کلمه‌های ساده',
  'کدام کمتر است؟',
  'کدام بیشتر است؟',
  'بعداً دوباره می‌بینیم.',
  MATCH_UNDO_HINT,
  homeGreeting(),
  `خوشحالم که شما را می‌شناسم، ${LEARNER_NAME}!`,
];

type ContentExercise = {
  id: string;
  type: string;
  prompt: string;
  audio_script: string;
  payload: Record<string, unknown>;
  answer: string;
  distractors: string[];
  feedback_correct: string;
  feedback_wrong: string;
};

function loadTrackJson(name: string) {
  return JSON.parse(readFileSync(join(ROOT, 'public', 'content', name), 'utf8')) as {
    units: Array<{
      title: string;
      lessons: Array<{ title: string; exercises: ContentExercise[] }>;
    }>;
  };
}

function add(texts: Set<string>, value: string) {
  const key = spokenTextKey(value);
  if (!key) return;
  if (!/[\u0600-\u06FF]/.test(key)) return;
  texts.add(key);
}

function optionPool(exercise: ContentExercise): string[] {
  const pool: string[] = [];
  if (exercise.type === 'match_pairs') {
    for (const pair of String(exercise.answer).split('|')) {
      for (const side of pair.split('=')) {
        if (side) pool.push(side);
      }
    }
  } else if (exercise.type !== 'compare_more_less') {
    pool.push(exercise.answer, ...(exercise.distractors || []));
  }
  for (const key of ['left', 'right', 'letter', 'picture'] as const) {
    const value = exercise.payload[key];
    if (typeof value === 'string') pool.push(value);
  }
  const letters = exercise.payload.letters;
  if (Array.isArray(letters)) {
    for (const letter of letters) {
      if (typeof letter === 'string') pool.push(letter);
    }
  }
  return pool.filter(Boolean);
}

export function collectSpokenTexts(): string[] {
  const texts = new Set<string>();

  for (const phrase of UI_PHRASES) {
    add(texts, phrase);
  }

  add(texts, lessonCompleteSpoken('درس تمام شد.'));

  for (const label of ['لاله', 'چای', 'سرو', 'انار', 'خورشید', 'ماه']) {
    add(texts, label);
  }

  for (const name of ['math.json', 'alphabet.json']) {
    const data = loadTrackJson(name);
    for (const unit of data.units) {
      add(texts, unit.title);
      for (const lesson of unit.lessons) {
        add(texts, lesson.title);
        for (const exercise of lesson.exercises) {
          add(texts, exercise.audio_script);
          add(texts, exercise.feedback_correct);
          add(texts, exercise.feedback_wrong);
          const labels = exercise.payload.labels;
          if (Array.isArray(labels)) {
            for (const label of labels) {
              if (typeof label === 'string') add(texts, label);
            }
          }
          const pool = optionPool(exercise);
          if (exercise.type !== 'match_pairs' && exercise.type !== 'compare_more_less') {
            const spokenAnswer = spokenOption(exercise.answer, pool);
            if (spokenAnswer) {
              add(texts, spokenAnswer);
              add(texts, `این ${spokenAnswer} است. بعداً دوباره می‌بینیم.`);
            }
          }
          for (const option of pool) {
            add(texts, spokenOption(option, pool));
          }
        }
      }
    }
  }

  return [...texts].sort((a, b) => a.localeCompare(b, 'fa'));
}
