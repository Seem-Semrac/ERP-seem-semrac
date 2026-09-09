#!/usr/bin/env bash
# Aide-mémoire de pilotage de la stack Docker ERP (Linux/macOS/Git-Bash).
# Usage : docker/scripts/erp-docker.sh <up|down|reset|logs|ps|psql|restore <f>|ged-bucket|migrate|urls>
set -euo pipefail
DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$DOCKER_DIR/.." && pwd)"
cd "$DOCKER_DIR"

# Plusieurs stacks sur la même machine : ERP_INSTANCE=recette cible .env.recette
# et le projet compose « erp-recette ». Sans variable → instance principale.
# Le nom de projet Compose DOIT etre identique a celui utilise par install.sh :
# c'est lui qui rattache les conteneurs et les volumes existants. Un nom different
# fait croire a Compose qu'il s'agit d'une nouvelle stack — il cree des volumes vides
# et bute sur les noms de conteneurs deja pris.
if [ -n "${ERP_INSTANCE:-}" ]; then
  ENV_FILE=".env.$ERP_INSTANCE"
  export COMPOSE_PROJECT_NAME="erp-$ERP_INSTANCE"
else
  ENV_FILE="${ENV_FILE:-.env}"
  # On DETECTE la stack existante au lieu de la supposer. Selon la machine, elle peut
  # porter « erp » (pose par install.sh sur la VM) OU le nom declare dans le
  # docker-compose.yml (« erp-seem-semrac », cas d'un poste de dev demarre avec un
  # simple `docker compose up`). Se tromper de nom ne provoque aucune erreur visible :
  # Compose demarre simplement une SECONDE stack, vide, a cote de la vraie.
  if [ -z "${COMPOSE_PROJECT_NAME:-}" ]; then
    _proj="$(docker inspect erp-db --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null | head -1 | tr -d '')"
    export COMPOSE_PROJECT_NAME="${_proj:-erp}"
    [ -n "$_proj" ] && echo "· stack detectee : projet « $_proj »"
  fi
fi
[ -f "$ENV_FILE" ] || { echo "→ $ENV_FILE absent : copie depuis .env.example"; cp .env.example "$ENV_FILE"; }
# Toutes les commandes compose passent par ce fichier d'environnement.

compose() { command docker compose --env-file "$ENV_FILE" "$@"; }

