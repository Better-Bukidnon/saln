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

test('keyboard: Tab reaches a group, Enter and Space toggle it, focus ring is visible', async ({ page }) => {
  await page.goto('/')
  await toggle(page, 'provincial').focus()
  const b = toggle(page, 'house')
  for (let i = 0; i < 40 && !(await b.evaluate((e) => e === document.activeElement)); i++) await page.keyboard.press('Tab')
  await expect(b).toBeFocused()
  // the ring is drawn inset on the whole header band, so it is never clipped by the card
  expect(await b.evaluate((el) => getComputedStyle(el.closest('[data-testid="group-header"]')!).outlineStyle)).not.toBe('none')
  await page.keyboard.press('Enter')
  await expect(b).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Space')
  await expect(b).toHaveAttribute('aria-expanded', 'false')
  const box = await b.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  await expect(page.locator(`#${await b.getAttribute('aria-controls')}`)).toHaveCount(1)
})

test('a municipality filter auto-expands its groups and counts follow the filter', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Municipality', { exact: true }).selectOption(BAUNGON)
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
  // single-row levels carry their description on the row
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

test('group header band encloses title, count and description, and is one colour', async ({ page }) => {
  await page.goto('/')
  const band = group(page, 'provincial').getByTestId('group-header')
  const desc = group(page, 'provincial').getByTestId('group-description')
  const bg = (l: typeof band) => l.evaluate((e) => getComputedStyle(e).backgroundColor)
  expect(await bg(band)).toMatch(/oklch\(0\.985|rgb\(249, 250, 251\)/)
  expect(await bg(desc)).toBe('rgba(0, 0, 0, 0)') // transparent: it sits on the band's own gray
  const [bb, db, tb] = [await band.boundingBox(), await desc.boundingBox(), await band.getByRole('button').boundingBox()]
  expect(db!.y).toBeGreaterThanOrEqual(bb!.y)
  expect(db!.y + db!.height).toBeLessThanOrEqual(bb!.y + bb!.height + 0.5) // the description box (with its bottom padding) ends inside the band
  expect(db!.x + db!.width).toBeLessThanOrEqual(bb!.x + bb!.width)
  // no divider line: the gray band alone separates it from the white content
  expect(await band.evaluate((e) => getComputedStyle(e).borderBottomWidth)).toBe('0px')
  // the clickable/hover/focus area is the whole band, not just the title row
  expect(tb!.height).toBeLessThan(bb!.height)
  await desc.hover({ position: { x: 200, y: 10 }, force: true }) // over the description line, not the title row
  await page.waitForTimeout(300)
  expect(await bg(band)).toMatch(/oklch\(0\.96|rgb\(243, 244, 246\)/)
  // the focus ring is drawn on the band and sits inside the card (not clipped)
  await band.getByRole('button').focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  expect(await band.evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('solid')
})

test('active filter pills: appear, remove with ×, URL follows, clear all', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('filter-pills')).toHaveCount(0)
  await page.getByLabel('Municipality', { exact: true }).selectOption(BAUNGON)
  await page.getByLabel('Barangay', { exact: true }).selectOption({ label: 'Poblacion' })
  await page.getByLabel('Search by name').fill('cap')
  const pills = page.getByTestId('filter-pill')
  await expect(page.getByRole('group', { name: 'Active filters (3)' })).toBeVisible()
  await expect(pills).toHaveText(['Search: cap', 'Municipality: Baungon', 'Barangay: Poblacion'])
  await expect(page.getByTestId('filters-active')).toHaveText('3')
  // removing the barangay keeps the municipality
  await page.getByRole('button', { name: 'Remove filter: Barangay: Poblacion' }).click()
  await expect(page).not.toHaveURL(/barangay=/)
  await expect(page).toHaveURL(new RegExp(`lgu=${BAUNGON}`))
  // removing the municipality is keyboard operable
  const rm = page.getByRole('button', { name: 'Remove filter: Municipality: Baungon' })
  await rm.focus()
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/lgu=/)
  await expect(page.getByLabel('Municipality', { exact: true })).toHaveValue('')
  await expect(pills).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear all' }).click()
  await expect(page).not.toHaveURL(/q=/)
  await expect(page.getByTestId('filter-pills')).toHaveCount(0)
  await expect(page.getByLabel('Search by name')).toHaveValue('')
})

test('non-default term, sort and checkboxes become pills; × has a 44px hit area', async ({ page }) => {
  await page.goto('/?status=all&sort=netWorth&dir=desc&saln=1&pw=1')
  await expect(page.getByTestId('filter-pill')).toHaveText([
    'Term: All', 'Sort by: Net worth', 'Order: Descending', 'Include province-wide officials', 'Only officials with SALN data',
  ])
  // 28px button plus its ::before extension must give a >= 44px square target
  const hit = await page.getByRole('button', { name: /Remove filter: Term/ }).evaluate((e) => {
    const r = e.getBoundingClientRect()
    const a = getComputedStyle(e, '::before')
    return { w: Math.max(r.width, parseFloat(a.width)), h: Math.max(r.height, parseFloat(a.height)) }
  })
  expect(hit.w).toBeGreaterThanOrEqual(44)
  expect(hit.h).toBeGreaterThanOrEqual(44)
  await page.getByRole('button', { name: 'Remove filter: Term: All' }).click()
  await expect(page).not.toHaveURL(/status=/)
})

test.describe('filter card on phones', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('compact: search, dropdown pills, radios and clear are all visible without a toggle', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('filters-toggle')).toHaveCount(0)
    await expect(page.getByLabel('Search by name')).toBeVisible()
    await expect(page.getByTestId('filter-pill-select')).toHaveCount(5)
    for (const pill of await page.getByTestId('filter-pill-select').all()) await expect(pill).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Current only' })).toBeChecked()
    await expect(page.getByTestId('clear-filters')).toBeDisabled()
    // 44px touch targets, 16px text in the real controls
    const h = await page.getByLabel('Municipality', { exact: true }).evaluate((e) => [e.getBoundingClientRect().height, getComputedStyle(e).fontSize])
    expect(h[0]).toBeGreaterThanOrEqual(44)
    expect(h[1]).toBe('16px')
    const search = await page.getByLabel('Search by name').evaluate((e) => e.getBoundingClientRect().height)
    expect(search).toBeGreaterThanOrEqual(44)
  })

  test('chips stay visible and Clear all resets everything', async ({ page }) => {
    await page.goto(`/?q=cap&saln=1&status=all`)
    await expect(page.getByTestId('filter-pills')).toBeVisible()
    await expect(page.getByTestId('filter-pill')).toHaveCount(3)
    await expect(page.getByTestId('filters-active')).toHaveText('3')
    await page.getByRole('button', { name: 'Clear all' }).click()
    await expect(page.getByTestId('filter-pills')).toHaveCount(0)
    await expect(page.getByTestId('filters-active')).toHaveText('0')
  })

  for (const w of [320, 390, 768]) {
    test(`no horizontal overflow at ${w}px with every filter set`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 })
      await page.goto(`/?lgu=${BAUNGON}&q=captain&status=all&sort=netWorth&dir=desc&saln=1&pw=1&level=barangay`)
      await expect(page.getByTestId('filter-pill').first()).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    })
  }
})

