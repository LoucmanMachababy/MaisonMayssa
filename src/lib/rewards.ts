// Constantes récompenses fidélité (extraites de firebase.ts pour éviter de charger Firebase au démarrage)

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
