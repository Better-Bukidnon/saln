import { expect, test } from '@playwright/test'

test('profile shows long-form net worth and a source link equal to sourceUrl', async ({ page }) => {
  await page.goto('/official/dual-gov')
  await expect(page.getByRole('heading', { level: 2, name: 'Dual Term Person' })).toBeVisible()
  const table = page.getByRole('table')
  await expect(table.getByText('₱24,957,188.98')).toBeVisible()
  const link = table.getByRole('link', { name: /Ombudsman/ })
  await expect(link).toHaveAttribute('href', 'https://example.org/ombudsman-2024')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(table.getByRole('link', { name: /House of Representatives summary/ })).toHaveAttribute(
    'href',
    'https://example.org/house-summary-2022',
  )
})

test('table is newest first, with caption, scoped headers and verified-by only when verified', async ({ page }) => {
  await page.goto('/official/dual-gov')
  await expect(page.locator('table caption')).not.toBeEmpty()
  expect(await page.locator('th[scope="col"]').count()).toBeGreaterThanOrEqual(7)
  const years = await page.locator('tbody tr th[scope="row"]').allTextContents()
  expect(years).toEqual(['2024', '2022'])
  await expect(page.getByText('Verified by Test Maintainer on 2026-10-01')).toHaveCount(1)
  await expect(page.getByText(/Verified by/)).toHaveCount(1)
  await expect(page.getByText('Totals only, as declared. Source documents are linked.')).toBeVisible()
})

test('negative net worth renders as -₱ not NaN', async ({ page }) => {
  await page.goto('/official/test-mayor-baungon')
  await expect(page.getByRole('table').getByText('-₱300,000.00')).toBeVisible()
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
  for (const h of ['Sources', 'Verification', 'How to request a SALN', 'How to submit a SALN copy']) {
    await expect(page.getByRole('heading', { level: 3, name: h })).toBeVisible()
  }
  await expect(page.getByRole('link', { name: /Ombudsman/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /submission form/i })).toHaveAttribute(
    'href',
    'https://github.com/Better-Bukidnon/saln/issues/new?template=submit-saln.yml',
  )
  await expect(page.getByText('Aggregator, not the original source; not an official government website.')).toBeVisible()
})

test('unsafe source scheme is not rendered as a link', async ({ page }) => {
  await page.goto('/official/unsafe-person')
  await expect(page.getByText('Source link unavailable')).toBeVisible()
  await expect(page.getByRole('table').getByRole('link')).toHaveCount(0)
  await expect(page.locator('a[href^="javascript:" i]')).toHaveCount(0)
})
