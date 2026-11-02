import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { assertNoDemoInBuild, demoEnvFor } from '../../scripts/build-guard'

describe('assertNoDemoInBuild', () => {
  it('allows a normal build and the demo dev server', () => {
    expect(() => assertNoDemoInBuild('build', 'production', {})).not.toThrow()
    expect(() => assertNoDemoInBuild('build', 'e2e', {})).not.toThrow()
    expect(() => assertNoDemoInBuild('serve', 'demo', { VITE_DEMO_DATA: '1' })).not.toThrow()
  })
  it('fails a build when VITE_DEMO_DATA is set in the environment', () => {
    expect(() => assertNoDemoInBuild('build', 'production', { VITE_DEMO_DATA: '1' })).toThrow(/demo/i)
    expect(() => assertNoDemoInBuild('build', 'e2e', { VITE_DEMO_DATA: '1' })).toThrow()
  })
  it('fails a build in demo mode', () => {
    expect(() => assertNoDemoInBuild('build', 'demo', {})).toThrow(/demo/i)
  })
})

describe('demoEnvFor (.env files)', () => {
  const dir = (files: Record<string, string>) => {
    const d = mkdtempSync(join(tmpdir(), 'envg-'))
    for (const [n, c] of Object.entries(files)) writeFileSync(join(d, n), c)
    return d
  }
  it.each(['.env', '.env.local', '.env.production', '.env.production.local'])('picks up VITE_DEMO_DATA from %s', (name) => {
    const env = demoEnvFor('production', dir({ [name]: 'VITE_DEMO_DATA=1\n' }), {})
    expect(() => assertNoDemoInBuild('build', 'production', env)).toThrow(/VITE_DEMO_DATA/)
  })
  it('is clean with no env files and merges the process env', () => {
    const d = dir({})
    expect(() => assertNoDemoInBuild('build', 'production', demoEnvFor('production', d, {}))).not.toThrow()
    expect(() => assertNoDemoInBuild('build', 'production', demoEnvFor('production', d, { VITE_DEMO_DATA: '1' }))).toThrow()
  })
  it('ignores unrelated variables', () => {
    const env = demoEnvFor('production', dir({ '.env': 'FOO=1\n' }), {})
    expect(() => assertNoDemoInBuild('build', 'production', env)).not.toThrow()
  })
})
