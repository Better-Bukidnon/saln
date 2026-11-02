import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Resolve any CSS colour (rgb, oklch, color-mix...) to sRGB through a canvas, and composite
// translucent backgrounds over their ancestors (finally white) so contrast is computed from
// what is actually painted.
// `gradientStops` replaces the painted background for text over a CSS gradient: the worst stop wins.
async function contrastOf(page: Page, selector: string, gradientStops?: string[]): Promise<number> {
  return page.evaluate(([sel, stops]) => {
    const el = document.querySelector(sel)
    if (!el) throw new Error(`no element for ${sel}`)
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    const toRgba = (css: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2], d[3] / 255]
    }
    const over = (top: number[], bottom: number[]) => {
      const a = top[3]
      return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat([1])
    }
    const ratio = (fgCss: Element, bg: number[]) => {
      const fg = over(toRgba(getComputedStyle(fgCss).color), bg)
      const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a)
      return (hi + 0.05) / (lo + 0.05)
    }
    const lum = (c: number[]) => {
      const [r, g, b] = c.slice(0, 3).map((v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    if (stops?.length) return Math.min(...stops.map((c) => ratio(el, over(toRgba(c), [255, 255, 255, 1]))))
    let bg: number[] = [255, 255, 255, 1]
    const chain: Element[] = []
    for (let n: Element | null = el; n; n = n.parentElement) chain.push(n)
    for (const n of chain.reverse()) {
      const c = toRgba(getComputedStyle(n).backgroundColor)
      if (c[3] > 0) bg = over(c, bg)
    }
    return ratio(el, bg)
  }, [selector, gradientStops] as const)
}

test('primary button uses the Philippine blue', async ({ page }) => {
  await page.goto('/official/test-rep-1')
  const cta = page.getByRole('link', { name: 'Request this SALN from the Ombudsman' })
  expect(await cta.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(0, 56, 168)')
})

test('the header is sticky', async ({ page }) => {
  await page.goto('/')
  expect(await page.locator('header').first().evaluate((e) => getComputedStyle(e).position)).toBe('sticky')
})

test('body font is Inter, self-hosted', async ({ page }) => {
  const external: string[] = []
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost')) external.push(r.url())
  })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/^"?Inter/)
  expect(await page.evaluate(() => document.fonts.check('16px "Inter Variable"'))).toBe(true)
  expect(external).toEqual([])
})

for (const width of [360, 1280]) {
  for (const path of ['/', '/official/dual-gov', '/official/test-rep-1', '/about']) {
    test(`no horizontal overflow at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(path)
      await page.evaluate(() => document.fonts.ready)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}

test('text contrast meets WCAG AA on the badge, empty state and primary button', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-testid="unverified-badge"]').first().waitFor()
  expect(await contrastOf(page, '[data-testid="unverified-badge"]')).toBeGreaterThanOrEqual(4.5)
  const heroStops = ['rgb(0, 56, 168)', 'rgb(0, 45, 138)'] // both ends of from-primary-500 to-primary-600
  for (const sel of ['[data-testid="hero-title"]', '[data-testid="hero-summary"]']) {
    expect(await contrastOf(page, sel, heroStops), sel).toBeGreaterThanOrEqual(4.5)
  }
  await page.goto('/official/test-rep-1')
  expect(await contrastOf(page, '[data-testid="empty-state"] strong')).toBeGreaterThanOrEqual(4.5)
  expect(await contrastOf(page, '[data-testid="empty-state"] p:nth-of-type(2)')).toBeGreaterThanOrEqual(4.5)
  expect(await contrastOf(page, '[data-testid="empty-state"] a')).toBeGreaterThanOrEqual(4.5)
})

test('every level badge colour meets AA', async ({ page }) => {
  await page.goto('/')
  const n = await page.locator('[data-testid="level-badge"]').count()
  expect(n).toBeGreaterThan(0)
  for (let i = 0; i < n; i++) {
    await page.locator('[data-testid="level-badge"]').nth(i).evaluate((e, k) => e.setAttribute('data-i', String(k)), i)
    expect(await contrastOf(page, `[data-i="${i}"]`)).toBeGreaterThanOrEqual(4.5)
  }
})

test('keyboard focus shows a visible indicator on every interactive element', async ({ page }) => {
  await page.goto('/')
  const seen = new Set<string>()
  const bad: string[] = []
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement
      const s = getComputedStyle(e)
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
      const alpha = (css: string) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = css
        ctx.fillRect(0, 0, 1, 1)
        return ctx.getImageData(0, 0, 1, 1).data[3]
      }
      // Outline counts only with a real style, a width and a near-opaque colour.
      const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && alpha(s.outlineColor) >= 200
      // Box-shadow counts only if some layer paints: near-opaque colour (so a faint decorative shadow-sm does not count) and non-zero extent.
      const layers = s.boxShadow === 'none' ? [] : s.boxShadow.split(/,(?![^(]*\))/)
      const shadow = layers.some((l) => {
        const color = l.match(/(rgba?|oklch|oklab|color|hsla?)\([^)]*\)|#[0-9a-f]{3,8}/i)?.[0] ?? ''
        const nums = l.replace(color, '').match(/-?[\d.]+px/g) ?? []
        return color !== '' && alpha(color) >= 200 && nums.some((n) => parseFloat(n) !== 0)
      })
      const pressed = e.getAttribute('aria-pressed') === 'true'
      return { tag: e.tagName.toLowerCase(), type: (e as HTMLInputElement).type ?? '', visible: outline || shadow, id: e.id, pressed }
    })
    if (info.tag === 'body') continue // focus wrapped around past the last control
    const kind = info.tag === 'input' ? `input:${info.type}` : info.tag
    seen.add(kind)
    if (info.pressed) seen.add('primary-button') // the active language button is a primary Button
    if (!info.visible) bad.push(`${kind}#${info.id}`)
  }
  expect(bad).toEqual([])
  for (const k of ['a', 'button', 'primary-button', 'select', 'input:search', 'input:checkbox']) expect(seen.has(k), k).toBe(true)
})
