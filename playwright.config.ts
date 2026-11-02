import { defineConfig } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: `npx vite build --mode e2e && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
