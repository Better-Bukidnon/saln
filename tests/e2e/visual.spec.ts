import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { openLangMenu } from './helpers'

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
  expect(await cta.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(0, 50, 160)')
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
  const heroStops = ['rgb(0, 50, 160)', 'rgb(0, 33, 112)'] // both ends of from-primary-500 to-primary-700
  // the hashtag pill is white at 10% over the gradient: blend of each end
  expect(await contrastOf(page, '[data-testid="hero-hashtags"]', ['rgb(26, 71, 170)', 'rgb(26, 55, 126)'])).toBeGreaterThanOrEqual(4.5)
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

test('keyboard focus shows the 2px primary outline on every interactive element', async ({ page }) => {
  await page.goto('/')
  const seen = new Set<string>()
  const bad: string[] = []
  const rings = { footer: 0, onDark: 0 }
  for (let i = 0; i < 100; i++) {
    await page.keyboard.press('Tab')
    await page.waitForTimeout(250) // let `transition-all` finish so the outline is at its final width
    const info = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement
      const s = getComputedStyle(e)
      const outline =
        s.outlineStyle !== 'none' &&
        parseFloat(s.outlineWidth) >= 2 &&
        // light ring on the dark footer and the blue banner, primary blue elsewhere
        s.outlineColor === (e.closest('footer, .on-dark') ? 'rgb(255, 255, 255)' : 'rgb(0, 50, 160)')
      return {
        tag: e.tagName.toLowerCase(),
        type: (e as HTMLInputElement).type ?? '',
        outline,
        id: e.id,
        inFooter: !!e.closest('footer'),
        inOnDark: !!e.closest('.on-dark'),
      }
    })
    if (info.tag === 'body') continue // focus wrapped around past the last control
    const kind = info.tag === 'input' ? `input:${info.type}` : info.tag
    seen.add(kind)
    if (info.inFooter) rings.footer++
    if (info.inOnDark) rings.onDark++
    if (!info.outline) bad.push(`${kind}#${info.id}`)
  }
  expect(bad).toEqual([])
  // the white-ring branch must really have been exercised on the dark surfaces
  expect(rings.footer, 'footer elements reached').toBeGreaterThanOrEqual(8)
  expect(rings.onDark, 'blue banner elements reached').toBeGreaterThanOrEqual(3)
  for (const k of ['a', 'button', 'select', 'input:search', 'input:checkbox']) expect(seen.has(k), k).toBe(true)
})

test('the scrollable chart-data table region shows a focus outline that is not clipped', async ({ page }) => {
  await page.goto('/official/dual-gov')
  await page.getByText('Show chart data as a table').click()
  const region = page.getByRole('region', { name: 'SALN records table, scrollable' })
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    if (await region.evaluate((e) => e === document.activeElement)) break
  }
  await expect(region).toBeFocused()
  const r = await region.evaluate((e) => {
    const s = getComputedStyle(e)
    const w = parseFloat(s.outlineWidth)
    const off = parseFloat(s.outlineOffset)
    const box = e.getBoundingClientRect()
    const reach = w + off
    const out = { l: box.left - reach, t: box.top - reach, r: box.right + reach, b: box.bottom + reach }
    const clippedBy: string[] = []
    for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const o = getComputedStyle(n)
      if ([o.overflowX, o.overflowY].every((v) => v === 'visible')) continue
      const b = n.getBoundingClientRect()
      if (out.l < b.left || out.t < b.top || out.r > b.right || out.b > b.bottom) clippedBy.push(n.tagName + '.' + n.className)
    }
    return { style: s.outlineStyle, w, color: s.outlineColor, clippedBy }
  })
  expect(r.style).not.toBe('none')
  expect(r.w).toBeGreaterThanOrEqual(2)
  expect(r.color).toBe('rgb(0, 50, 160)')
  expect(r.clippedBy).toEqual([])
})

test('a primary Button shows the blue focus ring from the keyboard', async ({ page }) => {
  await page.goto('/official/test-rep-1')
  const cta = page.getByRole('link', { name: 'Request this SALN from the Ombudsman' })
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    if (await cta.evaluate((e) => e === document.activeElement)) break
  }
  await expect(cta).toBeFocused()
  await page.waitForTimeout(250)
  const o = await cta.evaluate((e) => ({ c: getComputedStyle(e).outlineColor, w: getComputedStyle(e).outlineWidth }))
  expect(o).toEqual({ c: 'rgb(0, 50, 160)', w: '2px' })
})

