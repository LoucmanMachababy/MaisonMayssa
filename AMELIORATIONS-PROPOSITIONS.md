# Propositions d'amélioration — Maison Mayssa

Ce document liste des pistes concrètes pour améliorer encore le site (UX, performance, SEO, accessibilité, PWA).

---

## ✅ Déjà corrigé

- **Double vidage du panier** : il y avait deux `setCart([])` consécutifs dans `handleSend`. Un seul suffit ; le second a été supprimé.

---

## 1. UX & Conversion

### 1.1 État de chargement à l’envoi de commande
- **Idée** : Désactiver le bouton "Envoyer sur WhatsApp" et afficher un spinner (ou texte "Envoi en cours...") pendant `saveOrderToFirebase` et la préparation du message.
- **Bénéfice** : Évite les double-clics et rassure l’utilisateur.

### 1.2 Recherche sans résultat
- **Idée** : Quand "Aucun produit trouvé" s’affiche, proposer des liens rapides (ex. "Voir les Tiramisus", "Voir les Brownies") ou un bouton "Voir toute la carte" en plus du "Réinitialiser la recherche".
- **Bénéfice** : L’utilisateur reste sur le site au lieu de quitter.

### 1.3 Zone de livraison et adresse
- **Idée** : Dans le formulaire de commande, afficher une courte mention du type : "Vérifiez que votre adresse est dans la zone (carte ci-dessous)" à côté du champ adresse, ou un petit lien "Voir la zone" qui scroll vers la carte.
- **Idée** : Optionnel — après sélection d’une adresse dans `AddressAutocomplete`, afficher une pastille "Dans la zone" / "Hors zone" selon `calculateDistance` par rapport à Annecy.

### 1.4 Créneaux de livraison
- **Idée** : Si `deliverySlots` indique qu’un créneau est plein (ex. 0 places), l’afficher visuellement (grisé, badge "Complet") dans le sélecteur date/heure pour éviter les déceptions.

---

## 2. Performance

### 2.1 Images
- Tu utilises déjà `BlurImage` et `priority` sur les premières cartes : c’est bien.
- **Idée** : S’assurer que toutes les images produits passent par un composant qui fait du lazy loading (loading="lazy" ou Intersection Observer) sauf pour les 4–6 premiers produits (déjà le cas avec `priority`).

### 2.2 Lazy loading des modales
- Les grosses modales (Tiramisu, Box, etc.) sont déjà en `Suspense` + `lazy()` : parfait.
- **Idée** : Précharger au hover/focus du premier bouton "Commander" (ex. `preload` du chunk) pour que l’ouverture de la première modale soit plus rapide.

### 2.3 Animations
- `useAdaptiveAnimations` et `prefers-reduced-motion` sont déjà pris en compte : très bien.
- **Idée** : Pour `FloatingParticles`, tu mets à jour tout le state à chaque frame ; on peut réduire les re-renders en utilisant un seul `requestAnimationFrame` qui met à jour un ref et ne fait `setState` que toutes les N frames (ex. 2–3) pour le rendu visuel, si tu constates des saccades sur mobile.

---

## 3. SEO & Partage

### 3.1 Open Graph / Twitter
- Les meta `og:*` et `twitter:*` sont déjà en place.
- **Idée** : Utiliser une image dédiée pour le partage (ex. 1200×630 px) au lieu du logo seul : une belle photo de pâtisseries + texte "Maison Mayssa – Annecy" améliore les clics sur les réseaux.

### 3.2 Schema.org
- Le JSON-LD "Bakery" est déjà présent dans `index.html`.
- **Idée** : Ajouter un `Product` schema pour 2–3 produits phares (nom, description, prix, image) pour enrichir les résultats (ex. Google Shopping / rich results) si pertinent.

### 3.3 Sitemap / robots
- `sitemap.xml` et `robots.txt` sont présents : OK.

---

## 4. Accessibilité

### 4.1 ErrorBoundary + Sentry
- **Idée** : Dans `ErrorBoundary.getDerivedStateFromError` (ou dans `componentDidCatch`), appeler Sentry pour enregistrer l’erreur : `captureException(error)`. Ainsi tu gardes une UI lisible pour l’utilisateur tout en ayant les erreurs en production pour le debug.

### 4.2 Modales
- **Idée** : Focus trap dans les modales (tab ne sort pas de la modale, Esc pour fermer) et remettre le focus sur l’élément qui a ouvert la modale à la fermeture. Beaucoup de composants modaux le font déjà ; à vérifier sur les plus gros (Account, Cart sheet, etc.).

### 4.3 Skip links
- Les skip links sont déjà là : bien pour la navigation clavier.

---

## 5. PWA & Mobile

### 5.1 PWA désactivée
- Le plugin PWA est commenté dans `vite.config.ts` à cause des problèmes de page blanche / lenteur sur mobile.
- **Idée** : Réactiver progressivement avec une stratégie prudente :
  - Cache "network-first" pour le HTML (ou "stale-while-revalidate") pour éviter de servir une vieille version qui provoque une page blanche.
  - `skipWaiting` + message "Nouvelle version disponible – Recharger" au lieu de mettre à jour le SW en arrière-plan sans prévenir.
- **Idée** : Même sans SW, ajouter un `manifest.json` (ou webmanifest) avec `name`, `short_name`, `theme_color`, `background_color`, `icons` pour que "Ajouter à l’écran d’accueil" propose un nom et une icône corrects.

### 5.2 Haptics
- Le retour haptique est déjà utilisé : bon pour l’UX mobile.

---

## 6. Code & Maintenabilité

### 6.1 Découper `App.tsx`
- `App.tsx` est très long (logique commande, panier, modales, formulaire).
- **Idée** : Extraire la construction du message WhatsApp dans un hook `useOrderMessage(cart, customer, ...)` ou un fichier `lib/orderMessage.ts`. Idem pour la logique "réservation trompe l’œil" dans un hook dédié. Cela allège `App.tsx` et facilite les tests.

### 6.2 Constantes
- **Idée** : Centraliser les textes répétés (ex. "Précommande dispo mercredi et samedi", messages de toast) dans un fichier `constants/messages.ts` ou `i18n` si tu envisages plusieurs langues plus tard.

---

## 7. Idées bonus (contenu / fonctionnel)

- **Produit du moment** : Section ou badge "Nouveauté" / "Coup de cœur" piloté par Firebase ou une constante, pour mettre en avant un produit.
- **Date de retrait la plus proche** : Afficher en haut de page ou dans le header une ligne du type "Prochaine récupération : mercredi 19 février" (à partir de `FIRST_PICKUP_DATE_CLASSIC` ou des créneaux).
- **Témoignages** : Si les avis sont structurés (note + texte), ajouter une note moyenne + "4,9/5 sur X avis" pour renforcer la confiance.

---

## Résumé des priorités suggérées

| Priorité | Amélioration |
|----------|--------------|
| Haute    | Loading state sur le bouton d’envoi WhatsApp |
| Haute    | ErrorBoundary → envoi des erreurs à Sentry |
| Moyenne  | Indication "Dans la zone" / "Hors zone" après saisie d’adresse |
| Moyenne  | Manifest.json pour "Ajouter à l’écran d’accueil" (sans SW si besoin) |
| Moyenne  | Image OG dédiée 1200×630 pour le partage |
| Basse    | Extraire `buildOrderMessage` (et logique associée) dans un module dédié |
| Basse    | Préchargement des modales au hover/focus |

Si tu veux, on peut détailler l’implémentation d’une de ces idées en priorité (par exemple le loading sur le bouton d’envoi ou le lien ErrorBoundary → Sentry).
