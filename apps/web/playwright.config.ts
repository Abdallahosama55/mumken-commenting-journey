import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

/**
 * End-to-end journeys against the production build (T-1), in a desktop and a phone viewport.
 * `npm run test:e2e` builds and starts the app; an already-running server on the port is reused locally.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
