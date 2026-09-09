# ERP Seem Semrac — instructions projet

SSR **Hono** (TSX server-side, zéro framework client) + **Supabase** (PostgREST, clé anon dans `src/db.ts` — posture assumée) + **Cloudflare Pages** (`dist/` uniquement). ~15 services, RBAC 13 rôles (`src/auth.ts`), login matricule+PIN. Langue du projet : **français** (UI, doc, commits descriptifs acceptés en ASCII).

## Skills du projet (les utiliser, ne pas réinventer)
| Skill | Quand |
|---|---|
| `erp-verify` | après TOUTE modif de code, avant commit (tsc + build + harnais toutes-pages + e2e) |
| `erp-db` | toute opération Supabase (DDL, sondes, pièges RLS/NOT NULL/noms de tables) |
| `erp-deploy` | mise en production (Cloudflare/Netlify) |
| `erp-new-module` | nouveau service/onglet/API (câblage complet + conventions JS client) |
| `erp-doc-sync` | **OBLIGATOIRE en fin de toute session qui a modifié le dépôt** |
| `erp-screenshots` | l'UI a changé → rafraîchir les captures de la doc |

## Règles non négociables
1. **« Fini » = code + `dist/` + doc + manuel à jour, systématiquement.** Toute modification de l'application (code / DB / process) DOIT, avant d'être considérée comme terminée, entraîner **automatiquement et dans le même mouvement** la mise à jour de ces trois artefacts — jamais l'un sans les autres :
   - **le build `dist/`** (`npm run build`) — c'est le seul artefact déployé ; un `dist/` périmé = correctif invisible en ligne. Rebuild à chaque modif, puis mise en production via `erp-deploy`.
   - **la documentation technique de maintenance** (`docs/technique/` : architecture, base de données, réf API, runbook d'exploitation, `docs/CHANGELOG.md`) — pour le prestataire qui reprendra l'ERP.
   - **le manuel utilisateur** (`docs/manuel/` + captures rafraîchies via `erp-screenshots` dès que l'UI change).
   Outillé et rendu obligatoire par `erp-doc-sync` (doc technique + manuel + memory) et `erp-deploy` (rebuild `dist/` + mise en ligne). La doc vit dans `docs/` (technique / manuel / fiches-poste).
2. **Vérifier avant de committer** : `erp-verify` vert (dont `node scripts_doc/harness_all_pages.mjs` — attrape les bugs d'échappement des scripts clients, 1ʳᵉ cause de régression du dépôt).
3. **Aucune donnée de démo inventée** en base ; données de test préfixées `-TEST-` et supprimées après usage.
4. **Secrets** : ne jamais écrire le PAT Supabase en clair (fichier, commit, memory). Clé anon committée = choix assumé, ne pas y toucher.
5. JS client dans les templates TSX : suivre les conventions d'échappement de `erp-new-module` (`\\'`, `\\n`, `sjX`, délégation d'événements).

## Dépôt git — Seem-Semrac est le dépôt principal (depuis le 09/09/2026)
- **`origin` = `Seem-Semrac/ERP-seem-semrac`** (privé). On y **committe et pousse directement** : plus d'étape de publication séparée, `scripts_doc/publier_pro.*` est obsolète.
- **`archive` = `Krmaaaaaa/ERP`** — ancien dépôt de travail, conservé pour l'historique (277 commits, 4,8 Go). Branche locale `archive-historique`.
- La VM tire de `origin`. Cycle complet : `git push` sur le poste, puis `~/erp/docker/scripts/erp-docker.sh maj` sur la VM.

## Repères du dépôt
- `src/index.tsx` = routeur (≈290 routes) · `src/queries.ts` = accès données · `src/shared.ts` = layout/sidebar/helpers · `src/auth.ts` = RBAC (4 points de câblage par service).
- `scripts_import/*.sql` = schémas DB (source de vérité DDL) · `scripts_doc/` = outillage doc/vérif.
- `docs/` = documentation (source Markdown ; recueils imprimables via `scripts_doc/build_print.mjs`).
- Dev local : `npm run build` puis `npx wrangler pages dev dist --port 8788` (pas de HMR — rebuilder pour voir un changement).
