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

test('no itemised Assets/Liabilities sections are rendered (totals only)', async ({ page }) => {
  await page.goto('/official/dual-gov')
  await expect(page.getByRole('heading', { name: /^(Assets|Liabilities) \(\d+\)$/ })).toHaveCount(0)
})

test('over-time chart appears only with two or more SALN years, with an accessible label and table', async ({ page }) => {
  await page.goto('/official/dual-gov')
  const chart = page.getByTestId('saln-chart')
  await expect(chart).toBeVisible()
  await expect(chart.getByRole('heading', { name: 'Assets, Liabilities & Net Worth Over Time' })).toBeVisible()
  await expect(chart).toContainText('Showing data from 2022 to 2024')
  await expect(chart.getByRole('img')).toHaveAttribute('aria-label', /2022 to 2024/)
  await expect(chart.getByTestId('chart-bar')).toHaveCount(6)
  for (const s of ['assets', 'liabilities', 'netWorth']) await expect(chart.locator(`[data-series="${s}"]`)).toHaveCount(2)
  await expect(chart.getByTestId('chart-legend').getByRole('listitem')).toHaveText(['Assets', 'Liabilities', 'Net Worth'])
  await expect(chart.getByTestId('chart-value').first()).toContainText('₱')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  await chart.getByText('Show chart data as a table').click()
  await expect(chart.getByRole('table').locator('tbody tr')).toHaveCount(2)
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
