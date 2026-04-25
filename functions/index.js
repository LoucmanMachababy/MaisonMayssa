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
        sendEmailWithRetry({
          to: order.customer.email.trim(),
          subject: `Commande ${orderNumber != null ? `#${orderNumber}` : orderId} enregistrée – Maison Mayssa`,
          html: htmlRecap,
        }).catch((err) => console.error('[onOrderCreated] email client:', err))
      )
    }

    if (adminEmails.length > 0) {
      promises.push(
        sendEmailWithRetry({
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
  { region: 'europe-west1' },
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
  { ref: 'stock/{productId}', region: 'europe-west1' },
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
  if (data.status !== 'en_attente') {
    throw new HttpsError('invalid-argument', 'status initial doit être en_attente')
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
  // Pour chaque produit, 3 cas possibles :
  //  - wasUntracked=true : stock initial null/undefined → rien à faire, pas de rollback
  //  - wasInsufficient=true : stock < qty → abort + rollback
  //  - sinon : décrément réussi → push dans attempted pour rollback éventuel
  const attempted = []
  for (const [productId, qty] of Object.entries(decrements)) {
    const stockRef = db.ref(`stock/${productId}`)
    let wasUntracked = false
    const result = await stockRef.transaction((current) => {
      if (current == null) {
        wasUntracked = true
        return // produit non-tracké : on ne touche rien
      }
      if (current < qty) return // abort → pas assez de stock
      return current - qty
    })
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
 * Callable : crée une commande côté serveur.
 * - Valide la structure d'entrée
 * - Anti-double-commande 48h par numéro de téléphone
 * - Décrémente le stock atomiquement avec rollback
 * - Incrémente counters/orderNumber
 * - Crée la commande
 * - Best-effort post-ops : réservation slot livraison + incrément promo usage
 *
 * Retour : { orderId, orderNumber }
 */
export const createOrder = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const data = request.data
    validateOrderInput(data)

    await checkDoubleOrder(data.customer.phone)

    // Stock (bloquant avec rollback)
    await decrementStockAtomic(data.items)

    // Counter orderNumber
    const counterRef = db.ref('counters/orderNumber')
    const counterRes = await counterRef.transaction((c) => (c ?? 0) + 1)
    if (!counterRes.committed) {
      // Rollback stock avant de throw
      const decrements = {}
      for (const it of data.items) {
        decrements[it.productId] = (decrements[it.productId] || 0) + it.quantity
      }
      for (const [pid, q] of Object.entries(decrements)) {
        await db.ref(`stock/${pid}`).transaction((c) => (c ?? 0) + q).catch(() => {})
      }
      throw new HttpsError('internal', 'Compteur indisponible')
    }
    const orderNumber = counterRes.snapshot.val()

    const userId = request.auth?.uid

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

    // Best-effort post-création (n'échoue pas la commande)
    const postOps = []
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
          .catch((e) => console.error('[createOrder] reserveDeliverySlot:', e))
      )
    }
    if (data.promoCode) {
      const promoKey = String(data.promoCode).toUpperCase()
      postOps.push(
        db
          .ref(`promoCodes/${promoKey}/usedCount`)
          .transaction((c) => (c ?? 0) + 1)
          .catch((e) => console.error('[createOrder] incrementPromoCodeUsage:', e))
      )
    }
    await Promise.allSettled(postOps)

    console.log(`[createOrder] order ${orderId} (#${orderNumber}) created for ${data.customer.phone}`)
    return { orderId, orderNumber }
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
