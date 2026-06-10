import { test, expect } from '@playwright/test'

test.describe('Pages informatives', () => {
  test('FAQ affiche les infos livraison', async ({ page }) => {
    await page.goto('/faq')

    await expect(
      page.getByRole('heading', { name: /toutes vos questions/i }),
    ).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/livraison/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('page contact accessible', async ({ page }) => {
    await page.goto('/contact')

    await expect(page.getByRole('heading', { name: /nous écrire/i })).toBeVisible({ timeout: 10000 })
  })
})
