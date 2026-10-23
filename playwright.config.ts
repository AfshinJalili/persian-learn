import { defineConfig, devices } from '@playwright/test';

// PW_PORT lets a second checkout run its suite beside another dev server.
const PORT = Number(process.env.PW_PORT || 3000);
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './__tests__',
  testMatch: '**/*.spec.ts',
  // Service-worker specs need a production build: playwright.sw.config.ts.
  testIgnore: '**/*.sw.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
