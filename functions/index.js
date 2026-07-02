/**
 * Cloud Functions Maison Mayssa
 * - À la création d'une commande : email récap au client + email alerte à l'admin
 * - Quand l'admin valide la commande : email au client pour noter la commande
 * - Quand le stock d'un produit remonte de 0 : email aux inscrits notifyWhenAvailable
 * - Callable admin : envoi en masse d'emails "avis Google" aux clients validés/livrés
 * - createOrder : création commande serveur (anti-double-commande + stock atomic)
 * - setAdminClaim : attribution Custom Claim admin (one-shot)
 *
 * Envoi d'emails via Resend (gratuit 3000/mois, 5 req/sec).
 * Rate-limiting : sendEmailBatch() envoie par chunks de 4/sec,
 * sendEmailWithRetry() retente 1× sur 429.
 * Config : RESEND_API_KEY, ADMIN_EMAIL, SITE_URL (optionnel)
 */

import { onValueCreated, onValueUpdated } from 'firebase-functions/v2/database'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { defineString, defineSecret } from 'firebase-functions/params'
import admin from 'firebase-admin'
import Stripe from 'stripe'

admin.initializeApp()

const db = admin.database()

/**
 * Secrets (chiffrés via Secret Manager) — à configurer avec :
 *   firebase functions:secrets:set RESEND_API_KEY
 *   firebase functions:secrets:set STRIPE_SECRET_KEY
 *   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
 * En émulateur local, ils sont lus depuis functions/.env.
 * Chaque function qui les utilise doit les lister dans son option `secrets`.
 */
const RESEND_API_KEY = defineSecret('RESEND_API_KEY')
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET')

// Params non sensibles (valeurs en clair, défauts fournis).
const ADMIN_EMAIL = defineString('ADMIN_EMAIL', { default: 'roumayssaghazi213@gmail.com' })
const SITE_URL = defineString('SITE_URL', { default: 'https://maison-mayssa.fr' })
/** Instance Realtime Database europe-west1 (nom dans l’URL Firebase). */
const RTDB_INSTANCE_NAME = process.env.RTDB_INSTANCE || 'maison-mayssa-default-rtdb'
/** Expéditeur des emails — domaine maison-mayssa.fr vérifié dans Resend. */
const FROM_EMAIL = defineString('FROM_EMAIL', { default: 'Maison Mayssa <contact@maison-mayssa.fr>' })

/** Options communes aux triggers Realtime Database (région + instance). */
function rtdbTriggerOptions(extra = {}) {
  return {
    region: 'europe-west1',
    instance: RTDB_INSTANCE_NAME,
    ...extra,
  }
}

let _stripe = null
/** Client Stripe paresseux (réutilisé entre invocations chaudes). */
function getStripe() {
  const key = STRIPE_SECRET_KEY.value()
  if (!key) throw new HttpsError('failed-precondition', 'Stripe non configuré (STRIPE_SECRET_KEY manquante)')
  if (!_stripe) _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' })
  return _stripe
}

/**
 * Envoyer un email via l'API Resend.
 * `attachments` : tableau Resend [{ filename, content }] où content est du base64.
 */
async function sendEmail({ to, subject, html, from, attachments }) {
  const apiKey = RESEND_API_KEY.value()
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY non configurée — aucun email envoyé')
    throw new Error('RESEND_API_KEY manquante')
  }
  const fromAddress = from || FROM_EMAIL.value()
  const payload = { from: fromAddress, to: Array.isArray(to) ? to : [to], subject, html }
  if (Array.isArray(attachments) && attachments.length > 0) {
    payload.attachments = attachments
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

/** Sleep asynchrone */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * sendEmail + 1 retry avec delay 2s sur erreur 429 (rate-limit Resend).
 * Absorbe les pics temporaires (ex: cascade de triggers onOrderUpdated).
 */
async function sendEmailWithRetry(msg, retried = false) {
  try {
    await sendEmail(msg)
  } catch (err) {
    const is429 = err && typeof err.message === 'string' && err.message.includes('Resend error 429')
    if (is429 && !retried) {
      await sleep(2000)
      return sendEmailWithRetry(msg, true)
    }
    throw err
  }
}

/**
 * Envoie un batch d'emails en respectant la limite Resend (5 req/sec).
 * Chunks de 4 emails par seconde (marge sous 5/s) avec delay 1.1s entre chunks.
 * @param {Array<{to: string|string[], subject: string, html: string, from?: string}>} batch
 * @returns {Promise<{sent: number, failed: number}>}
 */
async function sendEmailBatch(batch) {
  let sent = 0
  let failed = 0
  const CHUNK_SIZE = 4
  const CHUNK_DELAY_MS = 1100
  for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
    const chunk = batch.slice(i, i + CHUNK_SIZE)
    const results = await Promise.allSettled(chunk.map((msg) => sendEmailWithRetry(msg)))
    for (const r of results) {
      if (r.status === 'fulfilled') sent++
      else failed++
    }
    if (i + CHUNK_SIZE < batch.length) await sleep(CHUNK_DELAY_MS)
  }
  return { sent, failed }
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Identité visuelle email (couleurs marque + adresse boutique) ───────────
const BRAND = {
  brown: '#1E120D',
  espresso: '#2A1B12',
  gold: '#B8860B',
  goldLight: '#C5A059',
  ivory: '#FDFCFB',
  soft: '#FBF6EF',
  cream: '#F5EAD8',
  line: '#EFE3D0',
  muted: '#8A7A6B',
}
const STORE = {
  name: 'galerie marchande du centre commercial Carrefour',
  address: '134 avenue de Genève, 74000 Annecy',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Carrefour+134+avenue+de+Geneve+74000+Annecy',
}

/** Date "samedi 4 juillet" à partir d'un YYYY-MM-DD (sans dépendance, locale FR). */
function formatPickupDate(ymd) {
  if (!ymd || typeof ymd !== 'string') return ''
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ''
  try {
    const date = new Date(Date.UTC(y, m - 1, d))
    const label = date.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    })
    return label.charAt(0).toUpperCase() + label.slice(1)
  } catch {
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
  }
}

