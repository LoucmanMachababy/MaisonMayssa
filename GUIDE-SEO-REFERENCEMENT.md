# Guide SEO et référencement — Maison Mayssa

Objectif : **le meilleur référencement possible** pour « trompe l'œil Annecy », « pâtisserie Annecy », et la marque Maison Mayssa.

---

## ✅ Déjà en place sur le site

### Balises et meta
- **Title** : « Trompe l'œil Annecy | Maison Mayssa - Pâtisseries artisanales » (mot-clé en tête)
- **Meta description** : 150–160 caractères, avec « Trompe l'œil à Annecy » et parfums
- **Meta keywords** : trompe l'oeil annecy, trompe l'oeil pâtissier annecy, etc.
- **Canonical** : https://maison-mayssa.fr/
- **Robots** : index, follow
- **Lang** : fr sur `<html>`

### Open Graph et Twitter
- og:title, og:description, og:image, og:url, og:locale
- og:image:width, og:image:height, og:image:alt, og:site_name
- Twitter card summary_large_image

### Données structurées (Schema.org)
- **Bakery** : nom, adresse Annecy, téléphone, horaires, zone desservie, alternateName (dont « Trompe l'œil Annecy »)
- **ItemList** : liste des 6 trompes l'œil (rich results)
- **WebSite** : nom, URL, langue
- **FAQPage** : 5 questions/réponses (affichage FAQ dans Google)
- **BreadcrumbList** : Accueil
- **AggregateRating** : injecté dynamiquement si avis présents

### Technique
- **Preload** du logo (LCP)
- **Preconnect** : fonts, API adresse
- **Sitemap** : /sitemap.xml
- **robots.txt** : Allow / + Sitemap
- **Contenu** : H1, H2 « Trompe l'œil Annecy », section #trompe-loeil-annecy, texte dédié
- **Images** : alt descriptifs (logo, produits)

---

## 🎯 Checklist à faire en dehors du code

### 1. Google Search Console
- [ ] Ajouter la propriété https://maison-mayssa.fr
- [ ] Vérifier le site (balise HTML ou fichier à la racine)
- [ ] Envoyer le sitemap : https://maison-mayssa.fr/sitemap.xml
- [ ] Contrôler l’indexation et les erreurs (onglet « Couverture » / « Pages »)
- [ ] Utiliser « Inspection d’URL » pour la page d’accueil et les URLs importantes

### 2. Google Business Profile (ex-Google My Business)
- [ ] Créer ou réclamer la fiche « Maison Mayssa » à Annecy
- [ ] Catégorie principale : **Pâtisserie** ou **Boulangerie**
- [ ] Libellés / description : inclure **« trompe l'œil »**, **« pâtisserie artisanale »**, **« Annecy »**
- [ ] Adresse, téléphone, site (maison-mayssa.fr), horaires à jour
- [ ] Photos : logo, trompes l'œil, boutique/atelier, carte
- [ ] Récolter des avis Google (lien court depuis le site ou WhatsApp)

### 3. Image de partage (Open Graph)
- [ ] Créer une image **1200 × 630 px** pour og:image (photo de pâtisseries + « Maison Mayssa – Annecy » ou « Trompe l'œil Annecy »)
- [ ] Remplacer dans index.html :  
  `og:image` et `twitter:image` par l’URL de cette image (ex. /og-image.webp)
- [ ] Ajuster og:image:width et og:image:height à 1200 et 630

### 4. Performance (Core Web Vitals)
- [ ] Mesurer avec PageSpeed Insights (https://pagespeed.web.dev)
- [ ] Garder les images en WebP, tailles raisonnables
- [ ] Lazy-load des images hors viewport (déjà en place si BlurImage / lazy)
- [ ] Éviter les scripts tiers lourds qui bloquent le rendu

### 5. Contenu et mots-clés
- [ ] **Trompe l'œil Annecy** : déjà présent dans title, H2, description, schema, texte
- [ ] Variantes à garder dans les textes : « trompe l'oeil pâtissier annecy », « pâtisserie annecy », « livraison annecy »
- [ ] Une page ou un bloc « À propos » / « Notre histoire » avec 2–3 paragraphes (Annecy, trompe l'œil, valeurs) aide le SEO

### 6. Liens (netlinking)
- [ ] Annuaires locaux : Annecy, Haute-Savoie, pâtisseries
- [ ] Blogs / sites food, sorties Annecy
- [ ] Partenaires (salle de réception, traiteurs) avec lien vers maison-mayssa.fr
- [ ] Instagram / réseaux : lien site dans la bio

### 7. Réseaux et signaux
- [ ] Publier régulièrement (trompes l'œil, nouveautés, commandes) sur Instagram
- [ ] Utiliser les hashtags : #trompeloeil #annecy #patisserie #maisonmayssa
- [ ] Inciter les clients à laisser un avis Google après commande

### 8. Vérifications techniques récurrentes
- [ ] Tester les données structurées : https://search.google.com/test/rich-results
- [ ] Vérifier les meta et le titre en « résultat de recherche » (Search Console ou simulation)
- [ ] S’assurer qu’aucune erreur 404 importante (liens cassés, anciennes URLs)

---

## 📐 Bonnes pratiques générales

| Règle | Pourquoi |
|-------|----------|
| Un seul H1 par page | Hiérarchie claire pour Google |
| Title 50–60 caractères | Affichage complet dans les SERP |
| Description 150–160 caractères | Idem, avec appel à l’action |
| URL courte et lisible | maison-mayssa.fr est idéal |
| Contenu unique | Pas de copier-coller d’autres sites |
| Mobile-first | Google indexe en priorité la version mobile |
| HTTPS | Obligatoire pour la confiance et le SEO |
| Vitesse | LCP, FID, CLS dans le vert (Core Web Vitals) |

---

## 🔗 Outils utiles

- **Google Search Console** : indexation, sitemap, erreurs, performances
- **Google Business Profile** : fiche locale, avis, photos
- **PageSpeed Insights** : performance et Core Web Vitals
- **Test des résultats enrichis** : validation des schema.org
- **Screaming Frog** (ou équivalent) : audit des URLs, titres, meta (optionnel)

---

## Résumé prioritaire

1. **Search Console** : propriété + sitemap + vérification.
2. **Google Business Profile** : fiche complète avec « trompe l'œil » et Annecy.
3. **Image OG 1200×630** : meilleur rendu sur Google et réseaux.
4. **Avis Google** : encourager les clients à noter.
5. **Quelques backlinks** : annuaires Annecy / Haute-Savoie, partenaires.

Le site est déjà bien préparé côté technique et contenu ; le reste dépend du temps que tu consacres à la fiche Google, au contenu et aux liens externes.
