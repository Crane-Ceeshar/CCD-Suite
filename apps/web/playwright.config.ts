import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, 'tests', '.auth', 'user.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup — runs first, saves session
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // API integration tests
    {
      name: 'api-tests',
      testMatch: /crm-api\.spec\.ts/,
      use: {
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
    // UI E2E tests
    {
      name: 'e2e-tests',
      testMatch: /crm-ui\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npx next dev --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    cwd: __dirname,
  },
});
