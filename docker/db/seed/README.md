# Peuplement de la base Docker

## Schéma : automatique (versionné)
Le **schéma métier complet** (101 tables + RLS + droits anon) est versionné dans
[`schema.sql`](schema.sql) et **appliqué tout seul** à la 1ʳᵉ initialisation de la base
(cuit dans `../db.Dockerfile`). **Rien à faire** : une base vierge a déjà toutes les
tables (`clients`, `commandes`, `demandes_travaux`, `bons_de_travail`, `ecme`, …), sans
aucun accès au cloud. `schema.sql` ne contient **aucune donnée** (structure seule).

Deux parties dans le fichier :
1. **Corps** = `pg_dump --schema-only` du miroir Docker local (77 tables réellement présentes).
2. **Appendice « TABLES COMPLÉMENTAIRES »** (en fin de fichier) = 24 tables présentes en
   prod mais absentes du miroir local, **reconstituées depuis le code** (interfaces
   `src/types.ts` + payloads d'insert `src/queries.ts`/`index.tsx`) : colonnes toutes
   nullable (sur-ensemble sûr), `id text` PK, RLS permissive anon + grants.

> Régénérer le **corps** après un changement de schéma :
> `docker exec erp-db pg_dump -U postgres -d postgres --schema-only --no-owner -n public > docker/db/seed/schema.sql`
> puis retirer `\restrict`/`\unrestrict` + `ALTER DEFAULT PRIVILEGES`, rendre le
> `CREATE SCHEMA` idempotent (`IF NOT EXISTS`), et **ré-ajouter l'appendice à la fin**
> (pg_dump ne le régénère pas — c'est de la reconstitution). Si une table de l'appendice
> a depuis été appliquée en local, elle sortira du pg_dump : la retirer alors de l'appendice.

## Données (facultatif) : depuis le cloud
Pour avoir **tes vraies données** (pas seulement les tables vides) en local :

## 1. Exporter depuis le cloud (à faire TOI — je ne touche pas au secret)

Récupère la chaîne de connexion Postgres dans le dashboard Supabase cloud :
**Project Settings → Database → Connection string → URI** (mot de passe inclus).

```bash
# Schéma + données du schéma public (adapte l'URI) :
pg_dump "postgresql://postgres:MOT_DE_PASSE@db.vyqgrasezpyqjwvijwvv.supabase.co:5432/postgres" \
  --schema=public --no-owner --no-privileges --clean --if-exists \
  > docker/db/seed/dump.sql
```

> Sans `pg_dump` installé, le dashboard cloud propose aussi
> **Database → Backups** (télécharge une sauvegarde) — utilisable de la même façon.

## 2. Restaurer dans la base locale

```powershell
# La stack doit être démarrée (up)
.\docker\scripts\erp-docker.ps1 restore docker\db\seed\dump.sql
.\docker\scripts\erp-docker.ps1 ged-bucket   # crée le bucket GED
```

## 3. Recharger le cache de schéma PostgREST

Après restauration, PostgREST doit revoir le schéma :

```powershell
.\docker\scripts\erp-docker.ps1 psql
# puis dans psql :
NOTIFY pgrst, 'reload schema';
\q
```

---

**Les fichiers `*.sql` déposés ici sont gitignorés** (ils peuvent contenir des données
réelles). Seul ce README est versionné.
