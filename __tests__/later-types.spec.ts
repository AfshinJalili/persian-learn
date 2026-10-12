import { test, expect, type Page } from '@playwright/test';
import math from '../public/content/math.json';
import alphabet from '../public/content/alphabet.json';
import type { Exercise, ExerciseType, UserProgress } from '../lib/types';

const SCREENSHOT_DIR = 'docs/screenshots';

const TARGETS: Array<{ type: ExerciseType; track: 'math' | 'alphabet'; lessonId: string; snap?: string }> = [
  { type: 'read_clock', track: 'math', lessonId: 'm12l1', snap: '13-clock.png' },
  { type: 'count_money', track: 'math', lessonId: 'm10l1', snap: '14-money.png' },
  { type: 'pay_amount', track: 'math', lessonId: 'm10l3' },
  { type: 'make_change', track: 'math', lessonId: 'm11l2' },
  { type: 'number_line', track: 'math', lessonId: 'm3l5' },
  { type: 'ten_frame', track: 'math', lessonId: 'm6l1' },
  { type: 'match_pairs', track: 'math', lessonId: 'm1l4' },
  { type: 'break_points', track: 'alphabet', lessonId: 'a2l2' },
  { type: 'trace_letter', track: 'alphabet', lessonId: 'a2l1', snap: '15-trace.png' },
];

function lessonById(track: typeof math, id: string) {
  for (const unit of track.units) {
    const lesson = unit.lessons.find((item) => item.id === id);
    if (lesson) return lesson;
  }
  throw new Error(`Lesson ${id} not found`);
}

async function hideDevOverlay(page: Page) {
  await page.addStyleTag({
    content: 'nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }',
  });
}

async function snap(page: Page, name: string) {
  await hideDevOverlay(page);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}`, fullPage: false });
}

async function seedProgress(page: Page, track: 'math' | 'alphabet') {
  await page.goto('/');
  const progress: UserProgress = {
    currentTrack: track,
    onboarded: true,
    completedLessons: [],
    completedUnits: [],
    xp: 0,
    streak: 0,
    streakBest: 0,
    lastActivityDate: '',
    dailyGoal: 1,
    dailyLessonsCompleted: 0,
    restDaysUsed: 0,
    weakItems: [],
    avatar: '🌷',
    name: 'مادر جان',
    startDate: new Date().toISOString(),
  };

  await page.evaluate(async (value) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('persian-learn', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress');
        }
        if (!db.objectStoreNames.contains('lessons')) {
          db.createObjectStore('lessons');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('progress', 'readwrite');
        tx.objectStore('progress').put(value, 'current');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }, progress);
}

async function unlockIfNeeded(page: Page) {
  const prompt = page.getByText('برای شنیدن، اینجا بزنید');
  if (await prompt.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'شروع' }).click();
    await expect(prompt).toHaveCount(0);
  }
}

async function playChoice(page: Page, answer: string) {
  await page.getByRole('button', { name: answer, exact: true }).click();
  await page.getByRole('button', { name: /بررسی/ }).click();
  await page.getByRole('button', { name: 'ادامه' }).click();
}

async function playExercise(page: Page, exercise: Exercise) {
  switch (exercise.type) {
    case 'intro':
      await page.getByRole('button', { name: /ادامه/ }).click();
      return;
    case 'trace_letter': {
      const letter = (exercise.payload as { letter?: string }).letter || exercise.answer;
      await page.getByRole('button').filter({ hasText: letter }).first().click();
      await page.getByRole('button', { name: 'ادامه' }).click();
      return;
    }
    case 'match_pairs': {
      const pairs = exercise.answer.split('|').map((pair) => pair.split('='));
      const columns = page.locator('.grid.grid-cols-2 > div');
      for (const [left, right] of pairs) {
        await columns.nth(0).getByRole('button', { name: left, exact: true }).click();
        await columns.nth(1).getByRole('button', { name: right, exact: true }).click();
      }
      await page.getByRole('button', { name: /بررسی/ }).click();
      await page.getByRole('button', { name: 'ادامه' }).click();
      return;
    }
    case 'break_points': {
      const parts = exercise.answer.split('|');
      let index = -1;
      const buttons = page.getByRole('button', { name: 'جدا کردن' });
      for (const part of parts.slice(0, -1)) {
        index += Array.from(part).length;
        await buttons.nth(index).click();
      }
      await page.getByRole('button', { name: /بررسی/ }).click();
      await page.getByRole('button', { name: 'ادامه' }).click();
      return;
    }
    case 'build_word': {
      for (const letter of Array.from(exercise.answer)) {
        await page.getByRole('button', { name: letter, exact: true }).first().click();
      }
      await page.getByRole('button', { name: /بررسی/ }).click();
      await page.getByRole('button', { name: 'ادامه' }).click();
      return;
    }
    case 'compare_more_less': {
      const payload = exercise.payload as { left: string; right: string };
      if (exercise.answer === 'equal') {
        await page.getByRole('button', { name: 'یکسان هستند' }).click();
      } else if (exercise.answer === 'left') {
        await page.getByRole('button', { name: payload.left }).click();
      } else {
        await page.getByRole('button', { name: payload.right }).click();
      }
      await page.getByRole('button', { name: /بررسی/ }).click();
      await page.getByRole('button', { name: 'ادامه' }).click();
      return;
    }
    case 'tap_picture':
    case 'listen_choose':
    case 'count_objects':
    case 'choose_digit':
    case 'number_line':
    case 'equation':
    case 'count_money':
    case 'pay_amount':
    case 'make_change':
    case 'read_clock':
    case 'ten_frame':
      await playChoice(page, exercise.answer);
      return;
    default: {
      const unexpected: never = exercise.type;
      throw new Error(`Unhandled exercise type: ${unexpected}`);
    }
  }
}

test.describe('Later exercise types via deep links', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const target of TARGETS) {
    test(`${target.type} in ${target.lessonId}`, async ({ page }) => {
      test.setTimeout(120_000);
      const source = target.track === 'math' ? math : alphabet;
      const lesson = lessonById(source, target.lessonId);

      await seedProgress(page, target.track === 'alphabet' ? 'math' : 'alphabet');
      await page.goto(`/lesson/${target.lessonId}`);
      await unlockIfNeeded(page);

      for (const exercise of lesson.exercises) {
        if (exercise.type === target.type) {
          if (target.snap) {
            await snap(page, target.snap);
          }
          await playExercise(page, exercise);
          await expect(page).not.toHaveURL(/\/home$/);
          return;
        }
        await playExercise(page, exercise);
      }

      throw new Error(`${target.type} not found in ${target.lessonId}`);
    });
  }
});
