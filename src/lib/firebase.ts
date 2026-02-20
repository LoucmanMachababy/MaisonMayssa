import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, get, push, update, remove, runTransaction, connectDatabaseEmulator, onDisconnect } from 'firebase/database'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth'
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import type { User } from 'firebase/auth'

// ⚠️ Remplace ces valeurs par celles de ton projet Firebase
// Console : https://console.firebase.google.com → Paramètres du projet → Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

const databaseURL = (firebaseConfig.databaseURL || '').trim()
if (!databaseURL || !databaseURL.startsWith('https://')) {
  throw new Error(
    'Firebase Database URL manquante. Crée un fichier .env ou .env.local à la racine du projet avec :\n' +
    'VITE_FIREBASE_DATABASE_URL=https://TON_PROJECT_ID.firebaseio.com\n' +
    'ou pour Realtime Database (europe) : https://TON_PROJECT_ID-default-rtdb.europe-west1.firebasedatabase.app\n' +
    'Récupère l’URL dans la console Firebase → Realtime Database → URL.'
  )
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

/** En local : avec VITE_USE_FIREBASE_EMULATOR=true dans .env.local, l'app utilise les émulateurs (pas la prod). */
const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
if (useEmulator) {
  connectDatabaseEmulator(db, '127.0.0.1', 9000)
}

// --- Références DB ---
export const stockRef = ref(db, 'stock')
export const settingsRef = ref(db, 'settings')
export const productsOverrideRef = ref(db, 'products')
const deliverySlotsRef = ref(db, 'deliverySlots')
const mysteryFraiseRef = ref(db, 'mysteryFraise')

/** Structure: deliverySlots/{date}/{time} = count (1 = créneau pris, 0 = dispo) */
export type DeliverySlotsMap = Record<string, Record<string, number>>

export function listenDeliverySlots(callback: (slots: DeliverySlotsMap) => void) {
  return onValue(deliverySlotsRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
}

/** Réserver un créneau (ordre créé en livraison) */
export async function reserveDeliverySlot(date: string, time: string): Promise<void> {
  if (!date || !time) return
  const slotRef = ref(db, `deliverySlots/${date}/${time}`)
  await runTransaction(slotRef, (current) => (current ?? 0) + 1)
}

/** Libérer un créneau (ordre refusé/supprimé ou modifié) */
export async function releaseDeliverySlot(date: string, time: string): Promise<void> {
  if (!date || !time) return
  const slotRef = ref(db, `deliverySlots/${date}/${time}`)
  await runTransaction(slotRef, (current) => Math.max(0, (current ?? 1) - 1))
}

// --- Mystère Trompe l'oeil Fraise ---
export type MysteryFraiseState = { revealed: boolean; winnerUid: string | null }

export function listenMysteryFraise(callback: (state: MysteryFraiseState) => void) {
  return onValue(mysteryFraiseRef, (snapshot) => {
    const val = snapshot.val()
    callback(
      val && typeof val === 'object'
        ? { revealed: !!val.revealed, winnerUid: val.winnerUid ?? null }
        : { revealed: false, winnerUid: null },
    )
  })
}

let _functionsInstance: ReturnType<typeof getFunctions> | null = null
function getFunctionsInstance() {
  if (_functionsInstance) return _functionsInstance
  _functionsInstance = getFunctions(app, 'europe-west1')
  if (useEmulator) {
    connectFunctionsEmulator(_functionsInstance, '127.0.0.1', 5001)
  }
  return _functionsInstance
}

/** Soumettre la réponse au mystère (Fraise). Retourne { success, winner?, alreadyRevealed?, error? } */
export async function submitMysteryGuess(guess: string): Promise<{
  success: boolean
  winner?: boolean
  alreadyRevealed?: boolean
  error?: string
}> {
  const functions = getFunctionsInstance()
  const fn = httpsCallable<{ guess: string }, { success: boolean; winner?: boolean; alreadyRevealed?: boolean; error?: string }>(
    functions,
    'submitMysteryGuess',
  )
  const res = await fn({ guess })
  return res.data
}

// --- Stock ---
export type StockMap = Record<string, number>

export function listenStock(callback: (stock: StockMap) => void) {
  return onValue(stockRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
}

let _stockPermissionWarned = false
export async function updateStock(productId: string, quantity: number) {
  try {
    await set(ref(db, `stock/${productId}`), quantity)
  } catch (err: unknown) {
    const code = err && typeof (err as { code?: string }).code === 'string' ? (err as { code: string }).code : ''
    if (code === 'PERMISSION_DENIED') {
      if (!_stockPermissionWarned) {
        _stockPermissionWarned = true
        console.warn('[Firebase] Écriture stock refusée (règles). Vérifiez les règles Realtime Database pour /stock ou utilisez une Cloud Function.')
      }
      return
    }
    throw err
  }
}

export async function getStock(): Promise<StockMap> {
  const snapshot = await get(stockRef)
  return snapshot.val() || {}
}

// --- Product Overrides (admin) ---
import type { ProductOverride, ProductOverrideMap } from '../types'

export function listenProductOverrides(callback: (overrides: ProductOverrideMap) => void) {
  return onValue(productsOverrideRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
}

export async function updateProductOverride(productId: string, override: Partial<ProductOverride>) {
  // Firebase update() rejette les valeurs undefined — on les remplace par null (= suppression du champ)
  const sanitized = Object.fromEntries(
    Object.entries(override).map(([k, v]) => [k, v === undefined ? null : v])
  )
  await update(ref(db, `products/${productId}`), sanitized)
}

export async function setProductOverride(productId: string, override: ProductOverride) {
  // Firebase set() rejette les valeurs undefined — on les filtre
  const sanitized = Object.fromEntries(
    Object.entries(override).filter(([, v]) => v !== undefined)
  )
  await set(ref(db, `products/${productId}`), sanitized)
}

export async function deleteProductOverride(productId: string) {
  await remove(ref(db, `products/${productId}`))
}

// --- Settings ---
/** Ouverture de précommande : un jour (0=dim… 6=sam) et une heure à partir de laquelle on peut commander (HH:mm, "00:00" = toute la journée) */
export type PreorderOpening = { day: number; fromTime: string }

export type Settings = {
  preorderDays: number[]
  /** Horaires d'ouverture des précommandes trompe-l'œil (ex. samedi 00:00, mercredi 12:00). Si absent, on utilise preorderDays avec 00:00. */
  preorderOpenings?: PreorderOpening[]
  preorderMessage: string
  /** Si false, les clients ne peuvent pas envoyer de commande (bouton désactivé). Si true ou absent = commandes ouvertes. */
  ordersOpen?: boolean
  /** Première date sélectionnable pour retrait (YYYY-MM-DD). Si absent = firstAvailableDate puis aujourd'hui. */
  firstAvailableDateRetrait?: string
  /** Première date sélectionnable pour livraison (YYYY-MM-DD). Si absent = firstAvailableDate puis aujourd'hui. */
  firstAvailableDateLivraison?: string
  /** Première date sélectionnable pour retrait/livraison (YYYY-MM-DD). Rétrocompat : utilisée si les dates retrait/livraison ne sont pas définies. */
  firstAvailableDate?: string
  /** Dernière date sélectionnable (YYYY-MM-DD). Si absent = pas de limite. */
  lastAvailableDate?: string
  /** Jours de la semaine proposés (0=dim, 1=lun, …, 6=sam). Si absent ou vide = tous les jours entre première et dernière date. */
  availableWeekdays?: number[]
  /** Créneaux horaires proposés pour le retrait (ex. ["18:30"]). Si absent = défaut (18:30). */
  retraitTimeSlots?: string[]
  /** Créneaux horaires proposés pour la livraison (ex. ["20:00","20:30",...]). Si absent = défaut (20h-02h30). */
  livraisonTimeSlots?: string[]
  /** Message global affiché en bannière sur le site. Vide = pas de bannière. */
  globalMessage?: string
  /** Si true, le message global est affiché. Si false ou absent = pas de bannière. */
  globalMessageEnabled?: boolean
  /** Date d'ouverture des précommandes (YYYY-MM-DD). Si renseigné avec preorderOpenTime, les pickupDates ne sont visibles qu'à partir de cette date+heure. */
  preorderOpenDate?: string
  /** Heure d'ouverture des précommandes (HH:mm). Utilisé avec preorderOpenDate. */
  preorderOpenTime?: string
  /** Dates de récupération proposées aux clients (YYYY-MM-DD[]). Si renseigné, remplace availableWeekdays dans le sélecteur de date. */
  pickupDates?: string[]
}

const DEFAULT_PREORDER_OPENINGS: PreorderOpening[] = [
  { day: 6, fromTime: '00:00' },   // Samedi toute la journée
  { day: 3, fromTime: '12:00' },  // Mercredi à partir de midi
]

/** Parse "HH:mm" en minutes depuis minuit */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Précommande ouverte si la date donnée (ou maintenant) est dans une plage d'ouverture */
export function isPreorderOpenNow(openings: PreorderOpening[], date?: Date): boolean {
  const now = date ?? new Date()
  const today = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  for (const o of openings) {
    if (o.day !== today) continue
    if (o.fromTime === '00:00' || o.fromTime === '0:00') return true
    const fromMinutes = parseTimeToMinutes(o.fromTime)
    if (currentMinutes >= fromMinutes) return true
  }
  return false
}

function mergeSettings(val: unknown): Settings {
  const raw = (val || {}) as Record<string, unknown>
  const preorderDays = Array.isArray(raw.preorderDays) ? raw.preorderDays as number[] : [3, 6]
  const preorderOpenings = Array.isArray(raw.preorderOpenings) && (raw.preorderOpenings as PreorderOpening[]).length > 0
    ? (raw.preorderOpenings as PreorderOpening[])
    : DEFAULT_PREORDER_OPENINGS
  const ordersOpen = raw.ordersOpen === false ? false : true
  const firstAvailableDate = typeof raw.firstAvailableDate === 'string' && raw.firstAvailableDate.trim() ? raw.firstAvailableDate.trim() : undefined
  const firstAvailableDateRetrait = typeof raw.firstAvailableDateRetrait === 'string' && raw.firstAvailableDateRetrait.trim() ? raw.firstAvailableDateRetrait.trim() : undefined
  const firstAvailableDateLivraison = typeof raw.firstAvailableDateLivraison === 'string' && raw.firstAvailableDateLivraison.trim() ? raw.firstAvailableDateLivraison.trim() : undefined
  const lastAvailableDate = typeof raw.lastAvailableDate === 'string' && raw.lastAvailableDate.trim() ? raw.lastAvailableDate.trim() : undefined
  const availableWeekdays = Array.isArray(raw.availableWeekdays) && (raw.availableWeekdays as number[]).length > 0
    ? (raw.availableWeekdays as number[]).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : undefined
  const retraitTimeSlots = Array.isArray(raw.retraitTimeSlots) && (raw.retraitTimeSlots as string[]).length > 0
    ? (raw.retraitTimeSlots as string[]).filter((t): t is string => typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t))
    : undefined
  const livraisonTimeSlots = Array.isArray(raw.livraisonTimeSlots) && (raw.livraisonTimeSlots as string[]).length > 0
    ? (raw.livraisonTimeSlots as string[]).filter((t): t is string => typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t))
    : undefined
  const pickupDates = Array.isArray(raw.pickupDates) && (raw.pickupDates as string[]).length > 0
    ? (raw.pickupDates as string[]).filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    : undefined
  const preorderOpenDate = typeof raw.preorderOpenDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.preorderOpenDate) ? raw.preorderOpenDate : undefined
  const preorderOpenTime = typeof raw.preorderOpenTime === 'string' && /^\d{1,2}:\d{2}$/.test(raw.preorderOpenTime) ? raw.preorderOpenTime : undefined
  return {
    preorderDays,
    preorderOpenings,
    preorderMessage: typeof raw.preorderMessage === 'string' ? raw.preorderMessage : '',
    ordersOpen,
    ...(firstAvailableDateRetrait && { firstAvailableDateRetrait }),
    ...(firstAvailableDateLivraison && { firstAvailableDateLivraison }),
    ...(firstAvailableDate && { firstAvailableDate }),
    ...(lastAvailableDate && { lastAvailableDate }),
    ...(availableWeekdays && availableWeekdays.length > 0 && { availableWeekdays }),
    ...(retraitTimeSlots && retraitTimeSlots.length > 0 && { retraitTimeSlots }),
    ...(livraisonTimeSlots && livraisonTimeSlots.length > 0 && { livraisonTimeSlots }),
    ...(pickupDates && pickupDates.length > 0 && { pickupDates }),
    ...(preorderOpenDate && { preorderOpenDate }),
    ...(preorderOpenTime && { preorderOpenTime }),
    globalMessage: typeof raw.globalMessage === 'string' ? raw.globalMessage : undefined,
    globalMessageEnabled: raw.globalMessageEnabled === true ? true : undefined,
  }
}

export function listenSettings(callback: (settings: Settings) => void) {
  return onValue(settingsRef, (snapshot) => {
    callback(mergeSettings(snapshot.val()))
  })
}

export async function updateSettings(settings: Partial<Settings>) {
  const current = await get(settingsRef)
  const merged = { ...(current.val() || {}), ...settings } as Record<string, unknown>
  await set(settingsRef, stripUndefined(merged))
}

// --- Commandes ---
export type OrderItem = {
  productId: string
  name: string
  quantity: number
  price: number
  sizeLabel?: string
}

export type OrderStatus = 'en_attente' | 'en_preparation' | 'pret' | 'livree' | 'validee' | 'refusee'
export type OrderSource = 'site' | 'whatsapp' | 'instagram' | 'snap'
export type DeliveryMode = 'livraison' | 'retrait'

export type OrderCustomer = {
  firstName: string
  lastName: string
  phone: string
  /** Email pour envoi du récap et des notifications (optionnel) */
  email?: string
  address?: string
  addressCoordinates?: { lat: number; lng: number } | null
  /** Instructions pour le livreur (code, étage, etc.) */
  deliveryInstructions?: string
}

export type Order = {
  id?: string
  /** Numéro de commande affiché au client (ex. 1001, 1002) */
  orderNumber?: number
  items: OrderItem[]
  customer: OrderCustomer
  total: number
  status: OrderStatus
  createdAt: number
  source?: OrderSource
  deliveryMode?: DeliveryMode
  requestedDate?: string
  requestedTime?: string
  adminNote?: string
  /** Note saisie par le client (ex. créneau, consignes) */
  clientNote?: string
  /** Frais de livraison en € */
  deliveryFee?: number
  /** Distance en km depuis Annecy (livraison) */
  distanceKm?: number
  /** Si true, les trompes l'oeil de cette commande ne sont pas déduits du stock (ni restaurés si refus) */
  excludeTrompeLoeilStock?: boolean
  /** Code promo appliqué */
  promoCode?: string
  /** Montant de la réduction en € */
  discountAmount?: number
  /** Don au projet en € */
  donationAmount?: number
  /** UID du client connecté (pour badges / parrainage) */
  userId?: string
  /** Code parrain utilisé (filleul) */
  referralCode?: string
  /** Montant de la réduction parrain en € */
  referralDiscountAmount?: number
  /** UID du parrain (pour le créditer) */
  referrerUserId?: string
}

/** Stats de commandes pour les badges (stocké dans le profil) */
export type UserOrderStats = {
  orderCount: number
  hasOrderedTrompeLoeil: boolean
  hasDonated: boolean
  hasUsedPromo: boolean
}

/** Vérifie si un productId correspond à un trompe l'oeil */
export function isTrompeLoeilProductId(productId: string): boolean {
  return productId.startsWith('trompe-loeil-')
}

/**
 * Retourne les paires productId/quantity à décrémenter pour un item du panier.
 * Pour un bundle, retourne 1 entrée par produit composant (× quantity).
 * Pour un produit simple, retourne une seule entrée.
 */
export function getStockDecrementItems(
  productId: string,
  quantity: number,
  products: { id: string; bundleProductIds?: string[] }[]
): { productId: string; quantity: number }[] {
  const product = products.find((p) => p.id === productId)
  if (product?.bundleProductIds && product.bundleProductIds.length > 0) {
    return product.bundleProductIds.map((id) => ({ productId: id, quantity }))
  }
  return [{ productId, quantity }]
}

// --- Codes promo ---
export type PromoCodeType = 'fixed' | 'percent'
export type PromoCodeRecord = {
  type: PromoCodeType
  value: number
  minOrder?: number
  maxUses?: number
  usedCount: number
  expiresAt?: number
  createdAt: number
}

const promoCodesRef = ref(db, 'promoCodes')

export function listenPromoCodes(callback: (codes: Record<string, PromoCodeRecord>) => void) {
  return onValue(promoCodesRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
}

function promoKey(code: string): string {
  return String(code).trim().toUpperCase().replace(/\s+/g, '')
}

export async function getPromoCode(code: string): Promise<PromoCodeRecord | null> {
  const key = promoKey(code)
  if (!key) return null
  const snapshot = await get(ref(db, `promoCodes/${key}`))
  return snapshot.val() || null
}

/** Incrémente le nombre d'utilisations d'un code (après création de commande). */
export async function incrementPromoCodeUsage(code: string): Promise<void> {
  const key = promoKey(code)
  if (!key) return
  const codeRef = ref(db, `promoCodes/${key}/usedCount`)
  await runTransaction(codeRef, (current) => (current ?? 0) + 1)
}

export async function createPromoCode(data: {
  code: string
  type: PromoCodeType
  value: number
  minOrder?: number
  maxUses?: number
  expiresAt?: number
}): Promise<void> {
  const key = promoKey(data.code)
  if (!key) throw new Error('Code promo invalide')
  const record: PromoCodeRecord = {
    type: data.type,
    value: data.value,
    usedCount: 0,
    createdAt: Date.now(),
    ...(data.minOrder != null && data.minOrder > 0 && { minOrder: data.minOrder }),
    ...(data.maxUses != null && data.maxUses > 0 && { maxUses: data.maxUses }),
    ...(data.expiresAt != null && data.expiresAt > 0 && { expiresAt: data.expiresAt }),
  }
  await set(ref(db, `promoCodes/${key}`), record)
}

export async function deletePromoCode(code: string): Promise<void> {
  const key = promoKey(code)
  if (!key) return
  await remove(ref(db, `promoCodes/${key}`))
}

export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<{ valid: true; discount: number } | { valid: false; error: string }> {
  const record = await getPromoCode(code)
  if (!record) return { valid: false, error: 'Code invalide ou expiré' }
  if (record.minOrder != null && subtotal < record.minOrder) {
    return { valid: false, error: `Commande minimum ${record.minOrder} €` }
  }
  if (record.maxUses != null && (record.usedCount ?? 0) >= record.maxUses) {
    return { valid: false, error: 'Code déjà utilisé au maximum' }
  }
  if (record.expiresAt != null && Date.now() > record.expiresAt) {
    return { valid: false, error: 'Code expiré' }
  }
  let discount: number
  if (record.type === 'fixed') {
    discount = Math.min(record.value, subtotal)
  } else {
    discount = Math.round((subtotal * record.value) / 100 * 100) / 100
  }
  if (discount <= 0) return { valid: false, error: 'Code invalide' }
  return { valid: true, discount }
}

// --- Sondages (votes prochain trompe-l'œil) ---
export type Poll = {
  question: string
  options: Record<string, number> // optionId -> count
  optionLabels?: Record<string, string> // optionId -> label
  endAt?: number
  createdAt: number
}

const pollsRef = ref(db, 'polls')
export function listenPolls(callback: (polls: Record<string, Poll>) => void) {
  return onValue(pollsRef, (snapshot) => callback(snapshot.val() || {}))
}

export async function createPoll(question: string, optionLabels: string[]): Promise<string> {
  const options: Record<string, number> = {}
  const optionLabelsMap: Record<string, string> = {}
  optionLabels.forEach((label, i) => {
    const id = `opt${i}`
    options[id] = 0
    optionLabelsMap[id] = label
  })
  const newRef = push(pollsRef)
  await set(newRef, {
    question,
    options,
    optionLabels: optionLabelsMap,
    createdAt: Date.now(),
  })
  return newRef.key!
}

export async function votePoll(pollId: string, optionId: string, voterId: string): Promise<boolean> {
  const voteRef = ref(db, `pollVotes/${pollId}/${voterId}`)
  const optRef = ref(db, `polls/${pollId}/options/${optionId}`)
  const snapshot = await get(voteRef)
  if (snapshot.exists()) return false // déjà voté
  await set(voteRef, optionId)
  await runTransaction(optRef, (c) => (c ?? 0) + 1)
  return true
}

export async function getPollVote(pollId: string, voterId: string): Promise<string | null> {
  const snapshot = await get(ref(db, `pollVotes/${pollId}/${voterId}`))
  return snapshot.val()
}

const ordersRef = ref(db, 'orders')
const orderCounterRef = ref(db, 'counters/orderNumber')

/** Incrémente le compteur de commandes et retourne le prochain numéro (1, 2, 3...) */
async function getNextOrderNumber(): Promise<number> {
  const result = await runTransaction(orderCounterRef, (current) => {
    const next = (current ?? 0) + 1
    return next
  })
  if (!result.committed || result.snapshot.val() == null) throw new Error('Impossible d\'attribuer un numéro de commande')
  return result.snapshot.val() as number
}

export function listenOrders(callback: (orders: Record<string, Order>) => void) {
  return onValue(ordersRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
}

export async function createOrder(order: Omit<Order, 'id' | 'orderNumber'>): Promise<{ orderId: string; orderNumber: number } | null> {
  const orderNumber = await getNextOrderNumber()
  const newRef = push(ordersRef)
  await set(newRef, { ...order, orderNumber })
  return newRef.key ? { orderId: newRef.key, orderNumber } : null
}

/** Lecture d'une commande par ID (publique pour page statut) */
export async function getOrder(orderId: string): Promise<Order | null> {
  const snapshot = await get(ref(db, `orders/${orderId}`))
  const val = snapshot.val()
  if (!val) return null
  return { ...val, id: orderId } as Order
}

/** Écoute en temps réel une commande (page statut client : voit "En préparation" dès que l'admin valide) */
export function listenOrder(orderId: string, callback: (order: Order | null) => void): () => void {
  const orderRef = ref(db, `orders/${orderId}`)
  return onValue(orderRef, (snapshot) => {
    const val = snapshot.val()
    if (!val) {
      callback(null)
      return
    }
    callback({ ...val, id: orderId } as Order)
  })
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await update(ref(db, `orders/${orderId}`), { status })
}

export type OrderUpdate = Partial<Pick<Order, 'customer' | 'items' | 'total' | 'status' | 'deliveryMode' | 'requestedDate' | 'requestedTime' | 'adminNote' | 'clientNote' | 'deliveryFee' | 'distanceKm' | 'source' | 'excludeTrompeLoeilStock' | 'promoCode' | 'discountAmount' | 'donationAmount'>>

export async function updateOrder(orderId: string, updates: OrderUpdate) {
  const clean = stripUndefined(updates as Record<string, unknown>)
  if (Object.keys(clean).length === 0) return
  if (clean.items) {
    (clean as Record<string, unknown>).items = (clean.items as OrderItem[]).map((item) =>
      stripUndefined({ ...item } as Record<string, unknown>)
    )
  }
  await update(ref(db, `orders/${orderId}`), clean)
}

export async function deleteOrder(orderId: string) {
  await remove(ref(db, `orders/${orderId}`))
}

/**
 * Cherche une commande récente (dans les dernières `withinHours` heures) pour un numéro de téléphone donné.
 * Retourne la commande trouvée ou null.
 */
export async function getRecentOrderByPhone(
  phone: string,
  withinHours = 12
): Promise<(Order & { id: string }) | null> {
  const snapshot = await get(ordersRef)
  if (!snapshot.exists()) return null
  const since = Date.now() - withinHours * 60 * 60 * 1000
  const orders = snapshot.val() as Record<string, Order>
  for (const [id, order] of Object.entries(orders)) {
    if (
      order.customer?.phone === phone &&
      order.createdAt >= since &&
      order.status !== 'refusee'
    ) {
      return { ...order, id }
    }
  }
  return null
}

// --- Avis clients (reviews) ---
export type Review = {
  /** Optionnel : avis lié à une commande (sinon avis laissé librement) */
  orderId?: string
  rating: number // 1-5 étoiles
  comment?: string
  authorName?: string
  /** Notes par produit (trompe l'œil) : productId -> 1-5 */
  productRatings?: Record<string, number>
  createdAt: number
}

const reviewsRef = ref(db, 'reviews')

export function listenReviews(callback: (reviews: Record<string, Review>) => void) {
  return onValue(reviewsRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
}

/** Soumet un avis. Si uid est fourni (client connecté), ajoute 10 points fidélité (review_bonus). */
export async function submitReview(review: Omit<Review, 'createdAt'>, uid?: string | null): Promise<string | null> {
  const newRef = push(reviewsRef)
  const data: Review = {
    ...review,
    createdAt: Date.now(),
  }
  await set(newRef, stripUndefined(data as unknown as Record<string, unknown>))
  if (uid) {
    try {
      await addUserPoints(uid, {
        reason: 'review_bonus',
        points: 10,
        at: Date.now(),
      })
    } catch (err) {
      console.error('Error adding review bonus points:', err)
    }
  }
  return newRef.key
}

/** Vérifie si un avis a déjà été soumis pour cette commande */
export async function getReviewByOrderId(orderId: string): Promise<Review | null> {
  const snapshot = await get(reviewsRef)
  const val = snapshot.val() as Record<string, Review> | null
  if (!val) return null
  const found = Object.entries(val).find(([, r]) => r.orderId === orderId)
  return found ? { ...found[1] } : null
}

/** Retire les propriétés undefined (Firebase les refuse) */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

// Créer une commande hors-site (admin)
export async function createOffSiteOrder(order: Omit<Order, 'id' | 'createdAt' | 'orderNumber'>): Promise<string | null> {
  const orderNumber = await getNextOrderNumber()
  const fullOrder = stripUndefined({
    ...order,
    orderNumber,
    items: order.items.map((item) => stripUndefined({ ...item } as Record<string, unknown>)),
    createdAt: Date.now(),
  } as Omit<Order, 'id'>)
  const newRef = push(ordersRef)
  await set(newRef, fullOrder)
  return newRef.key
}

// Décrémenter le stock pour plusieurs items (commande hors-site)
export async function decrementStockBatch(items: { productId: string; quantity: number }[]): Promise<void> {
  const currentStock = await getStock()
  const updates: Record<string, number> = {}
  for (const item of items) {
    if (item.productId in currentStock) {
      updates[`stock/${item.productId}`] = Math.max(0, (currentStock[item.productId] ?? 0) - item.quantity)
    }
  }
  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates)
  }
}

// Initialiser le suivi de stock pour un produit
export async function initializeStock(productId: string, quantity: number): Promise<void> {
  await set(ref(db, `stock/${productId}`), quantity)
}

// Supprimer le suivi de stock (redevient illimité)
export async function removeStockTracking(productId: string): Promise<void> {
  await remove(ref(db, `stock/${productId}`))
}

// --- Auth Admin ---
export async function adminLogin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function adminLogout() {
  return signOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// --- Auth Clients ---
export async function clientRegister(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function clientLogin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function clientLogout() {
  return signOut(auth)
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email)
}

// --- Types Profils Clients & Fidélité ---
export type LoyaltyHistoryEntry = {
  reason: 'creation_compte' | 'instagram_follow' | 'tiktok_follow' | 'order_points' | 'review_bonus' | 'ramadan_bonus' | 'anniversary_bonus' | 'birthday_bonus' | 'admin_ajout' | 'admin_retrait'
  points: number
  at: number
  amount?: number // Pour order_points (montant € de la commande)
  orderId?: string // Pour order_points
  adminNote?: string // Pour admin_ajout / admin_retrait
}

export type UserLoyalty = {
  points: number // Solde actuel
  lifetimePoints: number // Points cumulés à vie (pour les tiers)
  tier: 'Douceur' | 'Gourmand' | 'Prestige'
  history: LoyaltyHistoryEntry[]
  instagramClaimedAt?: number
  tiktokClaimedAt?: number
}

export type RewardType = 'surprise_maison_mayssa' | 'remise_5e' | 'mini_box' | 'box_fidelite'

export type UserReward = {
  type: RewardType
  pointsSpent: number
  claimedAt: number
  usedInOrderId?: string | null
}

export type UserProfile = {
  email: string
  firstName: string
  lastName: string
  phone?: string
  birthday?: string // Format: YYYY-MM-DD
  address?: string
  addressCoordinates?: { lat: number; lng: number } | null
  createdAt: number
  loyalty: UserLoyalty
  birthdayGiftClaimed?: Record<string, boolean> // année -> cadeau offert (ex: "2026": true)
  /** Pour badges (première commande, 5 commandes, trompe-l'œil, don, promo) */
  orderStats?: UserOrderStats
  /** Code parrain unique (ex. MAYSSA-ABC1) ; 1 par compte */
  referralCode?: string
  /** Code parrain utilisé à la 1ère commande (filleul) */
  referredByCode?: string | null
  /** Dernière commande (timestamp) pour rappel douceur */
  lastOrderAt?: number
  /** Occasions qui m'intéressent (ramadan, noel, anniversaire...) */
  occasionsInteret?: string[]
  /** Allergies / préférences alimentaires (sans gluten, sans noix, etc.) */
  dietaryPreferences?: string
  /** Recevoir un rappel à l'ouverture des commandes (mercredi & samedi) */
  notifyOrderOpening?: boolean
}

// --- Profils Clients (Database) ---
export function getUserRef(uid: string) {
  return ref(db, `users/${uid}`)
}

export function getUserRewardsRef(uid: string) {
  return ref(db, `users/${uid}/rewards`)
}

// Créer un profil client (inscription)
export async function createUserProfile(uid: string, profile: Omit<UserProfile, 'createdAt' | 'loyalty'>) {
  const now = Date.now()
  const userProfile: UserProfile = {
    ...profile,
    createdAt: now,
    loyalty: {
      points: 15, // Bonus création de compte
      lifetimePoints: 15,
      tier: 'Douceur',
      history: [
        {
          reason: 'creation_compte',
          points: 15,
          at: now,
        },
      ],
    },
  }
  await set(getUserRef(uid), userProfile)
  return userProfile
}

// Lire un profil client
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await get(getUserRef(uid))
  return snapshot.exists() ? snapshot.val() : null
}

// Écouter un profil client en temps réel
export function listenUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  return onValue(getUserRef(uid), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null)
  })
}

