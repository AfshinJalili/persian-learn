import { test, expect } from '@playwright/test';

test.describe('Onboarding', () => {
  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.waitForSelector('text=برای شنیدن، اینجا بزنید', { timeout: 10000 });
    
    await page.click('button[aria-label="شروع"]');
    
    await page.waitForSelector('text=صدا را می‌شنوید؟', { timeout: 5000 });
    await page.click('button:has-text("✓")');
    
    await page.waitForSelector('text=یک تصویر برای خودتان انتخاب کنید', { timeout: 5000 });
    const avatars = await page.locator('button').filter({ hasText: '🌷' });
    await avatars.first().click();
    
    await page.waitForSelector('text=بعداً', { timeout: 5000 });
    await page.click('text=بعداً');
    
    await page.waitForSelector('text=امروز چه یاد بگیریم؟', { timeout: 5000 });
    await page.click('text=عددها و حساب');
    
    await page.waitForURL('**/home', { timeout: 10000 });
    
    await expect(page.locator('text=سلام')).toBeVisible();
  });
});

test.describe('Lesson Flow', () => {
  test.skip('should complete a math lesson', async ({ page }) => {
    await page.goto('http://localhost:3000/lesson/m1l1');
    
    await page.waitForSelector('text=ادامه', { timeout: 5000 });
    
    await expect(page.locator('.progress')).toBeVisible();
  });
});
