import { expect, test } from '@playwright/test'
import { chooseLang, openAllGroups, openLangMenu } from './helpers'

const DISCLAIMER = 'Aggregator, not the original source; not an official government website.'
const BAUNGON = '1001301000'
const DAMULOG = '1001302000'

test('barangay select is disabled until a municipality is chosen, then lists only its barangays', async ({ page }) => {
  await page.goto('/')
  const barangay = page.getByLabel('Barangay', { exact: true })
  await expect(barangay).toBeDisabled()
  await page.getByLabel('Municipality', { exact: true }).selectOption(BAUNGON)
  await expect(page).toHaveURL(new RegExp(`lgu=${BAUNGON}`))
  await expect(barangay).toBeEnabled()
  const names = await barangay.locator('option:not([value=""])').allTextContents()
  expect(names.sort()).toEqual(['Kiararum', 'Lacolac', 'Poblacion'])
})

test('changing the municipality resets the barangay', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Municipality', { exact: true }).selectOption(BAUNGON)
  await page.getByLabel('Barangay', { exact: true }).selectOption({ label: 'Poblacion' })
  await expect(page).toHaveURL(/barangay=/)
  await page.getByLabel('Municipality', { exact: true }).selectOption(DAMULOG)
  await expect(page.getByLabel('Barangay', { exact: true })).toHaveValue('')
  await expect(page).not.toHaveURL(/barangay=/)
})

test('same-named barangays are told apart by code', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Municipality', { exact: true }).selectOption(DAMULOG)
  await page.getByLabel('Barangay', { exact: true }).selectOption({ label: 'Poblacion' })
  await expect(page.getByText('Captain Poblacion Damulog')).toBeVisible()
  await expect(page.getByText('Captain Poblacion Baungon')).toHaveCount(0)
})

test('reload restores the selection from the URL', async ({ page }) => {
  await page.goto(`/?lgu=${BAUNGON}`)
  await expect(page.getByLabel('Municipality', { exact: true })).toHaveValue(BAUNGON)
  await page.reload()
  await expect(page.getByLabel('Municipality', { exact: true })).toHaveValue(BAUNGON)
  await expect(page.getByText('Captain Lacolac')).toBeVisible()
  await expect(page.getByText('Captain Poblacion Damulog')).toHaveCount(0)
})

test('unknown lgu renders the unfiltered list', async ({ page }) => {
  await page.goto('/?lgu=zzz')
  await openAllGroups(page)
  await expect(page.getByLabel('Municipality', { exact: true })).toHaveValue('')
  await expect(page.getByText('Test Governor')).toBeVisible()
  await expect(page.getByText('Captain Lacolac')).toBeVisible()
})

test('cards show net worth, no-SALN text and unverified badge', async ({ page }) => {
  await page.goto('/')
  await openAllGroups(page)
  await expect(page.getByText('No SALN data yet').first()).toBeVisible()
  await expect(page.getByText('₱10.50M')).toBeVisible()
  await expect(page.getByText('-₱300.00K')).toBeVisible()
  await expect(page.getByText('Unverified').first()).toBeVisible()
})

test('disclaimer is present on every page', async ({ page }) => {
  for (const path of ['/', '/about', '/official/test-governor']) {
    await page.goto(path)
    await expect(page.getByText(DISCLAIMER)).toBeVisible()
  }
})

test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

const NO_SALN_CEB = 'Wala pay datos sa SALN'

test('switching to Binisaya translates the page, updates <html lang> and persists after reload', async ({ page }) => {
  await page.goto('/official/test-rep-1')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByText('No SALN data yet')).toBeVisible()
  await chooseLang(page, 'Binisaya')
  await expect(page.getByText(NO_SALN_CEB)).toBeVisible()
  await expect(page.getByText('No SALN data yet')).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ceb')
  await expect(page).toHaveTitle('SALN Tracker - Bukidnon')
  await expect(page.getByRole('navigation', { name: 'Panguna' })).toBeVisible()
  await openLangMenu(page)
  await expect(page.getByRole('button', { name: 'Binisaya' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(page.getByText(NO_SALN_CEB)).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ceb')
  await chooseLang(page, 'Filipino')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil')
  await expect(page.getByText('Wala pang datos ng SALN')).toBeVisible()
})

test('the disclaimer is translated too', async ({ page }) => {
  await page.goto('/')
  await chooseLang(page, 'Filipino')
  await expect(page.getByRole('note')).toContainText('Tagapagtipon lamang')
})

test('the language switcher is keyboard operable', async ({ page }) => {
  await page.goto('/')
  await page.locator('#lang-toggle').focus()
  await page.keyboard.press('Enter') // the menu is closed until opened
  const group = page.getByRole('group', { name: 'Language' })
  await expect(group).toBeVisible()
  const ceb = page.getByRole('button', { name: 'Binisaya' })
  await ceb.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ceb')
  await openLangMenu(page)
  await page.getByRole('button', { name: 'English' }).focus()
  await page.keyboard.press('Space')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('a language choice works with localStorage disabled', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked')
      },
    })
  })
  await page.goto('/official/test-rep-1')
  await chooseLang(page, 'Binisaya')
  await expect(page.getByText(NO_SALN_CEB)).toBeVisible()
})
