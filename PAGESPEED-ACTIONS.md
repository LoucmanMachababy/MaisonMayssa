# PageSpeed Insights — Actions et suivi

Rapport du 16 fév. 2026 : **Performance 42** | Accessibilité 79 | Bonnes pratiques 77 | **SEO 100**.

---

## ✅ Déjà corrigé dans le code

- **Accessibilité** : `aria-label` sur les liens/boutons icon-only (Instagram, WhatsApp, menu, recherche, admin), sur les champs date/heure du panier, sur le select heure.
- **Images** : Logo avec `fetchPriority="high"`, `decoding="async"`, dimensions explicites ; preload du logo dans `index.html`.
- **Formulaire** : Champ recherche avec `aria-label` et `id` ; `type="search"` pour le champ recherche.

---

## Performance (objectif : remonter vers 70+)

### Métriques cibles
| Métrique | Actuel | Cible |
|----------|--------|--------|
| LCP (Largest Contentful Paint) | 7,8 s | < 2,5 s |
| FCP (First Contentful Paint) | 3,8 s | < 1,8 s |
| TBT (Total Blocking Time) | 790 ms | < 200 ms |
| CLS (Cumulative Layout Shift) | 0,061 | < 0,1 |

### Actions recommandées

1. **Images (économie estimée ~619 KiB)**
   - Vérifier que toutes les images produits sont en WebP et taille raisonnable (déjà le cas si tout passe par `BlurImage`).
   - Utiliser `loading="lazy"` pour les images hors viewport (déjà en place via BlurImage / Intersection Observer).
   - Éviter d’afficher trop d’images produits au premier rendu (limiter à 6–8 visibles, lazy load le reste).

2. **JavaScript**
   - **Réduire le temps d’exécution** (2,7 s) : le découpage en chunks (react, framer, lucide, firebase) est déjà en place ; garder le chargement dynamique (lazy) pour Admin, modales, etc.
   - **Réduire le JS inutilisé** (~222 KiB) : supprimer ou lazy-load des librairies lourdes si certaines ne sont utiles que sur une partie du site (ex. recharts uniquement en admin).
   - **Réduire les long tasks** (18 détectées) : découper le travail lourd (ex. listes longues) ou le différer après le premier rendu.

3. **Animations (102 éléments animés)**
   - Les animations Framer Motion peuvent contribuer au TBT. Envisager `will-change: transform` ou réduire les animations sur la zone above-the-fold (ex. logo sans animation au chargement pour améliorer le LCP).
   - Respecter `prefers-reduced-motion` (déjà partiellement en place) pour désactiver ou simplifier les animations.

4. **Cache (économie estimée ~125 KiB)**
   - Sur **Vercel** : un `vercel.json` avec en-têtes `Cache-Control` pour les assets statiques (JS, CSS, images) améliore le score « Use efficient cache lifetimes ».
   - Exemple : `assets/*` → `max-age=31536000, immutable` ; `index.html` → `max-age=0, must-revalidate`.

5. **Requêtes bloquantes**
   - Les polices sont déjà chargées en async (`media="print"` + `onload`). Vérifier qu’aucun autre CSS/JS critique ne bloque le rendu inutilement.

---

## Accessibilité (objectif : 90+)

- **Boutons / liens** : Tous les boutons et liens icon-only ont maintenant un `aria-label` ou un texte visible.
- **Formulaires** : Les champs date/heure et recherche ont `aria-label` ; associer des `<label htmlFor="...">` partout où c’est possible pour les autres champs (nom, prénom, téléphone, adresse).
- **Contraste** : Corriger les couleurs signalées (texte sur fond) pour atteindre au moins 4,5:1 (texte normal) ou 3:1 (grand texte).
- **Hiérarchie des titres** : S’assurer que les H1 → H2 → H3 sont dans l’ordre logique (pas de saut H1 → H3).

---

## Bonnes pratiques (objectif : 90+)

- **API dépréciée** : Identifier et remplacer l’API dépréciée signalée (souvent dans une dépendance ou dans le code ; vérifier la console et le détail de l’audit).
- **Erreurs console** : Corriger les erreurs JavaScript qui s’affichent en console au chargement de la page.
- **Sécurité** : CSP, HSTS, COOP, X-Frame-Options, Trusted Types sont des en-têtes serveur (Vercel / hébergeur). Les configurer dans `vercel.json` ou dans les paramètres d’hébergement si tu veux viser 100.

---

## Hébergement (Vercel) — Exemple de configuration

Créer ou compléter `vercel.json` à la racine du projet :

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*).webp",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=2592000" }
      ]
    }
  ]
}
```

Cela améliore le score « Use efficient cache lifetimes » et peut aider légèrement les performances sur les visites suivantes.

---

## Suivi

- Re-tester après déploiement : https://pagespeed.web.dev/
- Cibler d’abord : **LCP** (logo + contenu critique), **TBT** (réduction du JS et des long tasks), **accessibilité** (labels et contraste).
- Le **SEO à 100** est déjà bon ; les gains de performance et d’accessibilité renforcent aussi le classement et l’expérience utilisateur.
