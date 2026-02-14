# Maison Mayssa · Site de précommande

Site de précommande pour **Maison Mayssa** — pâtisseries artisanales à Annecy (brownies, cookies, trompe l'œil, boxes, layer cups, tiramisus…).  
React + TypeScript + Vite, déployé sur Vercel, données et auth Firebase.

---

## Développement

```bash
npm install
npm run dev
```

Variables d'environnement : copier `.env.example` vers `.env` et renseigner les clés Firebase (`VITE_FIREBASE_*`).
Optionnelles : `VITE_SENTRY_DSN` (monitoring erreurs Sentry).

- **Build** : `npm run build`
- **Preview build** : `npm run preview`
- **Tests** : `npm run test` (watch) / `npm run test:run` (une fois) / `npm run test:coverage`
- **Tests E2E** : `npm run test:e2e` (Playwright, parcours commande)
- **Lint** : `npm run lint`

---

## Checklist de test (après un push)

À faire **de A à Z** après chaque déploiement (Vercel preview ou production) pour vérifier que tout fonctionne.

### 1. Page d'accueil & navigation

- [ ] La page charge sans erreur (loader puis contenu).
- [ ] **Header** : logo, titre "Maison Mayssa", texte "Douceurs artisanales • Annecy", badge Ouvert/Fermé, "Livraison offerte dès 45 €", bouton Appeler (lien tel), lien Instagram.
- [ ] **Bandeau promo** : texte "Livraison offerte…" ou "Précommandes — récupération à partir du mercredi 18 février 2026" selon la date ; bouton fermer puis disparition (et ne réapparaît pas après refresh si déjà fermé).
- [ ] **Navbar** : logo, recherche, filtres par catégorie, favoris, panier, compte (Mon Compte).
- [ ] **Footer** : liens La Carte, Commander, Témoignages, Livraison, Contact ; livraison 45 € ; Mentions légales, Politique de confidentialité ; 5 clics sur le logo → accès admin (`#admin`).
- [ ] Clic sur les liens d’ancrage du footer (La Carte, Commander, etc.) → scroll vers la bonne section.

### 2. Catalogue & produits

- [ ] **Catégories** : filtrage par Trompe l'oeil, Brownies, Cookies, Layer Cups, Boxes, Mini Gourmandises, Tiramisus.
- [ ] **Recherche** : taper un nom de produit → les bons produits s’affichent.
- [ ] **Cartes produit** : image, nom, prix, badge stock / "Dès le 14/02" pour trompe l’œil, bouton favori (cœur).
- [ ] **Trompe l’œil** : clic sur un trompe l’œil ouvre la modal dédiée (quantité, précommande sous 3 j).
- [ ] **Produits avec taille** (ex. Layer Cups) : clic ouvre le modal de choix de taille (petite/grande).
- [ ] **Tiramisu** : clic ouvre la modal de personnalisation.
- [ ] **Mini boxes / Box cookies-brownies** : clic ouvre la modal de personnalisation (coulis, parfums selon le produit).
- [ ] **Produits simples** (ex. brownie, cookie) : un clic ajoute directement au panier (toast "ajouté au panier").
- [ ] **Favoris** : clic cœur ajoute/retire des favoris ; section Favoris affichée si au moins un favori.

### 3. Panier

- [ ] **Ouverture** : clic sur l’icône panier (desktop) ou barre panier (mobile) ouvre le panier.
- [ ] **Contenu** : liste des articles, quantités (+ / −), suppression possible, sous-total et total corrects.
- [ ] **Message précommande** : si le panier contient des produits classiques et qu’on est avant le 18/02/2026, le message "Précommandes — récupération à partir du mercredi 18 février 2026" s’affiche.
- [ ] **Après 23h** : si le panier contient des pâtisseries/cookies (hors trompe l’œil), message "Commandes possibles jusqu'à 23h" et bouton d’envoi désactivé pour ces produits (trompe l’œil reste envoyable).
- [ ] **Timer de réservation** : pour les trompe l’œil en préco., le timer "En attente de précommande" ou "Précommande confirmée" s’affiche correctement.

### 4. Formulaire client & livraison

- [ ] **Retrait / Livraison** : bascule Retrait sur place vs Livraison.
- [ ] **Champs** : Nom, Prénom, Téléphone, Adresse (pour livraison), Date souhaitée, Heure souhaitée, Note.
- [ ] **Autocomplétion adresse** : en tapant une adresse, des suggestions apparaissent (API adresse.gouv) ; sélection → remplissage de l’adresse et des coordonnées.
- [ ] **Zone de livraison** : adresse dans la zone → livraison 5 € si &lt; 45 €, offerte si ≥ 45 € ; hors zone → message "Tarif à définir".
- [ ] **Date/heure** : choix de date (date min selon jour/heure) et créneaux proposés cohérents (retrait à partir de 18h30, livraison à partir de 20h par ex.).
- [ ] **Validation** : erreurs affichées sur les champs invalides (ex. téléphone, champs obligatoires).

### 5. Envoi de commande (WhatsApp uniquement)

- [ ] **Commande par WhatsApp uniquement** : pas de choix de canal ; un seul bouton "Envoyer sur WhatsApp".
- [ ] **Clic "Envoyer sur WhatsApp"** : ouvre WhatsApp (app ou web) avec le message prérempli (infos client, liste des produits, récap, mentions préco. trompe l’œil et/ou "récupération à partir du 18/02" si pertinent).
- [ ] **Récompense fidélité** : si connecté et assez de points, choix d'une récompense ; elle apparaît dans le message (0 €).

### 6. Compte client & fidélité

- [ ] **Ouverture compte** : "Mon Compte" dans la navbar ouvre la modal/page Compte (connexion si pas connecté).
- [ ] **Connexion / Inscription** : email + mot de passe ; création de compte et connexion OK.
- [ ] **Profil** : affichage des points fidélité, anniversaire si renseigné.
- [ ] **Fidélité** : ajout au panier sans être connecté peut afficher un rappel "Créez un compte pour gagner des points" ; après connexion, les points s’affichent et peuvent être utilisés en récompense au checkout.

### 7. Pages légales & ancres

- [ ] **Mentions légales** : lien footer → scroll ou section #mentions-legales affichée.
- [ ] **Politique de confidentialité** : lien footer → #confidentialite.
- [ ] **Témoignages** : lien "Témoignages" → section témoignages.
- [ ] **Zone de livraison** : lien "Livraison" → section livraison.

### 8. Admin

- [ ] **Accès** : 5 clics sur le logo du footer → URL `#admin` → page Admin.
- [ ] **Ou** : clic sur l’icône ⚙️ en bas à gauche du footer → même résultat.
- [ ] **Dashboard** : indicateur "Précommandes ouvertes aujourd’hui" ou "fermées" selon jour/heure configurés.
- [ ] **Commandes** : liste des commandes récentes (si des commandes existent).
- [ ] **Produits / Stock** : gestion des stocks (trompe l’œil, etc.) si l’onglet existe.
- [ ] **Paramètres** : jours et horaires d’ouverture des précommandes (ex. Mercredi 12:00, Samedi 00:00).
- [ ] **Retour site** : lien ou bouton "Retour au site" → hash retiré, retour à l’accueil.

### 9. Mobile

- [ ] **Responsive** : tout le site est utilisable sur mobile (pas de débordement, boutons accessibles).
- [ ] **Bottom nav** : Accueil, Panier, Favoris (ou équivalent) si présent.
- [ ] **Cart sheet** : panier en tiroir depuis le bas ; mêmes infos que desktop (préco. 18/02, 23h, etc.).
- [ ] **Fiches produit mobiles** : swipe pour favoris / ajout panier si implémenté.
- [ ] **Recherche vocale** : si disponible, vérifier qu’elle déclenche bien la recherche.

### 10. Divers

- [ ] **Lien partagé produit** : ouvrir une URL avec `?produit=id` ou `#produit=id` → le produit s’ouvre ou s’ajoute au panier selon la logique actuelle.
- [ ] **Toasts** : les notifications (ajout au panier, erreur 23h, etc.) s’affichent et disparaissent.
- [ ] **Hors ligne** : en coupant le réseau, l’indicateur "Hors ligne" ou équivalent apparaît (PWA).
- [ ] **Accessibilité** : raccourcis "Passer au contenu" (skip links) si présents ; navigation au clavier possible sur les boutons principaux.

---

## Résumé rapide (smoke test)

Si tu n’as que 5 minutes :

1. Chargement de la page + bandeau + header + footer.
2. Ajouter un brownie/cookie au panier → toast + panier mis à jour.
3. Ouvrir le panier → formulaire client → choisir WhatsApp → "Commander maintenant" → message WhatsApp prérempli.
4. 5 clics sur le logo footer → accès admin.
5. Sur mobile : même parcours + panier en tiroir.

---

## Commandes projet

| Commande            | Description                    |
|---------------------|--------------------------------|
| `npm run dev`       | Serveur de dev                 |
| `npm run build`     | Build production               |
| `npm run preview`   | Prévisualiser le build         |
| `npm run test`      | Tests en mode watch            |
| `npm run test:run`  | Tests une fois                 |
| `npm run test:coverage` | Tests + couverture         |
| `npm run lint`      | ESLint                         |