test('no flag-colour gradient strips: nothing thin carries a gradient, no flag colours anywhere', async ({ page }) => {
  await page.goto('/')
  const found = await page.evaluate(() => {
    const out: string[] = []
    for (const e of document.querySelectorAll('*')) {
      const s = getComputedStyle(e)
      const h = e.getBoundingClientRect().height
      if (s.backgroundImage.includes('gradient') && h < 24) out.push(`strip ${e.tagName}.${e.className}`)
      if (/rgb\(247, 0, 0\)|rgb\(252, 209, 22\)/.test(s.backgroundImage + s.backgroundColor)) out.push(`flag colour ${e.tagName}`)
    }
    return out
  })
  expect(found).toEqual([])
})

test('footer has four sections, the disclaimer once, and readable links on the dark background', async ({ page }) => {
  await page.goto('/')
  for (const id of ['footer-brand', 'footer-quick', 'footer-resources', 'footer-contribute']) {
    await expect(page.getByTestId(id)).toHaveCount(1)
  }
  await expect(page.getByText('Aggregator, not the original source; not an official government website.')).toHaveCount(1)
  await expect(page.getByRole('note')).toHaveCount(1)
  for (const sel of ['footer-quick', 'footer-resources', 'footer-contribute']) {
    const a = `[data-testid="${sel}"] a`
    const n = await page.locator(a).count()
    for (let i = 0; i < n; i++) {
      await page.locator(a).nth(i).evaluate((e, k) => e.setAttribute('data-fc', String(k)), `${sel}-${i}`)
      expect(await contrastOf(page, `[data-fc="${sel}-${i}"]`, ['rgb(26, 26, 26)', 'rgb(17, 17, 17)']), `${sel}-${i}`).toBeGreaterThanOrEqual(4.5)
    }
  }
  expect(await contrastOf(page, 'footer [role="note"]', ['rgb(26, 26, 26)', 'rgb(17, 17, 17)'])).toBeGreaterThanOrEqual(4.5)
})

test('footer links are at least 44px tall on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  const heights = await page.locator('[data-testid="footer-quick"] a, [data-testid="footer-resources"] a').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44)
})

test('filter card groups exist and the checkboxes are real, labelled inputs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('filter-groups').locator('fieldset')).toHaveCount(3)
  for (const label of ['Include province-wide officials', 'Only officials with SALN data']) {
    await expect(page.getByRole('checkbox', { name: label })).toBeVisible()
  }
  await expect(page.getByLabel('Barangay')).toBeDisabled()
  await expect(page.getByTestId('filters-active')).toHaveCount(0)
  await page.getByLabel('Level').selectOption('province')
  await expect(page.getByTestId('filters-active')).toHaveText('1 active')
  await page.getByRole('button', { name: 'Reset filters' }).click()
  await expect(page.getByTestId('filters-active')).toHaveCount(0)
})

