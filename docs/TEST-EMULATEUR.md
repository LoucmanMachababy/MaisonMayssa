# Tester en local sans toucher à la prod (émulateurs Firebase)

**Pourquoi c’est nécessaire :** Depuis `http://localhost:5173`, les appels vers les Cloud Functions en prod sont bloqués par le navigateur (CORS). Le bouton « Vérifier » du mystère ne peut pas appeler la fonction. En utilisant les émulateurs, l’app appelle `localhost:5001` et tout fonctionne.

Pour tester le **trompe l'oeil mystère** (ou le reste du site) sans modifier la base ni les functions en production :

## 1. Créer `.env.local`

À la racine de `maison-mayssa-site`, crée un fichier `.env.local` avec la **même config** que ton `.env` (ou celle de prod), et ajoute la ligne qui active les émulateurs :

```
VITE_USE_FIREBASE_EMULATOR=true
```

(Garde aussi tes variables `VITE_FIREBASE_*` si tu les mets dans `.env.local`, sinon elles sont lues depuis `.env`.)

## 2. Lancer les émulateurs

Dans un premier terminal :

```bash
cd maison-mayssa-site
firebase emulators:start --only database,functions
```

La base tourne sur le port **9000**, les functions sur **5001**. L’interface des émulateurs est sur **http://localhost:4000**.

## 3. Lancer le site

Dans un second terminal :

```bash
cd maison-mayssa-site
npm run dev
```

Ouvre **http://localhost:5173** (ou l’URL affichée).  
Tant que `VITE_USE_FIREBASE_EMULATOR=true` est dans `.env.local`, l’app parle aux émulateurs : **aucun impact sur la prod**.

## 4. Tester le mystère

- La carte « Trompe l'oeil mystère » s’affiche (image cachée, 3 choix : Gousse de vanille, Fraise, Myrtilles).
- Choisis **Fraise** et clique sur **Vérifier** → le mystère se révèle en local (dans l’émulateur).
- Tu peux réinitialiser pour retester : dans l’UI des émulateurs (http://localhost:4000), onglet Database, supprime le noeud `mysteryFraise` ou remets `revealed: false` et `winnerUid: null`.

## 5. Revenir sur la prod

- Supprime la ligne `VITE_USE_FIREBASE_EMULATOR=true` de `.env.local`, ou renomme/supprime `.env.local`.
- Redémarre `npm run dev` : l’app utilisera à nouveau la vraie base et les vraies functions.
