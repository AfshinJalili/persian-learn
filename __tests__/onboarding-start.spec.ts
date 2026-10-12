import { test, expect } from '@playwright/test';

test.describe('Onboarding Start does not wait on audio', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('advances immediately when real MP3s are present', async ({ page }) => {
    await page.addInitScript(() => {
      const NativeAudio = window.Audio;
      window.Audio = class extends NativeAudio {
        addEventListener(type, listener, options) {
          if (type === 'ended') {
            super.addEventListener(
              type,
              (event) => {
                window.setTimeout(() => {
                  if (typeof listener === 'function') listener(event);
                }, 30000);
              },
              options
            );
            return;
          }
          super.addEventListener(type, listener, options);
        }

        play() {
          return super.play().catch(() => undefined);
        }
      };
    });

    await page.goto('/');
    await expect(page.getByText('خوش آمدید')).toBeVisible();
    await page.getByRole('button', { name: /شروع/ }).click();
    await expect(page.getByText('یک تصویر برای خودتان انتخاب کنید')).toBeVisible({
      timeout: 2000,
    });
  });

  test('advances immediately when audio files are missing', async ({ page }) => {
    await page.route('**/audio/**', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' })
    );
    await page.goto('/');
    await expect(page.getByText('خوش آمدید')).toBeVisible();
    await page.getByRole('button', { name: /شروع/ }).click();
    await expect(page.getByText('یک تصویر برای خودتان انتخاب کنید')).toBeVisible({
      timeout: 2000,
    });
  });
});
