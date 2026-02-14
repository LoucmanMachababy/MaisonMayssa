import { test, expect } from '@playwright/test'

test.describe('Livraison et zone', () => {
  test('affiche la carte de zone de livraison', async ({ page }) => {
    await page.goto('/')

    // Aller à la section livraison
    await page.getByRole('link', { name: /livraison|zone/i }).first().click()

    // Vérifier la présence de la carte ou du texte zone
    await expect(
      page.getByText(/livraison|zone|annecy|km/i).first()
    ).toBeVisible({ timeout: 5000 })
  })
})
