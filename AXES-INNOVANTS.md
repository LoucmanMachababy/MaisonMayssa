# Axes d’amélioration innovants & percutants — Maison Mayssa

Pistes différenciantes, orientées impact et mémorabilité, au-delà des améliorations déjà listées.

---

## 1. Storytelling & émotion

### 1.1 « L’histoire derrière la pâtisserie »
- **Accroche** : Chaque produit a une micro-histoire (inspiration, ingrédient coup de cœur, anecdote).
- **Idée** : Sur la fiche produit ou en tooltip : « Pourquoi ce brownie ? », « L’idée du trompe-l’œil avocat ».
- **Impact** : Attachement émotionnel, partage (« j’ai adoré l’histoire du tiramisu »), SEO (contenu unique).

### 1.2 Message sur la boîte
- **Accroche** : « Un mot sur l’emballage : on l’écrit pour toi. »
- **Idée** : Champ optionnel « Message sur la boîte » (anniversaire, remerciement, prénom). Affiché sur le récap et sur l’emballage en boutique.
- **Impact** : Parfait pour les cadeaux, très Instagram, différenciation forte.

---

## 2. Urgence & rareté (douce)

### 2.1 Stock en direct par créneau
- **Accroche** : « Plus que X parts de tiramisu pour samedi 14h–16h. »
- **Idée** : Si le stock est géré par créneau, afficher la jauge (ex. 3 restantes) à côté du créneau dans le panier.
- **Impact** : Transparence = confiance ; urgence douce sans agressivité.

### 2.2 Éditions limitées
- **Accroche** : « Spécial fêtes : plus disponible après le 25. »
- **Idée** : Badge ou date de fin de dispo sur certains produits (Firebase ou constante). Compte à rebours optionnel.
- **Impact** : FOMO positif, justification d’achat « maintenant ».

---

## 3. Social proof & viralité

### 3.1 « Ils viennent de commander »
- **Accroche** : « Marie a commandé un Brownie Kinder il y a 2 min » (anonymisé, type Booking).
- **Idée** : Bandeau ou pastilles en temps réel (dernières commandes sans données perso, ex. « 1 brownie », « 1 box surprise »).
- **Impact** : Preuve sociale immédiate, envie d’acheter.

### 3.2 Partage « Ma commande » après validation
- **Accroche** : « Tag @maisonmayssa avec ta box pour être reposté. »
- **Idée** : Après envoi WhatsApp, CTA « Partager sur Instagram » avec message pré-rempli + lien vers la page « Ma commande » (déjà en place). Optionnel : concours « meilleure photo de ta box ».
- **Impact** : UGC gratuit, communauté, visibilité.

### 3.3 Carte de la communauté
- **Accroche** : « Nos clients à Annecy, Rumilly, Faverges… »
- **Idée** : Carte (heatmap ou pastilles anonymisées par ville/CP) des livraisons ou des inscrits. Section « Où sont nos clients ».
- **Impact** : Sentiment d’appartenance, preuve de zone couverte.

---

## 4. Expérience client (pratique)

### 4.1 Rappel « Ta commande est prête demain »
- **Accroche** : « On te prévient la veille et le jour J. »
- **Idée** : Notification (email ou push si FCM) la veille et/ou le matin du créneau : « Ta commande est prête demain 14h–16h ».
- **Impact** : Moins de no-show, clients plus sereins.

### 4.2 Instructions livreur en avant
- **Accroche** : « Code, étage, « sonner 2 fois » : on transmet au livreur. »
- **Idée** : Champ dédié « Instructions pour le livreur » (en plus de la note), mis en évidence dans le récap et transmis clairement au livreur.
- **Impact** : Livraisons plus fluides, moins d’appels.

### 4.3 Préférences alimentaires (compte)
- **Accroche** : « Allergies et préférences : on les retient. »
- **Idée** : Dans le profil : allergies, sans gluten, sans noix, etc. Pré-remplies dans chaque commande et rappelées dans le récap.
- **Impact** : Sécurité, personnalisation, moins d’oublis.

---

## 5. Personnalisation & data

### 5.1 « Recommandé pour toi »
- **Accroche** : « La dernière fois tu as pris un Brownie Kinder – découvre le Brownie Café. »
- **Idée** : Bloc « Pour toi » (connecté + historique) : 1–2 produits basés sur les achats passés ou les favoris.
- **Impact** : Panier moyen, sentiment d’être reconnu.

