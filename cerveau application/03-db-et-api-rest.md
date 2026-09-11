> 🧠 [Cerveau (accueil)](README.md) · Voisines : [⚙️ Backend](02-backend.md) · [🐳 Docker](04-docker.md)

# 🗄️ Brique 03 — DB & API REST

**État : ✅ Fait (Supabase cloud)** — cible : la **même** base, mais auto-hébergée (voir [🐳 Docker](04-docker.md)).

## L'idée en une phrase
Toutes les données vivent dans une base **PostgreSQL** gérée par **Supabase**. Supabase expose **automatiquement** une **API REST** au-dessus des tables (via *PostgREST*) — l'application n'écrit donc quasi aucune « couche base » à la main.

## Les deux « API REST » (à ne pas confondre)
| Couche | Qui la fournit | Qui l'appelle |
|---|---|---|
| **API PostgREST** (`…supabase.co/rest/v1/<table>`) | Supabase, automatiquement sur chaque table | Le backend via `supabase-js` ([`src/db.ts`](../src/db.ts)) — et demain N8N |
| **API applicative** (`/api/*`) | Notre backend ([`src/index.tsx`](../src/index.tsx)) | Le frontend (JS client) — et demain N8N |

→ L'`/api` de l'app porte la **règle métier** (droits, validations, cascades). PostgREST donne un accès **brut** aux tables.

## Ce qu'il y a dans la base
- **Tables métier historiques** : `clients`, `commandes`, `nomenclatures`, `stock`, `lots`, `bdt`, `factures_client`, `factures_fournisseur`, `demandes_travaux`, `bons_sous_traitance`, `non_conformites`… (créées avant/pendant l'exploitation).
- **28 schémas SQL versionnés** dans [`scripts_import/`](../scripts_import/) — la **source de vérité** rejouable ailleurs. Ex. : `references_clients`, `plans_batiment`, `plan_marqueurs`, `plans_controle`, `kpi_objectifs`, `mouvements_perissables`, `documents` (GED), et **14 tables `hse_*`** (DUER, EPI, chimie, ATEX, formations…).
- **Storage** : un bucket privé **`ged`** pour les fichiers (plans, CAO, FDS), ouverts via `/api/ged/file/:id`.
- **Journal EN 9100 des nomenclatures** : `nomenclature_journal`, **en ajout seul** (déclencheurs `always` contre UPDATE, DELETE et vidage — seul le propriétaire peut les désactiver ; heure imposée par un déclencheur `before insert` aux écritures de l'API, gardée à la restauration d'une sauvegarde ; droits lecture + ajout ; pas de FK → il survit à la fiche). Docker : migration 006 ; cloud : `docker/db/cloud/cloud-5-nomenclature-journal.sql`. ⚠ `docker/scripts/migrate.sh` refuse le mot-clé de vidage, sauf la clause déclarée `before truncate on`, et toute concaténation de chaînes littérales.

## Conventions & pièges (mémoriser)
- **Identifiants texte lisibles** : `CL-4116097` (client), `DT-2026-0001`, `AV-2026-XX`… (pas des UUID partout).
- **Liens souples** entre objets (ex. `cmd_ref` / `num_affaire`) plutôt que des FK strictes partout.
- **RLS permissive** (Row Level Security ouverte) = **posture assumée en bêta** ; la clé anon est côté serveur (SSR) → risque navigateur surévalué. À durcir avant grand public.
- **DDL** (créer/modifier une table) = **Management API + PAT** (jamais le PAT en clair), puis `NOTIFY pgrst, 'reload schema'`. La clé anon ne peut pas `ALTER TABLE`.
- **Gotchas** : colonnes `NOT NULL` sans défaut, vrais noms de tables (`stock`, `bons_sous_traitance`, **`credits`** = les avoirs, PAS `avoirs`), FK qui font échouer un insert (ex. `demandes_travaux.client_id` → `clients`, `commandes.offre_id` → `offres`).
- **`demandes_travaux.cahier_charges` = `text[]`** (pas jsonb) : l'analyse BE y range ses champs libres (faisabilité, décision, commentaire…) dans un **élément tagué `__analyse_be__:{…}`**, lignes existantes préservées (faute de colonne dédiée — DDL = PAT).
- **Stock ↔ catalogue** : toute réf de `produits_fournisseurs` crée une **entrée `stock` vide** (`ensureStockRowForRef`, idempotent) ; **`reference` ≠ `designation`** (la réf n'est jamais recopiée en désignation). Le solde stock est remis via les BL.
- **`documents.categorie`** inclut **`analyse_dt`** (docs d'analyse rattachés à une DT : `nomenclature_id` = id de la DT, chemin `DT-…/analyse_dt/…` dans le bucket `ged`).
- **Avoirs (`credits`)** : décomptés **à l'acceptation** de l'offre (`solde` → `partiel`/`cloture`) ; jamais consommés par une offre non gagnée.
- **Sondes REST** : header `User-Agent: Mozilla/5.0` **obligatoire**.
- **Docker : `id` sans défaut** — la base née de `schema.sql` n'avait aucun défaut sur 50 colonnes `id text` : une insertion sans id y échouait alors qu'elle passe en cloud. Migration **007** (`gen_random_uuid()::text`, seulement là où il n'y a aucun défaut).

Tout ceci est outillé par le skill [`erp-db`](../.claude/skills/erp-db/SKILL.md).

## Quand cette brique change → à maintenir
1. Changement de schéma → **écrire/mettre à jour le `.sql`** dans `scripts_import/` (source de vérité) **avant** d'appliquer.
2. Mettre à jour [`docs/technique/03-base-de-donnees.md`](../docs/technique/03-base-de-donnees.md) + [`03b-tables-reference.md`](../docs/technique/03b-tables-reference.md).
3. `NOTIFY pgrst` pour que l'API REST voie la nouvelle table/colonne.

## Pour aller plus loin
[`docs/technique/03-base-de-donnees.md`](../docs/technique/03-base-de-donnees.md) · [`scripts_import/`](../scripts_import/) · skill [`erp-db`](../.claude/skills/erp-db/SKILL.md)