// Mettre à jour le profil client (infos de base)
export async function updateUserProfile(uid: string, updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone' | 'birthday' | 'address' | 'addressCoordinates' | 'occasionsInteret' | 'dietaryPreferences' | 'notifyOrderOpening'>>) {
  await update(getUserRef(uid), updates)
}

/** Met à jour les stats de commandes (badges) et lastOrderAt après une commande. */
export async function updateUserOrderStats(
  uid: string,
  opts: { hasTrompeLoeil: boolean; hasDonation: boolean; hasPromo: boolean }
) {
  const profile = await getUserProfile(uid)
  if (!profile) return
  const prev = profile.orderStats ?? {
    orderCount: 0,
    hasOrderedTrompeLoeil: false,
    hasDonated: false,
    hasUsedPromo: false,
  }
  const orderStats: UserOrderStats = {
    orderCount: prev.orderCount + 1,
    hasOrderedTrompeLoeil: prev.hasOrderedTrompeLoeil || opts.hasTrompeLoeil,
    hasDonated: prev.hasDonated || opts.hasDonation,
    hasUsedPromo: prev.hasUsedPromo || opts.hasPromo,
  }
  await update(getUserRef(uid), {
    orderStats,
    lastOrderAt: Date.now(),
  })
}

/** Génère un code parrain unique (MAYSSA-XXXX) et le sauvegarde si pas déjà présent. */
export async function getOrCreateReferralCode(uid: string): Promise<string> {
  const profile = await getUserProfile(uid)
  if (profile?.referralCode) return profile.referralCode
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'MAYSSA-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  const key = code.toUpperCase().replace(/\s/g, '')
  await update(getUserRef(uid), { referralCode: code })
  await set(ref(db, `referralCodes/${key}`), uid)
  return code
}