test('the help banner is on the list page only, with its three actions', async ({ page }) => {
  await page.goto('/')
  const banner = page.getByRole('region', { name: 'Help us open up SALN data' })
  await expect(banner.getByRole('link', { name: 'Submit SALN Data' })).toBeVisible()
  await expect(banner.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', 'mailto:volunteer@betterbukidnon.org')
  await expect(banner.getByRole('link', { name: 'Learn More' })).toHaveAttribute('href', '/about')
  await expect(banner.getByRole('link', { name: /ombudsman.gov.ph/ })).toBeVisible()
  for (const p of ['/about', '/official/dual-gov']) {
    await page.goto(p)
    await expect(page.getByText('Help us open up SALN data')).toHaveCount(0)
  }
})

test('banner text and buttons on the blue meet AA', async ({ page }) => {
  await page.goto('/')
  const stops = ['rgb(0, 50, 160)', 'rgb(0, 33, 112)']
  const banner = '[aria-labelledby="help-banner-title"]'
  expect(await contrastOf(page, `${banner} h3`, stops)).toBeGreaterThanOrEqual(4.5)
  expect(await contrastOf(page, `${banner} > div p:nth-of-type(1)`, stops)).toBeGreaterThanOrEqual(4.5)
  expect(await contrastOf(page, `${banner} a[href^="mailto"]`, ['rgb(38, 82, 177)', 'rgb(26, 55, 126)'].concat(['rgb(0, 50, 160)']))).toBeGreaterThanOrEqual(4.5)
  expect(await contrastOf(page, `${banner} a[href*="issues"]`)).toBeGreaterThanOrEqual(4.5) // white button, primary text
})

test('the language menu opens, selects, closes on Escape and outside click, and moves with the arrow keys', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  const toggle = page.locator('#lang-toggle')
  const list = page.getByRole('group', { name: 'Language' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toHaveAttribute('aria-controls', /.+/)
  await expect(toggle).toContainText('EN')
  await expect(list).toBeHidden()
  await toggle.click()
  await expect(list).toBeVisible()
  // inside the viewport at 360px, 44px targets, active one pressed
  const box = await list.boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(360)
  for (const b of await list.getByRole('button').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'English' })).toBeFocused()
  // arrows, Home, End
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('button', { name: 'Filipino' })).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.getByRole('button', { name: 'Cebuano (Binisaya)' })).toBeFocused()
  await page.keyboard.press('ArrowDown') // wraps
  await expect(page.getByRole('button', { name: 'English' })).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('button', { name: 'Cebuano (Binisaya)' })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(page.getByRole('button', { name: 'English' })).toBeFocused()
  // Escape closes and returns focus to the toggle
  await page.keyboard.press('Escape')
  await expect(list).toBeHidden()
  await expect(toggle).toBeFocused()
  // outside click closes
  await openLangMenu(page)
  await page.locator('main').click({ position: { x: 5, y: 5 } })
  await expect(list).toBeHidden()
  // selecting closes, returns focus, updates the toggle and the page
  await openLangMenu(page)
  await page.getByRole('button', { name: 'Filipino' }).click()
  await expect(list).toBeHidden()
  await expect(toggle).toBeFocused()
  await expect(toggle).toContainText('FIL')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('footer content is aligned with the page container at 1280', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const left = (sel: string) => page.locator(sel).first().evaluate((e) => e.getBoundingClientRect().left)
  const brand = await left('[data-testid="footer-brand"]')
  const pageLeft = await left('main > div')
  expect(Math.abs(brand - pageLeft)).toBeLessThanOrEqual(1)
  expect(brand).toBeGreaterThan(16)
})

test('footer columns follow 1.5fr 1fr 1fr 1fr and bottom bar is one row on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const w = await page.locator('footer [data-testid^="footer-"]:not([data-testid="footer-bottom"]):not([data-testid="footer-version"])').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width))
  expect(w[0] / w[1]).toBeGreaterThan(1.3)
  expect(w[0] / w[1]).toBeLessThan(1.7)
  const bar = page.getByTestId('footer-bottom')
  const ys = await bar.locator('> div > *, > span').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
  expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(2)
  const version = page.getByTestId('footer-version')
  await expect(version).toHaveText(/^Ver\. \d+\.\d+\.\d+/)
  const vb = await version.boundingBox()
  const bb = await bar.boundingBox()
  expect(vb!.x + vb!.width).toBeGreaterThan(bb!.x + bb!.width - 4)
  await expect(page.getByText('Aggregator, not the original source; not an official government website.')).toHaveCount(1)
  await expect(page.getByTestId('footer-contribute')).toContainText('₱0')
})

test('footer partner logo is 54px tall and every footer text is AA on the dark background', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const h = await page.locator('footer img[src="/bettergov-footer.svg"]').evaluate((e) => e.getBoundingClientRect().height)
  expect(Math.round(h)).toBe(54)
  for (const sel of ['footer h2', '[data-testid="footer-bottom"] span', '[data-testid="footer-brand"] p']) {
    expect(await contrastOf(page, sel, ['rgb(26, 26, 26)', 'rgb(17, 17, 17)']), sel).toBeGreaterThanOrEqual(4.5)
  }
})
