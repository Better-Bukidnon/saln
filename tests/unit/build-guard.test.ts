import { describe, expect, it } from 'vitest'
import { assertNoDemoInBuild } from '../../scripts/build-guard'

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
