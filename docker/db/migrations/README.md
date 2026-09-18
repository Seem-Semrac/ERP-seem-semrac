# Migrations de schéma — règles

Ce dossier contient les évolutions de **schéma** appliquées à une base **déjà en service**.

## Pourquoi il existe

Les scripts de `/docker-entrypoint-initdb.d/` (dont `db/seed/schema.sql`) ne sont joués par Postgres **que si le répertoire de données est vide** — donc uniquement à la toute première création de la base. Sur une VM déjà en production, une nouvelle colonne n'arrivait jamais : le code se mettait à jour, le schéma non.

Le runner `docker/scripts/migrate.sh` tourne à **chaque démarrage de la stack**, rejoue uniquement les fichiers jamais appliqués, et tient son journal dans la table `_erp_migrations`.

## Règle non négociable : on ne touche pas aux données

Une migration **ajoute** ou **transforme** du schéma. Elle ne supprime **jamais** de données.

Le runner **refuse** — et n'applique alors *aucune* migration — tout fichier contenant :

```
DROP TABLE · DROP COLUMN · DROP DATABASE · DROP SCHEMA · DROP TYPE · DROP SEQUENCE
TRUNCATE · DELETE FROM
```

Restent autorisés parce qu'ils ne détruisent aucune donnée : `drop policy`, `drop index`, `drop trigger`, `drop constraint`.

Une suppression réellement voulue se fait **à la main**, en connaissance de cause :

```bash
docker exec -it erp-db psql -U postgres
```

## Écrire une migration

