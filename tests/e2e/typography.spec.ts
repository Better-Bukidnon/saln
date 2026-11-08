import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const PAGES = ['/', '/official/dual-gov', '/about']
const style = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((e) => {
    const s = getComputedStyle(e)
    return { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, line: s.lineHeight }
  })

test('every sampled element on every page uses Figtree, including controls and SVG text', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path)
    const families = await page.evaluate(() => {
      const out: string[] = []
      for (const e of document.querySelectorAll('body, h1, h2, h3, h4, p, a, button, input, select, label, li, dt, dd, th, td, text, summary, span')) {
        if (!(e as HTMLElement).offsetParent && e.tagName !== 'text' && e.tagName !== 'BODY') continue
        const f = getComputedStyle(e).fontFamily
        if (!/^"?Figtree/i.test(f)) out.push(`${e.tagName}: ${f}`)
      }
      return out
    })
    expect(families, path).toEqual([])
  }
  await page.goto('/official/dual-gov')
  await expect(page.locator('[data-testid="saln-chart"] .recharts-bar-rectangle').first()).toBeVisible()
  expect((await style(page, '[data-testid="saln-chart"] .recharts-cartesian-axis-tick-value')).family).toMatch(/^"?Figtree/i)
})

test('the same role has the same size and weight on every page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const at = async (path: string, sel: string) => {
    await page.goto(path)
    const s = await style(page, sel)
    return `${s.size}/${s.weight}/${s.line}`
  }
  // hero titles
  expect(await at('/about', '[data-testid="about-hero-title"]')).toBe(await at('/', '[data-testid="hero-title"]'))
  // section titles: list "Current Officials", profile "SALN records", About cards, year cards
  const section = await at('/', '[data-testid="current-officials"] > h2')
  expect(await at('/official/dual-gov', '#saln-records-heading')).toBe(section)
  expect(await at('/about', '#about-what')).toBe(section)
  expect(await at('/official/dual-gov', '[data-testid="saln-card"] h4')).toBe(section)
  // card titles: official card name, banner title, chart title
  const card = await at('/', '[data-testid="group"] h4 a')
  expect(await at('/', '#help-banner-title')).toBe(card)
  expect(await at('/official/dual-gov', '[data-testid="saln-chart"] h4')).toBe(card)
  // group titles: group rows, level headers, About sub-headings, profile "Terms"
  const group = await at('/', '[data-group="provincial"] button > span')
  expect(await at('/', '[data-level="municipal"] h3')).toBe(group)
  expect(await at('/about', '#about-data ~ * h4, [aria-labelledby="about-data"] h4')).toBe(group)
  // body paragraphs
  const body = await at('/', '[data-testid="hero-summary"]')
  expect(await at('/about', '[aria-labelledby="about-what"] p')).toBe(body)
  // buttons and badges
  const btn = await at('/about', '[aria-labelledby="about-request"] a')
  expect(await at('/', 'section[aria-labelledby="help-banner-title"] a[href*="forms.gle"]')).toBe(btn)
  const badge = await at('/', '[data-testid="level-badge"]')
  expect(await at('/official/dual-gov', '[data-testid="level-badge"]')).not.toBe('')
  expect(badge).toMatch(/^12px\/700/)
  // big numbers
  expect(await at('/official/dual-gov', '[data-testid="stat-records"] dd')).toMatch(/^24px\/700/)
})

test('inputs and selects are 16px on phones (no iOS zoom)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  expect((await style(page, '#f-q')).size).toBe('16px')
  expect((await style(page, '#f-lgu')).size).toBe('16px')
})