cmd="${1:-urls}"; arg="${2:-}"
case "$cmd" in
  up)
    compose up -d --build
    echo "App: http://localhost:3000   Dashboard: http://localhost:8000" ;;
  down)  compose down ;;
  stop)
    # Arret SANS supprimer les conteneurs : redemarrage bien plus rapide que down/up,
    # et aucune reconstruction d'image. Les donnees ne bougent pas.
    compose stop; echo "Stack arretee. Relancer avec : erp-docker.sh start" ;;
  start)
    compose start; echo "Stack relancee. App: http://localhost:3000" ;;
  restart) compose restart; echo "Stack redemarree." ;;
  maj)
    # Recupere la derniere version publiee et l'applique. Les donnees ne bougent pas :
    # seule l'image de l'application est reconstruite.
    echo "→ Recuperation de la derniere version…"
    git -C "$REPO_ROOT" pull --ff-only || { echo "✗ git pull a echoue — resolvez le conflit puis relancez."; exit 1; }
    # Grave le commit dans l'image : /api/version dira ensuite quel code tourne vraiment.
    GIT_COMMIT="$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo '')"
    BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    export GIT_COMMIT BUILD_DATE
    echo "→ Reconstruction et redemarrage… (code ${GIT_COMMIT:0:10})"
    # ⚠ `set -e` en tete de ce script : sans ce garde, un service qui sort en erreur
    #   (ex. une migration en echec) faisait AVORTER la commande ici — l'utilisateur ne
    #   voyait alors ni les logs de migration, ni l'etat des conteneurs.
    rc_up=0; compose up -d --build || rc_up=$?
    echo
    # Migrations de SCHEMA : le conteneur `migrate` a tourne pendant le up ci-dessus.
    # Les DONNEES ne sont jamais touchees (toute instruction destructrice est refusee).
    echo "Schema de la base :"
    compose logs migrate --no-log-prefix 2>/dev/null | tail -30 || echo "  (aucune sortie)"
    echo
    compose ps -a --format 'table {{.Name}}\t{{.Status}}'
    echo
    if [ "$rc_up" != "0" ]; then
      echo "  ! un service a signale une erreur (voir ci-dessus)."
      echo "    L'application demarre malgre tout : rien ne depend des migrations."
      echo
    fi
    _port="$(sed -n 's/^APP_PORT=//p' "$ENV_FILE" | head -1)"; _port="${_port:-3000}"
    _ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    echo "✓ Mise a jour terminee. App : http://${_ip:-localhost}:${_port}"
    # Verification finale : le code SERVI est-il bien celui du depot ?
    _srv="$(curl -s --max-time 5 "http://localhost:${_port}/api/version" 2>/dev/null | sed -n 's/.*"commit":"\([^"]*\)".*//p')"
    if [ -n "$_srv" ] && [ -n "$GIT_COMMIT" ]; then
      if [ "$_srv" = "$GIT_COMMIT" ]; then
        echo "  ✓ code servi = code du depot (${_srv:0:10})"
      else
        echo "  ! ATTENTION : l'application sert ${_srv:0:10} alors que le depot est a ${GIT_COMMIT:0:10}."
        echo "    Le conteneur n'a pas redemarre sur la nouvelle image : docker start erp-app"
      fi
    fi ;;
  reset)
    echo "Supprime les données locales (base + storage) dans 3s (Ctrl+C pour annuler)…"; sleep 3
    compose down -v; echo "Base réinitialisée." ;;   # -v = supprime les volumes nommés
  logs)  [ -n "$arg" ] && compose logs -f "$arg" || compose logs -f ;;
  ps)    compose ps ;;
  psql)  compose exec db psql -U postgres -d postgres ;;
  restore)
    [ -n "$arg" ] || { echo "Usage: restore <dump.sql>"; exit 1; }
    compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0 < "$arg"
    echo "Restauration terminée." ;;
  ged-bucket)
    echo "insert into storage.buckets (id,name,public) values ('ged','ged',false) on conflict (id) do nothing;" \
      | compose exec -T db psql -U postgres -d postgres
    echo "Bucket 'ged' prêt." ;;
  migrate)
    for f in $(ls "$REPO_ROOT"/scripts_import/*.sql | sort); do
      echo "  · $(basename "$f")"
      compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0 < "$f"
    done
    echo "Migrations appliquées." ;;
  mirror)
    # Recopie le schéma + les données des tables publiques du CLOUD vers la base LOCALE,
    # via la seule clé anon (aucun mot de passe DB requis). arg = limite de lignes/table.
    # NB : on est déjà dans $DOCKER_DIR (cd en tête) → chemins RELATIFS pour éviter la
    #      conversion Git-Bash « /e/… » → « E:\e\… » qui casse node sous Windows.
    URL="${MIRROR_URL:-https://vyqgrasezpyqjwvijwvv.supabase.co}"
    ANON="${MIRROR_ANON:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWdyYXNlenB5cWp3dmlqd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE4MTcsImV4cCI6MjA5MzYyNzgxN30.Optt1QD-Ai3Xm8mk4f8fsvKry9-L2SlTBNB9KgVG3ls}"
    mkdir -p db/seed
    # Node n'est pas forcement installe sur la machine (VM fraiche) : on retombe
    # alors sur un conteneur jetable, Docker etant de toute facon present ici.
    if command -v node >/dev/null 2>&1; then
      node scripts/mirror-cloud.mjs "$URL" "$ANON" db/seed/_mirror.sql "${arg:-5000}"
    else
      docker run --rm -v "$DOCKER_DIR:/w" -w /w node:20-alpine \
        node scripts/mirror-cloud.mjs "$URL" "$ANON" db/seed/_mirror.sql "${arg:-5000}"
    fi
    compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0 < db/seed/_mirror.sql | tail -3
    compose restart rest >/dev/null 2>&1 || true
    echo "Miroir cloud → local chargé (PostgREST rechargé)." ;;
  urls|*)
    echo "App ERP   : http://localhost:3000"
    echo "Dashboard : http://localhost:8000 (Supabase Studio)"
    echo "Postgres  : localhost:54322 (postgres / POSTGRES_PASSWORD du .env)"
    echo "Commandes : maj | up | stop | start | restart | down | reset | logs [svc] | ps | psql"
    echo "             restore <f> | ged-bucket | migrate | mirror [limite]" ;;
esac
