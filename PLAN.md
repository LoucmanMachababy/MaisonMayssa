# Plan : Trompe l'oeil - Précommande limitée + Gestion de stock admin

## Problème
Les Trompe l'oeil sont des best-sellers en quantité limitée. Roumayssa doit pouvoir :
- Limiter les précommandes au **mercredi et samedi** uniquement
- Gérer le **stock** de chaque produit (et le modifier en temps réel)
- Tous les visiteurs doivent voir le stock actuel et les restrictions

## Architecture choisie : Firebase Realtime Database

**Pourquoi ?** Le site est purement frontend (pas de serveur). Pour un stock partagé visible par tous, il faut un service externe. Firebase est gratuit, temps réel, et simple.

### Structure Firebase
```json
{
  "stock": {
    "trompe-loeil-mangue": 20,
    "trompe-loeil-citron": 15,
    "trompe-loeil-pistache": 10,
    "trompe-loeil-passion": 12,
    "trompe-loeil-framboise": 18,
    "trompe-loeil-cacahuete": 8
  },
  "settings": {
    "preorderDays": [3, 6],
    "preorderMessage": "Disponible uniquement le mercredi et samedi"
  }
}
```

### Règles de sécurité Firebase
- **Lecture** : publique (tous les visiteurs)
- **Écriture** : uniquement l'admin authentifié (Roumayssa)
- Auth : Firebase Authentication (email/password), 1 seul compte admin

---

## Fichiers à créer

### 1. `src/lib/firebase.ts`
- Config Firebase (apiKey, projectId, etc.)
- Init de `getDatabase()` et `getAuth()`
- Export des références DB

### 2. `src/hooks/useStock.ts`
- Hook qui écoute Firebase en temps réel (`onValue`)
- Retourne `{ stock, isPreorderDay, loading }`
- `stock` = `Map<productId, number>` (quantité restante)
- `isPreorderDay` = `true` si aujourd'hui est mercredi ou samedi
- Se met à jour automatiquement quand Roumayssa change le stock

### 3. `src/components/admin/AdminPanel.tsx`
- Page admin complète pour Roumayssa
- Login email/password via Firebase Auth
- Dashboard avec :
  - Liste des trompe l'oeil avec champ stock modifiable
  - Bouton +/- ou input numérique pour chaque produit
  - Toggle activer/désactiver un produit
  - Indicateur des jours de précommande
- Accessible via `#admin` dans l'URL (pas besoin de react-router)

### 4. `src/components/StockBadge.tsx`
- Petit badge affiché sur les cartes produit trompe l'oeil
- Affiche "X restants" ou "Rupture" ou "Dispo mer. et sam."
- Couleur : vert (dispo), orange (peu de stock), rouge (rupture)

---

## Fichiers à modifier

### 5. `src/App.tsx`
- Importer `useStock` hook
- Si URL contient `#admin` → afficher AdminPanel au lieu du site
- Passer `stock` et `isPreorderDay` aux composants produit
- Modifier `handleAddToCart` : vérifier stock > 0 et jour autorisé avant d'ajouter un trompe l'oeil
- Afficher un toast si jour non autorisé ou stock épuisé

### 6. `src/components/ProductCard.tsx`
- Recevoir `stock` et `isPreorderDay` en props (optionnel, seulement pour trompe l'oeil)
- Si stock = 0 → overlay "Rupture de stock", bouton + désactivé
- Si pas le bon jour → overlay "Disponible mer. et sam.", bouton + désactivé
- Afficher StockBadge

### 7. `src/components/mobile/SwipeableProductCard.tsx`
- Même logique que ProductCard (stock + jour)
- Désactiver le swipe-to-add si indisponible

### 8. `src/components/mobile/ProductDetailModal.tsx`
- Afficher stock restant
- Désactiver "Ajouter au panier" si indisponible

---

## Étapes d'implémentation

1. **Installer Firebase** : `npm install firebase`
2. **Créer projet Firebase** : via console.firebase.google.com (à faire manuellement)
3. **Configurer Firebase** : `src/lib/firebase.ts` avec les clés du projet
4. **Créer le hook useStock** : écoute temps réel
5. **Créer l'admin panel** : login + gestion stock
6. **Créer StockBadge** : composant visuel
7. **Modifier ProductCard + SwipeableProductCard** : intégrer stock
8. **Modifier App.tsx** : routing admin + logique panier
9. **Initialiser la BDD Firebase** : seed les stocks initiaux
10. **Créer le compte admin** pour Roumayssa

## Setup Firebase (à faire ensemble)
Le user devra :
1. Aller sur https://console.firebase.google.com
2. Créer un projet "Maison Mayssa"
3. Activer Realtime Database (région europe-west1)
4. Activer Authentication > Email/Password
5. Créer un compte admin (email + mdp de Roumayssa)
6. Me donner les clés de config Firebase
