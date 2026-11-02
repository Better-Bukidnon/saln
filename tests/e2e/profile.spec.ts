import { expect, test } from '@playwright/test'
import portalConfig from '../../portal.config'

test('profile shows long-form net worth and a source link equal to sourceUrl', async ({ page }) => {
  await page.goto('/official/dual-gov')
  await expect(page.getByRole('heading', { level: 2, name: 'Dual Term Person' })).toBeVisible()
  const cards = page.getByTestId('saln-cards')
  await expect(cards.getByText('₱24,957,188.98')).toBeVisible()
  const link = cards.getByRole('link', { name: /View source.*Ombudsman/ })
  await expect(link).toHaveAttribute('href', 'https://example.org/ombudsman-2024')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(cards.getByRole('link', { name: /View source.*House of Representatives summary/ })).toHaveAttribute(
    'href',
    'https://example.org/house-summary-2022',
  )
})

test('year cards are newest first with a status badge, and verified-by only when verified', async ({ page }) => {
  await page.goto('/official/dual-gov')
  const years = await page.locator('[data-testid="saln-card"] h4').allTextContents()
  expect(years).toEqual(['SALN 2024', 'SALN 2022'])
  const badges = await page.getByTestId('status-badge').allTextContents()
  expect(badges).toEqual(['Submitted, not yet verified', 'Verified'])
  await expect(page.getByText('Verified by Test Maintainer on 2026-10-01')).toHaveCount(1)
  await expect(page.getByText(/Verified by/)).toHaveCount(1)
  await expect(page.getByText('Totals only, as declared. Source documents are linked.')).toBeVisible()
  await expect(page.getByTestId('stat-records')).toContainText('2')
  await expect(page.getByTestId('stat-latest')).toContainText('2024')
  await expect(page.getByText('Data source: Ombudsman copy')).toBeVisible()
})

test('over-time chart appears only with two or more SALN years, with an accessible label and table', async ({ page }) => {
  await page.goto('/official/dual-gov')
  const chart = page.getByTestId('saln-chart')
  await expect(chart).toBeVisible()
  await expect(chart.getByRole('heading', { name: 'Assets, Liabilities & Net Worth Over Time' })).toBeVisible()
  await expect(chart).toContainText('Showing data from 2022 to 2024')
  await expect(chart.getByRole('group', { name: /Grouped bar chart/ })).toHaveAttribute('aria-label', /2022 to 2024/)
  await expect(chart.locator('.recharts-bar-rectangle')).toHaveCount(6)
  await expect(chart.locator('.recharts-bar')).toHaveCount(3)
  for (const s of ['assets', 'liabilities', 'netWorth']) await expect(chart.locator(`.recharts-bar-rectangle path[fill="var(--color-${s})"]`)).toHaveCount(2)
  await expect(chart.locator('[data-slot="chart-legend"] > div')).toHaveText(['Assets', 'Liabilities', 'Net Worth'])
  await expect(chart.getByTestId('chart-value').first()).toContainText('₱')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  await chart.getByText('Show chart data as a table').click()
  await expect(chart.getByRole('table').locator('tbody tr')).toHaveCount(2)
  const rows = chart.getByRole('table').locator('tbody tr')
  await expect(rows.nth(0)).toContainText(/20,000,000\.00/)
  await expect(rows.nth(1)).toContainText(/5,042,811\.02/)
  await page.goto('/official/test-mayor-baungon')
  await expect(page.getByTestId('saln-chart')).toHaveCount(0)
  await page.goto('/official/test-rep-1')
  await expect(page.getByTestId('saln-chart')).toHaveCount(0)
})

test('negative net worth renders as -₱ not NaN', async ({ page }) => {
  await page.goto('/official/test-mayor-baungon')
  await expect(page.getByTestId('saln-cards').getByText('-₱300,000.00')).toBeVisible()
  await expect(page.getByText('NaN')).toHaveCount(0)
})

test('both terms of one person are listed, with unverified badge only on the unverified one', async ({ page }) => {
  await page.goto('/official/dual-rep')
  const terms = page.getByRole('list', { name: 'Terms' }).getByRole('listitem')
  await expect(terms).toHaveCount(2)
  await expect(terms.filter({ hasText: 'Representative, 2nd District' })).toHaveCount(1)
  await expect(terms.filter({ hasText: 'Governor' })).toHaveCount(1)
  await expect(terms.filter({ hasText: 'Unverified' })).toHaveCount(1)
  await expect(terms.filter({ hasText: 'Governor' }).getByText('Unverified')).toBeVisible()
})

