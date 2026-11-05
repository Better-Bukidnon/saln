import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(__dirname, '..', '..', 'src', 'styles', 'index.css'), 'utf8').toLowerCase()

describe('Tailwind theme tokens (BetterBukidnon main-site palette)', () => {
  it.each([
    ['--color-primary-500', '#0032a0'],
    ['--color-primary-700', '#002170'],
    ['--color-accent-500', '#f77f00'],
    ['--color-success', '#06a77d'],
    ['--color-danger-500', '#d62828'],
    ['--color-success-light', '#2fd9ad'],
    ['--color-ink', '#1a1a1a'],
    ['--color-ink-deep', '#111111'],
    ['--color-surface-alt', '#f8f9fa'],
  ])('%s is %s', (name, hex) => {
    expect(css).toMatch(new RegExp(`${name}:\\s*${hex}`))
  })

  it('defines the scales 50 to 900 for primary, accent and danger', () => {
    for (const scale of ['primary', 'accent', 'danger'])
      for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900])
        expect(css).toContain(`--color-${scale}-${step}:`)
  })

  it('has no flag colours or gradient utilities left, and keeps the animations', () => {
    expect(css).not.toMatch(/flag|gradient|#f70000|#fcd116|#0038a8|--color-ph-/)
    for (const a of ['fade-in', 'slide-up']) expect(css).toContain(`--animate-${a}:`)
    expect(css).not.toContain('scale-up')
  })

  it('uses the self-hosted Figtree variable font', () => {
    expect(css).toMatch(/--font-sans:\s*"figtree variable"/)
    // the inline SVG data URI carries an xmlns string that is not a request
    expect(css.replaceAll('http://www.w3.org/2000/svg', '')).not.toMatch(/googleapis|gstatic|https?:\/\//)
  })
})
