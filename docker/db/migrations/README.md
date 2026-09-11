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
