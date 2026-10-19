import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.SW_PORT || 3100);

// Service-worker tests need a production build (the worker only registers in
// production). Run `npx next build` first, then:
//   npx playwright test -c playwright.sw.config.ts
export default defineConfig({
  testDir: './__tests__',
  testMatch: '**/*.sw.spec.ts',
  reporter: 'line',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 5'],
    serviceWorkers: 'allow',
  },
  webServer: {
    command: `PORT=${PORT} node scripts/sw-test-server.mjs`,
    url: `http://localhost:${PORT}/home`,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
