import { test, expect } from '@playwright/test'

test.describe('Parcours commande premium', () => {
  test('fiche produit → panier → formulaire visible', async ({ page }) => {
    await page.goto('/produit/trompe-loeil-mangue')

    await expect(page.getByRole('heading', { name: 'Mangue' })).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /ajouter à la précommande/i }).click()

    await expect(page).toHaveURL(/\/panier/, { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /votre précommande/i })).toBeVisible()
    await expect(page.getByText('Mangue').first()).toBeVisible()

    await page.getByRole('button', { name: /suivant.*mes informations/i }).click()
    await page.getByRole('textbox', { name: 'Prénom' }).fill('Marie')
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Dupont')
    await page.getByRole('textbox', { name: 'Numéro de téléphone' }).fill('0612345678')
  })

  test('carte → précommander un trompe-l\'œil', async ({ page }) => {
    await page.goto('/carte')

    await expect(page.getByRole('heading', { name: 'La Carte' })).toBeVisible({ timeout: 10000 })

    const mangueCard = page.locator('.group').filter({ has: page.getByRole('heading', { name: 'Mangue' }) })
    await mangueCard.getByRole('button', { name: /précommander/i }).click()

    await expect(page).toHaveURL(/\/panier/, { timeout: 5000 })
    await expect(page.getByText('Mangue').first()).toBeVisible()
  })
})
