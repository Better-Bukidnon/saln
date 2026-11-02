// Smoke test against the REAL data in data/ (production build, no fixture alias).
// Run by the `smoke` Playwright project (see playwright.config.ts). Nothing here
// asserts a record is `verified`; real records are unverified by default.
import { readdirSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import portalConfig from '../../portal.config'
import { formatPeso } from '../../src/lib/money'
import type { Official, SalnRecord } from '../../src/lib/types'

interface GeoNode {
  psgc: string
  name: string
  type: string
  parent?: string
}

const readJson = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')) as T

const geo = readJson<{ nodes: GeoNode[] }>('data/geo.json').nodes
const officialFiles = ['seed', 'openhalalan-2016', 'openhalalan-2019', 'openhalalan-2022', 'openhalalan-2025', 'barangay-captains']
const officials: Official[] = officialFiles.flatMap((f) => {
  try {
    return readJson<Official[]>(`data/officials/${f}.json`)
  } catch {
    return [] // barangay-captains.json is optional
  }
})
const houseSaln = readJson<SalnRecord[]>('data/saln/house-2016.json')
const byId = new Map(officials.map((o) => [o.id, o]))
const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)

/** Hrefs of the official cards currently listed, as ids. */
async function listedIds(page: import('@playwright/test').Page): Promise<string[]> {
  const hrefs = await page.locator('a[href^="/official/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))
  return hrefs.map((h) => h.replace('/official/', ''))
}

test('the list loads with the current governor from the seed data', async ({ page }) => {
  const seed = readJson<Official[]>('data/officials/seed.json')
  const governor = seed.find((o) => o.position === 'Governor' && o.termStart <= today && (o.termEnd === null || today <= o.termEnd))
  expect(governor, 'seed.json has a current Governor').toBeTruthy()
  await page.goto('/')
  await expect(page.locator(`a[href="/official/${governor!.id}"]`)).toHaveText(governor!.name)
  expect((await listedIds(page)).length).toBeGreaterThan(1)
})

test('municipality then barangay filter works on real data', async ({ page }) => {
  const municipalities = geo.filter((n) => n.type === 'municipality' || n.type === 'city')
  const barangaysOf = (code: string) => geo.filter((n) => n.type === 'barangay' && n.parent === code)
  const inScope = (code: string) => (o: Official) =>
    o.geoCode === code || barangaysOf(code).some((b) => b.psgc === o.geoCode)
  // A municipality that has local officials in the data.
  const muni = municipalities.find((m) => officials.some((o) => o.level !== 'province' && o.level !== 'district' && o.geoCode === m.psgc))
  expect(muni, 'some municipality has officials').toBeTruthy()

  await page.goto('/')
  const barangaySelect = page.getByLabel('Barangay', { exact: true })
  await expect(barangaySelect).toBeDisabled()
  await page.getByLabel('Municipality', { exact: true }).selectOption(muni!.psgc)
  await expect(page).toHaveURL(new RegExp(`lgu=${muni!.psgc}`))
  await expect(barangaySelect).toBeEnabled()

  const names = await barangaySelect.locator('option:not([value=""])').allTextContents()
  expect([...names].sort()).toEqual(barangaysOf(muni!.psgc).map((b) => b.name).sort())

  const inMuni = inScope(muni!.psgc)
  const shown = await listedIds(page)
  expect(shown.length).toBeGreaterThan(0)
  for (const id of shown) expect(inMuni(byId.get(id)!), `${id} belongs to ${muni!.name}`).toBe(true)

  // Prefer a barangay that has a captain in the data; with no captain data (the file is
  // optional and does not ship yet) the barangay filter must show nothing, explicitly.
  const children = barangaysOf(muni!.psgc)
  const withCaptain = children.find((b) => officials.some((o) => o.level === 'barangay' && o.geoCode === b.psgc))
  const bgy = withCaptain ?? children[0]
  await barangaySelect.selectOption(bgy.psgc)
  await expect(page).toHaveURL(new RegExp(`barangay=${bgy.psgc}`))
  const bgyShown = await listedIds(page)
  for (const id of bgyShown) expect(byId.get(id)!.geoCode).toBe(bgy.psgc)
  if (!withCaptain) {
    // Captain-specific assertion is not possible without captain data: no data, no cards.
    expect(bgyShown, 'no barangay captain data, so no cards for a barangay').toHaveLength(0)
  } else {
    expect(bgyShown.length).toBeGreaterThan(0)
  }
})

test('2016 House officials show a House-sourced, unverified SALN row with a source link', async ({ page }) => {
  let checked = 0
  for (const rec of houseSaln) {
    const official = officials.find((o) => o.personId === rec.personId && o.termStart.startsWith('2016'))
    expect(official, rec.personId).toBeTruthy()
    if (!official) continue
    checked++
    await page.goto(`/official/${official.id}`)
    const row = page.getByTestId('saln-card').filter({ hasText: formatPeso(rec.netWorth) })
    await expect(row).toHaveCount(1)
    const link = row.getByRole('link', { name: /View source/ })
    await expect(link).toHaveAttribute('href', rec.sourceUrl)
    expect(new URL(rec.sourceUrl).hostname).toBe('docs.congress.hrep.online')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(row).toContainText(/submitted/i)
    await expect(row).toContainText(/not yet verified/i)
    await expect(row.getByText(/Verified by/)).toHaveCount(0)
  }
  expect(checked).toBe(houseSaln.length)
})

test('the disclaimer appears exactly once on the list, a profile and About', async ({ page }) => {
  const profile = officials.find((o) => houseSaln.some((r) => r.personId === o.personId))!
  for (const path of ['/', `/official/${profile.id}`, '/about']) {
    await page.goto(path)
    await expect(page.getByText(portalConfig.disclaimer)).toHaveCount(1)
  }
})

test('the production build contains no demo or sample data', async () => {
  const dir = new URL('../../dist/', import.meta.url)
  const files: string[] = []
  const walk = (d: URL) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const u = new URL(e.name + (e.isDirectory() ? '/' : ''), d)
      if (e.isDirectory()) walk(u)
      else if (/\.(js|css|html|json|txt|svg)$/.test(e.name)) files.push(readFileSync(u, 'utf8'))
    }
  }
  walk(dir)
  expect(files.length).toBeGreaterThan(0)
  for (const f of files) {
    expect(f).not.toContain('SAMPLE DATA')
    expect(f).not.toContain('Juan Dela Cruz')
    expect(f).not.toContain('Demo Maintainer')
    expect(f).not.toContain('example.com/sample-saln')
  }
})
