import { defineConfig, devices } from '@playwright/test';

// Service-worker tests need a production build (the worker only registers in
// production). Run `npx next build` first, then:
//   npx playwright test -c playwright.sw.config.ts
export default defineConfig({
  testDir: './__tests__',
  testMatch: '**/*.sw.spec.ts',
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3100',
    ...devices['Pixel 5'],
    serviceWorkers: 'allow',
  },
  webServer: {
    command: 'node scripts/sw-test-server.mjs',
    url: 'http://localhost:3100/home',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
