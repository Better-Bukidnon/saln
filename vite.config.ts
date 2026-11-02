/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertNoDemoInBuild } from './scripts/build-guard'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// `vite build --mode e2e` swaps the data location for small test fixtures.
export default defineConfig(({ mode, command }) => {
  assertNoDemoInBuild(command, mode, process.env)
  return {
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: {
    alias: {
      '@data': fileURLToPath(
        new URL(mode === 'e2e' ? './tests/fixtures/e2e-data' : './data', import.meta.url),
      ),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
}
})
