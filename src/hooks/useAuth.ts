import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { onAuthChange, getUserProfile, type UserProfile } from '../lib/firebase'

export type AuthState = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
}

let globalAuthState: AuthState = {
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
}

const listeners = new Set<(state: AuthState) => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener(globalAuthState))
}

// Initialisation du listener Firebase Auth (une seule fois)
let authInitialized = false

function initializeAuth() {
  if (authInitialized) return
  authInitialized = true

  onAuthChange(async (user) => {
    globalAuthState.user = user
    globalAuthState.loading = true
    notifyListeners()

    if (user) {
      // Charger le profil client
      try {
        const profile = await getUserProfile(user.uid)
        globalAuthState.profile = profile
        globalAuthState.isAuthenticated = !!profile
      } catch (error) {
        console.error('Error loading user profile:', error)
        globalAuthState.profile = null
        globalAuthState.isAuthenticated = false
      }
    } else {
      globalAuthState.profile = null
      globalAuthState.isAuthenticated = false
    }

    globalAuthState.loading = false
    notifyListeners()
  })
}

/**
 * Hook pour gérer l'authentification client
 * Partage l'état globalement pour éviter les re-chargements
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(globalAuthState)

  useEffect(() => {
    initializeAuth()
    listeners.add(setState)
    
    // Mettre à jour l'état local avec l'état global actuel
    setState(globalAuthState)

    return () => {
      listeners.delete(setState)
    }
  }, [])

  return state
}

/**
 * Forcer le rechargement du profil utilisateur
 * Utile après une mise à jour de profil ou de points
 */
export async function refreshUserProfile() {
  if (!globalAuthState.user) return

  globalAuthState.loading = true
  notifyListeners()

  try {
    const profile = await getUserProfile(globalAuthState.user.uid)
    globalAuthState.profile = profile
    globalAuthState.isAuthenticated = !!profile
  } catch (error) {
    console.error('Error refreshing user profile:', error)
    globalAuthState.profile = null
    globalAuthState.isAuthenticated = false
  }

  globalAuthState.loading = false
  notifyListeners()
}