# Plan : Comptes clients & programme de fidélité Maison Mayssa

**Version « niveau au-dessus »** — compatible avec le fonctionnement actuel (précommande WhatsApp / Insta, pas de paiement en ligne), simple à gérer, et qui donne envie de revenir vite.

---

## 1. Objectifs & logique globale

### 1.1 Objectifs

- **Fidéliser** : les clients créent un compte pour ne pas « perdre » leurs points ; plus ils commandent, plus ils gagnent.
- **Développer les réseaux** : bonus points pour Instagram et TikTok (honneur système).
- **Donner envie de revenir** : 1 € = 1 point → la surprise à 60 pts est atteignable en 1 à 2 commandes (effet « wow » rapide).
- **Rester simple pour toi** : pas de paiement en ligne ; tu valides la commande et les récompenses comme aujourd’hui (WhatsApp / Insta).

### 1.2 Trois leviers du programme

1. **Points à chaque commande** — le cœur du système (sans ça, 60 pts serait trop loin).
2. **Boosts** — actions qui t’aident : création de compte, Insta, TikTok, avis, parrainage.
3. **Petites attentions événementielles** — Ramadan, anniversaire Maison Mayssa, anniversaire client, « client régulier ».

Les comptes clients (Firebase Auth + Realtime Database) sont le socle : dès que quelqu’un commande plusieurs fois, on l’encourage à créer son compte pour ne pas perdre ses points.

---

## 2. Backend : choix technique

**Recommandation : rester sur Firebase** (déjà en place).

| Besoin | Solution Firebase |
|--------|-------------------|
| Inscription / Connexion client | Firebase Authentication (email + mot de passe) |
| Profil client | Realtime Database : `users/{uid}` |
| Points, historique, tier | Realtime Database : `users/{uid}/loyalty` |
| Récompenses réclamées | Realtime Database : `users/{uid}/rewards` |
| Admin (Roumayssa) | Déjà en place (Auth séparé, `#admin`) |

**Séparation admin / client :**
- Comptes **admin** : créés manuellement, utilisés uniquement pour `#admin`.
- Comptes **clients** : créés par le site (inscription), stockés dans `users/{uid}` (éventuellement `role: 'client'`). Règles de sécurité : lecture/écriture `users/{uid}` uniquement par l’utilisateur `uid` (et lecture par l’admin si besoin).

---

## 3. Barème de points (simple et motivant)

**Une phrase à communiquer :** *« 1 € dépensé = 1 point, et des bonus pour nous suivre ou créer ton compte. »*

### 3.1 Gains de points

| Action | Points | Une seule fois ? | Comment |
|--------|--------|-------------------|--------|
| **1 € dépensé** (commande) | 1 point par € (arrondi) | Non, à chaque commande | Enregistré quand la commande est validée (ou au moment de l’envoi du message si connecté). |
| **Création de compte** | +15 | Oui | Automatique à la création du profil. |
| **S’abonner à Instagram** | +15 | Oui | Clic « J’ai suivi » → ouvre Instagram → on enregistre `instagramClaimedAt`. |
| **S’abonner à TikTok** | +15 | Oui | Idem avec lien TikTok → `tiktokClaimedAt`. |
| **Avis après commande** (v1.5) | +10 | Par avis (à limiter si besoin) | Bouton « J’ai laissé un avis » ou toi tu coches à la main (message, story, Google…). |

**Exemple :** commande de 25 € + compte créé + suivi Insta → 25 + 15 + 15 = **55 points**. Une deuxième petite commande ou TikTok → **60 points** (surprise atteignable rapidement).

### 3.2 Tiers : bonus pour les plus fidèles (optionnel, v1.5 ou v2)

On calcule un **niveau** à partir des **points cumulés à vie** (`lifetimePoints`), jamais décrémentés (contrairement à `points` qui baisse quand on dépense).