/** Retourne l'UID du parrain si le code est valide, sinon null. */
export async function getReferrerByCode(code: string): Promise<string | null> {
  const key = String(code).trim().toUpperCase().replace(/\s+/g, '')
  if (!key) return null
  const snapshot = await get(ref(db, `referralCodes/${key}`))
  return snapshot.val() ?? null
}

/** Marque l'utilisateur comme filleul et crédite le parrain (à appeler après création de commande). */
export async function applyReferralAfterOrder(orderedUserId: string, referralCode: string, referrerUid: string): Promise<void> {
  const { REFERRAL_POINTS_TO_REFERRER } = await import('../constants')
  await update(getUserRef(orderedUserId), { referredByCode: referralCode.trim().toUpperCase() })
  await addUserPoints(referrerUid, {
    reason: 'admin_ajout',
    points: REFERRAL_POINTS_TO_REFERRER,
    at: Date.now(),
    adminNote: 'Parrainage',
  })
}

// Supprimer un client (admin) — supprime le profil Realtime Database
export async function deleteUserProfile(uid: string): Promise<void> {
  await remove(getUserRef(uid))
}

// Ajouter des points (avec entrée dans l'historique)
export async function addUserPoints(uid: string, entry: LoyaltyHistoryEntry) {
  const profile = await getUserProfile(uid)
  if (!profile) return

  const newPoints = profile.loyalty.points + entry.points
  const newLifetimePoints = profile.loyalty.lifetimePoints + entry.points
  
  // Recalculer le tier en fonction des points à vie
  let newTier: UserProfile['loyalty']['tier'] = 'Douceur'
  if (newLifetimePoints >= 400) {
    newTier = 'Prestige'
  } else if (newLifetimePoints >= 150) {
    newTier = 'Gourmand'
  }

  const newHistory = Array.isArray(profile.loyalty.history) 
    ? [...profile.loyalty.history, entry]
    : [...Object.values(profile.loyalty.history || {}), entry]

  const updates = {
    'loyalty/points': newPoints,
    'loyalty/lifetimePoints': newLifetimePoints,
    'loyalty/tier': newTier,
    'loyalty/history': newHistory,
  }

  await update(getUserRef(uid), updates)
}

