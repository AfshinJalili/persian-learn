import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const OUT = 'docs/screenshots/fixes/after/qa';

mkdirSync(OUT, { recursive: true });

const MATH_UNIT1 = ['m1l1', 'm1l2', 'm1l3', 'm1l4', 'm1l5'];
const MATH_BEFORE_M3L2 = [...MATH_UNIT1, 'm2l1', 'm2l2', 'm2l3', 'm2l4', 'm2l5', 'm3l1'];
const MATH_BEFORE_M3L3 = [...MATH_BEFORE_M3L2, 'm3l2'];

function progress(completedLessons) {
  const today = new Date().toISOString().split('T')[0];
  return {
    currentTrack: 'math',
    onboarded: true,
    completedLessons,
    completedUnits: [],
    xp: 400,
    streak: 3,
    streakBest: 3,
    lastActivityDate: today,
    dailyGoal: 2,
    dailyLessonsCompleted: 1,
    restDaysUsed: 0,
    weakItems: [],
    avatar: 'tulip',
    name: 'فریبا جون',
    startDate: '2026-01-01T00:00:00.000Z',
    speechRate: 1,
    autoplay: true,
    activityDates: [today],
  };
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

async function measure(page, label) {
  const info = await page.evaluate(() => {
    const tray = document.querySelector('[data-match-tray]');
    const check = document.querySelector('.bottom, .btn');
    const checkBtn = [...document.querySelectorAll('button')].find((el) => /بررسی/.test(el.textContent || ''));
    const items = [...document.querySelectorAll('.match-object-apples .object-cluster > .illus')].map((item) =>
      Math.round(item.getBoundingClientRect().width)
    );
    const clusters = [...document.querySelectorAll('.match-object-apples .object-cluster')].map((cluster) => ({
      count: cluster.getAttribute('data-count'),
      cols: cluster.style.getPropertyValue('--object-cols'),
      rows: cluster.style.getPropertyValue('--object-rows'),
      size: Number.parseInt(cluster.style.getPropertyValue('--object-size') || '0', 10),
    }));
    const trayBox = tray?.getBoundingClientRect();
    const checkBox = (checkBtn ?? check)?.getBoundingClientRect();
    return {
      minItem: items.length ? Math.min(...items) : 0,
      maxItem: items.length ? Math.max(...items) : 0,
      itemCount: items.length,
      clusters,
      trayBottom: trayBox ? trayBox.bottom : null,
      checkTop: checkBox ? checkBox.top : null,
      trayAboveCheck: trayBox && checkBox ? trayBox.bottom <= checkBox.top + 1 : false,
    };
  });
  console.log(label, JSON.stringify(info));
  if (info.minItem < 32) {
    throw new Error(`${label} item size ${info.minItem} < 32`);
  }
  if (info.trayAboveCheck === false) {
    throw new Error(`${label} tray not above بررسی`);
  }
}

async function snapLesson(context, width, height, name, completedLessons, path) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await seed(page, progress(completedLessons));
  await page.goto(BASE + path);
  await page.waitForSelector('[data-match-tray]');
  await page.waitForTimeout(400);
  await measure(page, name);
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log('wrote', name);
  await page.close();
}

async function snapGallery(context, width, height, name) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(BASE + '/dev/object-cards');
  const section = page.locator('[data-gallery-section="match_pairs"]');
  await section.waitFor();
  await page.waitForTimeout(300);
  const sizes = await page.evaluate(() => {
    const root = document.querySelector('[data-gallery-section="match_pairs"]');
    const items = [...(root?.querySelectorAll('.object-cluster > .illus') ?? [])].map((item) =>
      Math.round(item.getBoundingClientRect().width)
    );
    const layout = [...(root?.querySelectorAll('[data-count="4"] .object-cluster, [data-count="5"] .object-cluster') ?? [])].map(
      (cluster) => ({
        count: cluster.getAttribute('data-count'),
        cols: cluster.style.getPropertyValue('--object-cols'),
        rows: cluster.style.getPropertyValue('--object-rows'),
        size: Number.parseInt(cluster.style.getPropertyValue('--object-size') || '0', 10),
      })
    );
    return { minItem: Math.min(...items), layout };
  });
  console.log(name, JSON.stringify(sizes));
  if (sizes.minItem < 32) {
    throw new Error(`${name} gallery item size ${sizes.minItem} < 32`);
  }
  await section.screenshot({ path: `${OUT}/${name}` });
  console.log('wrote', name);
  await page.close();
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fa-IR',
  });

  const viewports = [
    { width: 375, height: 812, tag: '375' },
    { width: 412, height: 915, tag: '412' },
  ];

  for (const { width, height, tag } of viewports) {
    await snapLesson(
      context,
      width,
      height,
      `lesson-m3l2e9-match-6-9-${tag}.png`,
      MATH_BEFORE_M3L2,
      '/lesson/m3l2?ex=8'
    );
    await snapLesson(
      context,
      width,
      height,
      `lesson-m1l4e2-match-1-3-${tag}.png`,
      ['m1l1', 'm1l2', 'm1l3'],
      '/lesson/m1l4?ex=1'
    );
    await snapLesson(
      context,
      width,
      height,
      `lesson-m2l1e9-match-2-5-${tag}.png`,
      MATH_UNIT1,
      '/lesson/m2l1?ex=8'
    );
    await snapLesson(
      context,
      width,
      height,
      `lesson-m3l3e9-match-8-10-${tag}.png`,
      MATH_BEFORE_M3L3,
      '/lesson/m3l3?ex=8'
    );
    await snapGallery(context, width, height, `gallery-match-pairs-1-10-${tag}.png`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
