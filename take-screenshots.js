import { chromium } from '@playwright/test';

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/01-welcome.png' });
    console.log('Screenshot 1: Welcome screen');

    const audioButton = page.locator('button[aria-label="شروع"]');
    await audioButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/02-sound-check.png' });
    console.log('Screenshot 2: Sound check');

    const yesButton = page.locator('button:has-text("✓")').first();
    await yesButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/03-avatar-picker.png' });
    console.log('Screenshot 3: Avatar picker');

    const tulip = page.locator('button:has-text("🌷")').first();
    await tulip.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/04-name-picker.png' });
    console.log('Screenshot 4: Name picker');

    const later = page.locator('text=بعداً');
    await later.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/05-track-picker.png' });
    console.log('Screenshot 5: Track picker');

    const mathTrack = page.locator('text=عددها و حساب').first();
    await mathTrack.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/06-home-path.png' });
    console.log('Screenshot 6: Home / lesson path');

    const streakButton = page.locator('text=پیشرفت');
    await streakButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/07-streak.png' });
    console.log('Screenshot 7: Streak screen');

    const profileButton = page.locator('text=من').last();
    await profileButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/08-profile.png' });
    console.log('Screenshot 8: Profile screen');

    console.log('All screenshots captured!');
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
