import { test, expect } from './e2e-audio-stub';

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 412, height: 915 },
] as const;

async function seedProgress(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    const today = new Date().toISOString().split('T')[0];
    const progress = {
      currentTrack: 'math',
      onboarded: true,
      completedLessons: [],
      completedUnits: [],
      xp: 0,
      streak: 0,
      streakBest: 0,
      lastActivityDate: today,
      dailyGoal: 2,
      dailyLessonsCompleted: 0,
      restDaysUsed: 0,
      weakItems: [],
      avatar: 'tulip',
      name: 'فریبا جون',
      startDate: '2026-01-01T00:00:00.000Z',
      speechRate: 1,
      autoplay: false,
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
        tx.objectStore('progress').put(progress, 'current');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error ?? new Error('progress write failed'));
      };
      req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
    });
  });
}

function measureCountCards() {
  const cards = [...document.querySelectorAll('[data-count-card]')] as HTMLElement[];
  return cards.map((card) => {
    const cardBox = card.getBoundingClientRect();
    const zone = card.querySelector('.cc-zone') as HTMLElement | null;
    const zoneBox = zone?.getBoundingClientRect();
    const items = [...card.querySelectorAll('.cc-item')].map((item) => {
      const box = item.getBoundingClientRect();
      const overflow = zoneBox
        ? Math.max(
            zoneBox.top - box.top,
            box.right - zoneBox.right,
            box.bottom - zoneBox.bottom,
            zoneBox.left - box.left,
            0
          )
        : 0;
      return { width: Math.round(box.width), overflow };
    });
    return {
      count: Number(card.getAttribute('data-count') || '0'),
      cardWidth: Math.round(cardBox.width),
      cardHeight: Math.round(cardBox.height),
      overflowX: Math.max(0, Math.round(cardBox.right - (card.parentElement?.getBoundingClientRect().right ?? cardBox.right))),
      minItem: items.length ? Math.min(...items.map((item) => item.width)) : 0,
      itemOverflow: items.length ? Math.max(...items.map((item) => item.overflow)) : 0,
      sizes: items.map((item) => item.width).join(','),
    };
  });
}

test.describe('Count cards', () => {
  for (const viewport of VIEWPORTS) {
    test(`gallery 1-10 does not overflow and stays stable at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dev/count-cards');
      await expect(page.locator('[data-count-gallery]')).toBeVisible();
      await page.waitForTimeout(300);
      const first = await page.evaluate(measureCountCards);
      expect(first).toHaveLength(10);
      await page.waitForTimeout(400);
      const second = await page.evaluate(measureCountCards);
      expect(second.map((card) => card.sizes)).toEqual(first.map((card) => card.sizes));
      for (const card of second) {
        expect(card.cardWidth, `n=${card.count}`).toBeLessThanOrEqual(viewport.width);
        expect(card.itemOverflow, `n=${card.count}`).toBeLessThanOrEqual(2);
        expect(card.minItem, `n=${card.count}`).toBeGreaterThanOrEqual(36);
        expect(card.overflowX, `n=${card.count}`).toBeLessThanOrEqual(2);
      }
    });
  }

  test('intro fits in one 375x667 viewport', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await seedProgress(page);
    await page.goto('/lesson/m1l1');
    await expect(page.getByRole('button', { name: 'یک سیب' })).toBeVisible();
    const stats = await page.evaluate(() => {
      const phone = document.querySelector('.app-phone') as HTMLElement | null;
      const content = document.querySelector('.content') as HTMLElement | null;
      const cards = [...document.querySelectorAll('[data-count-card]')];
      return {
        phoneH: phone?.clientHeight ?? 0,
        contentScroll: content ? Math.max(0, content.scrollHeight - content.clientHeight) : 99,
        cardCount: cards.length,
        heading: document.querySelector('.prompt h2')?.textContent ?? '',
      };
    });
    expect(stats.cardCount).toBe(3);
    expect(stats.heading).toContain('فریبا جان');
    expect(stats.contentScroll).toBeLessThanOrEqual(2);
    expect(stats.phoneH).toBeLessThanOrEqual(667);
  });
});