| Niveau | Points à vie | Avantage |
|--------|-------------|----------|
| **Douceur** | 0 – 149 | Programme de base (1 € = 1 pt). |
| **Gourmand** | 150 – 399 | +5 % de points sur chaque commande (ex. 1 € = 1,05 pt, arrondi). |
| **Prestige** | 400+ | +10 % de points + petite attention anniversaire (ex. brownie offert à utiliser sur une commande du mois). |

- Stockage : `users/{uid}.loyalty.tier` (Douceur / Gourmand / Prestige), recalculé à chaque ajout de points.
- `lifetimePoints` : incrémenté à chaque gain, **jamais** décrémenté quand le client dépense des points pour une récompense.

---

## 4. Structure des données (Firebase)

### 4.1 `users/{uid}` (profil client)

```json
{
  "email": "client@example.com",
  "firstName": "Marie",
  "lastName": "Dupont",
  "phone": "06 12 34 56 78",
  "createdAt": 1739123456789,
  "birthday": "1990-05-15",
  "loyalty": {
    "points": 72,
    "lifetimePoints": 132,
    "tier": "Gourmand",
    "history": [
      { "reason": "creation_compte", "points": 15, "at": 1739123456789 },
      { "reason": "instagram_follow", "points": 15, "at": 1739123500000 },
      { "reason": "tiktok_follow", "points": 15, "at": 1739123600000 },
      { "reason": "order_points", "points": 25, "amount": 25, "orderId": "abc123", "at": 1739124000000 },
      { "reason": "order_points", "points": 27, "amount": 26.5, "orderId": "def456", "at": 1739125000000 },
      { "reason": "review_bonus", "points": 10, "at": 1739126000000 }
    ],
    "instagramClaimedAt": 1739123500000,
    "tiktokClaimedAt": 1739123600000
  }
}
```

- **points** : solde actuel (décrémenté quand le client « dépense » des points pour une récompense).
- **lifetimePoints** : total cumulé à vie (jamais décrémenté) → sert au calcul du **tier**.
- **tier** : `"Douceur"` | `"Gourmand"` | `"Prestige"` (optionnel en v1).
- **history** : transparence et debug ; chaque entrée a un `reason` et un `points` (et selon le cas `amount`, `orderId`, etc.).
- **birthday** : optionnel (pour plus tard, attention anniversaire client).

### 4.2 `users/{uid}/rewards` (récompenses réclamées)

```json
{
  "reward_abc": {
    "type": "surprise_maison_mayssa",
    "pointsSpent": 60,
    "claimedAt": 1739127000000,
    "usedInOrderId": null
  }
}
```

- **type** : identifiant de la récompense (surprise_maison_mayssa, remise_5e, mini_box, box_fidelite, etc.).
- **pointsSpent** : points déduits au moment de la réclamation.
- **usedInOrderId** : optionnel, pour lier à une commande si tu veux tracer l’utilisation (ex. -5 € sur la commande X).

---

## 5. Récompenses : échelle lisible

| Points | Récompense | Détail technique |
|--------|------------|------------------|
| **60** | Surprise Maison Mayssa | Produit ou assortiment choisi par toi. Bouton « Réclamer » si `points >= 60` → enregistrement dans `rewards` + déduction de 60 pts. |
| **100** | -5 € sur la commande | Remise notée dans la récompense ; à utiliser sur la prochaine commande (tu appliques à la main en voyant le message). |
| **150** | Mini box (ou box dédiée programme) | Comme la surprise : réclamation → `rewards` + déduction. |
| **250** | Box Fidélité / création plus généreuse | Idem. |

- **Expiration des points** (recommandation v1) : ne pas faire expirer au début. Message rassurant : *« Tes points ne s’effacent pas tant que tu commandes au moins une fois par an »* (règle à appliquer manuellement ou plus tard en automatique si tu veux).

---

## 6. Intégration au site actuel

### 6.1 Accès au compte

- **Navbar / bas de page** : lien **« Mon compte & fidélité »**.
- **Non connecté** : « S’inscrire » / « Se connecter » (modal ou page dédiée).
- **Connecté** : « Mon compte » (profil + points + récompenses) + déconnexion.

