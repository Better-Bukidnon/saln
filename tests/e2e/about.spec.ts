import { expect, test } from '@playwright/test'
import portalConfig from '../../portal.config'

const DISCLAIMER = 'Aggregator, not the original source; not an official government website.'

test('about page: hero, banner, section headings in order, one h1', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2, name: 'About SALN Tracker Bukidnon' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Help us open up SALN data' })).toBeVisible()
  const h3s = await page.locator('main h3').allTextContents()
  expect(h3s).toEqual([
    'Help us open up SALN data',
    'What is a SALN?',
    'Our Mission',
    'Data Sources and Disclaimer',
    'How to request a SALN',
    'Legal Framework',
    'Support Transparency',
  ])
  const levels = await page.locator('main h2, main h3, main h4').evaluateAll((els) => els.map((e) => Number(e.tagName[1])))
  for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
})

test('about page: Important callout names our sources and the disclaimer appears exactly once', async ({ page }) => {
  await page.goto('/about')
  const box = page.getByTestId('about-important')
  await expect(box).toContainText('Important')
  const data = page.getByRole('region', { name: 'Data Sources and Disclaimer' })
  for (const s of ['House of Representatives', 'Open Halalan roster', 'curated list', 'citizens obtained lawfully']) {
    await expect(data).toContainText(s)
  }
  await expect(data).not.toContainText(/exclusively official/i)
  await expect(page.getByText(DISCLAIMER)).toHaveCount(1)
  await expect(page.getByRole('note')).toHaveCount(1)
})

test('about page: Ombudsman link, legal framework and hashtags', async ({ page }) => {
  await page.goto('/about')
  const req = page.getByRole('region', { name: 'How to request a SALN' })
  await expect(req.getByRole('link', { name: /Ombudsman/ })).toHaveAttribute('href', portalConfig.ombudsmanRequestUrl)
  await expect(req).toContainText('Memorandum Circular No. 3')
  await expect(req).toContainText('regional deputy ombudsman')
  const legal = page.getByRole('region', { name: 'Legal Framework' })
  for (const s of ['Article XI, Section 17', 'Republic Act No. 6713', 'Republic Act No. 3019', 'Executive Order No. 2']) {
    await expect(legal).toContainText(s)
  }
  await expect(page.getByRole('region', { name: 'Support Transparency' })).toContainText('#TransparencyPH')
  await expect(page.getByRole('link', { name: /submission form/i })).toHaveAttribute('href', portalConfig.submitUrl)
})

test('about page: no horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/about')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
})
