import { test, expect } from './e2e-audio-stub';

test.describe('Codex review navigation fixes', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opening a lesson URL without onboarding redirects home', async ({ page }) => {
    await page.goto('/lesson/m1l1');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('خوش آمدید')).toBeVisible();
  });

  test('the lesson-complete replay button returns to that lesson', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('گوش کنید')).toBeVisible();
    await page.getByRole('button', { name: /شروع/ }).click();
    await expect(page.getByText('یک تصویر برای خودتان انتخاب کنید')).toBeVisible();
    await page.getByRole('button', { name: '🌷' }).click();
    await page.getByRole('button', { name: 'ادامه' }).click();
    await expect(page.getByText('امروز چه یاد بگیریم؟')).toBeVisible();
    await page.getByRole('button', { name: /عددها و حساب/ }).click();
    await page.waitForURL('**/home');

    await page.goto('/lesson-complete?xp=10&lesson=سلام&id=m1l1');
    await page.getByRole('button', { name: 'همین درس را دوباره بخوانیم' }).click();
    await expect(page).toHaveURL(/\/lesson\/m1l1/);
  });

  test('home chips and bottom nav stay tappable at 48px', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /شروع/ }).click();
    await page.getByRole('button', { name: 'ادامه' }).click();
    await page.getByRole('button', { name: /عددها و حساب/ }).click();
    await page.waitForURL('**/home');

    const chip = page.locator('.chip').first();
    const chipBox = await chip.boundingBox();
    expect(chipBox?.height ?? 0).toBeGreaterThanOrEqual(48);

    const nav = page.locator('nav.nav');
    await expect(nav).toBeVisible();
    const position = await nav.evaluate((element) => getComputedStyle(element).position);
    expect(['sticky', 'fixed']).toContain(position);

    await page.getByRole('button', { name: 'من' }).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByLabel('پخش خودکار')).toHaveCount(0);

    const tile = page.locator('.letter-tile').first();
    const tileBox = await tile.boundingBox();
    expect(tileBox?.width ?? 0).toBeGreaterThanOrEqual(56);
    expect(tileBox?.height ?? 0).toBeGreaterThanOrEqual(56);

    const pad = await page.locator('.content').evaluate((element) => parseFloat(getComputedStyle(element).paddingBottom));
    expect(pad).toBeGreaterThanOrEqual(98 + 16);
  });

  test('lesson-complete continue opens home with the next lesson in view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /شروع/ }).click();
    await page.getByRole('button', { name: 'ادامه' }).click();
    await page.getByRole('button', { name: /عددها و حساب/ }).click();
    await page.waitForURL('**/home');

    await page.goto('/lesson-complete?xp=10&lesson=سلام&id=m1l1');
    await page.getByRole('button', { name: 'ادامه' }).click();
    await expect(page).toHaveURL(/\/home\?focus=next/);
    await expect(page.locator('[data-next-lesson="true"]')).toBeInViewport();
  });

  test('subitize cards share the lesson content inset', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const today = new Date().toISOString().split('T')[0];
      const value = {
        currentTrack: 'math',
        onboarded: true,
        completedLessons: ['m1l1'],
        completedUnits: [],
        xp: 40,
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
      sessionStorage.setItem('pl-audio-unlocked', '1');
      await new Promise<void>((resolve, reject) => {
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
          tx.onerror = () => reject(tx.error ?? new Error('progress write failed'));
        };
        req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
      });
    });

    await page.goto('/lesson/m1l2?ex=1');
    await expect(page.getByText('با یک نگاه')).toBeVisible();

    const check = page.getByRole('button', { name: /بررسی/ });
    const cards = page.locator('.picture-grid .object-choice-card');
    await expect(cards).toHaveCount(3);

    const checkBox = await check.boundingBox();
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    const third = await cards.nth(2).boundingBox();
    expect(checkBox && first && second && third).toBeTruthy();

    expect(first!.x).toBeGreaterThanOrEqual(20);
    expect(Math.abs(first!.x - checkBox!.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(third!.x + third!.width - (checkBox!.x + checkBox!.width))).toBeLessThanOrEqual(2);

    const gap = second!.x - (first!.x + first!.width);
    expect(gap).toBeGreaterThanOrEqual(11);
    expect(gap).toBeLessThanOrEqual(13);

    const dots = page.locator('.picture-grid .object-cluster > .illus');
    const dotBox = await dots.first().boundingBox();
    expect(dotBox?.width ?? 0).toBeGreaterThanOrEqual(23);
    expect(dotBox?.width ?? 0).toBeLessThanOrEqual(25);
  });
});
