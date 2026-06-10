import { test, expect } from '@playwright/test'

test.describe('Navigation premium', () => {
  test('accueil charge le hero', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /l'art du trompe-l'œil pâtissier/i }),
    ).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /précommander|découvrir la carte/i }).first()).toBeVisible()
  })

  test('header navigue vers la carte et le panier', async ({ page }) => {
    await page.goto('/')

    await page.locator('header nav').getByRole('link', { name: 'La carte', exact: true }).click()
    await expect(page).toHaveURL(/\/carte/)
    await expect(page.getByRole('heading', { name: 'La Carte' })).toBeVisible()

    await page.locator('a[href="/panier"]').first().click()
    await expect(page).toHaveURL(/\/panier/)
  })

  test('produit bientôt disponible — canette mangue passion', async ({ page }) => {
    await page.goto('/produit/canette-cake-mangue-passion')

    await expect(page.getByRole('heading', { name: /canette cake.*mangue passion/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/bientôt disponible/i)).toBeVisible()
    await expect(page.locator('img[src*="canette-cake-mangue-passion"]')).toBeVisible()
  })
})