// Réclamer Instagram/TikTok points (une seule fois)
export async function claimSocialPoints(uid: string, platform: 'instagram' | 'tiktok') {
  const profile = await getUserProfile(uid)
  if (!profile) return

  const claimedAtField = platform === 'instagram' ? 'instagramClaimedAt' : 'tiktokClaimedAt'
  if (profile.loyalty[claimedAtField]) {
    throw new Error(`Points ${platform} déjà réclamés`)
  }

  const now = Date.now()
  const entry: LoyaltyHistoryEntry = {
    reason: `${platform}_follow` as any,
    points: 15,
    at: now,
  }

  await addUserPoints(uid, entry)
  await update(getUserRef(uid), {
    [`loyalty/${claimedAtField}`]: now,
  })
}

// Ajouter des points manuellement (admin)
export async function adminAddPoints(uid: string, points: number, note?: string): Promise<void> {
  if (points <= 0) return
  const entry: LoyaltyHistoryEntry = {
    reason: 'admin_ajout',
    points,
    at: Date.now(),
    ...(note?.trim() && { adminNote: note.trim() }),
  }
  await addUserPoints(uid, entry)
}

// Retirer des points manuellement (admin) — ne touche pas aux lifetimePoints
export async function adminRemovePoints(uid: string, points: number, note?: string): Promise<void> {
  if (points <= 0) return
  const profile = await getUserProfile(uid)
  if (!profile) return

  const toRemove = Math.min(points, profile.loyalty.points)
  if (toRemove <= 0) return

  const newPoints = profile.loyalty.points - toRemove
  const entry: LoyaltyHistoryEntry = {
    reason: 'admin_retrait',
    points: -toRemove,
    at: Date.now(),
    ...(note?.trim() && { adminNote: note.trim() }),
  }
  const newHistory = Array.isArray(profile.loyalty.history)
    ? [...profile.loyalty.history, entry]
    : [...Object.values(profile.loyalty.history || {}), entry]

  await update(getUserRef(uid), {
    'loyalty/points': Math.max(0, newPoints),
    'loyalty/history': newHistory,
  })
}

