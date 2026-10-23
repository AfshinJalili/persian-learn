import { test, expect } from './e2e-audio-stub';

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 412, height: 915 },
] as const;

async function seedProgress(page: import('@playwright/test').Page) {
  // Seed from a page that does not run the app (see object-fill.spec).
  await page.goto('/manifest.json');
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
  const overflowOutside = (inner: DOMRect, outer: DOMRect) =>
    Math.max(
      outer.top - inner.top,
      inner.right - outer.right,
      inner.bottom - outer.bottom,
      outer.left - inner.left,
      0
    );
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
      const overflow = zoneBox ? overflowOutside(box, zoneBox) : 0;
      const cardOverflow = overflowOutside(box, cardBox);
      return {
        width: Math.round(node.offsetWidth),
        height: Math.round(node.offsetHeight),
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        overflow,
        cardOverflow,
      };
    });
    // Spec §3 overlap layout: same-row neighbours overlap by at most 22% of
    // the box (plus rounding); rows overlap by a few px.
    let maxRowOverlap = 0;
    for (let i = 0; i + 1 < items.length; i += 1) {
      const a = items[i];
      const b = items[i + 1];
      if (Math.abs(a.top - b.top) > 6) continue;
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      maxRowOverlap = Math.max(maxRowOverlap, overlapX / Math.min(a.width, b.width));
    }
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
    // The badge straddles the tile corner (spec §2) but must not cover the
    // numeral or the word.
    const textBoxes = [card.querySelector('.cc-num'), card.querySelector('.cc-word')]
      .filter(Boolean)
      .map((node) => (node as HTMLElement).getBoundingClientRect());
    const speakerOnText = speakerBox
      ? textBoxes.some(
          (t) =>
            !(
              speakerBox.right <= t.left + 0.5 ||
              speakerBox.left >= t.right - 0.5 ||
              speakerBox.bottom <= t.top + 0.5 ||
              speakerBox.top >= t.bottom - 0.5
            )
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
    const clusterLeft = items.length ? Math.min(...items.map((item) => item.left)) : cardBox.left;
    const clusterRight = items.length ? Math.max(...items.map((item) => item.right)) : cardBox.right;
    const clusterTop = items.length ? Math.min(...items.map((item) => item.top)) : cardBox.top;
    const clusterBottom = items.length ? Math.max(...items.map((item) => item.bottom)) : cardBox.bottom;
    const padTop = clusterTop - cardBox.top;
    const padBottom = cardBox.bottom - clusterBottom;
    const padStart = cardBox.right - clusterRight;
    const padEnd = clusterLeft - cardBox.left;
    let speakerItemGap = Infinity;
    if (speakerBox && items.length) {
      for (const item of items) {
        const overlapX = Math.min(item.right, speakerBox.right) - Math.max(item.left, speakerBox.left);
        const overlapY = Math.min(item.bottom, speakerBox.bottom) - Math.max(item.top, speakerBox.top);
        if (overlapX > 0.5 && overlapY > 0.5) {
          speakerItemGap = Math.min(speakerItemGap, -Math.min(overlapX, overlapY));
          continue;
        }
        const dx = overlapX > 0 ? 0 : Math.max(item.left, speakerBox.left) - Math.min(item.right, speakerBox.right);
        const dy = overlapY > 0 ? 0 : Math.max(item.top, speakerBox.top) - Math.min(item.bottom, speakerBox.bottom);
        speakerItemGap = Math.min(speakerItemGap, Math.hypot(dx, dy) > 0 ? (dx || dy) : 0);
      }
    }
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
      cardOverflow: Math.max(
        items.length ? Math.max(...items.map((item) => item.cardOverflow)) : 0,
        tileBox ? overflowOutside(tileBox, cardBox) : 0,
        speakerBox ? overflowOutside(speakerBox, cardBox) : 0
      ),
      minGap: items.length > 1 ? minGap : 12,
      maxRowOverlap,
      minPad: Math.min(padTop, padBottom, padStart, padEnd),
      padTop,
      padBottom,
      speakerItemGap,
      speakerSize: speakerBox ? Math.round(Math.min(speakerBox.width, speakerBox.height)) : 0,
      speakerOnTile,
      speakerOnText,
      checkOnTile,
      checkSize: checkBox ? Math.round(Math.min(checkBox.width, checkBox.height)) : 0,
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
        path: test.info().outputPath(`count-1-10-${viewport.width}.png`),
        fullPage: true,
      });
      await page.waitForTimeout(400);
      const second = await page.evaluate(measureCountCards);
      expect(second.map((card) => card.sizes)).toEqual(first.map((card) => card.sizes));
      for (const card of second) {
        expect(card.cardWidth, `n=${card.count}`).toBeLessThanOrEqual(viewport.width);
        expect(card.itemOverflow, `n=${card.count}`).toBeLessThanOrEqual(2);
        expect(card.cardOverflow, `n=${card.count}`).toBeLessThanOrEqual(1);
        expect(card.minItem, `n=${card.count}`).toBeGreaterThanOrEqual(32);
        expect(card.maxItem, `n=${card.count}`).toBe(card.minItem);
        expect(card.maxRowOverlap, `n=${card.count}`).toBeLessThanOrEqual(0.24);
        expect(card.minPad, `n=${card.count}`).toBeGreaterThanOrEqual(12);
        expect(Math.abs(card.padTop - card.padBottom), `n=${card.count}`).toBeLessThanOrEqual(6);
        expect(card.speakerItemGap, `n=${card.count}`).toBeGreaterThanOrEqual(8);
        expect(card.overflowX, `n=${card.count}`).toBeLessThanOrEqual(2);
        expect(card.speakerSize, `n=${card.count}`).toBeGreaterThanOrEqual(48);
        expect(card.speakerOnText, `n=${card.count}`).toBe(false);
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
    expect(stats.heading).toContain('فریبا جون');
    expect(stats.heading).not.toContain('جان');
    expect(stats.contentScroll).toBeLessThanOrEqual(2);
    expect(stats.phoneH).toBeLessThanOrEqual(667);
    expect(stats.continueNativeDisabled).toBe(false);
    expect(stats.continueAriaDisabled).toBe(true);
    expect(stats.hoopoePresent).toBe(true);
    expect(stats.helper).toContain('هر کارت را بزنید تا عددش را بشنوید');
    expect(stats.sidePad).toBe(24);
    await page.screenshot({
      path: test.info().outputPath('intro-375x667.png'),
      fullPage: false,
    });
  });

  test('intro at 375x667 hits the figma item floors and single-apple ink', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedProgress(page);
    await page.goto('/lesson/m1l1');
    await page.addStyleTag({
      content: 'nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; }',
    });
    await expect(page.getByRole('button', { name: 'سه انار' })).toBeVisible();
    await page.waitForTimeout(800);
    const cards = await page.evaluate(measureCountCards);
    const floors: Record<number, number> = { 1: 96, 2: 84, 3: 70 };
    for (const card of cards) {
      expect(card.minItem, `n=${card.count}`).toBeGreaterThanOrEqual(floors[card.count]);
      expect(card.cardHeight, `n=${card.count}`).toBeGreaterThanOrEqual(128);
      expect(card.itemOverflow, `n=${card.count}`).toBeLessThanOrEqual(2);
      expect(card.speakerOnText, `n=${card.count}`).toBe(false);
      expect(card.speakerItemGap, `n=${card.count}`).toBeGreaterThanOrEqual(8);
    }
    // Single apple: changed pixels with and without the item, inside the
    // cluster zone, must span >= 70% of the card height.
    const single = page.locator('[data-count-card][data-count="1"]');
    const geo = await single.evaluate((el) => {
      const c = el.getBoundingClientRect();
      const z = (el.querySelector('.cc-zone') as HTMLElement).getBoundingClientRect();
      return { x: z.left, y: c.top, width: z.width, height: c.height };
    });
    const withArt = (await page.screenshot({ clip: geo, animations: 'disabled', scale: 'css' })).toString('base64');
    await single.evaluate((el) =>
      el.querySelectorAll('.cc-item').forEach((n) => (n as HTMLElement).style.setProperty('visibility', 'hidden', 'important'))
    );
    const without = (await page.screenshot({ clip: geo, animations: 'disabled', scale: 'css' })).toString('base64');
    await single.evaluate((el) =>
      el.querySelectorAll('.cc-item').forEach((n) => (n as HTMLElement).style.removeProperty('visibility'))
    );
    const ink = await page.evaluate(async ({ a, b }) => {
      const load = async (src: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${src}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height);
      };
      const [da, db] = await Promise.all([load(a), load(b)]);
      let minY = Infinity;
      let maxY = -Infinity;
      for (let y = 0; y < da.height; y += 1) {
        for (let x = 0; x < da.width; x += 1) {
          const k = (y * da.width + x) * 4;
          const d = Math.abs(da.data[k] - db.data[k]) + Math.abs(da.data[k + 1] - db.data[k + 1]) + Math.abs(da.data[k + 2] - db.data[k + 2]);
          if (d > 30) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }
      return maxY >= minY ? maxY - minY + 1 : 0;
    }, { a: withArt, b: without });
    expect(ink / geo.height).toBeGreaterThanOrEqual(0.7);
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
      path: test.info().outputPath('intro-412.png'),
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
    expect(await continueBtn.evaluate((el) => (el as HTMLButtonElement).disabled)).toBe(false);
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
    const checkSize = await page.evaluate(() => {
      const check = document.querySelector('[data-cc-check]') as HTMLElement;
      const box = check.getBoundingClientRect();
      return Math.round(Math.min(box.width, box.height));
    });
    expect(checkSize).toBeGreaterThanOrEqual(28);
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