/** Échappe les caractères spéciaux iCalendar (RFC 5545). */
function escapeIcs(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Construit le contenu .ics du retrait click & collect.
 * Heures écrites en local "flottant" (sans Z) — l'agenda du client interprète
 * dans son propre fuseau, ce qui correspond à l'heure de retrait affichée.
 * Retourne null si la date est invalide.
 */
function buildPickupIcs(order, orderId, orderNumber) {
  const ymd = order.requestedDate
  if (!ymd || typeof ymd !== 'string') return null
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return null

  const time = /^\d{1,2}:\d{2}$/.test(order.requestedTime || '') ? order.requestedTime : '12:00'
  const [hh, mn] = time.split(':').map(Number)
  const pad = (n) => String(n).padStart(2, '0')
  const dtStart = `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mn)}00`
  // Fin = +30 min (créneau standard), via minutes brutes pour éviter le passage d'heure.
  const endMinutesTotal = hh * 60 + mn + 30
  const endHh = Math.floor(endMinutesTotal / 60) % 24
  const endMn = endMinutesTotal % 60
  const dtEnd = `${y}${pad(m)}${pad(d)}T${pad(endHh)}${pad(endMn)}00`

  const ref = orderNumber != null ? `#${orderNumber}` : orderId
  const uid = `pickup-${String(ref).replace(/[^a-zA-Z0-9]/g, '')}@maison-mayssa.fr`
  const summary = escapeIcs(`Retrait commande ${ref} — Maison Mayssa`)
  const location = escapeIcs(`${STORE.name}, ${STORE.address}`)
  const description = escapeIcs(
    `Présentez le numéro ${ref} au comptoir. Aucun paiement sur place : c'est déjà réglé.`,
  )

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Maison Mayssa//Click and Collect//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** En-tête de marque (logo texte + filet doré) réutilisable. */
function emailHeader() {
  return `
  <tr><td style="padding:32px 32px 0;text-align:center;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:3px;color:${BRAND.brown};text-transform:uppercase;">Maison&nbsp;Mayssa</div>
    <div style="font-size:11px;letter-spacing:2px;color:${BRAND.gold};text-transform:uppercase;margin-top:6px;">Pâtisserie artisanale · Annecy</div>
    <div style="width:48px;height:2px;background:${BRAND.gold};margin:18px auto 0;"></div>
  </td></tr>`
}

/** Pied de page email réutilisable. */
function emailFooter() {
  return `
  <tr><td style="padding:24px 32px 32px;text-align:center;border-top:1px solid ${BRAND.line};">
    <div style="font-size:12px;color:${BRAND.muted};line-height:1.7;">
      Maison Mayssa — ${escapeHtml(STORE.address)}<br/>
      Click &amp; collect · 11h - 20h, 7j/7<br/>
      <a href="https://instagram.com/maison_mayssa74" style="color:${BRAND.gold};text-decoration:none;">@maison_mayssa74</a>
    </div>
  </td></tr>`
}

/** Récap commande en HTML pour le client — click & collect, design marque. */
function buildClientRecapHtml(order, orderId, orderNumber, statusUrl) {
  const c = order.customer || {}
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || 'cher gourmand'
  const num = orderNumber != null ? `#${orderNumber}` : orderId
  const total = (order.total ?? 0).toFixed(2).replace('.', ',')

  const items = (order.items || [])
    .map((i, idx) => {
      const line = (i.price * i.quantity).toFixed(2).replace('.', ',')
      const bg = idx % 2 === 0 ? BRAND.ivory : BRAND.soft
      return `<tr style="background:${bg};">
        <td style="padding:12px 16px;font-size:14px;color:${BRAND.brown};">
          <span style="display:inline-block;min-width:22px;font-weight:700;color:${BRAND.gold};">${escapeHtml(i.quantity)}×</span>
          ${escapeHtml(i.name)}
        </td>
        <td style="padding:12px 16px;font-size:14px;color:${BRAND.brown};text-align:right;white-space:nowrap;font-weight:600;">${line} €</td>
      </tr>`
    })
    .join('')

  const pickupDate = formatPickupDate(order.requestedDate)
  const pickupTime = order.requestedTime || ''
  const pickupLine = [pickupDate, pickupTime ? `à ${pickupTime}` : ''].filter(Boolean).join(' ')

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Commande ${escapeHtml(String(num))} — Maison Mayssa</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Ta commande ${escapeHtml(String(num))} est confirmée — récap et retrait click &amp; collect.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.ivory};border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(30,18,13,0.08);">

        ${emailHeader()}

        <tr><td style="padding:28px 32px 0;text-align:center;">
          <div style="display:inline-block;background:${BRAND.gold};color:#fff;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 16px;border-radius:999px;">✓ Commande confirmée &amp; payée</div>
          <h1 style="font-family:Georgia,serif;font-size:24px;color:${BRAND.brown};margin:18px 0 4px;">Merci ${escapeHtml(name)} !</h1>
          <p style="font-size:14px;color:${BRAND.muted};margin:0;">Ta commande <strong style="color:${BRAND.brown};">${escapeHtml(String(num))}</strong> est bien enregistrée.</p>
        </td></tr>

        <!-- Bloc retrait click & collect -->
        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.soft};border:1px solid ${BRAND.line};border-radius:14px;">
            <tr><td style="padding:18px 20px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND.gold};margin-bottom:8px;">📍 Votre retrait — Click &amp; collect</div>
              ${pickupLine ? `<div style="font-size:16px;font-weight:700;color:${BRAND.brown};margin-bottom:4px;">${escapeHtml(pickupLine)}</div>` : ''}
              <div style="font-size:14px;color:${BRAND.brown};line-height:1.5;">
                ${escapeHtml(STORE.name)}<br/>
                <a href="${escapeHtml(STORE.mapsUrl)}" style="color:${BRAND.gold};text-decoration:none;">${escapeHtml(STORE.address)}</a>
              </div>
              <div style="font-size:12px;color:${BRAND.muted};margin-top:10px;">Présentez votre numéro <strong>${escapeHtml(String(num))}</strong> au comptoir. Aucun paiement sur place : c'est déjà réglé.</div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Articles -->
        <tr><td style="padding:24px 32px 0;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};margin-bottom:10px;">Votre commande</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.line};border-radius:12px;overflow:hidden;">
            ${items}
            <tr style="background:${BRAND.espresso};">
              <td style="padding:14px 16px;font-size:15px;font-weight:700;color:${BRAND.ivory};">Total payé</td>
              <td style="padding:14px 16px;font-size:16px;font-weight:700;color:${BRAND.goldLight};text-align:right;">${total} €</td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA suivi -->
        <tr><td style="padding:28px 32px 8px;text-align:center;">
          <a href="${escapeHtml(statusUrl)}" style="display:inline-block;background:${BRAND.brown};color:#fff;font-size:14px;font-weight:700;letter-spacing:0.5px;text-decoration:none;padding:14px 36px;border-radius:12px;">Suivre ma commande</a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;text-align:center;">
          <p style="font-size:12px;color:${BRAND.muted};margin:8px 0 0;">Une question ? Réponds à cet email ou écris-nous sur Instagram.</p>
        </td></tr>

        ${emailFooter()}

      </table>
    </td></tr>
  </table>
</body></html>`
}

/** Email admin : nouvelle commande */
function buildAdminAlertHtml(orderNumber, orderId, adminUrl, order) {
  const num = orderNumber != null ? `#${orderNumber}` : orderId
  const paid =
    order?.paymentStatus === 'paid' ||
    order?.paymentStatus === 'simulated_paid' ||
    !!order?.stripePaymentIntentId
  const paidLine = paid
    ? '<p style="color:#166534;font-weight:600;">Paiement en ligne confirmé — commande déjà en préparation.</p>'
    : '<p>Commande à traiter depuis le dashboard.</p>'
  return `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px;">
  <h2 style="color:#5b3a29;">Nouvelle commande</h2>
  <p>Tu as reçu une nouvelle commande <strong>${escapeHtml(String(num))}</strong>.</p>
  ${paidLine}
  <p><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#5b3a29;color:white;padding:10px 16px;text-decoration:none;border-radius:8px;">Voir le dashboard admin</a></p>
  <p style="color:#666;font-size:12px;">Maison Mayssa</p>
</body></html>`
}

/**
 * Emails nouvelle commande (client + admin), idempotent via emailNotificationsSentAt.
 * Appelé par le trigger RTDB, la callable sendOrderCreatedEmails et createOrder.
 */
async function dispatchOrderCreatedEmails(orderId, order) {
  if (!order || typeof order !== 'object') {
    return { ok: false, reason: 'no_order' }
  }

  const sentRef = db.ref(`orders/${orderId}/emailNotificationsSentAt`)
  const claim = await sentRef.transaction((current) => {
    if (current) return
    return Date.now()
  })
  if (!claim.committed) {
    return { ok: true, skipped: true, reason: 'already_sent' }
  }

  const orderNumber = order.orderNumber
  const site = SITE_URL.value().replace(/\/$/, '')
  const adminEmails = ADMIN_EMAIL.value()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  const statusUrl = `${site}/commande/${orderId}`
  const adminUrl = `${site}/admin`

  const htmlRecap = buildClientRecapHtml(order, orderId, orderNumber, statusUrl)
  const htmlAdmin = buildAdminAlertHtml(orderNumber, orderId, adminUrl, order)

  const promises = []

  if (order.customer?.email?.trim()) {
    const ics = buildPickupIcs(order, orderId, orderNumber)
    const attachments = ics
      ? [
          {
            filename: 'retrait-maison-mayssa.ics',
            content: Buffer.from(ics, 'utf-8').toString('base64'),
          },
        ]
      : undefined
    promises.push(
      sendEmailWithRetry({
        to: order.customer.email.trim(),
        subject: `Votre commande ${orderNumber != null ? `#${orderNumber}` : orderId} est confirmée 🎂 – Maison Mayssa`,
        html: htmlRecap,
        attachments,
      }),
    )
  }

  if (adminEmails.length > 0) {
    promises.push(
      sendEmailWithRetry({
        to: adminEmails,
        subject: `Nouvelle commande ${orderNumber != null ? `#${orderNumber}` : orderId} – Maison Mayssa`,
        html: htmlAdmin,
      }),
    )
  }

  if (promises.length === 0) {
    await sentRef.remove().catch(() => {})
    return { ok: false, reason: 'no_recipients' }
  }

  try {
    await Promise.all(promises)
    console.log(`[dispatchOrderCreatedEmails] order ${orderId} (#${orderNumber}) — ${promises.length} email(s) sent`)
    return { ok: true, sent: promises.length }
  } catch (err) {
    await sentRef.remove().catch(() => {})
    console.error('[dispatchOrderCreatedEmails]', orderId, err)
    throw err
  }
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
  { ref: 'orders/{orderId}', ...rtdbTriggerOptions({ secrets: [RESEND_API_KEY] }) },
  async (event) => {
    const orderId = event.params.orderId
    const order = event.data.val()
    if (!order) return
    await dispatchOrderCreatedEmails(orderId, order).catch((err) =>
      console.error('[onOrderCreated]', orderId, err),
    )
  },
)

