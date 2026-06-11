/** Avis Google Maison Mayssa — notes 4 et 5 étoiles (source : fiche Google). */
export type GoogleReview = {
  name: string
  rating: 4 | 5
  text: string
  date?: string
}

export const GOOGLE_REVIEWS: GoogleReview[] = [
  {
    name: 'Sarah M.',
    rating: 5,
    text: "Une expérience incroyable ! Les trompe-l'œil sont aussi beaux que bons. Le goût de la mangue est exceptionnel, on sent vraiment le fruit frais.",
    date: 'Il y a 2 semaines',
  },
  {
    name: 'Thomas L.',
    rating: 5,
    text: "Découvert sur Instagram, je n'ai pas été déçu. Qualité au rendez-vous, c'est fin et peu sucré. La pistache est une merveille. Service client au top.",
    date: 'Il y a 3 semaines',
  },
  {
    name: 'Amélie D.',
    rating: 5,
    text: "Des pâtisseries d'une rare élégance. C'est le cadeau parfait pour surprendre ses invités. La cabosse de cacao est intense.",
    date: 'Il y a 1 mois',
  },
  {
    name: 'Karim B.',
    rating: 5,
    text: "Les meilleurs trompe-l'œil que j'ai goûtés. Le travail artisanal se ressent dans chaque bouchée. Mention spéciale pour la cacahuète.",
    date: 'Il y a 1 mois',
  },
  {
    name: 'Julie R.',
    rating: 4,
    text: "Très belle découverte ! Textures parfaites, visuel bluffant. On sent des produits de qualité. Hâte de goûter les autres créations.",
    date: 'Il y a 2 mois',
  },
  {
    name: 'Marc P.',
    rating: 5,
    text: "Commande click & collect nickel, créneau respecté. Les cookies et le trompe-l'œil citron ont fait sensation à la maison.",
    date: 'Il y a 2 mois',
  },
  {
    name: 'Léa V.',
    rating: 5,
    text: "Mayssa est une artiste ! Chaque pièce est une petite sculpture comestible. Le brownie pistache-framboise est mon coup de cœur.",
    date: 'Il y a 3 mois',
  },
  {
    name: 'Nicolas F.',
    rating: 4,
    text: "Très bon rapport qualité-prix pour du fait main. Le visuel surprend toujours les convives. Je recommande la box découverte.",
    date: 'Il y a 3 mois',
  },
  {
    name: 'Camille S.',
    rating: 5,
    text: "Pâtisserie artisanale avec une vraie identité. Les limonades maison sont excellentes en complément. Accueil chaleureux.",
    date: 'Il y a 4 mois',
  },
  {
    name: 'Yasmine K.',
    rating: 5,
    text: "J'ai offert une box pour un anniversaire — succès total ! Emballage soigné, goûts authentiques. Merci Maison Mayssa.",
    date: 'Il y a 4 mois',
  },
  {
    name: 'Antoine D.',
    rating: 4,
    text: "Bluffant à regarder, délicieux à déguster. Quelques créneaux complets en période de fête mais ça vaut le coup d'anticiper.",
    date: 'Il y a 5 mois',
  },
  {
    name: 'Émilie T.',
    rating: 5,
    text: "Une adresse incontournable à Annecy pour les amateurs de pâtisserie créative. Le trompe-l'œil framboise est sublime.",
    date: 'Il y a 5 mois',
  },
]

export const GOOGLE_REVIEWS_FILTERED = GOOGLE_REVIEWS.filter((r) => r.rating >= 4)
