/**
 * Cloud Functions Maison Mayssa
 * - À la création d'une commande : email récap au client + email alerte à l'admin
 * - Quand l'admin valide la commande : email au client pour noter la commande
 *
 * Envoi d'emails via Resend (gratuit 3000/mois).
 * Config : RESEND_API_KEY, ADMIN_EMAIL, SITE_URL (optionnel)
 */

import { onValueCreated, onValueUpdated } from 'firebase-functions/v2/database'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineString } from 'firebase-functions/params'
import admin from 'firebase-admin'

admin.initializeApp()

const db = admin.database()

const RESEND_API_KEY = defineString('RESEND_API_KEY')
const ADMIN_EMAIL = defineString('ADMIN_EMAIL', { default: 'roumayssaghazi213@gmail.com' })
const SITE_URL = defineString('SITE_URL', { default: 'https://maison-mayssa.fr' })
/** Expéditeur des emails (doit être un domaine vérifié dans Resend, sinon laisser par défaut) */
const FROM_EMAIL = defineString('FROM_EMAIL', { default: 'Maison Mayssa <onboarding@resend.dev>' })

/** Envoyer un email via l'API Resend */
async function sendEmail({ to, subject, html, from }) {
  const apiKey = RESEND_API_KEY.value()
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY non configurée, email non envoyé')
    return
  }
  const fromAddress = from || FROM_EMAIL.value()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromAddress, to: Array.isArray(to) ? to : [to], subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Récap commande en HTML pour le client */
function buildClientRecapHtml(order, orderId, orderNumber, statusUrl) {
  const c = order.customer || {}
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
  const items = (order.items || [])
    .map((i) => `<tr><td>${escapeHtml(i.quantity)}</td><td>${escapeHtml(i.name)}</td><td style="text-align:right">${(i.price * i.quantity).toFixed(2)} €</td></tr>`)
    .join('')
  const total = (order.total ?? 0).toFixed(2)
  const num = orderNumber != null ? `#${orderNumber}` : orderId
  return `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px;">
  <h2 style="color:#5b3a29;">Commande enregistrée</h2>
  <p>Bonjour ${escapeHtml(name)},</p>
  <p>Ta commande <strong>${escapeHtml(num)}</strong> a bien été enregistrée.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <thead><tr style="background:#fef5ec;"><th style="text-align:left;padding:8px;">Qté</th><th style="text-align:left;padding:8px;">Article</th><th style="text-align:right;padding:8px;">Montant</th></tr></thead>
    <tbody>${items}</tbody>
    <tfoot><tr style="font-weight:bold;border-top:1px solid #ddd;"><td colspan="2" style="padding:8px;">Total</td><td style="text-align:right;padding:8px;">${total} €</td></tr></tfoot>
  </table>
  <p><a href="${escapeHtml(statusUrl)}" style="color:#b8860b;">Suivre ma commande</a></p>
  <p style="color:#666;font-size:12px;">À bientôt,<br/>Maison Mayssa</p>
</body></html>`
}

/** Email admin : nouvelle commande */
function buildAdminAlertHtml(orderNumber, orderId, adminUrl) {
  const num = orderNumber != null ? `#${orderNumber}` : orderId
  return `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px;">
  <h2 style="color:#5b3a29;">Nouvelle commande</h2>
  <p>Tu as reçu une nouvelle commande <strong>${escapeHtml(String(num))}</strong>.</p>
  <p><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#5b3a29;color:white;padding:10px 16px;text-decoration:none;border-radius:8px;">Voir le dashboard admin</a></p>
  <p style="color:#666;font-size:12px;">Maison Mayssa</p>
</body></html>`
}

/** Email client : demande d'avis après validation */
function buildReviewRequestHtml(orderNumber, orderId, customerName, reviewUrl) {
  const num = orderNumber != null ? `#${orderNumber}` : orderId
  return `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px;">
  <h2 style="color:#5b3a29;">Ta commande a été validée</h2>
  <p>Bonjour ${escapeHtml(customerName || '')},</p>
  <p>Bonne nouvelle : ta commande <strong>${escapeHtml(String(num))}</strong> a été confirmée.</p>
  <p>Tu as un moment pour nous dire ce que tu en as pensé ? Ton avis nous aide beaucoup.</p>
  <p><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#b8860b;color:white;padding:10px 16px;text-decoration:none;border-radius:8px;">Noter ma commande</a></p>
  <p style="color:#666;font-size:12px;">Merci,<br/>Maison Mayssa</p>
</body></html>`
}

/** Trigger : nouvelle commande → email client (récap) + email admin (alerte) */
export const onOrderCreated = onValueCreated(
  { ref: 'orders/{orderId}', region: 'europe-west1' },
  async (event) => {
    const orderId = event.params.orderId
    const order = event.data.val()
    if (!order) return

    const orderNumber = order.orderNumber
    const site = SITE_URL.value()
    const adminEmails = ADMIN_EMAIL.value()
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    const statusUrl = `${site}/#/commande/${orderId}`
    const adminUrl = `${site}/#admin`

    const htmlRecap = buildClientRecapHtml(order, orderId, orderNumber, statusUrl)
    const htmlAdmin = buildAdminAlertHtml(orderNumber, orderId, adminUrl)

    const promises = []

    if (order.customer?.email?.trim()) {
      promises.push(
        sendEmail({
          to: order.customer.email.trim(),
          subject: `Commande ${orderNumber != null ? `#${orderNumber}` : orderId} enregistrée – Maison Mayssa`,
          html: htmlRecap,
        }).catch((err) => console.error('[onOrderCreated] email client:', err))
      )
    }

    if (adminEmails.length > 0) {
      promises.push(
        sendEmail({
          to: adminEmails,
          subject: `Nouvelle commande ${orderNumber != null ? `#${orderNumber}` : orderId} – Maison Mayssa`,
          html: htmlAdmin,
        }).catch((err) => console.error('[onOrderCreated] email admin:', err))
      )
    }

    await Promise.all(promises)
  }
)

/** Callable : soumettre la réponse au mystère Trompe l'oeil Fraise. Le premier à trouver a 10 % dessus. */
export const submitMysteryGuess = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const guess = request.data?.guess
    if (guess !== 'Fraise') {
      return { success: false, error: 'wrong' }
    }
    const ref = db.ref('mysteryFraise')
    const snapshot = await ref.once('value')
    const current = snapshot.val()
    if (current && current.revealed) {
      return { success: true, alreadyRevealed: true }
    }
    const uid = request.auth?.uid || null
    await ref.set({ revealed: true, winnerUid: uid })
    return { success: true, winner: !!uid }
  }
)

/** Trigger : commande mise à jour → si statut passé à "validee", email client pour noter */
export const onOrderUpdated = onValueUpdated(
  { ref: 'orders/{orderId}', region: 'europe-west1' },
  async (event) => {
    const before = event.data.before.val()
    const after = event.data.after.val()
    if (!after || after.status !== 'validee') return
    if (before?.status === 'validee') return

    const orderId = event.params.orderId
    const email = after.customer?.email?.trim()
    if (!email) return

    const orderNumber = after.orderNumber
    const site = SITE_URL.value()
    const customerName = [after.customer?.firstName, after.customer?.lastName].filter(Boolean).join(' ')
    const reviewUrl = `${site}/#/commande/${orderId}`

    await sendEmail({
      to: email,
      subject: `Ta commande a été validée – Dis-nous ce que tu en penses !`,
      html: buildReviewRequestHtml(orderNumber, orderId, customerName, reviewUrl),
    }).catch((err) => console.error('[onOrderUpdated] email avis:', err))
  }
)
