import { test, expect } from '@playwright/test'

async function acceptCookies(page: import('@playwright/test').Page) {
  const btn = page.getByRole('button', { name: /j'accepte/i })
  if (await btn.isVisible().catch(() => false)) {
    await btn.click()
  }
}

test.describe('Nouvelles fonctionnalités', () => {
  test('accueil — carousel avis Google visible', async ({ page }) => {
    await page.goto('/')
    await acceptCookies(page)
    await expect(page.getByRole('heading', { name: /l'avis de nos clients/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/avis google · 4 & 5 étoiles/i)).toBeVisible()
  })

  test('inscription — adresse facultative + formulaire', async ({ page }) => {
    await page.goto('/inscription')
    await acceptCookies(page)
    await expect(page.getByRole('heading', { name: /rejoignez la maison/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/adresse \(optionnelle\)/i)).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('panier — click & collect + paiement indisponible', async ({ page }) => {
    await page.goto('/produit/trompe-loeil-mangue')
    await acceptCookies(page)
    await page.getByRole('button', { name: /ajouter à la précommande/i }).click()
    await page.getByLabel('Panier').click()
    await expect(page).toHaveURL(/\/panier/, { timeout: 8000 })

    await page.getByRole('button', { name: /suivant.*mes informations/i }).click()

    await page.getByRole('textbox', { name: 'Prénom' }).fill('Test')
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Local')
    await page.getByRole('textbox', { name: 'Numéro de téléphone' }).fill('0612345678')

    await page.getByRole('button', { name: /suivant.*click & collect/i }).click()
    await expect(page.getByText(/retrait au point de collecte/i)).toBeVisible({ timeout: 5000 })

    const dateSelect = page.getByLabel(/date de retrait/i)
    await dateSelect.selectOption({ index: 1 })

    const timeSelect = page.getByLabel(/heure de retrait/i)
    await timeSelect.selectOption({ index: 1 })

    await page.getByRole('button', { name: /suivant.*validation/i }).click()

    await expect(page.getByText(/paiement indisponible pour le moment/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: /whatsapp/i })).toBeDisabled()
  })
})
