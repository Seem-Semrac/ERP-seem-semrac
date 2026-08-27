# Guide — Audit préliminaire de maintenabilité (prestataire externe)

> **Pour le dirigeant.** Ce que tu dois savoir et faire pour confier le dépôt à une entreprise externe qui évalue la **maintenabilité** de l'ERP, **sans exposer de données ni de secrets** de l'entreprise.

## 1. En une phrase

L'auditeur reçoit **le code source + la stack Docker + la documentation**. Il peut **builder, lancer et lire** tout le projet en local, **sans** ta base de données réelle et **sans** tes identifiants cloud. Les vraies données et les secrets restent **hors du dépôt**.

## 2. Ce que l'auditeur reçoit ✅ / ne reçoit pas ⛔

| ✅ Fourni (dans GitHub) | ⛔ Jamais dans GitHub (transmis hors-ligne si besoin) |
|---|---|
| Tout le code source (`src/`, `docker/`, `scripts_*`) | Le PAT Supabase (jeton d'admin base) |
| La doc technique (`docs/technique/`), le manuel (`docs/manuel/`), le wiki (`cerveau application/`) | Le mot de passe Postgres réel (`docker/.env` — gitignoré) |
| La stack Docker complète (ERP + Supabase local + n8n) | Les vraies données métier (clients, fournisseurs, salariés) — voir §5 |
| Les scripts de build/déploiement, la CI GitHub Actions | Le `pg_dump` de la base cloud (schéma + données réelles) |
| Les schémas de tables (DDL) dans `scripts_import/*.sql` | |

## 3. Comment l'auditeur build & lance (2 chemins documentés)

**Chemin A — Stack Docker locale (recommandé, autonome, base Supabase locale vide de données métier)**
```bash
cd docker && docker compose up -d --build
```
→ ERP sur http://localhost:3000, Supabase Studio, n8n. Détails : `docs/technique/12-docker-installation.md`.

**Chemin B — Dev Cloudflare (nécessite un `.dev.vars` local — voir `.dev.vars.example`)**
```bash
npm install
npm run build
npx wrangler pages dev dist --port 8788
```

**Vérifier le projet :**
```bash
npm run verify
```
(= `npm run build` + `node scripts_doc/harness_all_pages.mjs` — le harnais maison qui exécute les scripts clients de chaque page.)

## 4. Où est la documentation (carte pour l'auditeur)

- **`README.md`** (racine) — point d'entrée.
- **`docs/technique/`** — architecture (01), runbook (02), base de données (03/03b), auth-RBAC (04), conventions de code (05), fiches par module (06-modules/), **référence API générée** (07, ~290 routes), sécurité (08), audit de code (09), **variables d'environnement (10)**, **ce guide (11)**, **installation Docker (12)**.
- **`docs/CHANGELOG.md`** — journal chronologique le plus fiable et le plus frais (source de vérité).
- **`docs/manuel/`** — manuel utilisateur (+ `parcours/`, `formulaires/`, captures).
- **`cerveau application/`** — wiki Obsidian (7 briques Front/Back/DB/Docker/N8N/Maintenance/Utilisation).
- **`.claude/skills/`** — 6 skills d'outillage projet (verify, db, deploy, new-module, doc-sync, screenshots).

## 5. Sécurité : posture assumée + ce qui reste à faire

Le projet est un **SSR Hono** : la clé Supabase `anon` est utilisée **côté serveur uniquement** (jamais envoyée au navigateur). C'est une **posture assumée** documentée (`docs/technique/08-securite.md`). Points connus qu'un auditeur relèvera — **déjà identifiés** :

| Élément | État | Action |
|---|---|---|
| **Auth activée en prod** (`AUTH_ENFORCE=on`) | ✅ En place (login matricule+PIN requis) | — |
| Clé `anon` + URL cloud committées (`wrangler.jsonc`, `src/db.ts`, scripts) | Posture assumée | **Roter la clé anon après l'audit** (dashboard Supabase) |
| `JWT_SECRET` (signature des sessions) | ⚠️ **À poser en secret Cloudflare** (sinon repli committé = jetons forgeables) | Voir §6 |
| `BOOTSTRAP_PIN` (compte de secours) | ⚠️ **À poser en secret Cloudflare** (sinon PIN par défaut) | Voir §6 |
| RLS permissive (`anon` peut lire/écrire) | Posture assumée | Durcir le RLS à terme |
| Vraies données fournisseurs | ✅ **Retirées du dépôt** (gitignore) | — |

## 6. Check-list AVANT de remettre le dépôt (ce que TU fais)

1. **Poser les 2 secrets Cloudflare** (une seule fois — ils neutralisent les replis committés) :
   ```bash
   npx wrangler pages secret put JWT_SECRET --project-name seem-semrac-erp
   ```
   ```bash
   npx wrangler pages secret put BOOTSTRAP_PIN --project-name seem-semrac-erp
   ```
   (Choisis un `JWT_SECRET` long et aléatoire ; un `BOOTSTRAP_PIN` que toi seul connais. Après un `put`, redéploie pour qu'il soit pris en compte.)
2. **Confirmer** que le dépôt ne contient plus de données réelles (déjà fait : `fournisseurs_classes.json`, `import_fournisseurs.sql`, `relink_semrac.sql` sont gitignorés).
3. Donner à l'auditeur **l'accès en lecture** au dépôt GitHub (pas de droit d'écriture, pas de secrets d'Actions).
4. **Ne pas** transmettre le PAT Supabase ni `docker/.env` via GitHub (hors-ligne uniquement, si l'auditeur en a besoin).

## 7. APRÈS l'audit

- **Roter la clé Supabase `anon`** (dashboard Supabase → Settings → API → *Rotate anon key*), puis mettre à jour `wrangler.jsonc` / `src/db.ts` / `.dev.vars` et redéployer.
- Changer le `BOOTSTRAP_PIN`.
- Traiter les recommandations de l'auditeur (tests automatisés, durcissement RLS, etc.).

## 8. Ce que l'auditeur va probablement souligner (pour ne pas être surpris)

- **Pas de tests automatisés** (la vérif repose sur `harness_all_pages.mjs` + e2e manuels décrits au CHANGELOG).
- **`tsc` non bloquant** (~60 erreurs de types héritées ; le build esbuild/vite passe).
- **Fichiers volumineux** (`src/index.tsx` ~routeur de 290 routes, `src/prod.tsx`, `src/qualite.tsx`).
- **Schéma métier hors dépôt** (base réelle via `pg_dump` cloud, non versionnée).
- **Secrets de repli committés** (traités en §5/§6).

Ce sont des points **connus et documentés** — leur présence dans ce guide montre à l'auditeur qu'ils sont maîtrisés, pas ignorés.
