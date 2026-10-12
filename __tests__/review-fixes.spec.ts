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
    const grid = page.locator('.picture-grid');
    const cards = page.locator('.picture-grid .object-choice-card');
    await expect(cards).toHaveCount(3);

    const checkBox = await check.boundingBox();
    const gridBox = await grid.boundingBox();
    const boxes = (await Promise.all([0, 1, 2].map((index) => cards.nth(index).boundingBox()))).filter(
      (box): box is NonNullable<typeof box> => Boolean(box)
    );
    expect(checkBox && gridBox && boxes.length === 3).toBeTruthy();

    expect(gridBox!.x).toBeGreaterThanOrEqual(20);
    expect(Math.abs(gridBox!.x - checkBox!.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(gridBox!.width - checkBox!.width)).toBeLessThanOrEqual(2);

    const ordered = [...boxes].sort((left, right) => left.x - right.x);
    const gap = ordered[1].x - (ordered[0].x + ordered[0].width);
    expect(gap).toBeGreaterThanOrEqual(11);
    expect(gap).toBeLessThanOrEqual(13);

    const layout = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.picture-grid .object-choice-card')];
      const sizes = cards.map((card) => {
        const item = card.querySelector('.object-cluster > .illus') as HTMLElement | null;
        return item?.getBoundingClientRect().width ?? 0;
      });
      const three = cards.find(
        (element) => element.querySelectorAll('.object-cluster > .illus').length === 3
      );
      if (!three) return null;
      const cardBox = three.getBoundingClientRect();
      const dots = [...three.querySelectorAll('.object-cluster > .illus')]
        .map((dot) => dot.getBoundingClientRect())
        .sort((left, right) => left.y - right.y || left.x - right.x);
      const unique = new Set(sizes.map((size) => Math.round(size)));
      return {
        sizes,
        unique: unique.size,
        cardX: cardBox.x,
        cardRight: cardBox.right,
        firstDotX: dots[0]?.x ?? 0,
        lastDotRight: Math.max(...dots.map((dot) => dot.right)),
        cols: Number.parseInt(
          (three.querySelector('.object-cluster') as HTMLElement | null)?.style.getPropertyValue(
            '--object-cols'
          ) || '0',
          10
        ),
      };
    });
    expect(layout).toBeTruthy();
    expect(layout!.sizes).toHaveLength(3);
    expect(layout!.unique).toBe(1);
    expect(layout!.sizes[0] ?? 0).toBeGreaterThanOrEqual(32);
    expect(layout!.firstDotX).toBeGreaterThanOrEqual(layout!.cardX);
    expect(layout!.lastDotRight).toBeLessThanOrEqual(layout!.cardRight);
  });

  test('profile path rows and the slower chip stay at least 48px', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const today = new Date().toISOString().split('T')[0];
      const value = {
        currentTrack: 'math',
        onboarded: true,
        completedLessons: ['m1l1', 'm1l2'],
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

    await page.goto('/profile');
    await expect(page.getByText('سرعت صدا')).toBeVisible();
    const mathPath = page.getByRole('button', { name: 'مسیر عددها' });
    const alphabetPath = page.getByRole('button', { name: 'ب الفبا' });
    expect((await mathPath.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
    expect((await alphabetPath.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);

    await page.goto('/lesson/m1l3?ex=6');
    const slow = page.locator('.slow-btn');
    await expect(slow).toBeVisible();
    expect((await slow.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
    const turtle = slow.locator('svg');
    await expect(turtle).toBeVisible();
    const turtleBox = await turtle.boundingBox();
    expect(turtleBox?.width ?? 0).toBeGreaterThanOrEqual(24);
    expect(turtleBox?.height ?? 0).toBeGreaterThanOrEqual(24);
    await expect(turtle.locator('ellipse').first()).toHaveAttribute('fill', '#3E9A00');
  });

  test('gallery object items stay at least 32px and wrap after five', async ({ page }) => {
    await page.goto('/dev/object-cards');
    await expect(page.locator('[data-object-gallery]')).toBeVisible();
    const sizes = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.object-cluster > .illus, .ten-frame-cell .illus')];
      return items.map((item) => Math.round(item.getBoundingClientRect().width));
    });
    expect(sizes.length).toBeGreaterThan(20);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(32);

    const tenApples = page.locator('[data-gallery-section="match_pairs"] [data-count="10"] .object-cluster');
    await expect(tenApples).toHaveAttribute('data-layout', 'row');
    await expect(tenApples).toHaveAttribute('data-count', '10');
    const tenLayout = await tenApples.evaluate((element) => ({
      cols: (element as HTMLElement).style.getPropertyValue('--object-cols'),
      rows: (element as HTMLElement).style.getPropertyValue('--object-rows'),
      size: Number.parseInt((element as HTMLElement).style.getPropertyValue('--object-size') || '0', 10),
    }));
    expect(tenLayout.cols).toBe('5');
    expect(tenLayout.rows).toBe('2');
    expect(tenLayout.size).toBeGreaterThanOrEqual(32);
  });
});
