import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Lock, Phone, Eye, EyeOff, Gift, Calendar, Cake, CheckCircle } from 'lucide-react'
import { clientRegister, clientLoginFresh, createUserProfile, resetPassword, sendClientEmailVerification, clientLogout } from '../../lib/firebase'
import { refreshUserProfile } from '../../hooks/useAuth'
import { AddressAutocomplete } from '../AddressAutocomplete'
import { CgvAcceptance } from '../legal/CgvAcceptance'
import type { Coordinates } from '../../types'

const inputWrap = (hasError: boolean) =>
  `flex items-center gap-2 border px-4 py-3.5 ${hasError ? 'border-red-300' : 'border-mayssa-brown/10 focus-within:border-mayssa-gold'} bg-white transition-colors`

const authInputClass =
  'w-full bg-transparent text-sm text-mayssa-brown placeholder:text-mayssa-brown/55 placeholder:opacity-100 focus:outline-none'

interface RegisterFormProps {
  /** Reçu pour cohérence d'API, mais non appelé : après inscription le client
   *  doit d'abord vérifier son email (écran de confirmation), pas de login direct. */
  onSuccess: () => void
}

export function RegisterForm(_props: RegisterFormProps) {
  const PHONE_REGEX = /^(\+33|0)[1-9](\d{2}){4}$/

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthday: '',
    address: '',
    addressCoordinates: null as Coordinates,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'Email requis'
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Au moins 6 caractères'
    if (!formData.firstName) newErrors.firstName = 'Prénom requis'
    if (!formData.lastName) newErrors.lastName = 'Nom requis'
    if (!formData.phone.trim()) {
      newErrors.phone = 'Téléphone requis'
    } else if (!PHONE_REGEX.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Format invalide (ex: 06 12 34 56 78)'
    }
    if (!formData.birthday) {
      newErrors.birthday = 'Date de naissance requise'
    } else {
      const birthDate = new Date(formData.birthday)
      const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (age < 13) newErrors.birthday = 'Vous devez avoir au moins 13 ans'
    }
    if (!acceptedTerms) newErrors.terms = 'Vous devez accepter les CGV et la politique de confidentialité'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const userCredential = await clientRegister(formData.email, formData.password)
      await createUserProfile(userCredential.user.uid, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        birthday: formData.birthday,
        ...(formData.address.trim() && { address: formData.address }),
        ...(formData.addressCoordinates && { addressCoordinates: formData.addressCoordinates }),
      })
      await sendClientEmailVerification(userCredential.user)
      await clientLogout()
      setRegisteredEmail(formData.email)
      setVerificationPending(true)
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code
      if (code === 'auth/email-already-in-use') setErrors({ email: 'Cet email est déjà utilisé' })
      else if (code === 'auth/weak-password') setErrors({ password: 'Mot de passe trop faible' })
      else if (code === 'auth/invalid-email') setErrors({ email: 'Email invalide' })
      else setErrors({ general: "Erreur lors de l'inscription" })
    } finally {
      setLoading(false)
    }
  }

  if (verificationPending) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 text-emerald-600 mb-6 rounded-full">
          <CheckCircle size={28} />
        </div>
        <h1 className="font-display text-3xl text-mayssa-brown mb-3">Vérifiez votre email</h1>
        <p className="text-sm text-mayssa-brown/70 font-light leading-relaxed mb-2">
          Un lien de confirmation a été envoyé à
        </p>
        <p className="text-sm font-medium text-mayssa-brown mb-6">{registeredEmail}</p>
        <p className="text-xs text-mayssa-brown/55 leading-relaxed mb-8 max-w-sm mx-auto">
          Cliquez sur le lien dans l&apos;email pour activer votre compte, puis connectez-vous. Pensez à vérifier vos spams.
        </p>
        <Link
          to="/connexion"
          className="inline-flex items-center justify-center w-full py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors"
        >
          Aller à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-mayssa-gold/15 text-mayssa-gold mb-5">
          <Gift size={20} />
        </div>
        <h1 className="font-display text-3xl text-mayssa-brown mb-2">Créer mon compte</h1>
        <p className="text-sm text-mayssa-brown/60 font-light">
          <span className="text-mayssa-gold font-medium">15 points</span> de bienvenue et un cadeau le jour de votre anniversaire.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-600">{errors.general}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Prénom</label>
            <div className={inputWrap(!!errors.firstName)}>
              <User size={16} className="text-mayssa-gold shrink-0" />
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={authInputClass}
                placeholder="Marie"
                required
              />
            </div>
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Nom</label>
            <div className={inputWrap(!!errors.lastName)}>
              <User size={16} className="text-mayssa-gold shrink-0" />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={authInputClass}
                placeholder="Dupont"
                required
              />
            </div>
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Email</label>
          <div className={inputWrap(!!errors.email)}>
            <Mail size={16} className="text-mayssa-gold shrink-0" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={authInputClass}
              placeholder="vous@exemple.fr"
              required
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Mot de passe</label>
          <div className={inputWrap(!!errors.password)}>
            <Lock size={16} className="text-mayssa-gold shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="6 caractères minimum"
              className={authInputClass}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-mayssa-brown/40">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Téléphone</label>
          <div className={inputWrap(!!errors.phone)}>
            <Phone size={16} className="text-mayssa-gold shrink-0" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                let value = e.target.value.replace(/[^\d+\s]/g, '')
                const digits = value.replace(/\s/g, '')
                if (digits.length > 2 && !digits.startsWith('+')) {
                  value = digits.match(/.{1,2}/g)?.join(' ') || value
                }
                setFormData({ ...formData, phone: value })
              }}
              className={authInputClass}
              placeholder="06 12 34 56 78"
              required
            />
          </div>
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Date de naissance</label>
          <div className={inputWrap(!!errors.birthday)}>
            <Calendar size={16} className="text-mayssa-gold shrink-0" />
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              min="1920-01-01"
              className={authInputClass}
              aria-label="Date de naissance"
              required
            />
          </div>
          <p className="text-[10px] text-mayssa-brown/50 mt-1 flex items-center gap-1">
            <Cake size={10} /> Un cadeau vous attend le jour de votre anniversaire
          </p>
          {errors.birthday && <p className="text-xs text-red-500 mt-1">{errors.birthday}</p>}
        </div>

        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Adresse (optionnelle)</label>
          <div className={`border ${errors.address ? 'border-red-300' : 'border-mayssa-brown/10'} bg-white`}>
            <AddressAutocomplete
              value={formData.address}
              onChange={(address, coordinates) => setFormData({ ...formData, address, addressCoordinates: coordinates })}
              placeholder="Votre adresse complète"
              className="px-4 py-3"
            />
          </div>
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>

        <CgvAcceptance checked={acceptedTerms} onChange={setAcceptedTerms} className="mt-2" />
        {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}

        <button
          type="submit"
          disabled={loading || !acceptedTerms}
          className="w-full py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="text-center text-sm text-mayssa-brown/60 mt-8 pt-8 border-t border-mayssa-brown/10">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="text-mayssa-gold hover:text-mayssa-brown tracking-wide uppercase text-xs font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  )
}

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const email = formData.email.trim()
    const password = formData.password.trim()
    if (!email || !password) {
      setErrors({ general: 'Email et mot de passe requis' })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const cred = await clientLoginFresh(email, password)
      if (!cred.user.emailVerified) {
        await sendClientEmailVerification(cred.user)
        await clientLogout()
        setErrors({
          general:
            'Votre email n\'est pas encore vérifié. Un nouveau lien de confirmation vient d\'être envoyé. Consultez votre boîte mail.',
        })
        return
      }
      await refreshUserProfile()
      onSuccess()
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrors({ general: 'Email ou mot de passe incorrect' })
      } else {
        setErrors({ general: 'Erreur lors de la connexion' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: "Saisissez votre email d'abord" })
      return
    }
    try {
      await resetPassword(formData.email.trim())
      setShowResetPassword(false)
      setErrors({ general: 'Email de réinitialisation envoyé !' })
    } catch {
      setErrors({ general: "Erreur lors de l'envoi de l'email" })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-mayssa-gold/15 text-mayssa-gold mb-5">
          <User size={20} />
        </div>
        <h1 className="font-display text-3xl text-mayssa-brown mb-2">Connexion</h1>
        <p className="text-sm text-mayssa-brown/60 font-light">
          Accédez à vos points fidélité, récompenses et historique de commandes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div
            className={`border p-3 text-sm ${
              errors.general.includes('envoyé')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {errors.general}
          </div>
        )}

        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Email</label>
          <div className={inputWrap(!!errors.email)}>
            <Mail size={16} className="text-mayssa-gold shrink-0" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={authInputClass}
              placeholder="vous@exemple.fr"
              required
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-[10px] tracking-widest uppercase text-mayssa-brown/50 mb-1.5">Mot de passe</label>
          <div className={inputWrap(!!errors.password)}>
            <Lock size={16} className="text-mayssa-gold shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={authInputClass}
              placeholder="Votre mot de passe"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-mayssa-brown/40">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowResetPassword(!showResetPassword)}
            className="text-xs text-mayssa-brown/50 hover:text-mayssa-brown tracking-wide"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {showResetPassword && (
          <div className="bg-white border border-mayssa-brown/10 p-4">
            <p className="text-xs text-mayssa-brown/60 mb-2">
              Saisissez votre email ci-dessus, puis demandez le lien de réinitialisation.
            </p>
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-mayssa-gold hover:text-mayssa-brown tracking-widest uppercase"
            >
              Envoyer l&apos;email
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors disabled:opacity-50"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm text-mayssa-brown/60 mt-8 pt-8 border-t border-mayssa-brown/10">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="text-mayssa-gold hover:text-mayssa-brown tracking-wide uppercase text-xs font-medium">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  )
}