// Déduire des points (réclamation de récompense)
export async function spendUserPoints(uid: string, pointsToSpend: number): Promise<boolean> {
  const profile = await getUserProfile(uid)
  if (!profile || profile.loyalty.points < pointsToSpend) {
    return false // Pas assez de points
  }

  await update(getUserRef(uid), {
    'loyalty/points': profile.loyalty.points - pointsToSpend,
  })

  return true
}

// Créer une récompense réclamée
export async function claimReward(uid: string, rewardType: RewardType, pointsCost: number): Promise<string | null> {
  const canSpend = await spendUserPoints(uid, pointsCost)
  if (!canSpend) return null

  const reward: UserReward = {
    type: rewardType,
    pointsSpent: pointsCost,
    claimedAt: Date.now(),
    usedInOrderId: null,
  }

  const rewardRef = push(getUserRewardsRef(uid))
  await set(rewardRef, reward)
  return rewardRef.key
}

// Lister les récompenses réclamées d'un utilisateur
export async function getUserRewards(uid: string): Promise<Record<string, UserReward>> {
  const snapshot = await get(getUserRewardsRef(uid))
  return snapshot.exists() ? snapshot.val() : {}
}

// Écouter les récompenses en temps réel
export function listenUserRewards(uid: string, callback: (rewards: Record<string, UserReward>) => void) {
  return onValue(getUserRewardsRef(uid), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {})
  })
}

