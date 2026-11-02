import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(__dirname, '..', '..', 'src', 'styles', 'index.css'), 'utf8').toLowerCase()

describe('Tailwind theme tokens (SALN Tracker PH palette)', () => {
  it.each([
    ['--color-ph-red', '#f70000'],
    ['--color-ph-blue', '#0038a8'],
    ['--color-ph-yellow', '#fcd116'],
    ['--color-primary-500', '#0038a8'],
    ['--color-primary-600', '#002d8a'],
    ['--color-primary-900', '#001230'],
    ['--color-accent-400', '#fcd116'],
    ['--color-danger-500', '#f70000'],
  ])('%s is %s', (name, hex) => {
    expect(css).toMatch(new RegExp(`${name}:\\s*${hex}`))
  })

  it('defines the scales 50 to 900 for primary, accent and danger', () => {
    for (const scale of ['primary', 'accent', 'danger'])
      for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900])
        expect(css).toContain(`--color-${scale}-${step}:`)
  })

  it('defines the flag gradient and animations', () => {
    expect(css).toContain('bg-flag-gradient')
    expect(css).toContain('linear-gradient(135deg, #0038a8 0%, #f70000 50%, #fcd116 100%)')
    expect(css).toContain('bg-ph-blue-gradient')
    expect(css).toContain('bg-ph-red-gradient')
    for (const a of ['fade-in', 'slide-up', 'scale-up']) expect(css).toContain(`--animate-${a}:`)
  })

  it('uses the self-hosted Inter variable font', () => {
    expect(css).toMatch(/--font-sans:\s*"inter variable"/)
    expect(css).not.toMatch(/googleapis|gstatic|https?:\/\//)
  })
})
