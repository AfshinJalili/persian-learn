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
});
