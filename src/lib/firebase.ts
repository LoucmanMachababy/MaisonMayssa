import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, get, push, update, remove } from 'firebase/database'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth'
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

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

// --- Références DB ---
export const stockRef = ref(db, 'stock')
export const settingsRef = ref(db, 'settings')

// --- Stock ---
export type StockMap = Record<string, number>

export function listenStock(callback: (stock: StockMap) => void) {
  return onValue(stockRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
}

export async function updateStock(productId: string, quantity: number) {
  await set(ref(db, `stock/${productId}`), quantity)
}

export async function getStock(): Promise<StockMap> {
  const snapshot = await get(stockRef)
  return snapshot.val() || {}
}

// --- Settings ---
export type Settings = {
  preorderDays: number[]
  preorderMessage: string
}

export function listenSettings(callback: (settings: Settings) => void) {
  return onValue(settingsRef, (snapshot) => {
    callback(snapshot.val() || { preorderDays: [3, 6], preorderMessage: '' })
  })
}

export async function updateSettings(settings: Partial<Settings>) {
  const current = await get(settingsRef)
  await set(settingsRef, { ...(current.val() || {}), ...settings })
}

// --- Commandes (précommandes trompe l'oeil) ---
export type OrderItem = {
  productId: string
  name: string
  quantity: number
  price: number
}

export type OrderStatus = 'en_attente' | 'validee' | 'refusee'

export type Order = {
  id?: string
  items: OrderItem[]
  customer: { firstName: string; lastName: string; phone: string }
  total: number
  status: OrderStatus
  createdAt: number
}

const ordersRef = ref(db, 'orders')

export function listenOrders(callback: (orders: Record<string, Order>) => void) {
  return onValue(ordersRef, (snapshot) => {
    callback(snapshot.val() || {})
  })
}

export async function createOrder(order: Omit<Order, 'id'>) {
  const newRef = push(ordersRef)
  await set(newRef, order)
  return newRef.key
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await update(ref(db, `orders/${orderId}`), { status })
}

export async function deleteOrder(orderId: string) {
  await remove(ref(db, `orders/${orderId}`))
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
  reason: 'creation_compte' | 'instagram_follow' | 'tiktok_follow' | 'order_points' | 'review_bonus' | 'ramadan_bonus' | 'anniversary_bonus' | 'birthday_bonus'
  points: number
  at: number
  amount?: number // Pour order_points (montant € de la commande)
  orderId?: string // Pour order_points
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
  createdAt: number
  loyalty: UserLoyalty
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
export async function updateUserProfile(uid: string, updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone' | 'birthday'>>) {
  await update(getUserRef(uid), updates)
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

export { db, auth }
