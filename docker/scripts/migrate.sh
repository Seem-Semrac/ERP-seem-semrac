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
# ⚠ DEUX GARANTIES, dans cet ordre :
#   1. Les DONNÉES ne sont jamais touchées : tout fichier contenant une instruction
#      destructrice est REFUSÉ, et le lot entier est abandonné.
#   2. L'APPLICATION n'est jamais bloquée : une migration qui échoue est signalée
#      bruyamment, les suivantes sont tentées, et la stack démarre quand même.
#      Un schéma en retard est un désagrément ; un ERP à terre est un arrêt de travail.
#      (`app` ne dépend PAS de ce conteneur — voir docker-compose.yml.)
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail          # PAS de `set -e` : on veut gérer les échecs nous-mêmes.

DIR="${MIGRATIONS_DIR:-/migrations}"
HOTE="${PGHOST:-db}"
BASE="${PGDATABASE:-postgres}"
USER_PG="${PGUSER:-postgres}"
psql_() { psql -v ON_ERROR_STOP=1 -h "$HOTE" -U "$USER_PG" -d "$BASE" "$@"; }

echo "▸ Migrations de schema"

# ── Attente de la base (le healthcheck compose couvre déjà ce cas, ceinture+bretelles)
pret=0
for _ in $(seq 1 60); do
  if pg_isready -h "$HOTE" -U "$USER_PG" >/dev/null 2>&1; then pret=1; break; fi
  sleep 2
done
if [ "$pret" != "1" ]; then
  echo "  ! base injoignable apres 120 s — aucune migration tentee." >&2
  echo "    L'application demarre quand meme ; relancez la mise a jour plus tard." >&2
  exit 1
fi

# ── Journal des migrations
if ! psql_ -q -c "create table if not exists public._erp_migrations (fichier text primary key, applique_le timestamptz not null default now(), empreinte text);" >/dev/null 2>/tmp/err; then
  echo "  ! impossible de creer/lire la table de suivi _erp_migrations :" >&2
  sed 's/^/      /' /tmp/err >&2
  echo "    Aucune migration tentee. L'application demarre quand meme." >&2
  exit 1
fi

shopt -s nullglob
fichiers=("$DIR"/*.sql)
if [ ${#fichiers[@]} -eq 0 ]; then
  echo "  · aucune migration a appliquer"
  exit 0
fi

# ── GARANTIE 1 — on inspecte TOUS les fichiers AVANT d'en appliquer un seul.
#    Les commentaires SQL (-- …) sont retirés pour éviter les faux positifs.
#    `drop policy`, `drop index`, `drop trigger`, `drop constraint` restent autorisés :
#    ils ne détruisent aucune donnée.
interdits='(drop[[:space:]]+(table|column|database|schema|type|sequence))|truncate[[:space:]]|delete[[:space:]]+from'
refus=0
for f in "${fichiers[@]}"; do
  if sed 's/--.*$//' "$f" | grep -Eiq "$interdits"; then
    echo "  ✗ REFUSE : $(basename "$f") contient une instruction destructrice." >&2
    sed 's/--.*$//' "$f" | grep -Ein "$interdits" | head -5 | sed 's/^/      /' >&2
    refus=1
  fi
done
if [ "$refus" = "1" ]; then
  echo "" >&2
  echo "  Une migration ajoute ou transforme du schema, elle ne supprime JAMAIS de donnees." >&2
  echo "  AUCUNE migration n'a ete appliquee. Corrigez le fichier, ou faites la suppression" >&2
  echo "  a la main en connaissance de cause : docker exec -it erp-db psql -U postgres" >&2
  exit 1
fi

# ── GARANTIE 2 — application fichier par fichier ; un échec n'arrête pas les suivants.
applique=0; deja_ok=0; echecs=0
for f in "${fichiers[@]}"; do
  nom="$(basename "$f")"
  deja="$(psql_ -tAc "select 1 from public._erp_migrations where fichier = '$nom'" 2>/dev/null)"
  if [ "$deja" = "1" ]; then
    echo "  = $nom"
    deja_ok=$((deja_ok + 1))
    continue
  fi
  # -1 = une transaction pour tout le fichier : soit il passe entierement, soit rien.
  if psql_ -q -1 -f "$f" 2>/tmp/err; then
    emp="$(md5sum "$f" 2>/dev/null | cut -d' ' -f1)"
    psql_ -q -c "insert into public._erp_migrations (fichier, empreinte) values ('$nom', '${emp:-?}')" >/dev/null 2>&1
    echo "  + $nom"
    applique=$((applique + 1))
  else
    echo "  ✗ ECHEC : $nom — la transaction a ete annulee, la base est INTACTE." >&2
    sed 's/^/      /' /tmp/err >&2
    echecs=$((echecs + 1))
  fi
done

# PostgREST doit revoir le schéma, sinon les nouvelles colonnes restent invisibles à l'API.
if [ "$applique" -gt 0 ]; then
  psql_ -q -c "notify pgrst, 'reload schema';" >/dev/null 2>&1
fi

echo "  ✓ $applique appliquee(s) · $deja_ok deja a jour · $echecs en echec"
if [ "$echecs" -gt 0 ]; then
  echo "    Les migrations en echec seront retentees au prochain demarrage." >&2
  echo "    L'application demarre normalement : le schema est simplement en retard." >&2
  exit 1        # visible dans `docker compose ps`, mais RIEN n'en depend.
fi
exit 0
