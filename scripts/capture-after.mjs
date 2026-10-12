import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = 'docs/screenshots/design-match/after';

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
    avatar: 'tulip',
    name: 'مادر جان',
    startDate: '2026-09-23T00:00:00.000Z',
    speechRate: 1,
    autoplay: true,
    ...overrides,
  };
}

async function hideChrome(page) {
  await page.addStyleTag({
    content: 'nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }',
  });
}

async function snap(page, name) {
  await hideChrome(page);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log('wrote', name);
}

async function seed(page, data) {
  await page.goto(BASE + '/');
  await page.evaluate(async (value) => {
    sessionStorage.setItem('pl-audio-unlocked', '1');
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
  page.setDefaultTimeout(15000);

  await page.goto(BASE + '/');
  await page.waitForSelector('text=خوش آمدید', { timeout: 20000 });
  await snap(page, '01-onboarding-welcome.png');

  await page.getByRole('button', { name: /شروع/ }).click();
  await page.waitForSelector('text=یک تصویر برای خودتان انتخاب کنید');
  await page.getByRole('button', { name: '🌷' }).click();
  await snap(page, '02-onboarding-avatar.png');

  await page.getByRole('button', { name: 'ادامه' }).click();
  await page.waitForSelector('text=امروز چه یاد بگیریم؟');
  await snap(page, '03-track-picker.png');

  await page.getByRole('button', { name: /عددها و حساب/ }).click();
  await page.waitForURL('**/home');
  await page.waitForSelector('text=خانه');
  await snap(page, '04-lesson-path.png');

  await seed(page, progress());
  await page.goto(BASE + '/lesson/m1l1?ex=1');
  await page.waitForTimeout(500);
  await snap(page, '05-ex-tap-picture.png');

  const option = page.getByRole('button', { name: '🍞🍞' });
  if (await option.count()) {
    await option.click({ timeout: 4000 }).catch(() => {});
  } else {
    await page.locator('.card').first().click().catch(() => {});
  }
  const check = page.getByRole('button', { name: /بررسی/ });
  if (await check.count()) {
    await check.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(400);
    await snap(page, '11-feedback-correct.png');
  }

  await seed(page, progress({ completedLessons: ['m1l1', 'm1l2'] }));
  await page.goto(BASE + '/lesson/m1l3?ex=1');
  await page.waitForTimeout(500);
  await snap(page, '08-ex-count-objects.png');
  const wrong = page.getByRole('button', { name: '۲', exact: true });
  if (await wrong.count()) {
    await wrong.click({ timeout: 4000 }).catch(() => {});
    if (await check.count()) await check.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(400);
    await snap(page, '12-feedback-retry.png');
  }

  await seed(page, progress({ currentTrack: 'alphabet', completedLessons: ALPHA_BEFORE_A2L1 }));
  await page.goto(BASE + '/lesson/a2l1?ex=4');
  await page.waitForTimeout(500);
  await snap(page, '07-ex-trace-letter.png');

  await page.goto(BASE + '/lesson/a2l1?ex=5');
  await page.waitForTimeout(500);
  await snap(page, '06-ex-listen-letter.png');

  await seed(page, progress({ completedLessons: ['m1l1', 'm1l2', 'm1l3'] }));
  await page.goto(BASE + '/lesson/m1l4?ex=1');
  await page.waitForTimeout(500);
  await snap(page, '09-ex-drag-match.png');

  await seed(page, progress({ completedLessons: MATH_BEFORE_M3L5 }));
  await page.goto(BASE + '/lesson/m3l5?ex=3');
  await page.waitForTimeout(500);
  await snap(page, '10-ex-number-line.png');

  await seed(page, progress({ completedLessons: ['m1l1'], xp: 20, streak: 5 }));
  await page.goto(BASE + '/lesson-complete');
  await page.waitForTimeout(600);
  await snap(page, '13-lesson-complete.png');

  await seed(page, progress({ streak: 5, dailyLessonsCompleted: 1, dailyGoal: 2 }));
  await page.goto(BASE + '/streak');
  await page.waitForSelector('text=پیشرفت');
  await snap(page, '14-streak.png');

  await seed(page, progress({
    streak: 5,
    xp: 340,
    completedLessons: ['m1l1', 'm1l2', 'a2l1', 'a2l2', 'a2l3', 'a2l4'],
    name: 'مادر جان',
    avatar: 'tulip',
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