### 6.2 Page « Mon compte » (si connecté)

- Infos profil (éditables : prénom, nom, téléphone, optionnel anniversaire).
- **Solde de points** et **niveau** (Douceur / Gourmand / Prestige) si tiers activé.
- Liste des récompenses **disponibles** (avec coût en points) et **réclamées** (historique).
- Boutons **« Suivre sur Instagram (+15 pts) »** / **« Suivre sur TikTok (+15 pts) »** si pas encore réclamés (ouvre le réseau puis « J’ai suivi » pour créditer).

### 6.3 Zone panier (avant « Choisissez un mode pour envoyer votre commande »)

- **Si connecté :**
  - Phrase du type : *« Tu gagneras environ **XX** points avec cette commande. »* (XX = total du panier en €, arrondi, éventuellement ajusté par le tier).
  - Rappel : *« Solde actuel : **YY** points. »*
- **Si une récompense est disponible** (ex. 60 pts et le client a ≥ 60) :
  - Texte : *« Tu peux utiliser ta récompense : Surprise Maison Mayssa (60 pts) »* + petit bouton **« Utiliser pour cette commande »**.
  - Au clic : on ajoute une ligne dans le **message** qui part sur WhatsApp / Insta (ex. *« 🎁 Surprise fidélité (60 pts utilisés) »*), sans modifier le paiement (tu valides à la main).
- Comme il n’y a pas de paiement en ligne, **toi tu vérifies** dans le message que la récompense est cohérente avec le solde du client et tu prépares la surprise.

### 6.4 Attribution des points « commande »

- **Option A** : au moment où le client envoie le message (s’il est connecté), on estime les points (total panier en €) et on les ajoute tout de suite (avec un libellé « en attente de validation » si tu veux ; à valider côté admin plus tard).
- **Option B** : l’admin, en validant la commande dans `#admin`, déclenche l’attribution des points (il faudrait alors lier la commande à un `uid` client, ex. via numéro de téléphone ou email).

La **Option A** est plus simple pour le client (il voit ses points monter tout de suite) ; tu peux ensuite en v2 ajouter une vérification admin pour éviter les abus.

---

## 7. Parcours client (inscription / connexion)

### 7.1 Inscription

- **Champs** : email, mot de passe, prénom, nom, téléphone (optionnel).
- Après création du compte Firebase Auth : création de `users/{uid}` avec **+15 points** (creation_compte) et premier enregistrement dans `loyalty.history`.

### 7.2 Connexion / Déconnexion

- Connexion : email + mot de passe.
- Déconnexion : bouton dans « Mon compte ».
- Optionnel v1 : « Mot de passe oublié » (Firebase envoie l’email).

---

## 8. Spécial Ramadan & événements

Pour créer un effet saisonnier et renforcer la fidélité :

| Événement | Règle | Technique |
|-----------|--------|-----------|
| **Ramadan** | x1,5 points sur les box Ramadan ou les commandes après 21h | Entrées `history` avec `reason: "ramadan_bonus"`, points = bonus en plus du base 1 € = 1 pt. |
| **Semaine anniversaire Maison Mayssa** | +20 points sur une commande (une fois) | `reason: "anniversary_bonus"`. |
| **Anniversaire client** (plus tard) | Brownie ou layer cup offert à partir de X € de commande (mois d’anniversaire) | Champ `birthday` dans `users/{uid}` ; entrée `reason: "birthday_bonus"` ou récompense spéciale. |

Techniquement, ce sont des lignes supplémentaires dans `loyalty.history` avec les `reason` adaptés ; l’admin ou le site peut appliquer les règles (date, type de produit, horaire, etc.).

---

## 9. Réseaux sociaux : honneur système

Instagram et TikTok ne permettent pas de vérifier « cet utilisateur nous suit » depuis le site. Donc :

