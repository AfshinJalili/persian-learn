import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const OUT = 'docs/screenshots/fixes/after/qa';
mkdirSync(OUT, { recursive: true });

const MATH_UNIT1 = ['m1l1', 'm1l2', 'm1l3', 'm1l4', 'm1l5'];
const MATH_BEFORE_M2L3 = [...MATH_UNIT1, 'm2l1', 'm2l2'];
const MATH_BEFORE_M2L4 = [...MATH_BEFORE_M2L3, 'm2l3'];
const MATH_BEFORE_M3L2 = [...MATH_UNIT1, 'm2l1', 'm2l2', 'm2l3', 'm2l4', 'm2l5', 'm3l1'];
const MATH_BEFORE_M3L3 = [...MATH_BEFORE_M3L2, 'm3l2'];

function progress(completedLessons, currentTrack = 'math') {
  const today = new Date().toISOString().split('T')[0];
  return {
    currentTrack,
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

function measureScript() {
  const cardOf = (item) =>
    item.closest(
      '.object-choice-card, .object-count-card, .match-object-apples, .ten-frame-cell, [data-digit-display], [data-dice-face]'
    );
  const innerOf = (card) => {
    const style = getComputedStyle(card);
    return (
      card.clientWidth -
      (Number.parseFloat(style.paddingLeft) || 0) -
      (Number.parseFloat(style.paddingRight) || 0)
    );
  };
  const singles = [...document.querySelectorAll('.object-cluster[data-count="1"] > .illus')].map((item) => {
    const card = cardOf(item);
    const inner = card ? innerOf(card) : 0;
    const width = Math.round(item.getBoundingClientRect().width);
    return { width, inner: Math.round(inner), ratio: inner > 0 ? Number((width / inner).toFixed(2)) : 0 };
  });
  const sizes = [...document.querySelectorAll('.object-cluster > .illus')].map((item) =>
    Math.round(item.getBoundingClientRect().width)
  );
  const tray = document.querySelector('[data-match-tray]');
  const check = [...document.querySelectorAll('button')].find((el) => /بررسی/.test(el.textContent || ''));
  const trayBox = tray?.getBoundingClientRect();
  const checkBox = check?.getBoundingClientRect();
  return {
    singles,
    minItem: sizes.length ? Math.min(...sizes) : 0,
    maxItem: sizes.length ? Math.max(...sizes) : 0,
    trayAboveCheck: Boolean(trayBox && checkBox && trayBox.bottom <= checkBox.top + 1),
  };
}

async function snap(context, { width, height, tag, name, lessons, track, path, wait }) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  await seed(page, progress(lessons, track));
  await page.goto(BASE + path);
  await page.waitForSelector(wait, { timeout: 15000 });
  await page.waitForTimeout(400);
  const info = await page.evaluate(measureScript);
  console.log(`${name}`, JSON.stringify(info));
  await page.screenshot({ path: `${OUT}/${name.replace('WIDTH', tag)}`, fullPage: false });
  console.log('wrote', name.replace('WIDTH', tag));
  await page.close();
  return info;
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
  const shots = [
    { name: 'lesson-m1l3e2-count-1-WIDTH.png', lessons: ['m1l1', 'm1l2'], path: '/lesson/m1l3?ex=1', wait: '.object-count-card' },
    { name: 'lesson-m1l1e3-tap-1-WIDTH.png', lessons: [], path: '/lesson/m1l1?ex=2', wait: '.object-choice-card' },
    { name: 'lesson-a1l1e2-tap-picture-WIDTH.png', lessons: [], track: 'alphabet', path: '/lesson/a1l1?ex=1', wait: '.object-choice-card' },
    { name: 'lesson-m2l3e2-dice-WIDTH.png', lessons: MATH_BEFORE_M2L3, path: '/lesson/m2l3?ex=1', wait: '.object-count-card' },
    { name: 'lesson-m2l4e9-fingers-WIDTH.png', lessons: MATH_BEFORE_M2L4, path: '/lesson/m2l4?ex=8', wait: '[data-match-tray]' },
    { name: 'lesson-m3l2e9-match-6-9-WIDTH.png', lessons: MATH_BEFORE_M3L2, path: '/lesson/m3l2?ex=8', wait: '[data-match-tray]' },
    { name: 'lesson-m1l4e2-match-1-3-WIDTH.png', lessons: ['m1l1', 'm1l2', 'm1l3'], path: '/lesson/m1l4?ex=1', wait: '[data-match-tray]' },
    { name: 'lesson-m2l1e9-match-2-5-WIDTH.png', lessons: MATH_UNIT1, path: '/lesson/m2l1?ex=8', wait: '[data-match-tray]' },
    { name: 'lesson-m3l3e9-match-8-10-WIDTH.png', lessons: MATH_BEFORE_M3L3, path: '/lesson/m3l3?ex=8', wait: '[data-match-tray]' },
  ];

  for (const viewport of viewports) {
    for (const shot of shots) {
      await snap(context, { ...viewport, ...shot });
    }
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