/** Callable : envoi emails nouvelle commande (secours si le trigger RTDB ne part pas). */
export const sendOrderCreatedEmails = onCall(
  { region: 'europe-west1', secrets: [RESEND_API_KEY] },
  async (request) => {
    const orderId = request.data?.orderId
    if (!orderId || typeof orderId !== 'string') {
      throw new HttpsError('invalid-argument', 'orderId manquant')
    }
    const snap = await db.ref(`orders/${orderId}`).once('value')
    const order = snap.val()
    if (!order) {
      throw new HttpsError('not-found', 'Commande introuvable')
    }
    try {
      return await dispatchOrderCreatedEmails(orderId, order)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('RESEND_API_KEY')) {
        throw new HttpsError('failed-precondition', 'Service email non configuré (RESEND_API_KEY)')
      }
      throw new HttpsError('internal', 'Échec envoi email')
    }
  },
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

const GOOGLE_REVIEW_LINK = 'https://share.google/PsKmSr5Vx1VXqaNWx'

/** Email client : demande d'avis Google (envoi en masse) */
function buildGoogleReviewEmailHtml(customerName) {
  const prenom = customerName ? escapeHtml(customerName) : 'vous'
  return `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px;background:#fffdf9;">
  <div style="text-align:center;padding:24px 0 16px;">
    <h1 style="color:#5b3a29;font-size:22px;margin:0;">🎂 Maison Mayssa</h1>
    <p style="color:#b8860b;margin:4px 0 0;font-size:13px;">Pâtisserie artisanale</p>
  </div>
  <div style="background:white;border-radius:16px;padding:24px;border:1px solid #f0e6d3;">
    <h2 style="color:#5b3a29;margin-top:0;">Bonjour ${prenom} 😍</h2>
    <p style="color:#444;line-height:1.6;">Merci pour votre commande chez Maison Mayssa ! J'espère que vous vous êtes régalé(e) 🎂</p>
    <p style="color:#444;line-height:1.6;">Si vous avez un moment, un petit avis Google nous aiderait énormément à nous faire connaître :</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${GOOGLE_REVIEW_LINK}" style="display:inline-block;background:#b8860b;color:white;padding:14px 32px;text-decoration:none;border-radius:12px;font-weight:bold;font-size:16px;">⭐ Laisser un avis Google</a>
    </div>
    <p style="color:#444;line-height:1.6;">Ça prend juste 1 minute et ça compte énormément pour nous. Merci infiniment ! 🙏</p>
  </div>
  <p style="text-align:center;color:#aaa;font-size:12px;margin-top:16px;">Avec amour,<br/>Maison Mayssa</p>
</body></html>`
}

/**
 * Callable admin : envoie un email "avis Google" à tous les clients
 * ayant au moins une commande validée ou livrée (dédupliqué par email).
 * Retourne { sent: number } — le nombre d'emails envoyés.
 */
export const sendBulkGoogleReviewEmails = onCall(
  { region: 'europe-west1', secrets: [RESEND_API_KEY] },
  async () => {
    const ordersSnap = await db.ref('orders').once('value')
    const orders = ordersSnap.val() || {}

    const seenEmails = new Set()
    const batch = []

    for (const order of Object.values(orders)) {
      if (!['validee', 'livree'].includes(order.status)) continue
      const email = order.customer?.email?.trim()
      if (!email) continue
      const normalized = email.toLowerCase()
      if (seenEmails.has(normalized)) continue
      seenEmails.add(normalized)

      const customerName = order.customer?.firstName || ''
      batch.push({
        to: email,
        subject: 'Votre avis nous aide beaucoup ⭐ – Maison Mayssa',
        html: buildGoogleReviewEmailHtml(customerName),
      })
    }

    const { sent, failed } = await sendEmailBatch(batch)
    console.log(`[sendBulkGoogleReviewEmails] ${sent} sent, ${failed} failed (out of ${batch.length})`)
    return { sent, failed }
  }
)

/** Trigger : commande mise à jour → si statut passé à "validee", email client pour noter */
export const onOrderUpdated = onValueUpdated(
  { ref: 'orders/{orderId}', ...rtdbTriggerOptions({ secrets: [RESEND_API_KEY] }) },
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
    const reviewUrl = `${site.replace(/\/$/, '')}/commande/${orderId}`

    await sendEmailWithRetry({
      to: email,
      subject: `Ta commande a été validée – Dis-nous ce que tu en penses !`,
      html: buildReviewRequestHtml(orderNumber, orderId, customerName, reviewUrl),
    }).catch((err) => console.error('[onOrderUpdated] email avis:', err))
  }
)

/** Email client : produit à nouveau disponible */
function buildRestockEmailHtml(productName, productUrl) {
  return `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px;background:#fffdf9;">
  <div style="text-align:center;padding:24px 0 16px;">
    <h1 style="color:#5b3a29;font-size:22px;margin:0;">Maison Mayssa</h1>
    <p style="color:#b8860b;margin:4px 0 0;font-size:13px;">Pâtisserie artisanale</p>
  </div>
  <div style="background:white;border-radius:16px;padding:24px;border:1px solid #f0e6d3;">
    <h2 style="color:#5b3a29;margin-top:0;">Bonne nouvelle 🎉</h2>
    <p style="color:#444;line-height:1.6;">
      <strong>${escapeHtml(productName)}</strong> est à nouveau disponible.
    </p>
    <p style="color:#444;line-height:1.6;">
      Tu t'étais inscrit pour être prévenu — c'est le moment de commander !
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${escapeHtml(productUrl)}" style="display:inline-block;background:#b8860b;color:white;padding:14px 32px;text-decoration:none;border-radius:12px;font-weight:bold;font-size:16px;">Commander maintenant</a>
    </div>
    <p style="color:#666;font-size:12px;">Dépêche-toi, les stocks partent vite.</p>
  </div>
  <p style="text-align:center;color:#aaa;font-size:12px;margin-top:16px;">À bientôt,<br/>Maison Mayssa</p>
</body></html>`
}

/**
 * Trigger : stock d'un produit remonte de 0 → email aux inscrits notifyWhenAvailable.
 * Ne déclenche que sur transition stock ≤ 0 → stock > 0 pour éviter spam.
 * Supprime les entries après envoi (succès ou échec) pour éviter boucle infinie.
 */
