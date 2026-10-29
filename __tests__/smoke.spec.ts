import { test, expect } from './e2e-audio-stub';

test.describe('Onboarding', () => {
  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('text=خوش آمدید', { timeout: 10000 });

    await page.click('button[aria-label="شروع کنیم"]');

    await page.waitForSelector('text=یک تصویر برای خودتان انتخاب کنید', { timeout: 5000 });
    const avatars = await page.locator('button').filter({ hasText: '🌷' });
    if (await avatars.count()) {
      await avatars.first().click();
    } else {
      await page.getByRole('button', { name: '🌷' }).click();
    }

    await page.waitForSelector('text=ادامه', { timeout: 5000 });
    await page.click('text=ادامه');

    await page.waitForSelector('text=امروز چه یاد بگیریم؟', { timeout: 5000 });
    await page.click('text=عددها و حساب');

    await page.waitForURL('**/home', { timeout: 10000 });

    await expect(page.locator('text=خانه')).toBeVisible();
  });
});

test.describe('Lesson Flow', () => {
  test.skip('should complete a math lesson', async ({ page }) => {
    await page.goto('/lesson/m1l1');

    await page.waitForSelector('text=ادامه', { timeout: 5000 });

    await expect(page.locator('.progress')).toBeVisible();
  });
});
