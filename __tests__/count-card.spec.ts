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
    const tile = card.querySelector('.cc-tile') as HTMLElement | null;
    const tileBox = tile?.getBoundingClientRect();
    const speaker = card.querySelector('.cc-spk') as HTMLElement | null;
    const speakerBox = speaker?.getBoundingClientRect();
    const itemNodes = [...card.querySelectorAll('.cc-item')] as HTMLElement[];
    const items = itemNodes.map((node) => {
      const box = node.getBoundingClientRect();
      const overflow = zoneBox
        ? Math.max(
            zoneBox.top - box.top,
            box.right - zoneBox.right,
            box.bottom - zoneBox.bottom,
            zoneBox.left - box.left,
            0
          )
        : 0;
      return {
        width: Math.round(node.offsetWidth),
        height: Math.round(node.offsetHeight),
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        overflow,
      };
    });
    let minGap = Infinity;
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 0.5 && overlapY > 0.5) {
          minGap = Math.min(minGap, -Math.min(overlapX, overlapY));
          continue;
        }
        const sameRow = Math.abs(a.top - b.top) < 2;
        const sameCol = Math.abs(a.left - b.left) < 2;
        if (sameRow) {
          minGap = Math.min(minGap, Math.max(a.left, b.left) - Math.min(a.right, b.right));
        } else if (sameCol) {
          minGap = Math.min(minGap, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
        }
      }
    }
    const speakerOnTile =
      tileBox && speakerBox
        ? !(
            speakerBox.right <= tileBox.left + 0.5 ||
            speakerBox.left >= tileBox.right - 0.5 ||
            speakerBox.bottom <= tileBox.top + 0.5 ||
            speakerBox.top >= tileBox.bottom - 0.5
          )
        : false;
    const check = card.querySelector('[data-cc-check]') as HTMLElement | null;
    const checkBox = check?.getBoundingClientRect();
    const checkOnTile =
      tileBox && checkBox
        ? !(
            checkBox.right <= tileBox.left + 0.5 ||
            checkBox.left >= tileBox.right - 0.5 ||
            checkBox.bottom <= tileBox.top + 0.5 ||
            checkBox.top >= tileBox.bottom - 0.5
          )
        : false;
    return {
      count: Number(card.getAttribute('data-count') || '0'),
      cardWidth: Math.round(cardBox.width),
      cardHeight: Math.round(cardBox.height),
      overflowX: Math.max(
        0,
        Math.round(cardBox.right - (card.parentElement?.getBoundingClientRect().right ?? cardBox.right))
      ),
      minItem: items.length ? Math.min(...items.map((item) => item.width)) : 0,
      maxItem: items.length ? Math.max(...items.map((item) => item.width)) : 0,
      itemOverflow: items.length ? Math.max(...items.map((item) => item.overflow)) : 0,
      minGap: items.length > 1 ? minGap : 12,
      speakerSize: speakerBox ? Math.round(Math.min(speakerBox.width, speakerBox.height)) : 0,
      speakerOnTile,
      checkOnTile,
      wordSize: tile
        ? Number.parseFloat(getComputedStyle(tile.querySelector('.cc-word') as Element).fontSize)
        : 0,
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
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/dev/count-cards');
      await page.addStyleTag({
        content: 'nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }',
      });
      await expect(page.locator('[data-count-gallery]')).toBeVisible();
      await page.waitForTimeout(800);
      const first = await page.evaluate(measureCountCards);
      expect(first).toHaveLength(10);
      await page.screenshot({
        path: `/opt/cursor/artifacts/screenshots/count-1-10-${viewport.width}.png`,
        fullPage: true,
      });
      await page.waitForTimeout(400);
      const second = await page.evaluate(measureCountCards);
      expect(second.map((card) => card.sizes)).toEqual(first.map((card) => card.sizes));
      for (const card of second) {
        expect(card.cardWidth, `n=${card.count}`).toBeLessThanOrEqual(viewport.width);
        expect(card.itemOverflow, `n=${card.count}`).toBeLessThanOrEqual(2);
        expect(card.minItem, `n=${card.count}`).toBeGreaterThanOrEqual(32);
        expect(card.maxItem, `n=${card.count}`).toBe(card.minItem);
        expect(card.minGap, `n=${card.count}`).toBeGreaterThanOrEqual(8);
        expect(card.overflowX, `n=${card.count}`).toBeLessThanOrEqual(2);
        expect(card.speakerSize, `n=${card.count}`).toBeGreaterThanOrEqual(48);
        expect(card.speakerOnTile, `n=${card.count}`).toBe(false);
        expect(card.wordSize, `n=${card.count}`).toBeGreaterThanOrEqual(20);
      }
    });
  }

  test('intro fits in one 375x667 viewport', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await seedProgress(page);
    await page.goto('/lesson/m1l1');
    await page.addStyleTag({
      content: 'nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }',
    });
    await expect(page.getByRole('button', { name: 'یک سیب' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'دو گنجشک' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'سه انار' })).toBeVisible();
    await page.waitForTimeout(500);
    const stats = await page.evaluate(() => {
      const phone = document.querySelector('.app-phone') as HTMLElement | null;
      const content = document.querySelector('.content') as HTMLElement | null;
      const cards = [...document.querySelectorAll('[data-count-card]')];
      const continueBtn = document.querySelector('[data-cc-continue]') as HTMLButtonElement | null;
      const hoopoe = document.querySelector('.cc-hoda-speaker') as HTMLElement | null;
      const helper = document.querySelector('.cc-helper')?.textContent ?? '';
      const contentStyle = content ? getComputedStyle(content) : null;
      return {
        phoneH: phone?.clientHeight ?? 0,
        contentScroll: content ? Math.max(0, content.scrollHeight - content.clientHeight) : 99,
        cardCount: cards.length,
        heading: document.querySelector('.prompt h2')?.textContent ?? '',
        continueNativeDisabled: continueBtn?.disabled ?? false,
        continueAriaDisabled: continueBtn?.getAttribute('aria-disabled') === 'true',
        hoopoePresent: Boolean(hoopoe),
        helper,
        sidePad: contentStyle ? Number.parseFloat(contentStyle.paddingInlineStart) : 0,
      };
    });
    expect(stats.cardCount).toBe(3);
    expect(stats.heading).toContain('فریبا جان');
    expect(stats.contentScroll).toBeLessThanOrEqual(2);
    expect(stats.phoneH).toBeLessThanOrEqual(667);
    expect(stats.continueNativeDisabled).toBe(false);
    expect(stats.continueAriaDisabled).toBe(true);
    expect(stats.hoopoePresent).toBe(true);
    expect(stats.helper).toContain('هر کارت را بزنید تا عددش را بشنوید');
    expect(stats.sidePad).toBe(24);
    await page.screenshot({
      path: '/opt/cursor/artifacts/screenshots/intro-375x667.png',
      fullPage: false,
    });
  });

  test('intro at 412x915 centers the stack', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 412, height: 915 });
    await seedProgress(page);
    await page.goto('/lesson/m1l1');
    await page.addStyleTag({
      content: 'nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }',
    });
    await expect(page.getByRole('button', { name: 'یک سیب' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: '/opt/cursor/artifacts/screenshots/intro-412.png',
      fullPage: false,
    });
  });

  test('Continue stays gated until all three cards are heard', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 812 });
    await seedProgress(page);
    await page.goto('/lesson/m1l1');
    await page.addStyleTag({
      content: 'nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }',
    });
    const continueBtn = page.locator('[data-cc-continue]');
    await expect(continueBtn).toHaveAttribute('aria-disabled', 'true');
    await expect(continueBtn).toBeEnabled();
    await page.getByRole('button', { name: 'یک سیب' }).click();
    await expect(page.locator('[data-count-card][data-count="1"]')).toHaveAttribute(
      'data-heard',
      'true',
      { timeout: 10000 }
    );
    const checkOverlap = await page.evaluate(() => {
      const card = document.querySelector('[data-count-card][data-count="1"]') as HTMLElement;
      const tile = card.querySelector('.cc-tile') as HTMLElement;
      const check = card.querySelector('[data-cc-check]') as HTMLElement;
      const t = tile.getBoundingClientRect();
      const c = check.getBoundingClientRect();
      return !(
        c.right <= t.left + 0.5 ||
        c.left >= t.right - 0.5 ||
        c.bottom <= t.top + 0.5 ||
        c.top >= t.bottom - 0.5
      );
    });
    expect(checkOverlap).toBe(false);
    await expect(continueBtn).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: 'دو گنجشک' }).click();
    await expect(page.locator('[data-count-card][data-count="2"]')).toHaveAttribute(
      'data-heard',
      'true',
      { timeout: 10000 }
    );
    await expect(continueBtn).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: 'سه انار' }).click();
    await expect(page.locator('[data-count-card][data-count="3"]')).toHaveAttribute(
      'data-heard',
      'true',
      { timeout: 10000 }
    );
    await expect(continueBtn).toHaveAttribute('aria-disabled', 'false');
  });
});
