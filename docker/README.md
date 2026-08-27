# Stack Docker locale — ERP Seem Semrac

App ERP (Hono/Node) **+ Supabase auto-hébergé**, interconnectés, pour un **essai en
local**. Ne remplace pas la prod (Cloudflare + Supabase cloud), qui reste intacte.

## Démarrer (Docker Desktop doit tourner)

```powershell
cd docker
Copy-Item .env.example .env      # une fois
docker compose up -d --build
```

- App : http://localhost:3000
- Dashboard Supabase : http://localhost:8000 (`supabase` / mot de passe du `.env`)

Ou via l'aide-mémoire : `..\docker\scripts\erp-docker.ps1 up` (puis `... ps`, `... logs app`, `... down`).

## Schéma & données

Le **schéma métier complet** (101 tables + RLS + droits anon) est **versionné**
([`db/seed/schema.sql`](db/seed/schema.sql)) et **appliqué automatiquement** à la 1ʳᵉ
initialisation de la base (cuit dans `db.Dockerfile`). Une VM neuve obtient donc **tout
le schéma sans aucun accès au cloud** : `docker compose up -d --build` suffit.

Les **données** (facultatives) restent hors dépôt : pour recopier tes vraies données du
cloud, voir [`db/seed/README.md`](db/seed/README.md) (`pg_dump` du cloud → `erp-docker restore`).

## Documentation complète

➡ [`docs/technique/12-docker-installation.md`](../docs/technique/12-docker-installation.md)
(architecture, mises à jour automatiques, dépannage, passage en production).