// Marquer une récompense comme utilisée dans une commande
export async function markRewardUsed(uid: string, rewardId: string, orderId: string) {
  await update(ref(db, `users/${uid}/rewards/${rewardId}`), {
    usedInOrderId: orderId,
  })
}

// --- Constantes Récompenses ---
export const REWARD_COSTS = {
  surprise_maison_mayssa: 60,
  remise_5e: 100,
  mini_box: 150,
  box_fidelite: 250,
} as const

export const REWARD_LABELS = {
  surprise_maison_mayssa: 'Surprise Maison Mayssa',
  remise_5e: '5€ de réduction',
  mini_box: 'Mini box fidélité',
  box_fidelite: 'Box fidélité premium',
} as const

// --- Anniversaire ---

// Vérifier si on est dans la semaine d'anniversaire (3 jours avant à 4 jours après)
export function isBirthdayWeek(birthday: string): boolean {
  const now = new Date()
  const parts = birthday.split('-').map(Number)
  const month = parts[1]
  const day = parts[2]
  if (!month || !day) return false
  const birthdayThisYear = new Date(now.getFullYear(), month - 1, day)
  const diffMs = now.getTime() - birthdayThisYear.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= -3 && diffDays <= 4
}

// Vérifier si c'est exactement l'anniversaire aujourd'hui
export function isBirthdayToday(birthday: string): boolean {
  const now = new Date()
  const parts = birthday.split('-').map(Number)
  return now.getMonth() + 1 === parts[1] && now.getDate() === parts[2]
}