export const onStockAvailable = onValueUpdated(
  { ref: 'stock/{productId}', ...rtdbTriggerOptions({ secrets: [RESEND_API_KEY] }) },
  async (event) => {
    const productId = event.params.productId
    const before = event.data.before.val()
    const after = event.data.after.val()
    const beforeNum = typeof before === 'number' ? before : 0
    const afterNum = typeof after === 'number' ? after : 0
    if (beforeNum > 0 || afterNum <= 0) return

    const snap = await db.ref('notifyWhenAvailable').once('value')
    const entries = snap.val() || {}
    const matching = Object.entries(entries).filter(([, e]) => e && e.productId === productId)
    if (matching.length === 0) return

    const productName = matching[0][1].productName || 'Un produit'
    const site = SITE_URL.value()
    const productUrl = `${site}/#la-carte`

    // Dédoublon par email, collecter tous les IDs pour suppression
    const byEmail = new Map()
    for (const [id, entry] of matching) {
      const email = entry.email?.trim().toLowerCase()
      if (!email) continue
      if (!byEmail.has(email)) byEmail.set(email, { ids: [] })
      byEmail.get(email).ids.push(id)
    }

    const batch = Array.from(byEmail.keys()).map((email) => ({
      to: email,
      subject: `${productName} est de nouveau disponible – Maison Mayssa`,
      html: buildRestockEmailHtml(productName, productUrl),
    }))

    const { sent, failed } = await sendEmailBatch(batch)
    console.log(`[onStockAvailable] ${productId}: ${sent} sent, ${failed} failed`)

    // Supprimer les entries notifiées (succès OU échec) pour éviter re-envoi
    const removals = {}
    for (const { ids } of byEmail.values()) {
      for (const id of ids) removals[`notifyWhenAvailable/${id}`] = null
    }
    await db.ref().update(removals)
  }
)

// ============================================================================
// createOrder — création commande via serveur (anti-double-commande + stock atomic)
// ============================================================================

const ADMIN_EMAIL_HARDCODED = 'roumayssaghazi213@gmail.com'
const DOUBLE_ORDER_BLOCK_MS = 48 * 60 * 60 * 1000

// ============================================================================
// Programme fidélité — 100 % serveur (les points ne sont JAMAIS écrits par le
// client : `users/$uid/loyalty` et `users/$uid/rewards` sont admin-only dans
// les règles ; seul l'Admin SDK (qui bypass les règles) écrit ici).
// ============================================================================

const LOYALTY_TIER_GOURMAND = 150
const LOYALTY_TIER_PRESTIGE = 400
const REFERRAL_POINTS_TO_REFERRER = 15
const WELCOME_POINTS = 15
const SOCIAL_FOLLOW_POINTS = 15

// Coûts des récompenses — source de vérité serveur (miroir de REWARD_COSTS côté front).
const REWARD_COSTS = {
  surprise_maison_mayssa: 60,
  remise_5e: 100,
  mini_box: 150,
  box_fidelite: 250,
}

/** Palier correspondant à un nombre de points à vie. */
function tierForLifetimePoints(lifetimePoints) {
  if (lifetimePoints >= LOYALTY_TIER_PRESTIGE) return 'Prestige'
  if (lifetimePoints >= LOYALTY_TIER_GOURMAND) return 'Gourmand'
  return 'Douceur'
}

/**
 * Crédite (ou débite) des points de fidélité atomiquement, en recalculant le
 * tier d'après les points à vie. `entry.points` peut être négatif (retrait).
 * lifetimePoints n'augmente que pour les crédits (jamais diminué).
 * Retourne le nouveau solde, ou null si le profil/loyalty n'existe pas.
 */
async function awardLoyaltyPoints(uid, entry) {
  const loyaltyRef = db.ref(`users/${uid}/loyalty`)
  let applied = null
  const res = await loyaltyRef.transaction((current) => {
    if (current == null) return // profil/loyalty absent → on n'écrit rien
    const points = (Number(current.points) || 0) + entry.points
    const lifetime =
      entry.points > 0
        ? (Number(current.lifetimePoints) || 0) + entry.points
        : Number(current.lifetimePoints) || 0
    const history = Array.isArray(current.history)
      ? current.history
      : current.history && typeof current.history === 'object'
        ? Object.values(current.history)
        : []
    applied = {
      ...current,
      points: Math.max(0, points),
      lifetimePoints: lifetime,
      tier: tierForLifetimePoints(lifetime),
      history: [...history, entry],
    }
    return applied
  })
  if (!res.committed || !applied) return null
  return applied.points
}

/**
 * Crédite le parrain (15 pts) lors de la 1ère commande d'un filleul.
 * Best-effort : ne fait pas échouer la commande.
 */
async function creditReferrer(referrerUid, referralCode) {
  if (!referrerUid) return
  try {
    await awardLoyaltyPoints(referrerUid, {
      reason: 'admin_ajout',
      points: REFERRAL_POINTS_TO_REFERRER,
      at: Date.now(),
      adminNote: `Parrainage (${String(referralCode || '').toUpperCase()})`,
    })
  } catch (e) {
    console.error('[creditReferrer] échec:', e)
  }
}

/**
 * Recalcule, côté serveur, le total « gagnant de points » d'une commande
 * (jamais de confiance dans data.total fourni par le client).
 *   total = Σ(price·qty) − discountAmount − referralDiscountAmount
 *           + deliveryFee (plafonné 5 €) + donationAmount
 * Renvoie un nombre ≥ 0.
 */
function computeOrderPointsTotal(data) {
  let itemsTotal = 0
  for (const it of data.items || []) {
    itemsTotal += (Number(it.price) || 0) * (Number(it.quantity) || 0)
  }
  const discount = Math.max(0, Number(data.discountAmount) || 0)
  const referral = Math.max(0, Number(data.referralDiscountAmount) || 0)
  const delivery = Math.min(5, Math.max(0, Number(data.deliveryFee) || 0))
  const donation = Math.max(0, Number(data.donationAmount) || 0)
  const total = itemsTotal - discount - referral + delivery + donation
  return Math.max(0, total)
}

function normalizePhone(raw) {
  return String(raw || '').replace(/\D/g, '')
}

function validateOrderInput(data) {
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Requête invalide')
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new HttpsError('invalid-argument', 'Panier vide')
  }
  for (const it of data.items) {
    if (!it || typeof it !== 'object') {
      throw new HttpsError('invalid-argument', 'Item invalide')
    }
    if (!it.productId || typeof it.productId !== 'string') {
      throw new HttpsError('invalid-argument', 'productId manquant')
    }
    if (!Number.isFinite(it.quantity) || it.quantity < 1 || it.quantity > 100) {
      throw new HttpsError('invalid-argument', 'quantité invalide')
    }
    if (!Number.isFinite(it.price) || it.price < 0 || it.price > 10000) {
      throw new HttpsError('invalid-argument', 'prix invalide')
    }
    if (typeof it.name !== 'string' || !it.name.trim()) {
      throw new HttpsError('invalid-argument', 'nom article manquant')
    }
  }
  if (!data.customer || typeof data.customer !== 'object') {
    throw new HttpsError('invalid-argument', 'customer manquant')
  }
  if (!data.customer.phone || typeof data.customer.phone !== 'string') {
    throw new HttpsError('invalid-argument', 'téléphone manquant')
  }
  if (!Number.isFinite(data.total) || data.total < 0 || data.total > 100000) {
    throw new HttpsError('invalid-argument', 'total invalide')
  }
  // Statut initial : le site place désormais toute nouvelle commande en
  // 'en_preparation' (modèle « pas de file d'attente »). On accepte aussi
  // 'en_attente' (legacy / commandes hors-site non encore acceptées).
  if (data.status !== 'en_preparation' && data.status !== 'en_attente') {
    throw new HttpsError('invalid-argument', 'statut initial invalide')
  }
  if (data.source && !['site', 'whatsapp', 'instagram', 'snap'].includes(data.source)) {
    throw new HttpsError('invalid-argument', 'source invalide')
  }
  if (data.deliveryMode && !['livraison', 'retrait'].includes(data.deliveryMode)) {
    throw new HttpsError('invalid-argument', 'deliveryMode invalide')
  }
}

async function checkDoubleOrder(phone) {
  const normalized = normalizePhone(phone)
  if (!normalized) return
  const since = Date.now() - DOUBLE_ORDER_BLOCK_MS
  const snap = await db
    .ref('orders')
    .orderByChild('createdAt')
    .startAt(since)
    .once('value')
  const orders = snap.val() || {}
  for (const o of Object.values(orders)) {
    if (!o || typeof o !== 'object') continue
    if (o.status === 'refusee') continue
    if (normalizePhone(o.customer?.phone) === normalized) {
      throw new HttpsError(
        'already-exists',
        'Une commande récente est déjà enregistrée pour ce numéro (< 48h). Contactez-nous pour en passer une autre.'
      )
    }
  }
}

