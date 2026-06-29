# Emails automatiques (Cloud Functions + Resend)

Quand un client passe commande et qu’il a renseigné son **email** (champ optionnel) :

1. **Client** : reçoit un email avec le numéro de commande et le récap (articles, total, lien de suivi).
2. **Admin** : reçoit un email « Nouvelle commande #XXX – Consulte le dashboard ».

Quand l’**admin valide** la commande (statut → Validée) :

3. **Client** : reçoit un email « Ta commande a été validée – Dis-nous ce que tu en penses » avec un bouton pour noter la commande.

---

## Coût

- **Firebase Cloud Functions** : quota gratuit (2M invocations/mois).
- **Resend** : 3 000 emails/mois gratuits.

---

## 1. Créer un compte Resend

1. Va sur [resend.com](https://resend.com) et crée un compte.
2. Dans **API Keys**, crée une clé (ex. « Maison Mayssa ») et copie la valeur `re_xxxxx`.
3. En test, les envois partent depuis `onboarding@resend.dev`. En production, ajoute ton domaine (ex. `maison-mayssa.fr`) dans Resend pour envoyer depuis `noreply@maison-mayssa.fr`.

---

## 2. Configurer les paramètres des Functions

Depuis la racine du projet (où se trouve `firebase.json`) :

```bash
cd maison-mayssa-site   # ou la racine du repo
npm install -g firebase-tools   # si pas déjà fait
firebase login
firebase use <ton-project-id>
```

Crée un fichier `functions/.env` (copie de `functions/.env.example`) avec :

```
RESEND_API_KEY=re_xxxxx
ADMIN_EMAIL=roumayssaghazi213@gmail.com
SITE_URL=https://maison-mayssa.fr
```

Ne committe pas `.env`. Au premier `firebase deploy --only functions`, le CLI peut demander les valeurs manquantes et les enregistrer.

---

## 3. Région et instance Realtime Database

Les triggers écoutent l’instance **`maison-mayssa-default-rtdb`** en `europe-west1` (paramètre `RTDB_INSTANCE`).

Si ton URL Firebase ressemble à `https://TON-PROJET-default-rtdb.europe-west1.firebasedatabase.app`, l’instance est `TON-PROJET-default-rtdb`.

Dans `functions/.env` :

```
RTDB_INSTANCE=maison-mayssa-default-rtdb
```

Sans ce paramètre, les triggers **ne se déclenchent pas** et aucun email n’est envoyé (sauf via la callable `sendOrderCreatedEmails` appelée par le site après chaque commande).

---

## 4. Déployer les functions

```bash
cd maison-mayssa-site
firebase deploy --only functions
```

En cas d’erreur, vérifie que le projet Firebase est bien sélectionné (`firebase use`) et que la Realtime Database existe dans la région indiquée.

---

## 5. Vérifier

- Passe une commande de test avec un **email** renseigné : le client et l’admin doivent recevoir les emails.
- Dans l’admin, valide la commande : le client doit recevoir l’email « Noter ma commande ».

Les logs sont dans la [Console Firebase](https://console.firebase.google.com) → Functions → Logs, ou dans Google Cloud Logging.