### 5.2 Anniversaire de commande
- **Accroche** : « Il y a 1 an tu goûtais ton premier tiramisu – -10 % ce week-end. »
- **Idée** : Email ou notification à J-365 : « 1 an déjà ! » + code promo unique.
- **Impact** : Réactivation, fidélité, émotion.

---

## 6. Opérationnel & différenciation

### 6.1 Créneau « express » (retrait)
- **Accroche** : « Tu passes dans 30 min ? On te prépare. »
- **Idée** : Option « Je viens dans 30 min » si stock dispo et horaire cohérent (à définir). Créneau dédié « express » en admin.
- **Impact** : Capte les pressés, image réactive.

### 6.2 Liste de souhaits partageable (cadeau)
- **Accroche** : « Crée ta liste anniversaire : la famille commande pour toi. »
- **Idée** : Page « Ma liste » (produits + quantités) → lien partageable. Les proches ajoutent au panier depuis la liste et commandent. Optionnel : budget max, message commun.
- **Impact** : Cadeaux groupés, viralité familiale.

### 6.3 Abonnement « Box du mois »
- **Accroche** : « 1 box surprise par mois, tu ne choisis plus. »
- **Idée** : Produit ou formule « Abonnement 1 box/mois » (paiement récurrent Stripe ou manuel). Contenu surprise chaque mois.
- **Impact** : Revenu récurrent, fidélisation forte.

---

## 7. Engagement & fun

### 7.1 Quiz « Quel dessert es-tu ? »
- **Accroche** : « 3 questions → on te dit quel dessert tu es + -10 %. »
- **Idée** : Micro-quiz (goût, occasion, texture) → résultat « Tu es un Brownie Kinder » + lien produit + code promo unique.
- **Impact** : Viral, partage, découverte des produits.

### 7.2 Réveil « Ouverture des commandes »
- **Accroche** : « Réveille-moi le mercredi à 8h pour ne pas rater la préco. »
- **Idée** : Option (compte ou bandeau) « Me notifier à l’ouverture des commandes » (mercredi/samedi). Push ou email automatique.
- **Impact** : Habitude, moins de « j’ai oublié ».

### 7.3 Niveau VIP / Client Or
- **Accroche** : « Après 10 commandes : accès prioritaire + petite surprise. »
- **Idée** : Palier « Client Or » (badge, avantages : créneaux prioritaires ou petit cadeau surprise dans une commande).
- **Impact** : Fidélisation, sentiment d’élite, bouche-à-oreille.

---

## 8. Technique & innovation

### 8.1 Filtre Instagram / Snap « Ma box Maison Mayssa »
- **Accroche** : « Montre ta box en AR sur les réseaux. »
- **Idée** : Filtre (face ou monde) avec logo / visuel Maison Mayssa ou une box virtuelle. Partenariat créateur ou outil type Spark AR / Lens Studio.
- **Impact** : Branding fort, partage gratuit, jeune et moderne.

### 8.2 Invitation événement « Dégustation clients »
- **Accroche** : « Soirée dégustation réservée à nos meilleurs clients. »
- **Idée** : Invitation (email) pour un événement IRL (dégustation, atelier). Critère : X commandes ou clients actifs.
- **Impact** : Communauté, lien fort, contenu pour les réseaux.

---

## Synthèse : Top 5 « percutants » à prioriser

| Priorité | Idée | Effort estimé | Impact |
|----------|------|----------------|--------|
| 1 | **Message sur la boîte** | Faible (champ + récap) | Cadeaux, partage, différenciation |
| 2 | **« Ils viennent de commander »** | Moyen (Firebase + affichage) | Preuve sociale immédiate |
| 3 | **Quiz « Quel dessert es-tu ? »** | Moyen (page + code promo) | Viral, découverte, conversion |
| 4 | **Rappel « Ta commande est prête demain »** | Moyen (email/push) | Moins de no-show, sérénité |
| 5 | **Liste de souhaits partageable** | Élevé (page + logique partage) | Cadeaux groupés, viralité |

Tu peux piocher une idée par axe selon ton temps et tes objectifs (conversion, fidélisation, visibilité, communauté). Si tu veux, on peut détailler l’implémentation d’une de ces idées en priorité.
