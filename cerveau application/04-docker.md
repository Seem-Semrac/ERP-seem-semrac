> 🧠 [Cerveau (accueil)](README.md) · Voisines : [🗄️ DB & API REST](03-db-et-api-rest.md) · [🔗 N8N](05-n8n.md) · [🛠️ Maintenance](06-maintenance.md)

# 🐳 Brique 04 — DOCKER

**État : ✅ Construit et LANCÉ en LOCAL (dev/essai)** — depuis le 2026-07-21, `docker compose up`
monte l'app **+ Supabase auto-hébergé** sur le PC : **8 conteneurs `healthy`**, app sur
`localhost:3000` contre la Supabase locale (chemin de données prouvé). **Ne remplace pas**
la prod (Cloudflare + Supabase cloud, intacts). La **cible production** (VPS + reverse-proxy +
sauvegardes + N8N) reste à faire — voir « Étapes prévues » plus bas.

## Ce qui existe maintenant (local)
- **Dossier [`docker/`](../docker/README.md)** : `cd docker && cp .env.example .env && docker compose up -d`.
- **8 conteneurs** (compose Supabase officiel curé) : cœur `db` + `rest` (PostgREST) +
  `kong` (passerelle) + `app` (Hono/**Node**) ; confort `storage`+`imgproxy` (bucket GED)
  et `meta`+`studio` (dashboard `localhost:8000`). Retirés (inutiles en local) : realtime,
  pooler, edge-functions, **gotrue** (l'ERP a sa propre auth matricule+PIN).
- **Adaptateur Worker→Node** fait : `src/server.node.ts` (`@hono/node-server`) + `src/db.ts`
  lit `SUPABASE_URL`/`SUPABASE_ANON_KEY` de l'env **avec repli cloud** (Cloudflare inchangé).
- **Volumes nommés** `db-data` / `storage-data` (robustes sur Windows) = LES DONNÉES.
- ⚠️ **Bind-mounts inopérants sur ce poste** (fichiers ET dossiers depuis `E:\` arrivent
  vides) → configs Supabase et code app **cuits dans les images** (`db.Dockerfile`,
  `kong.Dockerfile`, `app.Dockerfile`). **Pas de live-reload** : mettre à jour l'app par
  `docker compose up -d --build app`.
- Base démarre **vide de tables métier** (schéma pas dans le dépôt) → peuplement par
  `pg_dump` du cloud, voir [`docker/db/seed/README.md`](../docker/db/seed/README.md).
- **Doc complète** : [`docs/technique/12-docker-installation.md`](../docs/technique/12-docker-installation.md).

## L'idée en une phrase
Une **image Docker** emballe l'application **avec tout son environnement** (Node, dépendances, config) figés, pour qu'elle tourne **à l'identique** partout : ton PC, un serveur, un VPS. Fini le « ça marchait chez moi ».

## Le vocabulaire (3 mots suffisent)
- **Dockerfile** : la *recette* d'une boîte (image). Ex. : partir d'un Node → copier le code → `npm install` → `npm run build` → lancer.
- **docker compose** : le *chef d'orchestre* qui fait tourner **plusieurs boîtes ensemble**.
- **Volume** : le *disque persistant* d'une boîte. Les données (Postgres) y **survivent** aux redémarrages. **C'est là que les sauvegardes comptent.**

## La cible : tout auto-héberger (roadmap)
Un `docker-compose.yml` avec, sur le même réseau :

```
┌─────────────────────────────────────────────┐
│  reverse-proxy (Caddy/Traefik) — HTTPS       │
├───────────────┬───────────────┬─────────────┤
│  app (Hono)   │  Supabase      │  N8N        │
│  sur Node     │  (postgres +   │  (automat.) │
│               │  postgrest +   │             │
│               │  auth+storage) │             │
└───────────────┴──────┬────────┴─────────────┘
                       │ volume "pgdata" (LES DONNÉES)
```

## ⚠️ Le seul vrai piège technique
L'app tourne aujourd'hui comme **Cloudflare Worker** (runtime edge). En Docker, elle tournera sur **Node** → il faut ajouter l'**adaptateur Node de Hono** (`@hono/node-server`) et un petit point d'entrée serveur. C'est mineur mais réel, à faire en premier dans cette brique.

## Ce que Docker apporte à la [réversibilité](06-maintenance.md)
- **Build reproductible** : le Dockerfile + `package-lock.json` figent tout → n'importe qui reconstruit à l'identique.
- **Zéro lock-in** : Node + Postgres + Docker sont universels → on quitte la dépendance au cloud Cloudflare/Supabase.
- **Données chez toi** : la base n'est plus « quelque part dans le cloud » mais dans un volume que tu sauvegardes.

## Étapes prévues (ordre)
1. ✅ Adaptateur **Worker → Node** pour l'app + `Dockerfile`.
2. ✅ `docker-compose` local : app + Postgres.
3. ✅ Ajouter **Supabase self-hosted** (postgrest/storage/studio). *Reste : migrer schéma+données (`pg_dump` cloud → `erp-docker restore`), non versionné dans le dépôt.*
4. 🔜 **Reverse-proxy + HTTPS** (pour un VPS).
5. 🔜 **Sauvegardes automatiques testées** (`pg_dump` → volume/stockage) — priorité n°1 dès l'hébergement.
6. 🔜 Brancher [🔗 N8N](05-n8n.md).

## Quand cette brique sera construite → à maintenir
Documenter ici : le `compose`, les variables d'environnement, les **volumes**, et la **procédure de restauration testée**. Basculer l'état 🔜 → ✅ et mettre à jour [🗄️ DB](03-db-et-api-rest.md) (URL/clé de la nouvelle instance) + [🛠️ Maintenance](06-maintenance.md).

## Pour aller plus loin
[`docs/ROADMAP-2mois.md`](../docs/ROADMAP-2mois.md) (plan self-hosting complet)
