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

- **Décision sur un lot reçu non conforme et avoirs fournisseurs** (migration **008** ; cloud : `docker/db/cloud/cloud-6-reception-fournisseur-avoirs.sql`) : `quarantaines` gagne l'issue de la décision (`issue`, quantités acceptée/renvoyée/rebutée, `compensation`, contexte `bc_id`/`bl_id`, traçabilité `decision_par`/`decision_le`/`decision_motif`, expédition du retour) **sans nouvelle valeur de `statut`** — donc aucune contrainte à élargir ; et la table **`avoirs_fournisseurs`** (ce que les fournisseurs NOUS doivent, à ne pas confondre avec `credits`, les avoirs clients) : droits `select, insert, update` seulement — **pas de DELETE**, un avoir s'annule ; index unique partiel sur `quarantaine_id` pour qu'une décision n'engendre qu'un avoir.

- **Réception fournisseur, certificat matière, PV détaillé** (migration **012** ; cloud : `docker/db/cloud/cloud-10-reception-fournisseur-pv.sql`, à jouer dans le **Studio en ligne**) : `bons_de_livraison` + `num_commande_fournisseur`, `num_bl_fournisseur`, `hors_france`, `poids_matiere_kg` (≥ 0), `num_nomenclature` (code douanier), `code_ewx` (1 ou 2), `mode_arrivee` — pas de contrainte « hors France ⇒ 4 champs » (contrôle applicatif) ; `bons_de_commande.certificat_matiere_requis` ; `pv_controle` + `detail` (jsonb v1 : instantané du BC, lignes Oui / Non avec observation, certificat, contrôleur), `controleur_id`, `controleur_nom`, `saisi_par`, `certificat_matiere` (`non_requis` / `confirme` / `absent`) ; index unique partiel `ux_pv_controle_reception_bl` (un PV de réception par BL, créé seulement sans doublons). ⚠ `bons_de_livraison.qte` d'une réception : `null` = inconnue, **jamais 0** ; ⚠ `statut` / `decision` de `pv_controle` gardent leurs valeurs historiques (CHECK du cloud) ; ⚠ la table est **`pv_controle`** au singulier.
- **Réglage stocké sur le BDT** (migration **011** ; cloud : `cloud-9-bdt-temps-reglage.sql`) : `bons_de_travail.temps_reglage` (h, compris dans `duree`, `null` = inconnu, un seul porteur par famille découpée), `duree_avant_decoupe` / `temps_machine_avant_decoupe` (retour arrière exact d'une découpe, repère du recollage). Remplissage de l'existant par `POST /api/production/bdt/reglage/reconstituer` (certains seulement).
- **Index uniques des upserts** (migration **010** ; cloud : `cloud-8-index-uniques-upsert.sql`, à contrôler) : `operateur_presence`, `affectation_poste`, `competences_operateur`, `produits_fournisseurs`, `kpi_objectifs`. Sans eux, un `upsert(onConflict)` échoue en 42P10.
- **Taux horaire machine du process** (migration **009** ; cloud : `docker/db/cloud/cloud-7-process-taux-horaire-machine.sql`, à jouer dans le **Studio en ligne**) : `process_atelier.taux_horaire_machine numeric` (€/h HT, `null` = « à saisir », contrainte `>= 0`). Recopie de départ depuis `machines.cout_h` **uniquement quand la colonne est créée** : rejoué, le script ne ré-alimente pas un taux vidé volontairement. Colonnes devenues inertes, laissées en base : `machines.cout_h` (lu seulement en transition), `postes.taux_horaire_manuel`, `machines_opex.taux_horaire`, copies `nomenclatures.taux_mo` / `cout_machine_h`. ⚠ Lire `process_atelier` en `select *` sans projeter : l'**absence** de la propriété signale au code une base pas encore migrée.

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
- **`upsert(…, { onConflict })` exige un index unique sur exactement ces colonnes** : sinon Postgres répond **42P10** et rien n'est écrit (supabase-js ne lève pas : lire `error`). La base Docker / VM née de `schema.sql` n'en avait aucun — c'était la cause du « clic de présence qui ne s'enregistre pas » (migration **010**). Toute nouvelle écriture en upsert = son index unique dans la même migration.
- **Docker : `id` sans défaut** — la base née de `schema.sql` n'avait aucun défaut sur 50 colonnes `id text` : une insertion sans id y échouait alors qu'elle passe en cloud. Migration **007** (`gen_random_uuid()::text`, seulement là où il n'y a aucun défaut).

Tout ceci est outillé par le skill [`erp-db`](../.claude/skills/erp-db/SKILL.md).

## Quand cette brique change → à maintenir
1. Changement de schéma → **écrire/mettre à jour le `.sql`** dans `scripts_import/` (source de vérité) **avant** d'appliquer.
2. Mettre à jour [`docs/technique/03-base-de-donnees.md`](../docs/technique/03-base-de-donnees.md) + [`03b-tables-reference.md`](../docs/technique/03b-tables-reference.md).
3. `NOTIFY pgrst` pour que l'API REST voie la nouvelle table/colonne.

## Pour aller plus loin
[`docs/technique/03-base-de-donnees.md`](../docs/technique/03-base-de-donnees.md) · [`scripts_import/`](../scripts_import/) · skill [`erp-db`](../.claude/skills/erp-db/SKILL.md)
