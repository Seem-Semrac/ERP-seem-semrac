#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Applique les migrations de SCHÉMA à une base EXISTANTE, sans toucher aux données.
#
# Pourquoi ce script existe : les scripts de `/docker-entrypoint-initdb.d/` ne sont
# joués par Postgres QUE si le répertoire de données est vide, c'est-à-dire à la
# toute première création de la base. Sur une VM déjà en service, une nouvelle
# colonne n'arrivait donc JAMAIS — le code se mettait à jour, le schéma non.
#
# Ce runner tourne à CHAQUE démarrage de la stack, rejoue uniquement les fichiers
# jamais appliqués, et tient son journal dans la table `_erp_migrations`.
#
# ⚠ GARDE-FOU : tout fichier contenant une instruction DESTRUCTRICE est REFUSÉ et
#   arrête la migration. Une migration ajoute ou transforme du schéma ; elle ne
#   supprime jamais de données. Voir docker/db/migrations/README.md.
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

DIR="${MIGRATIONS_DIR:-/migrations}"
HOTE="${PGHOST:-db}"
BASE="${PGDATABASE:-postgres}"
USER_PG="${PGUSER:-postgres}"
psql_() { psql -v ON_ERROR_STOP=1 -h "$HOTE" -U "$USER_PG" -d "$BASE" "$@"; }

# ── Attente de la base (le healthcheck compose couvre déjà ce cas, ceinture+bretelles)
for _ in $(seq 1 60); do
  pg_isready -h "$HOTE" -U "$USER_PG" >/dev/null 2>&1 && break
  sleep 2
done

echo "▸ Migrations de schéma"

# ── Journal des migrations (la table elle-même est créée si besoin)
psql_ -q -c "create table if not exists public._erp_migrations (
  fichier      text primary key,
  applique_le  timestamptz not null default now(),
  empreinte    text
);" >/dev/null

shopt -s nullglob
fichiers=("$DIR"/*.sql)
if [ ${#fichiers[@]} -eq 0 ]; then
  echo "  · aucune migration à appliquer"
  exit 0
fi

# ── GARDE-FOU : on inspecte TOUS les fichiers AVANT d'en appliquer un seul.
#    Les commentaires SQL (-- …) sont retirés pour ne pas déclencher de faux positif.
#    `drop policy`, `drop index`, `drop trigger`, `drop constraint` restent autorisés :
#    ils ne détruisent aucune donnée.
interdits='(drop[[:space:]]+(table|column|database|schema|type|sequence))|truncate[[:space:]]|delete[[:space:]]+from'
refus=0
for f in "${fichiers[@]}"; do
  if sed 's/--.*$//' "$f" | grep -Eiq "$interdits"; then
    echo "  ✗ REFUSÉ : $(basename "$f") contient une instruction destructrice." >&2
    sed 's/--.*$//' "$f" | grep -Ein "$interdits" | head -5 | sed 's/^/      /' >&2
    refus=1
  fi
done
if [ "$refus" = "1" ]; then
  echo "" >&2
  echo "  Une migration ajoute ou transforme du schéma, elle ne supprime JAMAIS de données." >&2
  echo "  Aucune migration n'a été appliquée. Corrigez le fichier, ou exécutez la suppression" >&2
  echo "  à la main en connaissance de cause : docker exec -it erp-db psql -U postgres" >&2
  exit 1
fi

# ── Application, dans l'ordre alphabétique, une transaction par fichier
applique=0
for f in "${fichiers[@]}"; do
  nom="$(basename "$f")"
  deja="$(psql_ -tAc "select 1 from public._erp_migrations where fichier = '$nom'" || echo '')"
  if [ "$deja" = "1" ]; then
    echo "  = $nom"
    continue
  fi
  emp="$(md5sum "$f" | cut -d' ' -f1)"
  echo "  + $nom"
  psql_ -q -1 -f "$f"                      # -1 = tout ou rien pour ce fichier
  psql_ -q -c "insert into public._erp_migrations (fichier, empreinte) values ('$nom', '$emp')" >/dev/null
  applique=$((applique + 1))
done

# PostgREST doit revoir le schéma, sinon les nouvelles colonnes restent invisibles à l'API.
if [ "$applique" -gt 0 ]; then
  psql_ -q -c "notify pgrst, 'reload schema';" >/dev/null 2>&1 || true
fi
echo "  ✓ $applique migration(s) appliquée(s), $(( ${#fichiers[@]} - applique )) déjà à jour"