test.describe('dropdown pills and option row', () => {
  test('every pill is a labelled native select; set pills turn primary and read "Label: value"', async ({ page }) => {
    await page.goto('/')
    const pills = page.getByTestId('filter-pill-select')
    await expect(pills).toHaveCount(5)
    for (const name of ['Municipality', 'Barangay', 'Level', 'Sort by', 'Order']) {
      expect(await page.getByLabel(name, { exact: true }).evaluate((e) => e.tagName)).toBe('SELECT')
    }
    await expect(pills.nth(0)).toContainText('Municipality All')
    await expect(pills.nth(0)).toHaveAttribute('data-filled', 'false')
    await page.getByLabel('Municipality', { exact: true }).selectOption(BAUNGON)
    await expect(pills.nth(0)).toContainText('Municipality: Baungon')
    await expect(pills.nth(0)).toHaveAttribute('data-filled', 'true')
    await page.waitForTimeout(400) // colour transition
    expect(await pills.nth(0).evaluate((e) => getComputedStyle(e).backgroundColor)).toMatch(/rgb\(0, 50, 160\)|oklch\(0\.3/)
    await page.getByLabel('Sort by', { exact: true }).selectOption('netWorth')
    await expect(pills.nth(3)).toContainText('Sort by: Net worth')
  })

  test('Barangay is natively disabled until a municipality is chosen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByLabel('Barangay', { exact: true })).toBeDisabled()
    await page.getByLabel('Municipality', { exact: true }).selectOption(BAUNGON)
    await expect(page.getByLabel('Barangay', { exact: true })).toBeEnabled()
  })

  test('keyboard only: Tab to a pill select, change it by typing, see the URL and chip update', async ({ page }) => {
    await page.goto('/')
    const level = page.getByLabel('Level', { exact: true })
    await level.focus()
    await expect(level).toBeFocused()
    expect(await level.evaluate((e) => getComputedStyle(e.parentElement!).outlineStyle)).not.toBe('none')
    await page.keyboard.type('Prov') // type-ahead picks the option on every platform; ArrowDown only opens the popup on macOS
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/level=province/)
    await expect(page.getByTestId('filter-pill')).toHaveText(['Level: Province'])
  })

  test('term radio group: three real radios, Current only by default, URL follows', async ({ page }) => {
    await page.goto('/')
    const radios = page.getByRole('radio')
    await expect(radios).toHaveCount(3)
    await expect(page.getByRole('radio', { name: 'Current only' })).toBeChecked()
    await page.getByRole('radio', { name: 'All' }).click()
    await expect(page).toHaveURL(/status=all/)
    await expect(page.getByRole('radio', { name: 'All' })).toBeChecked()
    await expect(page.getByTestId('filter-pill')).toHaveText(['Term: All'])
    await page.getByRole('radio', { name: 'Former only' }).focus()
    await page.keyboard.press('Space')
    await expect(page).toHaveURL(/status=former/)
    await page.getByRole('radio', { name: 'Current only' }).click()
    await expect(page).not.toHaveURL(/status=/)
    await expect(page.getByRole('radio', { name: 'Current only' })).toBeChecked()
  })

  test('Clear filters shows the active count, resets the URL and is disabled at zero', async ({ page }) => {
    await page.goto('/')
    const clear = page.getByTestId('clear-filters')
    await expect(clear).toBeDisabled()
    await page.getByLabel('Level', { exact: true }).selectOption('city')
    await expect(page).toHaveURL(/level=city/)
    await page.getByRole('checkbox', { name: 'Only officials with SALN data' }).click()
    await expect(page.getByTestId('filters-active')).toHaveText('2')
    await expect(clear).toBeEnabled()
    await clear.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('filters-active')).toHaveText('0')
    await expect(page).not.toHaveURL(/level=|saln=/)
  })

  test('the Search button is keyboard operable and moves focus to the result count', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Search by name').fill('gov')
    await page.getByRole('button', { name: 'Search', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#results-status')).toBeFocused()
    await expect(page).toHaveURL(/q=gov/)
  })
})

