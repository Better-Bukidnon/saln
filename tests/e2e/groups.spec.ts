import { expect, test } from '@playwright/test'

const BAUNGON = '1001301000'
const group = (page: import('@playwright/test').Page, key: string) => page.locator(`[data-group="${key}"]`)
const toggle = (page: import('@playwright/test').Page, key: string) => group(page, key).getByRole('button')

test('sections: Current Officials heading, Provincial Heads open by default, others collapsed', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 2, name: 'Current Officials' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Former Officials' })).toHaveCount(0)
  await expect(toggle(page, 'provincial')).toHaveAttribute('aria-expanded', 'true')
  await expect(group(page, 'provincial').getByText('Test Governor').first()).toBeVisible()
  await expect(toggle(page, 'house')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText('Captain Lacolac')).toHaveCount(0)
})

test('count badge text and result count agree', async ({ page }) => {
  await page.goto('/')
  const total = await page.getByRole('status').textContent()
  const n = Number(total!.match(/\d+/)![0])
  const badges = await page.locator('[data-testid="group"] button span:last-child').allTextContents()
  const sum = badges.reduce((s, b) => s + Number(b.match(/\d+/)![0]), 0)
  expect(sum).toBe(n)
  await expect(toggle(page, 'provincial')).toContainText(/\d+ Officials?/)
})

test('click expands and collapses; the chevron rotates', async ({ page }) => {
  await page.goto('/')
  const b = toggle(page, 'house')
  const chev = b.locator('svg')
  await b.click()
  await expect(b).toHaveAttribute('aria-expanded', 'true')
  await expect(group(page, 'house').getByRole('link').first()).toBeVisible()
  await expect(chev).toHaveClass(/rotate-90/)
  await b.click()
  await expect(b).toHaveAttribute('aria-expanded', 'false')
  await expect(group(page, 'house').getByRole('link')).toHaveCount(0)
})

test('keyboard: Tab to a group, Enter and Space toggle it, focus ring is visible', async ({ page }) => {
  await page.goto('/')
  const b = toggle(page, 'house')
  await b.focus()
  await expect(b).toBeFocused()
  expect(await b.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Enter')
  await expect(b).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Space')
  await expect(b).toHaveAttribute('aria-expanded', 'false')
  const box = await b.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('a municipality filter auto-expands its groups and counts follow the filter', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Municipality').selectOption(BAUNGON)
  await expect(page).toHaveURL(new RegExp(`lgu=${BAUNGON}`))
  await expect(page).not.toHaveURL(/open|expand/)
  await expect(page.getByText('Captain Lacolac')).toBeVisible()
  await expect(page.locator('[data-testid="group"] button[aria-expanded="false"]')).toHaveCount(0)
  await expect(group(page, 'provincial')).toHaveCount(0)
})

test('Former Officials appear when the term filter allows them', async ({ page }) => {
  await page.goto('/?status=all')
  await expect(page.getByRole('heading', { level: 2, name: 'Current Officials' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Former Officials' })).toBeVisible()
  await page.goto('/?status=former')
  await expect(page.getByRole('heading', { level: 2, name: 'Current Officials' })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: 'Former Officials' })).toBeVisible()
  await expect(page.locator('[data-testid="group"] button[aria-expanded="true"]')).toHaveCount(0)
})

test('no horizontal overflow at 360px with groups open', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  await toggle(page, 'house').click()
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(over).toBeLessThanOrEqual(0)
})

test('level headers: h3 per level with description, total badge and neutral rows', async ({ page }) => {
  await page.goto('/')
  const h3s = page.getByRole('heading', { level: 3 })
  await expect(h3s.filter({ hasText: 'Provincial Heads' })).toBeVisible()
  await expect(h3s.filter({ hasText: 'House of Representatives' })).toBeVisible()
  await expect(h3s.filter({ hasText: 'Municipal and City Officials' })).toBeVisible()
  await expect(h3s.filter({ hasText: 'Barangay Officials' })).toBeVisible()
  const muni = page.locator('[data-level="municipal"]')
  await expect(muni).toContainText(/Mayors, vice mayors and councilors of Bukidnon's \d+ cities and \d+ municipalities/)
  await expect(muni.getByTestId('level-total')).toContainText(/\d+ Officials?/)
  await expect(page.locator('[data-level="barangay"]')).toContainText(/Barangay captains across Bukidnon's \d+ barangays/)
  // single-row levels carry their description on the row and a coloured left marker
  await expect(page.locator('[data-level="provincial"]')).toContainText('governor and vice governor')
  // group rows are neutral cards: no coloured left edge
  const edges = await page
    .locator('[data-testid="group"] > div')
    .evaluateAll((els) => els.map((e) => [getComputedStyle(e).borderLeftWidth, getComputedStyle(e).borderLeftColor, getComputedStyle(e).borderTopColor]))
  expect(edges.length).toBeGreaterThan(3)
  for (const [w, left, top] of edges) {
    expect(w).toBe('1px')
    expect(left).toBe(top)
  }
  // level headers sit between the h2 and the card headings: no level skipped
  const levels = await page.locator('main h2, main h3, main h4').evaluateAll((els) => els.map((e) => Number(e.tagName[1])))
  for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
})
