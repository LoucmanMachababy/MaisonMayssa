# Paiement Stripe — Click & collect (carte + Apple Pay)

Le paiement en ligne utilise **Stripe Payment Element** (carte bancaire, Apple Pay,
Google Pay) avec un **PaymentIntent créé côté serveur** (Cloud Function), pour ne
jamais exposer la clé secrète ni faire confiance au montant envoyé par le client.

## Architecture

| Élément | Où | Rôle |
|---|---|---|
| Clé **publiable** `pk_…` | `.env.local` → `VITE_STRIPE_PUBLISHABLE_KEY` | Chargée dans le front (sûre, publique) |
| Clé **secrète** `sk_…` | Param Functions `STRIPE_SECRET_KEY` | Crée les PaymentIntents (jamais dans le front) |
| Secret webhook `whsec_…` | Param Functions `STRIPE_WEBHOOK_SECRET` | Vérifie la signature des événements Stripe |
| `createPaymentIntent` | `functions/index.js` (callable) | Recalcule le montant et renvoie le `clientSecret` |
| `stripeWebhook` | `functions/index.js` (onRequest) | Reçoit `payment_intent.succeeded` (journal/filet) |
| `StripePayment.tsx` | front | Affiche le Payment Element et confirme le paiement |
| `PaymentSection.tsx` | front | Aiguille Stripe réel ↔ paiement simulé |

## Bascule simulé → réel

Dans `src/constants/checkout.ts` :

```ts
export const STRIPE_LIVE = false   // ← passer à true quand tout est configuré
```

Tant que `STRIPE_LIVE === false` (ou si la clé publiable est absente), le checkout
affiche le **paiement simulé** (aucun débit) pour ne pas bloquer la mise en ligne.

## Mise en place (mode test puis prod)

### 1. Clés API

Dashboard Stripe → **Développeurs → Clés API**.

- Copier la clé **publiable** (`pk_test_…`) dans `.env.local` :
  ```
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
  ```
- Configurer la clé **secrète** côté Functions (ne pas la committer) :
  ```bash
  cd <racine du repo>
  firebase functions:secrets:set STRIPE_SECRET_KEY     # coller sk_test_xxx
  ```
  > En `firebase-functions` v6, `defineString` lit aussi un `functions/.env`.
  > Tu peux donc, en local, mettre `STRIPE_SECRET_KEY=sk_test_xxx` dans `functions/.env`
  > (déjà gitignoré). En prod, préférer `functions:secrets:set`.

### 2. Apple Pay / Google Pay

- Apple Pay : Dashboard Stripe → **Paramètres → Payment methods → Apple Pay**,
  puis enregistrer le **domaine** `maison-mayssa.fr` (Stripe gère le fichier de
  vérification automatiquement avec le Payment Element).
- Google Pay : activé automatiquement via `automatic_payment_methods`.

### 3. Webhook

1. Déployer les functions (étape 4) pour obtenir l'URL de `stripeWebhook`, du type :
   `https://europe-west1-<projet>.cloudfunctions.net/stripeWebhook`
2. Dashboard Stripe → **Développeurs → Webhooks → Ajouter un endpoint**, coller l'URL,
   écouter au moins `payment_intent.succeeded` et `payment_intent.payment_failed`.
3. Copier le **Signing secret** (`whsec_…`) :
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # coller whsec_xxx
   ```

### 4. Déployer

```bash
firebase deploy --only functions
```

### 5. Activer le mode réel

Passer `STRIPE_LIVE = true` dans `src/constants/checkout.ts`, rebuild + redeploy du
front. Tester avec une **carte de test** Stripe (`4242 4242 4242 4242`, date future,
CVC quelconque) avant de passer aux clés `live`.

## Notes

- Le montant est **toujours recalculé côté serveur** dans `createPaymentIntent`
  à partir des `items` (prix × quantité) ; les remises/dons sont bornés. Le total
  envoyé par le front n'est pas utilisé pour le débit.
- La commande est créée après confirmation du paiement (flux front). Le webhook
  sert de journal ; on peut l'étendre pour réconcilier les paiements orphelins.
