import { expect, test } from '@playwright/test'
import { chooseLang, openAllGroups } from './helpers'

test('list cards show the latest SALN verification status next to the figure', async ({ page }) => {
  await page.goto('/?status=all&q=Dual')
  await openAllGroups(page)
  // the person has two terms, so two cards, both showing the latest figure with its status
  await expect(page.getByText('₱24.96M')).toHaveCount(2)
  await expect(page.getByTestId('card-status-badge')).toHaveText(['Submitted, not yet verified', 'Submitted, not yet verified'])
  // an official without a SALN shows no status badge
  await page.goto('/?status=all&q=Test Representative')
  await openAllGroups(page)
  await expect(page.getByTestId('card-status-badge')).toHaveCount(0)
})

test('document titles per page and language', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('SALN Tracker - Bukidnon')
  await page.goto('/about')
  await expect(page).toHaveTitle('About - SALN Tracker - Bukidnon')
  await page.goto('/official/test-rep-1')
  await expect(page).toHaveTitle('Test Representative - SALN Tracker - Bukidnon')
  await chooseLang(page, 'Binisaya')
  await expect(page).toHaveTitle('Test Representative - SALN Tracker - Bukidnon')
  await page.goto('/about')
  await expect(page).toHaveTitle('Mahitungod - SALN Tracker - Bukidnon')
  await page.goto('/no/such/page')
  await expect(page).toHaveTitle('Wala makita ang panid - SALN Tracker - Bukidnon')
})

test('unknown routes show a not-found page with a link home and a single h1', async ({ page }) => {
  await page.goto('/definitely/not/a/page')
  await expect(page.getByTestId('not-found-page')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'Page not found' })).toBeVisible()
  await expect(page).toHaveTitle('Page not found - SALN Tracker - Bukidnon')
  await page.getByRole('link', { name: 'Go to the officials list' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page).toHaveTitle('SALN Tracker - Bukidnon')
  await page.goto('/official/nobody')
  await expect(page).toHaveTitle('Page not found - SALN Tracker - Bukidnon')
})
