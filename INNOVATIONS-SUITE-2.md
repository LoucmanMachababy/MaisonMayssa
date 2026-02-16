# Nouvelles idées innovantes — Maison Mayssa (suite 2)

Pistes supplémentaires pour se démarquer : expérience, viralité, technique, fidélisation.

---

## 1. Urgence douce & timing

### Compte à rebours « Plus que X h pour commander pour demain »
- **Idée** : Bandeau ou pastille en haut de page : « Plus que 2 h pour une commande à récupérer demain 14h–16h » (basé sur l’heure de coupure des précommandes).
- **Impact** : Rappel sans être agressif, limite les « j’ai oublié ».

### Lien « Ajouter au calendrier »
- **Idée** : Après choix du créneau (date + heure), bouton « Ajouter à mon calendrier » qui génère un fichier `.ics` ou lien Google Calendar (titre « Maison Mayssa – Retrait/Livraison », date/heure, adresse).
- **Impact** : Moins de no-show, le client a le créneau dans son agenda.

---

## 2. Engagement & viralité

### Roue de la chance (spin the wheel)
- **Idée** : Pop-up ou section « Tourne la roue » (1 fois par session ou par email) : -5 %, -10 %, « 1 cookie offert », « Livraison offerte », « Rien cette fois ». Enregistrement de l’email si pas connecté.
- **Impact** : Capture de leads, buzz, partage (« j’ai gagné -10 % »).

### « Ce produit a reçu X ❤️ cette semaine »
- **Idée** : Afficher un compteur de « cœurs » ou de favoris par produit (anonyme), mis à jour en temps réel ou quotidien.
- **Impact** : Preuve sociale, effet de tendance.

### Avis avec photo
- **Idée** : Lors du dépôt d’avis après commande, permettre d’uploader une photo (box reçue, trompe-l’œil à table). Modération simple (validation admin ou auto si pas de contenu sensible).
- **Impact** : UGC de qualité, galerie « Nos clients », meilleur taux de conversion.

---

## 3. Cadeaux & partage

### Carte cadeau digitale
- **Idée** : Produit « Carte cadeau 20 € » (ou montant au choix). Après paiement : lien unique + code envoyé par email, utilisable au checkout. Solde décrémenté à chaque commande.
- **Impact** : Cadeaux sans se déplacer, nouveaux clients via le bénéficiaire.

### Message cadeau personnalisé (déjà proche du « message sur la boîte »)
- **Idée** : En plus du message sur la boîte : option « C’est un cadeau » → champ « De la part de… » + message, affiché sur le récap et sur l’emballage.
- **Impact** : Déjà dans les axes ; à coupler avec carte cadeau.

---

## 4. Revenir & réactiver

### « Préviens-moi quand ce produit est dispo »
- **Idée** : Sur un produit en rupture ou « bientôt dispo », bouton « Me notifier ». Enregistrement email + id produit en Firebase ; au retour en stock (admin ou cron), envoi d’un email ou notification.
- **Impact** : Ne rate pas une vente, réactive l’intérêt.

### Rappel « Ton créneau dans 1 h »
- **Idée** : 1 h avant l’heure de retrait/livraison, notification (email ou push si activé) : « Ta commande est prête dans 1 h (14h–16h). À tout de suite ! »
- **Impact** : Moins d’oubli, meilleure ponctualité.

---

## 5. Technique & différenciation

### « En ce moment en cuisine »
- **Idée** : Bandeau ou pastille : « On prépare 12 commandes en ce moment » (compteur basé sur les commandes du jour en statut « en préparation » ou nombre de commandes du créneau). Optionnel : « Prochaine dispo retrait : 14h. »
- **Impact** : Transparence, sentiment de vie, preuve d’activité.

### Mode sombre (dark mode)
- **Idée** : Toggle dans le header ou dans les paramètres accessibilité : thème clair / sombre (couleurs adaptées : fond sombre, texte clair). Stockage en `localStorage` + respect de `prefers-color-scheme` si pas de choix.
- **Impact** : Confort le soir, accessibilité, image moderne.

### QR code sur les boîtes
- **Idée** : Petit QR sur l’emballage → lien vers « Laisse un avis » (page pré-remplie avec l’orderId si possible) ou vers « Découvre nos recettes / prochains trompe-l’œil ».
- **Impact** : Plus d’avis, lien physique → digital.

---

## 6. Recommandation & personnalisation

### « Pour ce soir » / « Selon l’occasion »
- **Idée** : Filtres ou bloc « Pour un dîner à 2 », « Pour un goûter kids », « Pour impressionner » → affichage de 3–4 produits recommandés (règles simples : nombre de parts, type de produit).
- **Impact** : Aide au choix, panier moyen.

### « Recommander ma dernière commande »
- **Idée** : Pour les clients connectés avec historique : bouton « Reprendre ma dernière commande » (recopie des articles + adresse/créneau par défaut, à modifier si besoin).
- **Impact** : Fidélité, commande en quelques secondes.

---

## Synthèse : 5 idées « coup de projecteur »

| Idée | Effort | Impact |
|------|--------|--------|
| **Compte à rebours** « Plus que X h pour demain » | Faible | Urgence douce, conversion |
| **Ajouter au calendrier** (lien .ics / Google) | Faible | Moins de no-show |
| **Roue de la chance** (-5 % / -10 % / cookie) | Moyen | Capture emails, viralité |
| **Avis avec photo** | Moyen | UGC, confiance, SEO |
| **« Préviens-moi quand dispo »** | Moyen | Réactivation, ventes perdues récupérées |

Tu peux en choisir une ou deux et on peut détailler l’implémentation (données Firebase, composants, wording) si tu veux.
