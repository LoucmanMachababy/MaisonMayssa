import { useState, useEffect } from 'react'
import { 
  User, Phone, Mail, Calendar, Star, Gift, Instagram, 
  ExternalLink, LogOut, Edit, Save, X, Sparkles, Award, History, Eye
} from 'lucide-react'
import { useAuth, refreshUserProfile } from '../../hooks/useAuth'
import { 
  updateUserProfile, claimSocialPoints, getUserRewards, claimReward,
  type UserReward, REWARD_COSTS, REWARD_LABELS
} from '../../lib/firebase'
import { clientLogout } from '../../lib/firebase'

interface AccountPageProps {
  onClose: () => void
}

export function AccountPage({ onClose }: AccountPageProps) {
  const { user, profile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'rewards' | 'history'>('profile')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthday: '',
  })
  const [rewards, setRewards] = useState<Record<string, UserReward>>({})
  const [loadingRewards, setLoadingRewards] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'instagram' | 'tiktok' | null>(null)

  // Charger les données d'édition
  useEffect(() => {
    if (profile) {
      setEditData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        birthday: profile.birthday || '',
      })
    }
  }, [profile])

  // Charger les récompenses
  useEffect(() => {
    if (!user) return
    
    const loadRewards = async () => {
      setLoadingRewards(true)
      try {
        const userRewards = await getUserRewards(user.uid)
        setRewards(userRewards)
      } catch (error) {
        console.error('Error loading rewards:', error)
      } finally {
        setLoadingRewards(false)
      }
    }

    loadRewards()
  }, [user])

  const handleSave = async () => {
    if (!user || !profile) return

    try {
      await updateUserProfile(user.uid, {
        firstName: editData.firstName,
        lastName: editData.lastName,
        phone: editData.phone || undefined,
        birthday: editData.birthday || undefined,
      })
      await refreshUserProfile()
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleSocialClaim = async (platform: 'instagram' | 'tiktok') => {
    if (!user || !profile || socialLoading) return

    setSocialLoading(platform)
    
    // Ouvrir le réseau social
    const urls = {
      instagram: 'https://www.instagram.com/maison_mayssa74/',
      tiktok: 'https://www.tiktok.com/@maison.mayssa74?lang=en'
    }
    window.open(urls[platform], '_blank')

    // Simuler le délai pour l'action "J'ai suivi"
    setTimeout(async () => {
      try {
        await claimSocialPoints(user.uid, platform)
        await refreshUserProfile()
      } catch (error) {
        console.error(`Error claiming ${platform} points:`, error)
      } finally {
        setSocialLoading(null)
      }
    }, 2000)
  }

  const handleClaimReward = async (rewardType: keyof typeof REWARD_COSTS) => {
    if (!user || !profile) return

    const cost = REWARD_COSTS[rewardType]
    if (!profile.loyalty || profile.loyalty.points < cost) return

    try {
      const rewardId = await claimReward(user.uid, rewardType, cost)
      if (rewardId) {
        // Recharger le profil et les récompenses
        await refreshUserProfile()
        const updatedRewards = await getUserRewards(user.uid)
        setRewards(updatedRewards)
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await clientLogout()
      onClose()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-mayssa-caramel border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-mayssa-brown/60">Erreur de chargement du profil</p>
      </div>
    )
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Prestige': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'Gourmand': return 'text-amber-600 bg-amber-50 border-amber-200'
      default: return 'text-mayssa-caramel bg-mayssa-caramel/10 border-mayssa-caramel/20'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Prestige': return <Award size={16} />
      case 'Gourmand': return <Star size={16} />
      default: return <Sparkles size={16} />
    }
  }

  const canClaimInstagram = !profile.loyalty?.instagramClaimedAt
  const canClaimTikTok = !profile.loyalty?.tiktokClaimedAt

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-mayssa-brown">Mon compte</h1>
          <p className="text-sm text-mayssa-brown/60">Profil & programme de fidélité</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-mayssa-brown/60 hover:bg-mayssa-soft transition-colors"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-mayssa-brown/10 text-mayssa-brown hover:bg-mayssa-brown/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Points Summary */}
      <div className="bg-gradient-to-r from-mayssa-caramel/10 to-mayssa-rose/10 rounded-3xl p-6 mb-6 border border-mayssa-caramel/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${getTierColor(profile.loyalty?.tier || 'Bronze')}`}>
                {getTierIcon(profile.loyalty?.tier || 'Bronze')}
                Niveau {profile.loyalty?.tier || 'Bronze'}
              </span>
            </div>
            <h2 className="text-3xl font-display font-bold text-mayssa-brown">
              {profile.loyalty?.points || 0} points
            </h2>
            <p className="text-sm text-mayssa-brown/70">
              {profile.loyalty?.lifetimePoints || 0} points cumulés à vie
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-mayssa-caramel">1 € = 1 pt</div>
            <p className="text-xs text-mayssa-brown/60">à chaque commande</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-mayssa-soft/50 rounded-2xl p-1 mb-6">
        {[
          { id: 'profile', label: 'Profil', icon: User },
          { id: 'rewards', label: 'Récompenses', icon: Gift },
          { id: 'history', label: 'Historique', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-mayssa-brown shadow-sm'
                : 'text-mayssa-brown/60 hover:text-mayssa-brown'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-mayssa-brown">Informations personnelles</h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs text-mayssa-caramel hover:text-mayssa-brown"
                >
                  <Edit size={12} />
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    <Save size={12} />
                    Sauver
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <X size={12} />
                    Annuler
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email (non modifiable) */}
              <div>
                <label className="block text-xs font-medium text-mayssa-brown/60 mb-1">Email</label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-mayssa-soft/30">
                  <Mail size={16} className="text-mayssa-caramel" />
                  <span className="text-sm text-mayssa-brown/80">{profile.email}</span>
                </div>
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-xs font-medium text-mayssa-brown/60 mb-1">Prénom</label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-mayssa-soft/30 text-sm text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-mayssa-soft/30">
                    <User size={16} className="text-mayssa-caramel" />
                    <span className="text-sm text-mayssa-brown">{profile.firstName}</span>
                  </div>
                )}
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-medium text-mayssa-brown/60 mb-1">Nom</label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-mayssa-soft/30 text-sm text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-mayssa-soft/30">
                    <User size={16} className="text-mayssa-caramel" />
                    <span className="text-sm text-mayssa-brown">{profile.lastName}</span>
                  </div>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-medium text-mayssa-brown/60 mb-1">Téléphone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="w-full p-3 rounded-xl bg-mayssa-soft/30 text-sm text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-mayssa-soft/30">
                    <Phone size={16} className="text-mayssa-caramel" />
                    <span className="text-sm text-mayssa-brown">{profile.phone || 'Non renseigné'}</span>
                  </div>
                )}
              </div>

              {/* Anniversaire */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-mayssa-brown/60 mb-1">Anniversaire (optionnel)</label>
                {editing ? (
                  <input
                    type="date"
                    value={editData.birthday}
                    onChange={(e) => setEditData({ ...editData, birthday: e.target.value })}
                    className="w-full p-3 rounded-xl bg-mayssa-soft/30 text-sm text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-mayssa-soft/30">
                    <Calendar size={16} className="text-mayssa-caramel" />
                    <span className="text-sm text-mayssa-brown">
                      {profile.birthday 
                        ? new Date(profile.birthday).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long' 
                          })
                        : 'Non renseigné'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Points */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5">
            <h3 className="font-bold text-mayssa-brown mb-4">Gagner plus de points</h3>
            <div className="grid gap-3">
              {/* Instagram */}
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 border-dashed transition-all ${
                canClaimInstagram ? 'border-pink-300 bg-pink-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  <Instagram size={20} className="text-pink-600" />
                  <div>
                    <p className="font-medium text-sm">Suivre sur Instagram</p>
                    <p className="text-xs text-mayssa-brown/60">+15 points</p>
                  </div>
                </div>
                {canClaimInstagram ? (
                  <button
                    onClick={() => handleSocialClaim('instagram')}
                    disabled={socialLoading === 'instagram'}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 transition-colors disabled:opacity-50"
                  >
                    {socialLoading === 'instagram' ? (
                      'J\'ai suivi !'
                    ) : (
                      <>
                        <ExternalLink size={14} />
                        Suivre
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-medium">✓ Points réclamés</span>
                )}
              </div>

              {/* TikTok */}
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 border-dashed transition-all ${
                canClaimTikTok ? 'border-gray-800 bg-gray-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-800 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">TT</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Suivre sur TikTok</p>
                    <p className="text-xs text-mayssa-brown/60">+15 points</p>
                  </div>
                </div>
                {canClaimTikTok ? (
                  <button
                    onClick={() => handleSocialClaim('tiktok')}
                    disabled={socialLoading === 'tiktok'}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    {socialLoading === 'tiktok' ? (
                      'J\'ai suivi !'
                    ) : (
                      <>
                        <ExternalLink size={14} />
                        Suivre
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-medium">✓ Points réclamés</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Available Rewards */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5">
            <h3 className="font-bold text-mayssa-brown mb-4">Récompenses disponibles</h3>
            <div className="grid gap-4">
              {Object.entries(REWARD_COSTS).map(([rewardType, cost]) => {
                const canClaim = (profile.loyalty?.points || 0) >= cost
                const label = REWARD_LABELS[rewardType as keyof typeof REWARD_LABELS]

                return (
                  <div
                    key={rewardType}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      canClaim 
                        ? 'border-mayssa-caramel bg-mayssa-caramel/5' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Gift size={20} className={canClaim ? 'text-mayssa-caramel' : 'text-gray-400'} />
                      <div>
                        <p className={`font-medium text-sm ${canClaim ? 'text-mayssa-brown' : 'text-gray-500'}`}>
                          {label}
                        </p>
                        <p className="text-xs text-mayssa-brown/60">{cost} points</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClaimReward(rewardType as keyof typeof REWARD_COSTS)}
                      disabled={!canClaim}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        canClaim
                          ? 'bg-mayssa-caramel text-white hover:bg-mayssa-brown'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canClaim ? 'Réclamer' : `${cost - (profile.loyalty?.points || 0)} pts manquants`}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Claimed Rewards */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5">
            <h3 className="font-bold text-mayssa-brown mb-4">Récompenses réclamées</h3>
            {loadingRewards ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-mayssa-caramel border-t-transparent rounded-full" />
              </div>
            ) : Object.keys(rewards).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(rewards)
                  .sort(([, a], [, b]) => b.claimedAt - a.claimedAt)
                  .map(([id, reward]) => (
                    <div key={id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <Gift size={16} className="text-emerald-600" />
                        <div>
                          <p className="font-medium text-sm text-emerald-800">
                            {REWARD_LABELS[reward.type]}
                          </p>
                          <p className="text-xs text-emerald-600">
                            Réclamé le {new Date(reward.claimedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">
                        -{reward.pointsSpent} pts
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center py-4 text-mayssa-brown/60 text-sm">
                Aucune récompense réclamée pour le moment
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5">
          <h3 className="font-bold text-mayssa-brown mb-4">Historique des points</h3>
          <div className="space-y-3">
            {(profile.loyalty?.history && Array.isArray(profile.loyalty.history) 
              ? profile.loyalty.history 
              : Object.values(profile.loyalty?.history || {})
            )
              .slice()
              .sort((a, b) => b.at - a.at)
              .map((entry, index) => {
                const getEntryLabel = (reason: string) => {
                  switch (reason) {
                    case 'creation_compte': return 'Création de compte'
                    case 'instagram_follow': return 'Suivi Instagram'
                    case 'tiktok_follow': return 'Suivi TikTok'
                    case 'order_points': return 'Commande'
                    case 'review_bonus': return 'Avis laissé'
                    case 'ramadan_bonus': return 'Bonus Ramadan'
                    case 'anniversary_bonus': return 'Anniversaire Maison Mayssa'
                    case 'birthday_bonus': return 'Anniversaire client'
                    default: return reason
                  }
                }

                const getEntryIcon = (reason: string) => {
                  switch (reason) {
                    case 'creation_compte': return <User size={14} />
                    case 'instagram_follow': return <Instagram size={14} />
                    case 'tiktok_follow': return <Eye size={14} />
                    case 'order_points': return <Gift size={14} />
                    default: return <Star size={14} />
                  }
                }

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-mayssa-soft/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="text-mayssa-caramel">
                        {getEntryIcon(entry.reason)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-mayssa-brown">
                          {getEntryLabel(entry.reason)}
                        </p>
                        <p className="text-xs text-mayssa-brown/60">
                          {new Date(entry.at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {entry.amount && ` • ${entry.amount} €`}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">
                      +{entry.points} pts
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}