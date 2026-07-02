# Fiabilité paiements — webhook-first Stripe

## Le problème résolu

Avant : la commande était créée par le **navigateur du client**, juste après le
paiement Stripe. Si le client fermait l'onglet ou perdait le réseau entre le
paiement et la création, **l'argent était encaissé mais aucune commande n'était
enregistrée** — invisible pour le client comme pour l'admin.

## La solution (A + B)

Un paiement réussi donne **toujours** une commande, garanti côté serveur :

1. **(A) Création automatique** — à la création du PaymentIntent,
   `createPaymentIntent` stocke un brouillon complet de la commande dans
   `pendingOrders/{paymentIntentId}`. Quand Stripe confirme le paiement
   (`payment_intent.succeeded`), le **webhook** crée la commande via `placeOrder`,
   même si le navigateur ne revient jamais.

2. **(B) Filet de sécurité** — si aucun brouillon n'est exploitable (vieux flux,
   erreur), le webhook enregistre `orphanPayments/{paymentIntentId}` et **envoie
   un email d'alerte à l'admin** pour réconciliation manuelle.

### Idempotence (pas de doublon)

L'index `paymentIntentToOrder/{paymentIntentId}` garantit qu'un PaymentIntent ne
crée **qu'une seule** commande, quel que soit le chemin (front, webhook, retry
Stripe). Le webhook attend 3 s (délai de grâce) pour laisser le front finir sa
propre création dans le cas nominal.

## ⚠️ Configuration requise en production

Le fix **ne marche que si le webhook Stripe est branché**. Sans ça, (A) et (B)
ne se déclenchent jamais.

### 1. Déployer les functions et les règles

```bash
firebase deploy --only functions,database
```

### 2. Configurer le webhook dans Stripe

Dashboard Stripe → **Développeurs → Webhooks → Ajouter un endpoint** :

- **URL** : `https://europe-west1-maison-mayssa.cloudfunctions.net/stripeWebhook`
  (vérifier l'URL exacte affichée après `firebase deploy`)
- **Événements à écouter** :
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### 3. Renseigner le secret du webhook

Copier le **Signing secret** (`whsec_…`) affiché par Stripe, puis :

```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# coller le whsec_... quand demandé
firebase deploy --only functions:stripeWebhook
```

Les emails d'alerte (filet B) utilisent `RESEND_API_KEY` (déjà configuré) et
`ADMIN_EMAIL`.

## Vérifier que ça marche

- Dans Stripe → Webhooks, l'endpoint doit afficher des réponses **200**.
- Un paiement test crée bien une commande dans `orders` (et `pendingOrders/{pi}`
  est nettoyé).
- Simuler un abandon (payer puis fermer l'onglet avant retour) : la commande
  doit apparaître ~3 s après, créée par le webhook.
- Si un paiement reste orphelin, l'admin reçoit l'email d'alerte et l'entrée
  apparaît dans `orphanPayments`.

## Données RTDB (toutes admin-only / serveur)

| Chemin | Rôle | Accès |
|---|---|---|
| `pendingOrders/{pi}` | Brouillon de commande en attente de paiement | serveur only (`false`/`false`) |
| `paymentIntentToOrder/{pi}` | Index idempotence PI → orderId | serveur only (`false`/`false`) |
| `orphanPayments/{pi}` | Paiements sans commande (à réconcilier) | admin only |
