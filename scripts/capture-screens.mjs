import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = process.argv[2] || 'docs/screenshots/design-match/before';

mkdirSync(OUT, { recursive: true });

function progress(overrides = {}) {
  return {
    currentTrack: 'math',
    onboarded: true,
    completedLessons: [],
    completedUnits: [],
    xp: 120,
    streak: 5,
    streakBest: 5,
    lastActivityDate: new Date().toISOString().split('T')[0],
    dailyGoal: 2,
    dailyLessonsCompleted: 1,
    restDaysUsed: 0,
    weakItems: [],
    avatar: '🌷',
    name: 'مادر جان',
    startDate: '2026-09-23T00:00:00.000Z',
    ...overrides,
  };
}

async function hideChrome(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }
    `,
  });
}

async function snap(page, name) {
  await hideChrome(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log('wrote', name);
}

async function seed(page, data) {
  await page.goto(BASE + '/');
  await page.evaluate(async (value) => {
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('persian-learn');
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('persian-learn', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress');
        if (!db.objectStoreNames.contains('lessons')) db.createObjectStore('lessons');
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('progress', 'readwrite');
        tx.objectStore('progress').put(value, 'current');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, data);
}

const MATH_BEFORE_M3L5 = [
  'm1l1', 'm1l2', 'm1l3', 'm1l4', 'm1l5',
  'm2l1', 'm2l2', 'm2l3', 'm2l4', 'm2l5',
  'm3l1', 'm3l2', 'm3l3', 'm3l4',
];
const ALPHA_BEFORE_A2L1 = ['a1l1', 'a1l2', 'a1l3', 'a1l4', 'a1l5'];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fa-IR',
  });
  const page = await context.newPage();

  await page.goto(BASE + '/');
  await page.waitForSelector('text=برای شنیدن، اینجا بزنید', { timeout: 20000 });
  await snap(page, '01-onboarding-welcome.png');

  await page.getByRole('button', { name: 'شروع' }).click();
  await page.waitForSelector('text=صدا را می‌شنوید؟');
  await snap(page, '01b-sound-check.png');

  await page.getByRole('button', { name: 'بله، می‌شنوم' }).click();
  await page.waitForSelector('text=یک تصویر برای خودتان انتخاب کنید');
  await snap(page, '02-onboarding-avatar.png');

  await page.getByRole('button', { name: '🌷' }).click();
  await page.waitForSelector('text=چه صدایتان کنیم؟');
  await snap(page, '02b-onboarding-name.png');

  await page.getByRole('button', { name: 'مادر جان' }).click();
  await page.waitForSelector('text=امروز چه یاد بگیریم؟');
  await snap(page, '03-track-picker.png');

  await page.getByRole('button', { name: /عددها و حساب/ }).click();
  await page.waitForURL('**/home');
  await page.waitForSelector('text=خانه');
  await snap(page, '04-lesson-path.png');

  await page.getByRole('button', { name: 'شروع' }).click();
  await page.waitForURL('**/lesson/m1l1');
  if (await page.getByRole('button', { name: /ادامه/ }).count()) {
    await page.getByRole('button', { name: /ادامه/ }).click();
  }
  await page.waitForTimeout(600);
  await snap(page, '05-ex-tap-picture.png');

  if (await page.getByRole('button', { name: /بررسی/ }).count()) {
    const option = page.getByRole('button').filter({ hasText: '🍞' }).first();
    if (await option.count()) await option.click();
    await page.getByRole('button', { name: /بررسی/ }).click();
    await page.waitForTimeout(500);
    await snap(page, '11-feedback-correct.png');
  }

  await seed(page, progress({
    currentTrack: 'math',
    completedLessons: ['m1l1', 'm1l2'],
  }));
  await page.goto(BASE + '/lesson/m1l3');
  if (await page.getByRole('button', { name: /ادامه/ }).count()) {
    await page.getByRole('button', { name: /ادامه/ }).click();
  }
  await page.waitForTimeout(600);
  await snap(page, '08-ex-count-objects.png');

  const wrong = page.getByRole('button', { name: '۲', exact: true });
  if (await wrong.count()) {
    await wrong.click();
    await page.getByRole('button', { name: /بررسی/ }).click();
    await page.waitForTimeout(500);
    await snap(page, '12-feedback-retry.png');
  }

  await seed(page, progress({
    currentTrack: 'alphabet',
    completedLessons: ALPHA_BEFORE_A2L1,
    avatar: '🌷',
  }));
  await page.goto(BASE + '/lesson/a2l1');
  if (await page.getByRole('button', { name: /ادامه/ }).count()) {
    await page.getByRole('button', { name: /ادامه/ }).click();
  }
  await page.waitForTimeout(600);
  await snap(page, '07-ex-trace-letter.png');

  const skipTrace = async () => {
    const letterBtn = page.getByRole('button').filter({ hasText: /آ|ا|ب/ }).first();
    if (await letterBtn.count()) {
      await letterBtn.click();
      await page.waitForTimeout(500);
      if (await page.getByRole('button', { name: 'ادامه' }).count()) {
        await page.getByRole('button', { name: 'ادامه' }).click();
      }
    } else if (await page.getByRole('button', { name: /ادامه/ }).count()) {
      await page.getByRole('button', { name: /ادامه/ }).click();
    }
    await page.waitForTimeout(400);
  };

  await skipTrace();
  await skipTrace();
  if (await page.getByRole('button', { name: /ادامه/ }).count()) {
    await page.getByRole('button', { name: /ادامه/ }).click();
    await page.waitForTimeout(400);
  }
  await skipTrace();
  await page.waitForTimeout(600);
  await snap(page, '06-ex-listen-letter.png');

  await seed(page, progress({
    currentTrack: 'math',
    completedLessons: ['m1l1', 'm1l2', 'm1l3'],
  }));
  await page.goto(BASE + '/lesson/m1l4');
  if (await page.getByRole('button', { name: /ادامه/ }).count()) {
    await page.getByRole('button', { name: /ادامه/ }).click();
  }
  await page.waitForTimeout(600);
  await snap(page, '09-ex-drag-match.png');

  await seed(page, progress({
    currentTrack: 'math',
    completedLessons: MATH_BEFORE_M3L5,
  }));
  await page.goto(BASE + '/lesson/m3l5');
  for (let i = 0; i < 3; i += 1) {
    if (await page.getByRole('button', { name: /ادامه/ }).count()) {
      await page.getByRole('button', { name: /ادامه/ }).click();
      await page.waitForTimeout(350);
      continue;
    }
    const check = page.getByRole('button', { name: /بررسی/ });
    if (await check.count()) {
      const firstChoice = page.locator('button').filter({ hasText: /^[۰-۹0-9]+$/ }).first();
      if (await firstChoice.count()) await firstChoice.click();
      await check.click();
      await page.waitForTimeout(350);
      if (await page.getByRole('button', { name: 'ادامه' }).count()) {
        await page.getByRole('button', { name: 'ادامه' }).click();
      } else if (await page.getByRole('button', { name: /دوباره/ }).count()) {
        await page.getByRole('button', { name: /دوباره/ }).click();
        const other = page.locator('button').filter({ hasText: /^[۰-۹0-9]+$/ }).nth(1);
        if (await other.count()) await other.click();
        if (await check.count()) await check.click();
        await page.waitForTimeout(350);
        if (await page.getByRole('button', { name: 'ادامه' }).count()) {
          await page.getByRole('button', { name: 'ادامه' }).click();
        }
      }
    }
  }
  await page.waitForTimeout(600);
  await snap(page, '10-ex-number-line.png');

  await seed(page, progress({
    currentTrack: 'math',
    completedLessons: ['m1l1'],
    xp: 20,
    streak: 5,
  }));
  await page.goto(BASE + '/lesson-complete');
  await page.waitForTimeout(800);
  await snap(page, '13-lesson-complete.png');

  await seed(page, progress({ streak: 5, dailyLessonsCompleted: 1, dailyGoal: 2 }));
  await page.goto(BASE + '/streak');
  await page.waitForSelector('text=پیشرفت');
  await snap(page, '14-streak.png');

  await seed(page, progress({
    streak: 5,
    xp: 340,
    completedLessons: ['m1l1', 'm1l2', 'a2l1'],
    name: 'مادر جان',
    avatar: '🌷',
  }));
  await page.goto(BASE + '/profile');
  await page.waitForSelector('text=من');
  await snap(page, '15-profile.png');

  await browser.close();
  console.log('done ->', OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