/**
 * Bundles → saveurs individuelles (miroir de PRODUCTS[].bundleProductIds côté site).
 * Les `box-*` n'ont pas de stock propre : leur stock = stock des composants.
 */
const BUNDLE_PRODUCT_IDS = {
  'box-trompe-loeil': [
    'trompe-loeil-mangue', 'trompe-loeil-citron', 'trompe-loeil-pistache',
    'trompe-loeil-passion', 'trompe-loeil-framboise', 'trompe-loeil-cacahuete',
    'trompe-loeil-fraise',
  ],
  'box-fruitee': [
    'trompe-loeil-mangue', 'trompe-loeil-passion', 'trompe-loeil-fraise',
    'trompe-loeil-framboise', 'trompe-loeil-myrtille', 'trompe-loeil-citron',
  ],
  'box-de-tout': [
    'trompe-loeil-mangue', 'trompe-loeil-citron', 'trompe-loeil-pistache',
    'trompe-loeil-passion', 'trompe-loeil-framboise', 'trompe-loeil-cacahuete',
    'trompe-loeil-fraise', 'trompe-loeil-myrtille', 'trompe-loeil-cafe',
    'trompe-loeil-vanille', 'trompe-loeil-popcorn', 'trompe-loeil-pecan',
    'trompe-loeil-amande', 'trompe-loeil-cabosse',
  ],
}

const BOX_DECOUVERTE_TROMPE = 'box-decouverte-trompe-5'

/**
 * Transforme les items de commande en décréments de stock réels.
 *  - Si l'item a trompeDiscoverySelection (box-decouverte-trompe-5 ou box-fruitee etc.)
 *    → décrémente chaque saveur choisie × quantity
 *  - Sinon si l'item est un bundle connu (box-trompe-loeil, box-de-tout sans choix)
 *    → décrémente toutes les saveurs du bundle × quantity
 *  - Sinon → décrémente le productId tel quel × quantity
 */
function expandItemsForStock(items) {
  const out = []
  for (const it of items) {
    const baseId = String(it.productId || '').replace(/-\d{10,}$/, '')
    const qty = it.quantity
    const sel = Array.isArray(it.trompeDiscoverySelection) ? it.trompeDiscoverySelection : null
    if (sel && sel.length > 0) {
      for (const sid of sel) out.push({ productId: sid, quantity: qty })
      continue
    }
    const bundle = BUNDLE_PRODUCT_IDS[baseId]
    if (bundle) {
      for (const bid of bundle) out.push({ productId: bid, quantity: qty })
      continue
    }
    out.push({ productId: baseId, quantity: qty })
  }
  return out
}

/**
 * Décrémente le stock atomiquement (runTransaction par produit), rollback complet
 * si l'un des produits n'a pas assez de stock.
 *
 * Comportement aligné sur decrementStockBatchStrict côté site :
 *  - Produit non-tracké (stock/productId absent) → skip silencieux
 *  - Produit tracké mais stock < qty → throw HttpsError + rollback
 */
async function decrementStockAtomic(items) {
  // Agréger quantités par productId (au cas où un productId apparaît plusieurs fois)
  const decrements = {}
  for (const it of items) {
    decrements[it.productId] = (decrements[it.productId] || 0) + it.quantity
  }
  console.log('[decrementStockAtomic] decrements to apply:', JSON.stringify(decrements))
  // Pour chaque produit, 3 cas possibles :
  //  - wasUntracked=true : stock initial null/undefined → rien à faire, pas de rollback
  //  - wasInsufficient=true : stock < qty → abort + rollback
  //  - sinon : décrément réussi → push dans attempted pour rollback éventuel
  const attempted = []
  for (const [productId, qty] of Object.entries(decrements)) {
    const stockRef = db.ref(`stock/${productId}`)
    let wasUntracked = false
    let before = null
    let after = null
    const result = await stockRef.transaction((current) => {
      before = current
      if (current == null) {
        wasUntracked = true
        return // produit non-tracké : on ne touche rien
      }
      if (current < qty) return // abort → pas assez de stock
      after = current - qty
      return current - qty
    })
    console.log(`[decrementStockAtomic] ${productId}: before=${before} qty=${qty} after=${after} committed=${result.committed} untracked=${wasUntracked}`)
    if (wasUntracked) continue // rien à faire, pas tracké
    const commitFailed = !result.committed
    if (commitFailed) {
      // Rollback complet de ce qui a été décrémenté
      for (const [pid, q] of attempted) {
        await db
          .ref(`stock/${pid}`)
          .transaction((c) => (c ?? 0) + q)
          .catch(() => {})
      }
      throw new HttpsError(
        'failed-precondition',
        `Stock insuffisant pour ${productId}`
      )
    }
    attempted.push([productId, qty])
  }
}

/**
 * Réserve atomiquement l'index paymentIntentToOrder/{pi} pour garantir qu'un
 * PaymentIntent ne donne qu'UNE commande, quel que soit le chemin (front,
 * webhook, retry Stripe). Retourne :
 *   - { alreadyOrderId } si une commande existe déjà pour ce PI (ne rien recréer)
 *   - { reserved: true } si la réservation vient d'être posée (on peut créer)
 * La valeur 'PENDING' est un verrou temporaire remplacé par l'orderId réel
 * une fois la commande écrite (voir placeOrder).
 */
async function reservePaymentIntent(paymentIntentId) {
  const ref = db.ref(`paymentIntentToOrder/${paymentIntentId}`)
  let existing = null
  const res = await ref.transaction((current) => {
    if (current) {
      existing = current
      return // déjà réservé/créé → abort (ne pas écraser)
    }
    return 'PENDING'
  })
  if (existing) return { alreadyOrderId: existing }
  if (!res.committed) return { alreadyOrderId: 'PENDING' }
  return { reserved: true }
}

/**
 * Cœur de la création de commande, réutilisable par le callable createOrder
 * (front) ET le webhook Stripe (secours). Idempotent quand data porte un
 * stripePaymentIntentId : le même PI ne crée jamais deux commandes.
 *
 * @param {object} data  Payload de commande validé (structure createOrder)
 * @param {{ userId?: string }} [opts]
 * @returns {Promise<{ orderId: string, orderNumber: number, deduped?: boolean }>}
 */
