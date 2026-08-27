# Déploiement Cloudflare Pages — bêta de connexion

App Hono SSR (Cloudflare Pages/Workers) reliée à Supabase. Projet Pages : **`webapp`**. Sortie build : `./dist`.
Coût : **gratuit** pour un bêta (Cloudflare Pages free + Supabase free).

---

## ⭐ MÉTHODE LA PLUS SIMPLE — glisser-déposer le dossier `dist/` (zéro config)

> Le glisser-déposer de **Cloudflare Pages exécute le serveur** (`dist/_worker.js`) — c'est ce qui rend cette méthode possible sans configuration.
> Et grâce aux valeurs par défaut embarquées, **aucune variable d'environnement n'est nécessaire**.

1. **Construire** (déjà fait par l'assistant) : `npm run build` → produit `dist/` = **3 éléments** (`_worker.js` + `_routes.json` + `static/`).
   ⚠️ On glisse **le dossier `dist/`**, PAS le projet entier (c'était la cause de l'erreur « 1000 fichiers »).
2. Aller sur https://dash.cloudflare.com → **Workers & Pages** → **Create** → onglet **Pages** → **Upload assets**.
3. Nommer le projet (ex. `seem-semrac-erp`) → **glisser le dossier `dist/`** dans la zone d'upload → **Deploy site**.
4. Cloudflare donne l'URL **`https://<projet>.pages.dev`**. **Ça marche tout de suite** — l'app tourne et parle à la base.
5. Se connecter : **matricule `ADMIN` / PIN `246810`** (compte admin embarqué).

**Mettre à jour ensuite** : `npm run build`, puis dans le projet Pages → **Create new deployment** → reglisser `dist/`.

> 🔒 Bêta : le secret de session et le compte `ADMIN/246810` sont **embarqués côté serveur** (jamais envoyés au navigateur, comme la clé Supabase). Pour durcir en prod, poser les variables `JWT_SECRET` / `BOOTSTRAP_MATRICULE` / `BOOTSTRAP_PIN` dans le dashboard (elles remplacent les valeurs par défaut).

---

## 0. Prérequis (une fois)
- **Node.js** installé (le repo utilise déjà `npx wrangler` 4.x).
- Un **compte Cloudflare** (gratuit) : https://dash.cloudflare.com/sign-up
- Le **projet Supabase réveillé** (le plan gratuit se met en pause après ~1 semaine d'inactivité) : dashboard Supabase → si « Paused », cliquer **Restore**.

## 1. Générer un secret JWT fort (à garder de côté)
```bash
openssl rand -base64 48
# (ou sous Windows PowerShell)
# node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```
Copiez la valeur — elle servira à l'étape 4.

## 2. Se connecter à Cloudflare
```bash
npx wrangler login
```
(ouvre le navigateur pour autoriser le compte)

## 3. Premier déploiement (crée le projet Pages + une URL publique)
```bash
npm run deploy        # = npm run build  &&  wrangler pages deploy (dossier ./dist lu depuis wrangler.jsonc)
```
- Au tout premier lancement, wrangler peut demander de **créer le projet** (nom : `webapp`) et la **branche de production** (ex. `main`). Acceptez.
- À la fin, wrangler affiche l'URL publique : **`https://webapp.pages.dev`** (ou `https://<hash>.webapp.pages.dev`).

## 4. Poser les secrets (le projet existe maintenant)
```bash
npx wrangler pages secret put JWT_SECRET         --project-name webapp   # coller le secret de l'étape 1
npx wrangler pages secret put BOOTSTRAP_MATRICULE --project-name webapp   # ex : ADMIN
npx wrangler pages secret put BOOTSTRAP_PIN       --project-name webapp   # un code PIN secret
```
> `AUTH_ENFORCE=on`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` sont déjà dans `wrangler.jsonc` (rien à faire).
> `JWT_SECRET` **doit** être posé (sinon, `AUTH_ENFORCE=on` → refus volontaire de démarrer les sessions).

## 5. Re-déployer pour appliquer les secrets
```bash
npm run deploy
```
(les secrets s'appliquent aux déploiements **suivants**)

## 6. Première connexion + création des comptes testeurs
1. Ouvrir `https://webapp.pages.dev`.
2. Se connecter avec **BOOTSTRAP_MATRICULE / BOOTSTRAP_PIN** (le compte de secours → accès Direction complet).
3. Aller dans **RH › Employés**, créer chaque testeur avec **matricule + code PIN** (et le(s) rôle(s) voulu(s)).
4. Communiquer à chacun : l'URL + son matricule + son PIN.

---

## Mettre à jour après une modif de code
```bash
npm run deploy
```

## Divers
- **Nom de domaine perso** (optionnel, gratuit) : dashboard Cloudflare → Workers & Pages → `webapp` → Custom domains.
- **Revenir en arrière** : dashboard → `webapp` → Deployments → sur un déploiement précédent → *Rollback*.
- **Voir les logs en direct** : `npx wrangler pages deployment tail --project-name webapp`.
- **Tester en local** (facultatif) : copier `.dev.vars.example` → `.dev.vars` (déjà gitignored), puis `npm run dev`.

## Sécurité (rappel — posture assumée pour le bêta)
- `JWT_SECRET` et `BOOTSTRAP_PIN` = **secrets Pages** (chiffrés), **jamais** committés. ✔
- La **clé anon Supabase** reste committée dans le code (décision actée) : acceptable pour un bêta interne. Pour un usage plus large, la sortir en secret + activer la RLS.
- Pensez à **changer le BOOTSTRAP_PIN** (ou le retirer) une fois les comptes réels créés.