// Marquer le cadeau d'anniversaire comme offert pour cette année
export async function claimBirthdayGift(uid: string) {
  const year = new Date().getFullYear().toString()
  await update(getUserRef(uid), {
    [`birthdayGiftClaimed/${year}`]: true,
  })
}

// Écouter tous les utilisateurs (admin - gestion anniversaires)
export function listenAllUsers(callback: (users: Record<string, UserProfile>) => void) {
  const usersRef = ref(db, 'users')
  return onValue(usersRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {})
  })
}

// --- Carte de la communauté (villes / CP agrégés, anonymes) ---
export type CommunityMapEntry = { count: number; label: string; lat?: number; lng?: number }
export type CommunityMapData = Record<string, CommunityMapEntry>

const communityMapRef = ref(db, 'communityMap')

export function listenCommunityMap(callback: (data: CommunityMapData) => void) {
  return onValue(communityMapRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {})
  })
}

export async function setCommunityMap(data: CommunityMapData) {
  await set(communityMapRef, data)
}

// --- Préviens-moi quand dispo (notify when available) ---
export type NotifyWhenAvailableEntry = {
  productId: string
  productName: string
  email: string
  createdAt: number
}

const notifyWhenAvailableRef = ref(db, 'notifyWhenAvailable')

export async function addNotifyWhenAvailable(productId: string, productName: string, email: string): Promise<void> {
  const entry: NotifyWhenAvailableEntry = {
    productId,
    productName,
    email: email.trim().toLowerCase(),
    createdAt: Date.now(),
  }
  await push(notifyWhenAvailableRef, entry)
}

export function listenNotifyWhenAvailable(callback: (entries: Record<string, NotifyWhenAvailableEntry>) => void) {
  return onValue(notifyWhenAvailableRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {})
  })
}

// --- Sessions actives (clients en train de commander) ---
import type { ActiveSession } from '../types'

export async function upsertActiveSession(sessionId: string, data: Omit<ActiveSession, 'sessionId'>): Promise<void> {
  const sessionRef = ref(db, `activeSessions/${sessionId}`)
  await set(sessionRef, { sessionId, ...data })
  // Nettoie automatiquement si la connexion est perdue (fermeture onglet/réseau)
  await onDisconnect(sessionRef).remove()
}

export async function removeActiveSession(sessionId: string): Promise<void> {
  await remove(ref(db, `activeSessions/${sessionId}`))
}

export function listenActiveSessions(callback: (sessions: Record<string, ActiveSession>) => void) {
  return onValue(ref(db, 'activeSessions'), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {})
  })
}

export { db, auth, app }

// --- Firebase Storage : upload d'images produits ---
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
const storage = getStorage(app)

export async function uploadProductImage(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `products/${Date.now()}-${safeName}`
  const r = storageRef(storage, path)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}