async function placeOrder(data, opts = {}) {
  validateOrderInput(data)

  const pi = typeof data.stripePaymentIntentId === 'string' ? data.stripePaymentIntentId : null

  // Idempotence : si ce PaymentIntent a déjà (ou est en train de créer) une
  // commande, on ne recrée rien. Évite les doublons front+webhook / retries.
  if (pi) {
    const reservation = await reservePaymentIntent(pi)
    if (reservation.alreadyOrderId) {
      console.log(`[placeOrder] PI ${pi} déjà traité (order=${reservation.alreadyOrderId}) — dédupliqué`)
      return {
        orderId: reservation.alreadyOrderId === 'PENDING' ? null : reservation.alreadyOrderId,
        orderNumber: null,
        deduped: true,
      }
    }
  }

  try {
    await checkDoubleOrder(data.customer.phone)
  } catch (err) {
    // La commande est refusée (doublon 48h) : on libère le verrou PI pour ne
    // pas bloquer une éventuelle réconciliation ultérieure.
    if (pi) await db.ref(`paymentIntentToOrder/${pi}`).remove().catch(() => {})
    throw err
  }

  const userId = opts.userId

  try {
    // Décomposer les bundles/boxes en saveurs individuelles pour le stock
    console.log('[placeOrder] input items:', JSON.stringify(data.items))
    const stockItems = expandItemsForStock(data.items)
    console.log('[placeOrder] expanded stockItems:', JSON.stringify(stockItems))

    // Stock (bloquant avec rollback)
    await decrementStockAtomic(stockItems)

    // Counter orderNumber
    const counterRef = db.ref('counters/orderNumber')
    const counterRes = await counterRef.transaction((c) => (c ?? 0) + 1)
    if (!counterRes.committed) {
      // Rollback stock avant de throw
      const decrements = {}
      for (const it of stockItems) {
        decrements[it.productId] = (decrements[it.productId] || 0) + it.quantity
      }
      for (const [pid, q] of Object.entries(decrements)) {
        await db.ref(`stock/${pid}`).transaction((c) => (c ?? 0) + q).catch(() => {})
      }
      throw new HttpsError('internal', 'Compteur indisponible')
    }
    const orderNumber = counterRes.snapshot.val()

    // Construire l'Order final (copie des champs validés + métadonnées)
    const order = {
      ...data,
      orderNumber,
      createdAt: Date.now(),
      ...(userId ? { userId } : {}),
    }

    const newRef = db.ref('orders').push()
    await newRef.set(order)
    const orderId = newRef.key

    // Verrouille l'index PI sur l'orderId réel (remplace 'PENDING').
    if (pi && orderId) {
      await db.ref(`paymentIntentToOrder/${pi}`).set(orderId).catch((e) =>
        console.error('[placeOrder] set paymentIntentToOrder:', e),
      )
    }

    // Best-effort post-création (n'échoue pas la commande)
    const postOps = []
    if (orderId) {
      postOps.push(
        dispatchOrderCreatedEmails(orderId, order).catch((e) =>
          console.error('[placeOrder] dispatchOrderCreatedEmails:', e),
        ),
      )
    }
    if (
      data.deliveryMode === 'livraison' &&
      data.requestedDate &&
      data.requestedTime
    ) {
      const slotRef = db.ref(
        `deliverySlots/${data.requestedDate}/${data.requestedTime}`
      )
      postOps.push(
        slotRef
          .transaction((c) => (c ?? 0) + 1)
          .catch((e) => console.error('[placeOrder] reserveDeliverySlot:', e))
      )
    }
    if (data.promoCode) {
      const promoKey = String(data.promoCode).toUpperCase()
      postOps.push(
        db
          .ref(`promoCodes/${promoKey}/usedCount`)
          .transaction((c) => (c ?? 0) + 1)
          .catch((e) => console.error('[placeOrder] incrementPromoCodeUsage:', e))
      )
    }
    // Fidélité (100 % serveur) : crédite les points de commande au client
    // connecté, sur la base du total RECALCULÉ serveur (jamais data.total).
    if (userId && orderId) {
      const pointsTotal = computeOrderPointsTotal(data)
      const basePoints = Math.round(pointsTotal)
      if (basePoints > 0) {
        postOps.push(
          awardLoyaltyPoints(userId, {
            reason: 'order_points',
            points: basePoints,
            at: Date.now(),
            amount: pointsTotal,
            orderId,
          }).catch((e) => console.error('[placeOrder] awardLoyaltyPoints:', e)),
        )
      }
      // Crédit parrain : 1ère commande d'un filleul (referrerUserId fourni par le front).
      if (data.referrerUserId && data.referrerUserId !== userId) {
        postOps.push(creditReferrer(data.referrerUserId, data.referralCode))
      }
    }
    await Promise.allSettled(postOps)

    // Une fois la commande créée, le pending n'est plus utile (le webhook la
    // trouvera via l'index PI). On le nettoie best-effort.
    if (pi) await db.ref(`pendingOrders/${pi}`).remove().catch(() => {})

    console.log(`[placeOrder] order ${orderId} (#${orderNumber}) created for ${data.customer.phone}`)
    return { orderId, orderNumber }
  } catch (err) {
    // Échec APRÈS réservation du verrou PI : on le libère pour permettre au
    // webhook (ou à une réconciliation) de retenter. Le stock a déjà été
    // rollback par decrementStockAtomic/counter le cas échéant.
    if (pi) await db.ref(`paymentIntentToOrder/${pi}`).remove().catch(() => {})
    throw err
  }
}

/**
 * Callable (front) : crée une commande côté serveur après paiement.
 * Mince wrapper autour de placeOrder (auth → userId). Voir placeOrder pour
 * l'idempotence et les post-ops.
 *
 * Retour : { orderId, orderNumber }
 */
export const createOrder = onCall(
  { region: 'europe-west1' },
  async (request) => {
    return placeOrder(request.data, { userId: request.auth?.uid })
  }
)

// ============================================================================
// Stripe — createPaymentIntent (callable) + webhook de confirmation
// ============================================================================

/**
 * Callable : crée un PaymentIntent Stripe pour le panier en cours.
 * Le montant est recalculé côté serveur à partir des items (jamais de confiance
 * dans un total envoyé par le client). Retourne le clientSecret pour le
 * Payment Element. La commande est créée après confirmation du paiement, soit
 * par le front (createOrder), soit par le webhook Stripe en secours à partir du
 * brouillon `orderDraft` stocké dans pendingOrders/{pi.id} (webhook-first).
 *
 * @returns {{ clientSecret: string, amount: number, paymentIntentId: string }}
 */
export const createPaymentIntent = onCall(
  { region: 'europe-west1', secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    const data = request.data || {}
    const items = Array.isArray(data.items) ? data.items : []
    if (items.length === 0) throw new HttpsError('invalid-argument', 'Panier vide')

    // Recalcul du montant côté serveur (en centimes) — source de vérité.
    let amount = 0
    for (const it of items) {
      const price = Number(it.price)
      const qty = Number(it.quantity)
      if (!Number.isFinite(price) || price < 0 || price > 10000) {
        throw new HttpsError('invalid-argument', 'Prix invalide')
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        throw new HttpsError('invalid-argument', 'Quantité invalide')
      }
      amount += Math.round(price * 100) * qty
    }
    // Remises éventuelles transmises (promo / parrainage / don) — bornées.
    const discount = Math.max(0, Math.round(Number(data.discountAmount || 0) * 100))
    const donation = Math.max(0, Math.round(Number(data.donationAmount || 0) * 100))
    amount = Math.max(0, amount - discount) + donation
    if (amount < 50) throw new HttpsError('invalid-argument', 'Montant trop faible (min 0,50 €)')

    const stripe = getStripe()

    // Annule l'intent précédent non finalisé (évite les « Incomplet » dans Stripe quand le panier change).
    const replaceId = data.replacePaymentIntentId
    if (typeof replaceId === 'string' && replaceId.startsWith('pi_')) {
      try {
        const existing = await stripe.paymentIntents.retrieve(replaceId)
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
          await stripe.paymentIntents.cancel(replaceId)
        }
      } catch (e) {
        console.warn('[createPaymentIntent] annulation intent précédent:', e.message)
      }
      // Nettoie le brouillon de l'intent remplacé (panier changé → nouvel intent).
      await db.ref(`pendingOrders/${replaceId}`).remove().catch(() => {})
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      // Carte (+ Apple Pay / Google Pay via Express Checkout) et Revolut Pay.
      payment_method_types: ['card', 'revolut_pay'],
      metadata: {
        ...(request.auth?.uid ? { userId: request.auth.uid } : {}),
        ...(data.phone ? { phone: String(data.phone).slice(0, 30) } : {}),
        source: 'click-and-collect',
      },
    })

    // Webhook-first : on stocke le brouillon de commande complet, indexé par
    // PaymentIntent, pour que le webhook puisse créer la commande même si le
    // navigateur du client ne revient jamais (onglet fermé, réseau coupé).
    // Best-effort : un échec ici ne bloque pas le paiement (le filet B alertera).
    if (data.orderDraft && typeof data.orderDraft === 'object') {
      const draft = {
        ...data.orderDraft,
        // Le PI est la clé d'idempotence : placeOrder l'utilise pour dédupliquer.
        stripePaymentIntentId: intent.id,
        paymentStatus: 'paid',
        // Montant recalculé serveur (en €) — trace de contrôle.
        serverAmountEur: amount / 100,
        ...(request.auth?.uid ? { userId: request.auth.uid } : {}),
      }
      await db
        .ref(`pendingOrders/${intent.id}`)
        .set({ order: draft, createdAt: Date.now() })
        .catch((e) => console.error('[createPaymentIntent] stash pendingOrder:', e))
    }

    return { clientSecret: intent.client_secret, amount, paymentIntentId: intent.id }
  }
)

