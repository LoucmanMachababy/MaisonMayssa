import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Truck,
  TrendingUp,
  Package,
  Users,
  Settings,
} from 'lucide-react'

export type AdminMainTab =
  | 'resume'
  | 'commandes'
  | 'historique'
  | 'livret'
  | 'ca'
  | 'catalogue'
  | 'clients'
  | 'reglages'
  | 'planning_detail'
  | 'livraison'
  | 'retrait'
  | 'avis'
  | 'stock'
  | 'jours'
  | 'creneaux'
  | 'anniversaires'
  | 'inscrits'
  | 'produits'
  | 'promos'
  | 'sondage'
  | 'rappels'
  | 'abonnes'
  | 'alertes'
  | 'carte'
  | 'sessions'
  | 'production'
  | 'planning'

export type AdminNavItem = {
  id: AdminMainTab
  icon: LucideIcon
  label: string
  badge?: number
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

export function buildAdminNavigation(counts: {
  pending: number
  inPrep: number
}): AdminNavGroup[] {
  return [
    {
      label: 'Pilotage',
      items: [
        { id: 'resume', icon: LayoutDashboard, label: 'Tableau de bord' },
        { id: 'ca', icon: TrendingUp, label: 'Analytics' },
      ],
    },
    {
      label: 'Commandes',
      items: [
        { id: 'commandes', icon: ClipboardList, label: 'Nouvelles', badge: counts.pending },
        { id: 'historique', icon: Calendar, label: 'Planning' },
        { id: 'livret', icon: Truck, label: 'Journalier', badge: counts.inPrep },
      ],
    },
    {
      label: 'Boutique',
      items: [
        { id: 'catalogue', icon: Package, label: 'Carte & stock' },
        { id: 'clients', icon: Users, label: 'Clients' },
        { id: 'reglages', icon: Settings, label: 'Paramètres' },
      ],
    },
  ]
}

export const ADMIN_TAB_LABELS: Record<string, string> = {
  resume: 'Tableau de bord',
  commandes: 'Nouvelles commandes',
  historique: 'Planning des commandes',
  livret: 'Journalier des retraits',
  ca: 'Analytics & performance',
  catalogue: 'Carte & produits',
  clients: 'Clients & avis',
  reglages: 'Paramètres boutique',
  planning_detail: 'Planning détaillé',
  livraison: 'Livraisons (archives)',
  retrait: 'Retraits',
  avis: 'Avis clients',
  stock: 'Stock',
  jours: "Jours d'ouverture",
  creneaux: 'Créneaux',
  anniversaires: 'Anniversaires',
  inscrits: 'Inscrits',
  produits: 'Produits',
  promos: 'Codes promo',
  sondage: 'Sondages',
  rappels: 'Rappels avis',
  abonnes: 'Abonnés',
  alertes: 'Alertes stock',
  carte: 'Carte communautaire',
  sessions: 'Sessions actives',
  production: 'Production',
  planning: 'Planning',
}
