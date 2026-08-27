> 🧠 [Cerveau (accueil)](README.md) · Voisines : **toutes** (c'est la brique méta) · surtout [🗄️ DB](03-db-et-api-rest.md) · [🐳 Docker](04-docker.md)

# 🛠️ Brique 06 — MAINTENANCE

**État : ✅ Fait** — comment garder l'application vivante, sûre, et **transmissible à un externe**.

## L'idée en une phrase
Rien n'est « fini » tant que **le code + `dist/` + la doc technique + le manuel** ne sont pas à jour **ensemble**. Cette discipline est outillée par **6 skills** et une **boucle de vérification**.

## Les 6 skills projet (`.claude/skills/erp-*`)
| Skill | Quand l'utiliser |
|---|---|
| [`erp-verify`](../.claude/skills/erp-verify/SKILL.md) | Après **toute** modif de code, avant commit. |
| [`erp-db`](../.claude/skills/erp-db/SKILL.md) | Toute opération Supabase (DDL, sondes, pièges). |
| [`erp-deploy`](../.claude/skills/erp-deploy/SKILL.md) | Mise en production. |
| [`erp-new-module`](../.claude/skills/erp-new-module/SKILL.md) | Nouveau service/onglet/API (câblage complet). |
| [`erp-doc-sync`](../.claude/skills/erp-doc-sync/SKILL.md) | **Fin de toute session** ayant modifié le dépôt. |
| [`erp-screenshots`](../.claude/skills/erp-screenshots/SKILL.md) | L'UI a changé → refaire les captures. |

## La boucle de vérification (le réflexe n°1)
```
npm run verify   =   tsc  +  vite build  +  node scripts_doc/harness_all_pages.mjs
```
- **tsc** : les types tiennent.
- **build** : `dist/` se régénère (le seul artefact déployé).
- **harnais** : exécute le JS de **toutes** les pages → attrape les bugs d'échappement (1ʳᵉ cause de régression).
- Puis, pour les changements sensibles : **e2e** (`app.request(...)` avec `AUTH_ENFORCE=off`) + **sondes REST** Supabase, et **nettoyage** des données de test (préfixe `-TEST-`).

## Déploiement
- **Aujourd'hui** : `npm run build` → glisser `dist/` dans Cloudflare Pages **ou** `npx wrangler pages deploy dist`. On ne déploie **que** `dist/` (3 fichiers).
- **Demain** : `docker compose up` ([🐳 Docker](04-docker.md)).
- Runbook complet : [`docs/technique/02-exploitation-runbook.md`](../docs/technique/02-exploitation-runbook.md).

## Secrets (règle absolue)
- **Jamais en clair** dans un fichier/commit/mémoire : le **PAT Supabase**.
- **Secrets Cloudflare Pages** : `JWT_SECRET`, `BOOTSTRAP_MATRICULE`, `BOOTSTRAP_PIN` (via `wrangler pages secret put`). En local : fichier `.dev.vars` (déjà ignoré) — modèle dans `.dev.vars.example`.
- La **clé anon** committée dans `src/db.ts` = **choix assumé** (SSR, serveur-only). Ne pas y toucher sans raison.

## Ce qui assure la réversibilité (reprise par un externe)
| Levier | État |
|---|---|
| Tout en git (code + SQL + imports + doc) | ✅ |
| Doc de reprise ([`docs/technique/`](../docs/technique/)) | ✅ |
| Schéma DB rejouable (`scripts_import/*.sql`) | ✅ |
| Techno standard (Node/Postgres/Docker), zéro lock-in | 🟡 (complet au self-host) |
| Build reproductible (lockfile + Dockerfile) | 🟡 |
| **Sauvegardes + restauration testées** | 🔜 **le vrai reste-à-faire** |

## L'audit de sécurité (déjà passé)
16 défauts trouvés → l'essentiel corrigé (RBAC fail-closed, portes qualité, idempotence, XSS…). Restants **assumés en bêta** : RLS permissive, secrets à roter, login sans anti-brute-force. Détail : [`docs/technique/09-audit.md`](../docs/technique/09-audit.md) · [`08-securite.md`](../docs/technique/08-securite.md).

## Quand cette brique change → à maintenir
Toute évolution de process/outillage → mettre à jour le skill concerné + [`docs/CHANGELOG.md`](../docs/CHANGELOG.md) + cette page.

## Pour aller plus loin
[`docs/technique/02-exploitation-runbook.md`](../docs/technique/02-exploitation-runbook.md) · [`CLAUDE.md`](../CLAUDE.md) · [`docs/technique/09-audit.md`](../docs/technique/09-audit.md)
