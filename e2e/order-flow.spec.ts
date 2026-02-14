import { test, expect } from '@playwright/test'

test.describe('Parcours commande', () => {
  test('add to cart → formulaire → envoi WhatsApp', async ({ page }) => {
    await page.goto('/')

    // Attendre le chargement
    await expect(page.getByRole('heading', { name: /nos douceurs/i })).toBeVisible({ timeout: 10000 })

    // Ajouter un brownie au panier (produit simple)
    const firstBrownie = page.getByText(/Brownie/).first()
    await firstBrownie.click()

    // Vérifier toast ou panier mis à jour
    await expect(page.getByText(/ajouté au panier/i).or(page.getByLabel(/panier/i))).toBeVisible({ timeout: 3000 })

    // Ouvrir le panier (barre flottante ou icône)
    await page.getByRole('button', { name: /panier/i }).or(page.getByLabel(/panier/i)).first().click()

    // Remplir le formulaire client
    await page.getByPlaceholder(/prénom/i).fill('Marie')
    await page.getByPlaceholder(/nom/i).fill('Dupont')
    await page.getByPlaceholder(/téléphone/i).fill('0612345678')
    await page.getByPlaceholder(/date/i).fill(new Date().toISOString().slice(0, 10))

    // Choisir un créneau heure
    const timeSelect = page.locator('select').filter({ has: page.getByText(/:/) }).or(page.getByLabel(/heure/i))
    if (await timeSelect.count() > 0) {
      await timeSelect.first().selectOption({ index: 1 })
    }

    // Cliquer sur Envoyer (WhatsApp)
    const sendBtn = page.getByRole('button', { name: /whatsapp/i }).or(page.getByText(/envoyer.*whatsapp/i))
    await expect(sendBtn).toBeVisible({ timeout: 5000 })
    await sendBtn.click()

    // Vérifier l'écran de confirmation (numéro commande, PayPal, etc.)
    await expect(page.getByText(/commande enregistrée|numéro de commande/i)).toBeVisible({ timeout: 5000 })
  })
})
