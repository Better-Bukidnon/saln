import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Open the language menu (the globe button) if it is closed. */
export async function openLangMenu(page: Page) {
  const toggle = page.locator('#lang-toggle')
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
}

/** Open the menu and pick a language by its option name. */
export async function chooseLang(page: Page, name: string) {
  await openLangMenu(page)
  await page.getByRole('button', { name }).click()
}

/** Expand every collapsed officials group so all cards are in the DOM. */
export async function openAllGroups(page: Page) {
  const closed = page.locator('[data-testid="group"] button[aria-expanded="false"]')
  // Re-query each time: expanding re-renders nothing above, but the count shrinks.
  while ((await closed.count()) > 0) await closed.first().click()
}
