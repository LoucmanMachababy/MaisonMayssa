import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Lock, Phone, Eye, EyeOff, Gift } from 'lucide-react'
import { clientRegister, clientLogin, createUserProfile, resetPassword } from '../../lib/firebase'
import { refreshUserProfile } from '../../hooks/useAuth'

interface AuthModalsProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
}

export function AuthModals({ isOpen, onClose, mode, onModeChange }: AuthModalsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 top-auto sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[51] bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-mayssa-brown/10 text-mayssa-brown hover:bg-mayssa-brown/20 transition-colors"
            >
              <X size={16} />
            </button>

            {mode === 'register' ? (
              <RegisterForm onSuccess={onClose} onSwitchToLogin={() => onModeChange('login')} />
            ) : (
              <LoginForm onSuccess={onClose} onSwitchToRegister={() => onModeChange('register')} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// --- Formulaire d'inscription ---
interface RegisterFormProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    // Validation simple
    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'Email requis'
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Au moins 6 caractères'
    if (!formData.firstName) newErrors.firstName = 'Prénom requis'
    if (!formData.lastName) newErrors.lastName = 'Nom requis'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Créer le compte Firebase Auth
      const userCredential = await clientRegister(formData.email, formData.password)
      
      // Créer le profil client avec +15 points
      await createUserProfile(userCredential.user.uid, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      })

      // Rafraîchir le profil dans le hook useAuth
      await refreshUserProfile()

      onSuccess()
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Cet email est déjà utilisé' })
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Mot de passe trop faible' })
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'Email invalide' })
      } else {
        setErrors({ general: 'Erreur lors de l\'inscription' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-mayssa-caramel/20 text-mayssa-caramel mb-4">
          <Gift size={24} />
        </div>
        <h2 className="text-2xl font-display font-bold text-mayssa-brown">Créer mon compte</h2>
        <p className="text-sm text-mayssa-brown/60 mt-2">
          Gagne <span className="font-bold text-mayssa-caramel">15 points</span> de bienvenue !
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Prénom */}
          <div>
            <div className={`flex items-center gap-2 rounded-xl bg-mayssa-soft/50 px-3 py-3 ring-1 ${errors.firstName ? 'ring-red-300' : 'ring-mayssa-brown/10'}`}>
              <User size={16} className="text-mayssa-caramel" />
              <input
                type="text"
                placeholder="Prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-transparent text-sm font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                required
              />
            </div>
            {errors.firstName && <p className="text-xs text-red-400 mt-1 pl-2">{errors.firstName}</p>}
          </div>

          {/* Nom */}
          <div>
            <div className={`flex items-center gap-2 rounded-xl bg-mayssa-soft/50 px-3 py-3 ring-1 ${errors.lastName ? 'ring-red-300' : 'ring-mayssa-brown/10'}`}>
              <User size={16} className="text-mayssa-caramel" />
              <input
                type="text"
                placeholder="Nom"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-transparent text-sm font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                required
              />
            </div>
            {errors.lastName && <p className="text-xs text-red-400 mt-1 pl-2">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <div className={`flex items-center gap-2 rounded-xl bg-mayssa-soft/50 px-3 py-3 ring-1 ${errors.email ? 'ring-red-300' : 'ring-mayssa-brown/10'}`}>
            <Mail size={16} className="text-mayssa-caramel" />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-transparent text-sm font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
              required
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1 pl-2">{errors.email}</p>}
        </div>

        {/* Mot de passe */}
        <div>
          <div className={`flex items-center gap-2 rounded-xl bg-mayssa-soft/50 px-3 py-3 ring-1 ${errors.password ? 'ring-red-300' : 'ring-mayssa-brown/10'}`}>
            <Lock size={16} className="text-mayssa-caramel" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe (6+ caractères)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-transparent text-sm font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-mayssa-brown/40 hover:text-mayssa-brown"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1 pl-2">{errors.password}</p>}
        </div>

        {/* Téléphone (optionnel) */}
        <div>
          <div className="flex items-center gap-2 rounded-xl bg-mayssa-soft/50 px-3 py-3 ring-1 ring-mayssa-brown/10">
            <Phone size={16} className="text-mayssa-caramel" />
            <input
              type="tel"
              placeholder="Téléphone (optionnel)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-transparent text-sm font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </button>
      </form>

      {/* Switch to login */}
      <div className="text-center mt-6 pt-6 border-t border-mayssa-brown/10">
        <p className="text-sm text-mayssa-brown/60">
          Déjà un compte ?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-bold text-mayssa-caramel hover:text-mayssa-brown"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  )
}

// --- Formulaire de connexion ---
interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'Email requis'
    if (!formData.password) newErrors.password = 'Mot de passe requis'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await clientLogin(formData.email, formData.password)
      await refreshUserProfile()
      onSuccess()
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrors({ general: 'Email ou mot de passe incorrect' })
      } else {
        setErrors({ general: 'Erreur lors de la connexion' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!formData.email) {
      setErrors({ email: 'Saisissez votre email d\'abord' })
      return
    }

    try {
      await resetPassword(formData.email)
      setShowResetPassword(false)
      setErrors({ general: 'Email de réinitialisation envoyé !' })
    } catch (error: any) {
      setErrors({ general: 'Erreur lors de l\'envoi de l\'email' })
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-mayssa-caramel/20 text-mayssa-caramel mb-4">
          <User size={24} />
        </div>
        <h2 className="text-2xl font-display font-bold text-mayssa-brown">Se connecter</h2>
        <p className="text-sm text-mayssa-brown/60 mt-2">
          Accédez à vos points et récompenses
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className={`border rounded-xl p-3 text-sm ${
            errors.general.includes('envoyé') 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {errors.general}
          </div>
        )}

        {/* Email */}
        <div>
          <div className={`flex items-center gap-2 rounded-xl bg-mayssa-soft/50 px-3 py-3 ring-1 ${errors.email ? 'ring-red-300' : 'ring-mayssa-brown/10'}`}>
            <Mail size={16} className="text-mayssa-caramel" />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-transparent text-sm font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
              required
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1 pl-2">{errors.email}</p>}
        </div>

        {/* Mot de passe */}
        <div>
          <div className={`flex items-center gap-2 rounded-xl bg-mayssa-soft/50 px-3 py-3 ring-1 ${errors.password ? 'ring-red-300' : 'ring-mayssa-brown/10'}`}>
            <Lock size={16} className="text-mayssa-caramel" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-transparent text-sm font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-mayssa-brown/40 hover:text-mayssa-brown"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1 pl-2">{errors.password}</p>}
        </div>

        {/* Reset password link */}
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowResetPassword(!showResetPassword)}
            className="text-xs text-mayssa-brown/60 hover:text-mayssa-brown"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {showResetPassword && (
          <div className="bg-mayssa-soft/50 rounded-xl p-3">
            <p className="text-xs text-mayssa-brown/70 mb-2">
              Saisissez votre email ci-dessus, puis cliquez sur le bouton pour recevoir un email de réinitialisation.
            </p>
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-mayssa-caramel hover:text-mayssa-brown font-medium"
            >
              Envoyer l'email de réinitialisation
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {/* Switch to register */}
      <div className="text-center mt-6 pt-6 border-t border-mayssa-brown/10">
        <p className="text-sm text-mayssa-brown/60">
          Pas encore de compte ?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-bold text-mayssa-caramel hover:text-mayssa-brown"
          >
            S'inscrire
          </button>
        </p>
      </div>
    </div>
  )
}