test('no SALN shows the empty state and the Ombudsman request link', async ({ page }) => {
  await page.goto('/official/test-rep-1')
  await expect(page.getByText('No SALN data yet')).toBeVisible()
  await expect(page.getByRole('table')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Request this SALN from the Ombudsman' })).toHaveAttribute(
    'href',
    'https://www.ombudsman.gov.ph/request-for-copy-of-salns/',
  )
})

test('unknown id shows not found with a link home', async ({ page }) => {
  await page.goto('/official/nope')
  await expect(page.getByText('Official not found')).toBeVisible()
  await page.getByRole('link', { name: /Back to officials/ }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('about page has its sections and the submit link', async ({ page }) => {
  await page.goto('/about')
  for (const h of ['What is a SALN?', 'Our Mission', 'Data Sources and Disclaimer', 'How to request a SALN', 'Legal Framework', 'Support Transparency']) {
    await expect(page.getByRole('heading', { level: 3, name: h })).toBeVisible()
  }
  await expect(page.getByRole('link', { name: /Ombudsman/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /submission form/i })).toHaveAttribute('href', portalConfig.submitUrl)
  await expect(page.getByText('Aggregator, not the original source; not an official government website.')).toBeVisible()
})

test('unsafe source scheme is not rendered as a link', async ({ page }) => {
  await page.goto('/official/unsafe-person')
  await expect(page.getByText('Source link unavailable')).toBeVisible()
  await expect(page.getByTestId('saln-cards').getByRole('link')).toHaveCount(0)
  await expect(page.locator('a[href^="javascript:" i]')).toHaveCount(0)
})

test('chart is keyboard reachable, shows the full peso value in its tooltip, and does not overflow a 360px page', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/official/dual-gov')
  const chart = page.getByTestId('saln-chart')
  await expect(chart.locator('.recharts-bar-rectangle')).toHaveCount(6)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  await expect(chart.getByRole('region', { name: 'Chart, scrollable' })).toHaveAttribute('tabindex', '0')
  const surface = chart.locator('.recharts-wrapper svg.recharts-surface')
  await surface.focus()
  await expect(surface).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(chart.locator('.recharts-tooltip-wrapper')).toContainText(/₱\d{1,3}(,\d{3})+\.\d{2}/)
  await expect(chart.locator('.recharts-tooltip-wrapper')).toContainText(/^\s*20(22|24)/) // header is the year, not a series name
})

test('chart surface is not nested inside role=img', async ({ page }) => {
  await page.goto('/official/dual-gov')
  await expect(page.getByTestId('saln-chart').locator('svg.recharts-surface')).toBeVisible()
  const nested = await page.evaluate(() => [...document.querySelectorAll('[role="img"]')].filter((e) => e.querySelector('[tabindex]:not([tabindex="-1"]), a[href], button, input, select')).length)
  expect(nested).toBe(0)
  await expect(page.getByRole('group', { name: /Grouped bar chart/ })).toHaveCount(1)
})

test('a chart with 12 years and a negative net worth renders without console errors, labels never overlap', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/official/many-years')
  const chart = page.getByTestId('saln-chart')
  await expect(chart.locator('.recharts-bar-rectangle')).toHaveCount(36)
  const boxes = await chart.locator('[data-testid="chart-value"]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height })))
  expect(boxes.length).toBeGreaterThan(0)
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const [a, b] = [boxes[i], boxes[j]]
      expect(a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1, `labels ${i} and ${j} overlap`).toBe(false)
    }
  expect(errors).toEqual([])
})

test('if the chart chunk fails to load, a message, the data table and a working Retry appear', async ({ page }) => {
  let block = true
  await page.route(/SalnChart-.*\.js/, (r) => (block ? r.abort() : r.continue()))
  await page.goto('/official/dual-gov')
  const err = page.getByTestId('saln-chart-error')
  await expect(err).toContainText('The chart could not be loaded')
  await expect(err.getByRole('table')).toBeVisible()
  block = false
  await err.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByTestId('saln-chart').locator('.recharts-bar-rectangle')).toHaveCount(6)
})
