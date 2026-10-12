import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = process.env.SHOT_DIR || 'docs/screenshots/fixes/before';

mkdirSync(OUT, { recursive: true });

function isoToday() {
  return new Date().toISOString().split('T')[0];
}

function progress(overrides = {}) {
  return {
    currentTrack: 'math',
    onboarded: true,
    completedLessons: [],
    completedUnits: [],
    xp: 40,
    streak: 3,
    streakBest: 3,
    lastActivityDate: isoToday(),
    dailyGoal: 2,
    dailyLessonsCompleted: 1,
    restDaysUsed: 0,
    weakItems: [],
    avatar: 'tulip',
    name: 'فریبا جون',
    startDate: '2026-01-01T00:00:00.000Z',
    speechRate: 1,
    autoplay: true,
    activityDates: [isoToday()],
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
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log('wrote', `${OUT}/${name}`);
}

async function seed(page, data) {
  await page.goto(BASE + '/');
  await page.evaluate(async (value) => {
    sessionStorage.setItem('pl-audio-unlocked', '1');
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
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, data);
}

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
  page.setDefaultTimeout(20000);

  await page.goto(BASE + '/');
  await page.waitForSelector('text=خوش آمدید', { timeout: 20000 });
  await snap(page, '01-onboarding-welcome.png');

  await seed(page, progress({ completedLessons: ['m1l1'] }));
  await page.goto(BASE + '/lesson/m1l2?ex=1');
  await page.waitForSelector('text=با یک نگاه');
  await snap(page, '02-math-m1l2e2.png');

  await page.goto(BASE + '/profile');
  await page.waitForSelector('text=سرعت صدا');
  await snap(page, '03-profile.png');

  await seed(page, progress({ currentTrack: 'alphabet', completedLessons: ['a1l1'] }));
  await page.goto(BASE + '/lesson/a1l2?ex=1');
  await page.waitForSelector('text=آهسته‌تر');
  await snap(page, '04-slow-chip.png');

  await seed(page, progress({ completedLessons: ['m1l1', 'm1l2', 'm1l3'] }));
  await page.goto(BASE + '/home');
  await page.waitForSelector('text=خانه');
  await snap(page, '05-home-nav.png');

  await page.goto(`${BASE}/lesson-complete?xp=10&lesson=${encodeURIComponent('یک، دو، سه')}&id=m1l1`);
  await page.waitForSelector('text=ادامه');
  await snap(page, '06-lesson-complete.png');

  await seed(page, progress({ completedLessons: ['m1l1'] }));
  await page.goto(BASE + '/home?focus=next');
  await page.waitForSelector('[data-next-lesson="true"]');
  await snap(page, '08-home-next-lesson.png');

  await page.goto(BASE + '/dev/object-cards');
  await page.waitForSelector('[data-object-gallery]');
  await hideChrome(page);
  await page.waitForTimeout(300);
  await page.locator('[data-object-gallery]').screenshot({
    path: `${OUT}/07-math-cards-1-to-10.png`,
  });
  console.log('wrote', `${OUT}/07-math-cards-1-to-10.png`);

  await browser.close();
  console.log('done ->', OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
