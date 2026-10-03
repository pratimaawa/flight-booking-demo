import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:3100' },
  projects: [{ name: 'chrome', use: { channel: 'chrome' } }],
  webServer: {
    command: 'yarn build && yarn start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { MOCK_NETWORK: 'off', MOCK_FREEZE_PRICES: '1' },
  },
});
