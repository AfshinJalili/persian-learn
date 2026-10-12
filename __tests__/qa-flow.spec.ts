import { test, expect, type Page } from '@playwright/test';
import math from '../public/content/math.json';
import alphabet from '../public/content/alphabet.json';

const SCREENSHOT_DIR = 'docs/screenshots';

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

async function completeOnboarding(page: Page, trackLabel: string) {
  await page.goto('/');
  await expect(page.getByText('خوش آمدید')).toBeVisible();
  await snap(page, '01-onboarding-welcome.png');

  await page.getByRole('button', { name: /شروع/ }).click();
  await expect(page.getByText('یک تصویر برای خودتان انتخاب کنید')).toBeVisible();
  await snap(page, '03-avatar-picker.png');

  await page.getByRole('button', { name: '🌷' }).click();
  await expect(page.getByText('شما را چه صدا کنیم؟')).toBeVisible();
  await snap(page, '04-name-picker.png');

  await page.getByRole('button', { name: 'بعداً' }).click();
  await expect(page.getByText('امروز چه یاد بگیریم؟')).toBeVisible();
  await snap(page, '05-track-picker.png');

  await page.getByRole('button', { name: new RegExp(trackLabel) }).click();
  await page.waitForURL('**/home');
  await expect(page.getByText('خانه')).toBeVisible();
}

async function playLesson(page: Page, lesson: ReturnType<typeof lessonById>) {
  for (const exercise of lesson.exercises) {
    if (exercise.type === 'intro') {
      await page.getByRole('button', { name: /ادامه/ }).click();
      continue;
    }

    if (exercise.type === 'trace_letter') {
      const letter = (exercise.payload as { letter?: string }).letter || exercise.answer;
      await page.getByRole('button').filter({ hasText: letter }).first().click();
      await page.getByRole('button', { name: /بررسی/ }).click();
      await page.getByRole('button', { name: 'ادامه' }).click();
      continue;
    }

    if (exercise.type === 'match_pairs') {
      const pairs = exercise.answer.split('|').map((pair) => pair.split('='));
      const columns = page.locator('.grid.grid-cols-2 > div');
      if (await columns.count()) {
        for (const [left, right] of pairs) {
          await columns.nth(0).getByRole('button', { name: left, exact: true }).click();
          await columns.nth(1).getByRole('button', { name: right, exact: true }).click();
        }
      } else {
        for (const [left, right] of pairs) {
          await page.getByRole('button', { name: left, exact: true }).click();
          await page.getByRole('button', { name: right, exact: true }).click();
        }
      }
      await page.getByRole('button', { name: /بررسی/ }).click();
      await page.getByRole('button', { name: 'ادامه' }).click();
      continue;
    }

    await page.getByRole('button', { name: exercise.answer, exact: true }).click();
    await page.getByRole('button', { name: /بررسی/ }).click();
    await page.getByRole('button', { name: 'ادامه' }).click();
  }
}

test.describe('Mobile QA 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('onboarding, path, math lesson, alphabet lesson', async ({ page }) => {
    test.setTimeout(300_000);
    page.setViewportSize({ width: 390, height: 844 });

    await completeOnboarding(page, 'عددها و حساب');
    await snap(page, '06-home-math.png');

    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');

    await page.getByRole('button', { name: 'شروع' }).click();
    await page.waitForURL('**/lesson/m1l1');
    await snap(page, '07-math-lesson.png');

    await playLesson(page, lessonById(math, 'm1l1'));
    await expect(page).toHaveURL(/\/lesson-complete/);
    await snap(page, '08-lesson-complete.png');

    await page.getByRole('button', { name: 'ادامه' }).click();
    await page.waitForURL('**/home');

    await page.getByRole('button', { name: 'من' }).click();
    await page.waitForURL('**/profile');
    await snap(page, '09-profile.png');

    await page.getByRole('button', { name: 'ب الفبا' }).click();
    await page.waitForURL('**/home');
    await snap(page, '10-home-alphabet.png');

    await page.getByRole('button', { name: 'شروع' }).click();
    await page.waitForURL('**/lesson/a1l1');
    await snap(page, '11-alphabet-lesson.png');

    await playLesson(page, lessonById(alphabet, 'a1l1'));
    await expect(page).toHaveURL(/\/lesson-complete/);

    await page.getByRole('button', { name: 'ادامه' }).click();
    await page.waitForURL('**/home');
    await page.getByRole('button', { name: 'پیشرفت' }).click();
    await page.waitForURL('**/streak');
    await snap(page, '12-streak.png');
  });
});