- Boutons « Suivre sur Instagram (+15 pts) » / « Suivre sur TikTok (+15 pts) » → ouvrent le profil Maison Mayssa dans un nouvel onglet.
- Au retour, le client clique « J’ai suivi » → on enregistre la date et on ajoute les 15 points (une seule fois par compte). Simple, légal, et suffisant pour pousser les abonnements.

---

## 10. Récapitulatif des écrans / blocs

| Écran / bloc | Contenu principal |
|--------------|-------------------|
| **Inscription** | Email, mot de passe, prénom, nom, téléphone (optionnel). « Créer mon compte » → +15 pts. |
| **Connexion** | Email, mot de passe. « Mot de passe oublié » (optionnel v1). |
| **Mon compte & fidélité** | Profil, solde de points, niveau (si tiers), historique des gains (optionnel), boutons Insta/TikTok si pas réclamés, liste des récompenses (disponibles + réclamées), boutons « Réclamer » selon le solde. |
| **Panier** (si connecté) | « Tu gagneras environ XX points » + « Solde : YY points » ; si récompense disponible : « Utiliser : Surprise (60 pts) » → ajout d’une ligne dans le message WhatsApp/Insta. |
| **Navbar / footer** | « Mon compte & fidélité » ; si non connecté « S’inscrire » / « Se connecter ». |

---

## 11. Ordre de développement proposé

1. **Firebase**
   - Activer Auth Email/Password pour les clients.
   - Règles Realtime DB pour `users/{uid}` (lecture/écriture par `uid`).

2. **Auth client**
   - Inscription (email, mot de passe, prénom, nom) → création `users/{uid}` avec **+15 points**.
   - Connexion / Déconnexion.

3. **Profil & points**
   - Page « Mon compte » : profil, solde, historique (optionnel), boutons Insta/TikTok « J’ai suivi ».

4. **Points commande**
   - Lors de l’envoi du message (panier) : si connecté, enregistrer les points (total € = points) dans `loyalty.history` + incrémenter `points` et `lifetimePoints`. (Lier la commande au `uid` via email/téléphone si besoin.)

5. **Récompenses**
   - Afficher les récompenses disponibles (60 / 100 / 150 / 250 pts).
   - Bouton « Réclamer » si `points >= coût` → enregistrement dans `rewards` + déduction des points.
   - Dans le panier : « Utiliser Surprise (60 pts) pour cette commande » → ajout d’une ligne dans le message WhatsApp/Insta.

6. **Optionnel (v1.5 / v2)**
   - Tiers (Douceur / Gourmand / Prestige) avec `lifetimePoints` et bonus %.
   - Bonus avis (+10 pts).
   - Ramadan / anniversaire Maison Mayssa / anniversaire client.
   - Admin : onglet « Récompenses réclamées » et vue des points par client si besoin.
   - « Mot de passe oublié ».

---

## 12. Résumé

- **Backend** : Firebase (Auth + Realtime Database), comme dans le plan initial.
- **Cœur du système** : **1 € dépensé = 1 point** ; bonus création de compte (+15), Insta (+15), TikTok (+15), avis (+10) plus tard.
- **Surprise à 60 pts** atteignable en 1 à 2 commandes + compte + réseaux → effet « wow » rapide.
- **Récompenses** : 60 pts = Surprise Maison Mayssa ; 100 = -5 € ; 150 = Mini box ; 250 = Box Fidélité. Même logique technique : réclamation → `rewards` + déduction des points.
- **Intégration site** : « Mon compte & fidélité » dans la navbar ; dans le panier, affichage des points gagnés + solde + option « Utiliser ma récompense » avec ligne ajoutée dans le message WhatsApp/Insta. Pas de paiement en ligne → validation manuelle de ta part.
- **Évolution** : Tiers (Gourmand, Prestige), événements (Ramadan, anniversaires), bonus avis/parrainage, sans changer l’architecture.

Dès que tu valides cette version du plan, on peut passer à l’implémentation étape par étape.