test('heading structure: level headers are h3, per-municipality rows are not headings', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-level="municipal"] h3')).toHaveCount(1)
  await expect(page.locator('[data-level="municipal"] [data-testid="group"] h3')).toHaveCount(0)
  await expect(page.locator('[data-level="provincial"] h3')).toHaveCount(1)
})

test('typing in the search box replaces history instead of adding an entry per keystroke', async ({ page }) => {
  await page.goto('/')
  const before = await page.evaluate(() => history.length)
  await page.getByLabel('Search by name').pressSequentially('test', { delay: 30 })
  await expect(page).toHaveURL(/q=test/)
  expect(await page.evaluate(() => history.length)).toBe(before)
  await expect(page.getByRole('search', { name: 'Search and filters' })).toBeVisible()
})

test('higher position first: governor before vice governor, mayor before vice mayor before councilors', async ({ page }) => {
  await page.goto('/')
  const names = (key: string) => group(page, key).locator('h4').allTextContents()
  expect(await names('provincial')).toEqual(['Dual Term Person', 'Test Governor', 'Aaron Test Vice Governor'])
  await toggle(page, 'lgu:1001301000').click()
  expect((await names('lgu:1001301000')).map((n) => n.trim())).toEqual(['Test Mayor Baungon', 'Aaron Test Vice Mayor Baungon', 'Zed Test Councilor Baungon'])
  await page.getByLabel('Order', { exact: true }).selectOption('desc')
  await page.getByLabel('Sort by', { exact: true }).selectOption('name')
  expect(await names('provincial')).toEqual(['Aaron Test Vice Governor', 'Test Governor', 'Dual Term Person'])
})
