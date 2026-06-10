import type { User } from 'firebase/auth'

/** Compte administrateur principal (fallback si custom claim absent). */
export const ADMIN_EMAIL = 'roumayssaghazi213@gmail.com'

export async function checkUserIsAdmin(user: User | null | undefined): Promise<boolean> {
  if (!user?.email) return false

  try {
    const tokenResult = await user.getIdTokenResult()
    if (tokenResult.claims.admin === true) return true
  } catch {
    // Token indisponible : fallback email
  }

  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}
