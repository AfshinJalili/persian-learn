// Which texts the app speaks, shared by the audio tooling and the
// service worker's audio warm-up plan (app/audio-plan.json).
import { spokenOption } from './spoken-option';
import { homeGreeting, lessonCompleteSpoken, LEARNER_NAME, onboardingSpokenWelcome } from './learner';
import { spokenTextKey } from './audio-id';
import { MATCH_UNDO_HINT } from './match-undo-hint';

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

export type ContentExercise = {
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

export type ContentLesson = { id: string; title: string; exercises: ContentExercise[] };
export type ContentTrack = { units: Array<{ title: string; lessons: ContentLesson[] }> };

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

/** Spoken texts that belong to the app shell, not to one lesson. */
export function uiSpokenTexts(): string[] {
  const texts = new Set<string>();
  for (const phrase of UI_PHRASES) {
    add(texts, phrase);
  }
  add(texts, lessonCompleteSpoken('درس تمام شد.'));
  for (const label of ['لاله', 'چای', 'سرو', 'انار', 'خورشید', 'ماه']) {
    add(texts, label);
  }
  return [...texts];
}

/** Spoken texts a lesson can play: title, scripts, feedback and options. */
export function lessonSpokenTexts(lesson: ContentLesson): string[] {
  const texts = new Set<string>();
  add(texts, lesson.title);
  for (const exercise of lesson.exercises) {
    add(texts, exercise.audio_script);
    add(texts, exercise.feedback_correct);
    add(texts, exercise.feedback_wrong);
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
  return [...texts];
}

/** Every spoken text in the app (UI, unit titles and all lessons). */
export function allSpokenTexts(tracks: ContentTrack[]): string[] {
  const texts = new Set<string>(uiSpokenTexts());
  for (const data of tracks) {
    for (const unit of data.units) {
      add(texts, unit.title);
      for (const lesson of unit.lessons) {
        for (const text of lessonSpokenTexts(lesson)) texts.add(text);
      }
    }
  }
  return [...texts].sort((a, b) => a.localeCompare(b, 'fa'));
}