1. Nommer le fichier `NNN-sujet-court.sql`, numéro à trois chiffres, **jamais réutilisé** — l'ordre alphabétique est l'ordre d'exécution.
2. La rendre **idempotente** : `add column if not exists`, `create table if not exists`, `create index if not exists`. Elle doit pouvoir être relue sans dommage.
3. Chaque fichier s'exécute dans **une transaction** (`psql -1`) : soit tout passe, soit rien.
4. Ne jamais modifier un fichier **déjà appliqué** — il ne sera pas rejoué (l'empreinte MD5 enregistrée sert alors seulement à repérer la divergence). Créer un nouveau fichier.
5. Reporter le même DDL dans `docker/db/seed/schema.sql`, pour que les **nouvelles** installations partent déjà à jour.

## Vérifier

```bash
docker logs erp-migrate                         # ce qui a été appliqué au dernier démarrage
docker exec erp-db psql -U postgres -d postgres -c "table _erp_migrations"
```

## Rôle du lanceur et contrôle des mots-clés (11/09/2026)

Le conteneur `erp-migrate` se connecte en **`supabase_admin`** : sur une base née de `schema.sql`
(VM installée par `install.sh`), les tables appartiennent à ce rôle — l'image Supabase y joue son
initialisation, puis rétrograde `postgres`. Connecté en `postgres`, le lanceur ne pouvait modifier
aucune table. Un objet créé par une migration appartient donc à `supabase_admin`.

Contrôle des mots-clés (fait avant toute application, sur le texte sans commentaires, en minuscules) :
une seule exception au mot-clé de vidage, la clause `before truncate on` d'un déclencheur (qui
l'**interdit**) ; toute concaténation de chaînes littérales (`'…' || '…'`) est refusée.

## Migrations propres au Docker / à la VM (sans équivalent cloud)

| Fichier | Pourquoi Docker seul |
|---|---|
| `015-nomenclature-composants-jsonb.sql` | `nomenclatures.composants` était `text` dans `schema.sql` (miroir d'une colonne vide) ; le cloud est déjà en `jsonb`. Conversion vide/NULL → `[]`, JSON valide → cast ; rien n'est jamais effacé. **Lève une exception** (relecture H0) si la conversion ne peut pas se faire — verrou occupé plus de 5 s (55P03), droits (42501), dépendance, ou valeur non JSON (requête de diagnostic dans le message) : transaction annulée, fichier **non journalisé**, **retenté au démarrage suivant** (même modèle que 016). Avant, l'erreur n'était qu'un NOTICE et 015 était journalisé : la colonne pouvait rester en `text` pour de bon. |
| `016-ged-bucket-policies.sql` | Docker seul, le cloud a déjà le bucket `ged` et ses policies. Crée le bucket privé `ged` (s'il manque) et les policies `ged_*` (contenu de `db/seed/storage_policies.sql`). **Lève une exception** si `storage.buckets` / `storage.objects` n'existent pas encore (storage-api pas encore passé sur une base neuve) : le fichier n'est pas journalisé et le lanceur le **retente au démarrage suivant**. Volontairement **sans** `depends_on: storage` dans `docker-compose.yml` (un `erp-storage` « unhealthy » bloquerait toutes les migrations). |

## Migrations avec équivalent cloud à jouer à la main

| Fichier | Équivalent cloud | Ce qu'elle fait |
|---|---|---|
| `017-catalogue-qte-paquet.sql` | `docker/db/cloud/cloud-13-catalogue-qte-paquet.sql` | Lot H1 · ajoute `produits_fournisseurs.qte_paquet` (numeric, `> 0` en contrainte `NOT VALID`) : le nombre de **pièces par paquet** du couple (fournisseur, référence), qui ne se déclarait jusque-là que ligne par ligne dans chaque nomenclature. La colonne texte `conditionnement` est **conservée** (libellé libre, repli en lecture). **Reprend** la valeur des nomenclatures vers la ligne catalogue de même référence normalisée ET même nom de fournisseur, uniquement si celle-ci est vide et si la nomenclature n'en donne qu'une (chaque copie est listée par un NOTICE ; aucune valeur existante n'est écrasée). Crée l'index unique `ux_produits_fournisseurs_ref_norm (fournisseur_id, lower(btrim(reference)))` **seulement sans doublons** — sinon WARNING avec la requête pour les lister. `ux_produits_fournisseurs_upsert` (010) reste en place : c'est lui qu'exige le `on conflict (fournisseur_id, reference)`. Tant que **cloud-13** n'est pas joué en ligne, l'application tourne sans la colonne : lectures en `select('*')`, prix d'accessoire estimé avec « 1 pièce par paquet » signalé en orange, écriture de la qté par paquet acceptée puis annoncée comme non conservée. |
| `018-lots-sous-lots.sql` | `docker/db/cloud/cloud-14-lots-sous-lots.sql` (à jouer **après** cloud-13) | Lot H2 · **sous-lots des nomenclatures mères** : ajoute à `lots` `lot_parent` (text, id du lot parent, NULL = racine, **sans** clé étrangère — lien souple comme `lot_ref`), `rang` (integer, position parmi les frères = ordre de fabrication, racine = son n° ZZ ; NULL pour les lots d'avant H2), `niveau` (integer NOT NULL DEFAULT 0 : 0 = racine … 4), `nomenclature_id` (text, nomenclature VALIDÉE retenue au lancement) et `qte_par_parent` (numeric, qté du composant par unité du parent) ; index `ix_lots_lot_parent` ; contraintes `NOT VALID` `lots_niveau_valide` (0 à 4), `lots_rang_valide` (NULL ou ≥ 1), `lots_parent_distinct`. Numérotation : `LOT-YYYY-AFF-ZZ.RR[.RR…]` (`src/nomenclature_arbre.ts`). Purement additif, aucune donnée modifiée ; `nomenclatures.composants` n'a besoin d'aucune DDL (jsonb depuis 015). Tant que **cloud-14** n'est pas joué en ligne : aucune page cassée, une pièce mère est lancée **sans sous-lots** avec un avertissement (acceptation de l'offre, fiche du lot), « Créer les sous-lots » répond 409 « jouez cloud-14 ». |
