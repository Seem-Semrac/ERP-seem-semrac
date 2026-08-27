# Variables d'environnement — inventaire consolidé

> Toutes les variables du projet, par contexte. **Aucun secret réel n'est committé** : seuls les `*.example` (valeurs de démo/placeholder) le sont. Les vrais secrets vivent dans `.dev.vars` (local), `docker/.env` (Docker) et les **secrets Cloudflare Pages** (prod) — tous **gitignorés**.

## 1. Application ERP — PRODUCTION (Cloudflare Pages)

Définies dans `wrangler.jsonc` (`vars`, non secrètes) **et** en **secrets Pages** (chiffrés, à poser via `wrangler pages secret put`).

| Variable | Où | Rôle | Défaut / repli |
|---|---|---|---|
| `SUPABASE_URL` | `wrangler.jsonc` vars | URL du projet Supabase cloud | committé (posture assumée) |
| `SUPABASE_ANON_KEY` | `wrangler.jsonc` vars + repli `src/db.ts` | Clé anon (accès PostgREST, **serveur only**) | committé (posture assumée — **roter après audit**) |
| `AUTH_ENFORCE` | `wrangler.jsonc` vars | `on` = login matricule+PIN obligatoire | **`on` en prod ✅** |
| `JWT_SECRET` | **secret Pages** | Signature des sessions JWT (HS256) | ⚠️ repli committé `BUILTIN_SECRET` (`auth.ts`) si non posé → **poser en secret** |
| `BOOTSTRAP_MATRICULE` | **secret Pages** | Matricule du compte de secours (Direction) | `ADMIN` si non posé |
| `BOOTSTRAP_PIN` | **secret Pages** | PIN du compte de secours | ⚠️ `246810` par défaut si non posé → **poser en secret** |

Poser les secrets :
```bash
npx wrangler pages secret put JWT_SECRET --project-name seem-semrac-erp
npx wrangler pages secret put BOOTSTRAP_PIN --project-name seem-semrac-erp
```

## 2. Application ERP — DÉV LOCAL (`wrangler pages dev`)

Fichier **`.dev.vars`** (gitignoré ; modèle : `.dev.vars.example`) :
`JWT_SECRET`, `BOOTSTRAP_MATRICULE`, `BOOTSTRAP_PIN`. (`SUPABASE_URL`/`SUPABASE_ANON_KEY` prennent les valeurs de `wrangler.jsonc`.)

## 3. Stack Docker (Supabase auto-hébergé + ERP Node)

Fichier **`docker/.env`** (gitignoré ; modèle **`docker/.env.example`** entièrement commenté). Les clés `ANON_KEY`/`SERVICE_ROLE_KEY`/`JWT_SECRET` de l'exemple sont les **clés de démo publiques Supabase** (ne fonctionnent que contre la stack locale).

- **Base** : `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_PORT`, `POSTGRES_PASSWORD`.
- **Supabase/JWT** : `JWT_SECRET`, `JWT_EXPIRY`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ANON_KEY_ASYMMETRIC`, `SERVICE_ROLE_KEY_ASYMMETRIC` (**trio cohérent** — voir en-tête de `.env.example`).
- **Kong / URL** : `KONG_HTTP_PORT`, `KONG_HTTPS_PORT`, `SUPABASE_PUBLIC_URL`.
- **PostgREST** : `PGRST_DB_SCHEMAS`, `PGRST_DB_MAX_ROWS`, `PGRST_DB_EXTRA_SEARCH_PATH`.
- **Storage/S3/imgproxy** : `GLOBAL_S3_BUCKET`, `REGION`, `STORAGE_TENANT_ID`, `IMGPROXY_AUTO_WEBP`, `S3_PROTOCOL_ACCESS_KEY_ID`, `S3_PROTOCOL_ACCESS_KEY_SECRET`.
- **Studio / meta** : `STUDIO_DEFAULT_ORGANIZATION`, `STUDIO_DEFAULT_PROJECT`, `PG_META_CRYPTO_KEY`, `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`.
- **ERP (conteneur app)** : `APP_PORT`, `AUTH_ENFORCE`, `APP_JWT_SECRET`, `BOOTSTRAP_MATRICULE`, `BOOTSTRAP_PIN`.

## 4. n8n (observabilité / auto-réparation)

Fichier **`docker/n8n/.env`** (gitignoré ; modèle `docker/n8n/.env.example`) :
`ANTHROPIC_API_KEY` (clé API Claude — **jamais committée**), `ALERT_WEBHOOK_URL`, `AUTOHEAL_ENABLED`, `CLAUDE_MODEL`.

## 5. CI GitHub Actions

Secrets de dépôt (Settings → Secrets → Actions) : `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Sans eux, la CI **build seulement** (pas de déploiement). Voir `.github/workflows/deploy.yml`.

## 6. Outillage (scripts Python / doc)

`SUPABASE_PAT` (env, **jamais committé**) — Personal Access Token Supabase pour les opérations DDL via la Management API (voir skill `erp-db`). `ERP_URL`, `ERP_MAT`, `ERP_PIN` — pour les captures Playwright (`scripts_doc/capture_screens.mjs`).

---
> Règle d'or : tout ce qui est secret réel se termine par sa présence dans un fichier **gitignoré** ou un **secret Cloudflare/Actions**, jamais dans le code ni dans un `*.example`.
