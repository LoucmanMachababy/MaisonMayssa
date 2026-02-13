# Règles Firebase Realtime Database

## Où les mettre

1. Ouvre [Firebase Console](https://console.firebase.google.com) → ton projet **Maison Mayssa**
2. **Realtime Database** → onglet **Règles**
3. Remplace tout le contenu par le contenu de `firebase-database-rules.json` (ou copie-colle ci‑dessous)
4. Clique sur **Publier**

## Règles à coller

```json
{
  "rules": {
    "stock": {
      ".read": true,
      ".write": "auth != null"
    },
    "settings": {
      ".read": true,
      ".write": "auth != null"
    },
    "products": {
      ".read": true,
      ".write": "auth != null"
    },
    "orders": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

## Résumé

| Chemin    | Lecture              | Écriture                    |
|-----------|----------------------|-----------------------------|
| `stock`   | Tout le monde        | Utilisateurs connectés      |
| `settings`| Tout le monde        | Utilisateurs connectés      |
| `products`| Tout le monde        | Utilisateurs connectés      |
| `orders`  | Utilisateurs connectés | Utilisateurs connectés   |
| `users/{uid}` | Uniquement le propriétaire | Uniquement le propriétaire |

- **Stock** : les réservations / mises à jour de stock ne fonctionnent que pour les **utilisateurs connectés**. Si un visiteur non connecté réserve un trompe‑l’œil, il aura une erreur de permission.
- Pour autoriser aussi les **invités** à réserver (sans compte), tu peux mettre pour `stock` : `".write": true`. Attention : n’importe qui pourrait alors modifier le stock depuis la console ou un script.

## Option : restreindre l’admin aux seuls écritures sensibles

Si tu veux que **seul l’admin** puisse modifier `stock`, `settings`, `products` et le statut des `orders` :

1. Dans Firebase Console → **Authentication** → utilisateur admin → menu ⋮ → **Gérer les revendications personnalisées** → ajoute `admin: true`.
2. Dans les règles, remplace les `.write` de `stock`, `settings`, `products` par :
   - `".write": "auth != null && auth.token.admin === true"`
3. Pour que les clients puissent quand même réserver le stock (réservation trompe‑l’œil), il faudrait alors une **Cloud Function** qui met à jour le stock après vérification, car les règles ne pourront plus autoriser les clients à écrire dans `stock`.

Pour l’instant, les règles ci‑dessus (écriture pour tout utilisateur connecté) suffisent pour que le site fonctionne sans erreur `PERMISSION_DENIED`.