/** Email admin : paiement reçu sans commande enregistrée (filet de sécurité B). */
function buildOrphanPaymentAlertHtml(pi) {
  const amount = (Number(pi.amount || 0) / 100).toFixed(2).replace('.', ',')
  const phone = pi.metadata?.phone || '—'
  const userId = pi.metadata?.userId || '(client non connecté)'
  const dashUrl = `https://dashboard.stripe.com/payments/${pi.id}`
  return `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px;">
  <h2 style="color:#b91c1c;">⚠️ Paiement reçu SANS commande</h2>
  <p>Un paiement Stripe a réussi mais aucune commande n'a été enregistrée dans les 2 minutes.</p>
  <ul style="font-size:14px;color:#333;">
    <li><strong>Montant :</strong> ${amount} €</li>
    <li><strong>Téléphone client :</strong> ${escapeHtml(phone)}</li>
    <li><strong>Compte :</strong> ${escapeHtml(userId)}</li>
    <li><strong>PaymentIntent :</strong> ${escapeHtml(pi.id)}</li>
  </ul>
  <p><strong>À faire :</strong> contacter le client pour confirmer sa commande, puis la saisir manuellement (le détail des articles n'est pas dans Stripe).</p>
  <p><a href="${dashUrl}" style="display:inline-block;background:#635bff;color:white;padding:10px 16px;text-decoration:none;border-radius:8px;">Voir le paiement dans Stripe</a></p>
  <p style="color:#666;font-size:12px;">Maison Mayssa — filet de sécurité automatique</p>
</body></html>`
}

/**
 * Traite un payment_intent.succeeded : garantit qu'un paiement réussi donne
 * toujours une commande.
 *  A) Si un brouillon pendingOrders/{pi} existe → crée la commande via placeOrder
 *     (idempotent : ne double pas si le front l'a déjà créée).
 *  B) Sinon (pas de brouillon exploitable) → enregistre orphanPayments/{pi} et
 *     alerte l'admin par email pour réconciliation manuelle.
 * Un court délai de grâce laisse le front finir sa propre création (cas nominal).
 */
async function handlePaymentSucceeded(pi) {
  const piId = pi.id
  // Idempotence globale du traitement webhook (retries Stripe inclus).
  const alreadyHandled = await db.ref(`orphanPayments/${piId}`).once('value').then((s) => s.exists())

  // Délai de grâce : le front crée souvent la commande dans la foulée du paiement.
  await sleep(3000)

  // Le front a-t-il déjà créé la commande pour ce PI ?
  const mapped = await db.ref(`paymentIntentToOrder/${piId}`).once('value')
  if (mapped.exists() && mapped.val() !== 'PENDING') {
    console.log(`[stripeWebhook] PI ${piId} → commande déjà créée (${mapped.val()})`)
    return
  }

  // (A) Brouillon disponible → création serveur de la commande complète.
  const pendingSnap = await db.ref(`pendingOrders/${piId}`).once('value')
  const pending = pendingSnap.val()
  if (pending?.order && typeof pending.order === 'object') {
    try {
      const draft = pending.order
      const { userId, ...orderData } = draft
      const result = await placeOrder(orderData, { userId })
      if (result.deduped) {
        console.log(`[stripeWebhook] PI ${piId} déjà traité (dédupliqué) — OK`)
      } else {
        console.log(`[stripeWebhook] PI ${piId} → commande créée par le webhook: ${result.orderId} (#${result.orderNumber})`)
      }
      return
    } catch (err) {
      console.error(`[stripeWebhook] échec placeOrder depuis brouillon PI ${piId}:`, err)
      // On tombe dans le filet B ci-dessous pour alerter malgré tout.
    }
  }

  // (B) Filet de sécurité : paiement sans commande → alerte admin (une seule fois).
  if (alreadyHandled) {
    console.log(`[stripeWebhook] PI ${piId} orphelin déjà signalé — pas de nouvelle alerte`)
    return
  }
  await db.ref(`orphanPayments/${piId}`).set({
    amount: pi.amount ?? null,
    currency: pi.currency ?? null,
    phone: pi.metadata?.phone ?? null,
    userId: pi.metadata?.userId ?? null,
    createdAt: Date.now(),
    resolved: false,
  }).catch((e) => console.error('[stripeWebhook] write orphanPayment:', e))

  const adminEmails = ADMIN_EMAIL.value().split(',').map((e) => e.trim()).filter(Boolean)
  if (adminEmails.length > 0) {
    await sendEmailWithRetry({
      to: adminEmails,
      subject: `⚠️ Paiement ${(Number(pi.amount || 0) / 100).toFixed(2)} € SANS commande – Maison Mayssa`,
      html: buildOrphanPaymentAlertHtml(pi),
    }).catch((e) => console.error('[stripeWebhook] alerte admin orphelin:', e))
  }
  console.warn(`[stripeWebhook] PI ${piId} PAIEMENT ORPHELIN signalé (${pi.amount} ${pi.currency})`)
}

/**
 * Webhook Stripe : reçoit les événements de paiement (signature vérifiée).
 * Filet + création webhook-first (voir handlePaymentSucceeded).
 *
 * Configurer l'URL de ce webhook dans le dashboard Stripe → Développeurs →
 * Webhooks (événements payment_intent.succeeded, payment_intent.payment_failed),
 * et renseigner STRIPE_WEBHOOK_SECRET (whsec_…).
 * Les emails admin nécessitent RESEND_API_KEY.
 */
export const stripeWebhook = onRequest(
  { region: 'europe-west1', secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY] },
  async (req, res) => {
    const whSecret = STRIPE_WEBHOOK_SECRET.value()
    if (!whSecret) {
      console.warn('[stripeWebhook] STRIPE_WEBHOOK_SECRET manquant')
      res.status(500).send('webhook non configuré')
      return
    }
    const stripe = getStripe()
    let evt
    try {
      // onRequest fournit le corps brut dans req.rawBody (requis pour la signature).
      evt = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], whSecret)
    } catch (err) {
      console.error('[stripeWebhook] signature invalide:', err.message)
      res.status(400).send(`Webhook signature error: ${err.message}`)
      return
    }

    try {
      switch (evt.type) {
        case 'payment_intent.succeeded':
          console.log(`[stripeWebhook] paiement réussi: ${evt.data.object.id} (${evt.data.object.amount} ${evt.data.object.currency})`)
          await handlePaymentSucceeded(evt.data.object)
          break
        case 'payment_intent.payment_failed':
          console.warn(`[stripeWebhook] paiement échoué: ${evt.data.object.id}`)
          break
        default:
          // autres événements ignorés pour l'instant
          break
      }
    } catch (err) {
      console.error('[stripeWebhook] erreur traitement:', err)
      // On renvoie 200 quand même : l'événement est signé et valide ; un 500
      // ferait retenter Stripe en boucle. Les erreurs sont loggées + orphanPayments.
    }
    res.status(200).json({ received: true })
  }
)

// ============================================================================
// setAdminClaim — one-shot : attribue le Custom Claim admin à un UID
// Seul l'email hardcodé peut déclencher cette CF (bootstrap).
// ============================================================================

export const setAdminClaim = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const callerEmail = request.auth?.token?.email
    if (callerEmail !== ADMIN_EMAIL_HARDCODED) {
      throw new HttpsError('permission-denied', 'admin only')
    }
    const targetUid = request.data?.uid
    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'uid manquant')
    }
    await admin.auth().setCustomUserClaims(targetUid, { admin: true })
    console.log(`[setAdminClaim] admin=true set on uid=${targetUid} by ${callerEmail}`)
    return { success: true, uid: targetUid }
  }
)

// ============================================================================
// Fidélité — Cloud Functions appelables (le client ne peut plus écrire ses points)
// ============================================================================

