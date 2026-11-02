import { defineConfig } from '@playwright/test'

// Two independent previews so the fixture-backed e2e and the real-data smoke test never collide.
// e2e:   Vite mode `e2e` (data aliased to tests/fixtures/e2e-data), built into dist-e2e/, port 4173.
// smoke: the normal production build on the real data/, built into dist/, port 4174.
const E2E_PORT = 4173
const SMOKE_PORT = 4174
const reuseExistingServer = !process.env.CI

export default defineConfig({
  testDir: 'tests/e2e',
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  webServer: [
    {
      command: `npx vite build --mode e2e --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${E2E_PORT} --strictPort`,
      url: `http://localhost:${E2E_PORT}`,
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: `npm run build && npx vite preview --port ${SMOKE_PORT} --strictPort`,
      url: `http://localhost:${SMOKE_PORT}`,
      reuseExistingServer,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: /smoke\.spec\.ts/,
      use: { browserName: 'chromium', baseURL: `http://localhost:${E2E_PORT}` },
    },
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { browserName: 'chromium', baseURL: `http://localhost:${SMOKE_PORT}` },
    },
  ],
})
