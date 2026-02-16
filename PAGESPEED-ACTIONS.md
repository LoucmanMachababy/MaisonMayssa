# PageSpeed Insights — Actions et suivi

**Objectif : 100 sur les 4 catégories** (Performance, Accessibilité, Bonnes pratiques, SEO).

Rapport du 16 fév. 2026 : **Performance 42→60** | **Accessibilité 91** | **Bonnes pratiques 77→90+** | **SEO 100**.

---

## ✅ Déjà corrigé dans le code

- **Accessibilité** : `aria-label` sur tous les boutons/liens icon-only ; labels et `aria-labelledby` sur les champs ; hiérarchie H1→H2→H3 ; contraste renforcé (text-mayssa-brown/75 ou /80 au lieu de /60).
- **Images** : Logo avec `fetchPriority="high"`, `decoding="async"`, preload dans `index.html`. **boutique-fictif** en WebP (113 Ko) avec `<picture>` + fallback PNG.
- **Performance** : Cache `.png` + `.webp` + assets dans `vercel.json` ; `loading="lazy"` + `decoding="async"` + dimensions partout ; 4 premières cartes en `priority` ; animation logo Header 0,15 s.
- **Sécurité (Bonnes pratiques)** : En-têtes dans `vercel.json` — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Referrer-Policy`.

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

## Bonnes pratiques (objectif : 100)

- **Sécurité** : X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy sont en place. Pour 100 : CSP stricte (peut casser le build Vite sans nonces), HSTS (souvent activé au niveau domaine Vercel), COOP, Trusted Types (avancé).
- **API dépréciée** : Souvent dans une dépendance (Firebase, etc.) ; mettre à jour les deps ou attendre un correctif.
- **Erreurs console** : Si Lighthouse signale des erreurs au chargement, les corriger (try/catch, pas de throw en global).

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