/**
 * Trigger : crédite les points de bienvenue à la création du profil.
 * Le client crée son profil avec loyalty.points = 0 ; ce trigger ajoute les
 * 15 pts de manière fiable (le client ne peut pas se créditer lui-même).
 * Garde anti-double-crédit : ne fait rien si l'historique contient déjà
 * 'creation_compte' (ré-exécution, restauration, etc.).
 */
export const onUserCreated = onValueCreated(
  { ref: 'users/{uid}', ...rtdbTriggerOptions() },
  async (event) => {
    const uid = event.params.uid
    const profile = event.data.val()
    if (!profile || typeof profile !== 'object') return
    const history = profile.loyalty?.history
    const historyArr = Array.isArray(history)
      ? history
      : history && typeof history === 'object'
        ? Object.values(history)
        : []
    if (historyArr.some((h) => h?.reason === 'creation_compte')) return
    await awardLoyaltyPoints(uid, {
      reason: 'creation_compte',
      points: WELCOME_POINTS,
      at: Date.now(),
    })
    console.log(`[onUserCreated] +${WELCOME_POINTS} pts bienvenue → ${uid}`)
  }
)

/**
 * Callable : réclame les points d'un suivi réseau social (Instagram / TikTok),
 * une seule fois par plateforme. Vérifie l'auth + le drapeau côté serveur.
 * @returns {{ points: number }}
 */
export const claimSocialPoints = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Connexion requise')
    const platform = request.data?.platform
    if (platform !== 'instagram' && platform !== 'tiktok') {
      throw new HttpsError('invalid-argument', 'plateforme invalide')
    }
    const claimedField = platform === 'instagram' ? 'instagramClaimedAt' : 'tiktokClaimedAt'
    const now = Date.now()

    // Transaction atomique : pose le drapeau (anti double-réclamation) ET crédite.
    let credited = false
    const res = await db.ref(`users/${uid}/loyalty`).transaction((current) => {
      if (current == null) return // profil absent
      if (current[claimedField]) return current // déjà réclamé → no-op (commit sans changement)
      credited = true
      const points = (Number(current.points) || 0) + SOCIAL_FOLLOW_POINTS
      const lifetime = (Number(current.lifetimePoints) || 0) + SOCIAL_FOLLOW_POINTS
      const history = Array.isArray(current.history)
        ? current.history
        : current.history && typeof current.history === 'object'
          ? Object.values(current.history)
          : []
      return {
        ...current,
        points,
        lifetimePoints: lifetime,
        tier: tierForLifetimePoints(lifetime),
        [claimedField]: now,
        history: [...history, { reason: `${platform}_follow`, points: SOCIAL_FOLLOW_POINTS, at: now }],
      }
    })
    if (!res.committed || res.snapshot.val() == null) {
      throw new HttpsError('not-found', 'Profil introuvable')
    }
    if (!credited) {
      throw new HttpsError('already-exists', `Points ${platform} déjà réclamés`)
    }
    console.log(`[claimSocialPoints] +${SOCIAL_FOLLOW_POINTS} pts ${platform} → ${uid}`)
    return { points: Number(res.snapshot.val().points) || 0 }
  }
)

/**
 * Callable : réclame une récompense (débite les points + crée l'entrée reward).
 * Le coût est lu côté serveur (REWARD_COSTS) — jamais fourni par le client.
 * Le débit + l'écriture du reward sont atomiques (transaction sur loyalty +
 * vérif du solde) pour empêcher solde négatif / double-clic.
 * @returns {{ rewardId: string, points: number }}
 */
export const claimLoyaltyReward = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Connexion requise')
    const rewardType = request.data?.rewardType
    const cost = REWARD_COSTS[rewardType]
    if (!cost) throw new HttpsError('invalid-argument', 'récompense inconnue')

    // Débit atomique : abort si solde insuffisant (transaction renvoie undefined).
    let insufficient = false
    const res = await db.ref(`users/${uid}/loyalty`).transaction((current) => {
      if (current == null) return // profil absent
      const points = Number(current.points) || 0
      if (points < cost) {
        insufficient = true
        return // abort → pas de débit
      }
      return { ...current, points: points - cost }
    })
    if (insufficient) throw new HttpsError('failed-precondition', 'Points insuffisants')
    if (!res.committed || res.snapshot.val() == null) {
      throw new HttpsError('not-found', 'Profil introuvable')
    }

    // Crée la récompense (le débit est déjà acté ; en cas d'échec rare ici, on
    // re-crédite pour ne pas perdre les points).
    try {
      const rewardRef = db.ref(`users/${uid}/rewards`).push()
      await rewardRef.set({
        type: rewardType,
        pointsSpent: cost,
        claimedAt: Date.now(),
        usedInOrderId: null,
      })
      console.log(`[claimLoyaltyReward] ${rewardType} (-${cost} pts) → ${uid}`)
      return { rewardId: rewardRef.key, points: Number(res.snapshot.val().points) || 0 }
    } catch (e) {
      await db
        .ref(`users/${uid}/loyalty/points`)
        .transaction((p) => (Number(p) || 0) + cost)
        .catch(() => {})
      console.error('[claimLoyaltyReward] échec création reward, points re-crédités:', e)
      throw new HttpsError('internal', 'Réclamation impossible, réessaie')
    }
  }
)

/**
 * Callable : crédite les 10 points d'avis (review_bonus), 1 seule fois par
 * commande (ou 1 seule fois tout court si pas d'orderId). Idempotent via
 * l'historique loyalty.
 * @returns {{ points: number, awarded: boolean }}
 */
export const awardReviewPoints = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Connexion requise')
    const orderId = typeof request.data?.orderId === 'string' ? request.data.orderId : null
    const REVIEW_BONUS = 10
    const now = Date.now()

    let awarded = false
    const res = await db.ref(`users/${uid}/loyalty`).transaction((current) => {
      if (current == null) return // profil absent
      const history = Array.isArray(current.history)
        ? current.history
        : current.history && typeof current.history === 'object'
          ? Object.values(current.history)
          : []
      // Anti-double : déjà un review_bonus (pour cette commande, ou tout court).
      const already = history.some(
        (h) => h?.reason === 'review_bonus' && (orderId ? h.orderId === orderId : true),
      )
      if (already) return current // no-op
      awarded = true
      const points = (Number(current.points) || 0) + REVIEW_BONUS
      const lifetime = (Number(current.lifetimePoints) || 0) + REVIEW_BONUS
      return {
        ...current,
        points,
        lifetimePoints: lifetime,
        tier: tierForLifetimePoints(lifetime),
        history: [...history, { reason: 'review_bonus', points: REVIEW_BONUS, at: now, ...(orderId && { orderId }) }],
      }
    })
    if (!res.committed || res.snapshot.val() == null) {
      throw new HttpsError('not-found', 'Profil introuvable')
    }
    return { points: Number(res.snapshot.val().points) || 0, awarded }
  }
)

/**
 * Callable (admin) : ajoute ou retire des points manuellement.
 * `points` > 0 → ajout (crédite lifetime) ; < 0 → retrait (ne touche pas lifetime).
 * @returns {{ points: number }}
 */
export const adminAdjustPoints = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const callerEmail = request.auth?.token?.email
    if (callerEmail !== ADMIN_EMAIL_HARDCODED) {
      throw new HttpsError('permission-denied', 'admin only')
    }
    const targetUid = request.data?.uid
    const delta = Number(request.data?.points)
    if (!targetUid || typeof targetUid !== 'string') {
      throw new HttpsError('invalid-argument', 'uid manquant')
    }
    if (!Number.isFinite(delta) || delta === 0) {
      throw new HttpsError('invalid-argument', 'points invalide')
    }
    const note = typeof request.data?.note === 'string' ? request.data.note.trim() : ''
    const newPoints = await awardLoyaltyPoints(targetUid, {
      reason: delta > 0 ? 'admin_ajout' : 'admin_retrait',
      points: delta,
      at: Date.now(),
      ...(note && { adminNote: note }),
    })
    if (newPoints == null) throw new HttpsError('not-found', 'Profil introuvable')
    console.log(`[adminAdjustPoints] ${delta > 0 ? '+' : ''}${delta} pts → ${targetUid} par ${callerEmail}`)
    return { points: newPoints }
  }
)
