#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Installation de la stack ERP Seem Semrac sur une VM Linux — UNE commande.
#
#   sudo /opt/erp/docker/scripts/install.sh                    # instance principale
#   sudo /opt/erp/docker/scripts/install.sh --instance recette --port 3100
#
# Le script est IDEMPOTENT : le relancer ne casse rien et ne régénère aucun
# secret déjà en place. Il ne demande jamais de mot de passe : il les fabrique.
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

INSTANCE=""          # nom d'instance : permet plusieurs stacks sur la même VM
APP_PORT=3000        # port de l'application
EXPOSE_STUDIO=0      # 1 = Studio et PostgreSQL joignables depuis le réseau
SEED=0               # 1 = charger les données depuis la Supabase cloud après le démarrage

while [ $# -gt 0 ]; do
  case "$1" in
    --instance) INSTANCE="${2:-}"; shift 2 ;;
    --port)     APP_PORT="${2:-3000}"; shift 2 ;;
    --expose-studio) EXPOSE_STUDIO=1; shift ;;
    --seed)     SEED=1; shift ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Option inconnue : $1 (voir --help)"; exit 1 ;;
  esac
done

DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DOCKER_DIR"

# Fichier .env : un par instance, pour que les stacks ne se marchent pas dessus.
ENV_FILE=".env"
PROJECT="erp"
if [ -n "$INSTANCE" ]; then
  ENV_FILE=".env.$INSTANCE"
  PROJECT="erp-$INSTANCE"
fi
# Ce nom prime sur le « name: » du docker-compose.yml. Il DOIT rester identique dans
# erp-docker.sh, sinon les deux scripts pilotent deux stacks distinctes.
export COMPOSE_PROJECT_NAME="$PROJECT"

etape() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()    { printf '  \033[0;32m✓\033[0m %s\n' "$1"; }
info()  { printf '  · %s\n' "$1"; }

# ── 1. Docker ──────────────────────────────────────────────────────────────
etape "Docker"
EST_ROOT=0; [ "$(id -u)" = "0" ] && EST_ROOT=1

demander_admin() {
  cat >&2 <<AIDE

  ✗ Docker n'est pas utilisable par ce compte, et vous n'avez pas les droits
    administrateur pour y remédier.

    C'est le SEUL point qui les exige, et une seule fois. Demandez à
    l'administrateur de la VM d'exécuter ces deux commandes :

        curl -fsSL https://get.docker.com | sudo sh
        sudo usermod -aG docker $(id -un) && sudo systemctl enable --now docker

    Déconnectez-vous puis reconnectez-vous, et relancez ce script SANS sudo.
    Tout le reste — code, secrets, conteneurs, données, mises à jour — se fait
    ensuite sans aucun privilège particulier.

    À savoir pour votre administrateur : appartenir au groupe « docker » équivaut
    en pratique à un accès root sur cette machine. S'il le refuse, il devra
    lancer ce script lui-même, avec sudo.

AIDE
  exit 1
}

if ! command -v docker >/dev/null 2>&1; then
  if [ "$EST_ROOT" = "1" ]; then
    info "absent — installation par le script officiel"
    curl -fsSL https://get.docker.com | sh
  else
    demander_admin
  fi
fi
# Docker présent : ce compte peut-il s'en servir ? (appartenance au groupe docker)
docker info >/dev/null 2>&1 || demander_admin
if ! docker compose version >/dev/null 2>&1; then
  echo "  ✗ le plugin « docker compose » manque. Demandez : sudo apt install docker-compose-plugin"
  exit 1
fi
# Le point qu'on oublie toujours : sans ça, rien ne remonte après un reboot.
if [ "$EST_ROOT" = "1" ]; then
  systemctl enable --now docker >/dev/null 2>&1 || true
  ok "$(docker --version | cut -d, -f1) · démarrage au boot activé"
else
  ok "$(docker --version | cut -d, -f1) · utilisable sans privilège"
  systemctl is-enabled docker >/dev/null 2>&1 || \
    info "⚠ démarrage au boot non activé — à faire une fois : sudo systemctl enable --now docker"
fi

# ── 2. Secrets ─────────────────────────────────────────────────────────────
etape "Configuration ($ENV_FILE)"
if [ -f "$ENV_FILE" ]; then
  ok "déjà présent — secrets conservés"
else
  [ -f .env.example ] || { echo "  ✗ .env.example introuvable"; exit 1; }
  cp .env.example "$ENV_FILE"

  # Secrets fabriqués sur place. ANON_KEY et SERVICE_ROLE_KEY sont des JWT signés
  # avec JWT_SECRET : ils doivent être générés ENSEMBLE, sinon PostgREST rejette tout.
  JWT_SECRET="$(openssl rand -hex 32)"
  KEYS="$(docker run --rm -e S="$JWT_SECRET" node:20-alpine node -e '
    const c=require("crypto"), s=process.env.S;
    const b=o=>Buffer.from(JSON.stringify(o)).toString("base64url");
    const now=Math.floor(Date.now()/1000), exp=now+3600*24*365*10;
    const jwt=role=>{
      const p=b({alg:"HS256",typ:"JWT"})+"."+b({role,iss:"supabase",iat:now,exp});
      return p+"."+c.createHmac("sha256",s).update(p).digest("base64url");
    };
    console.log(jwt("anon")); console.log(jwt("service_role"));
  ')"
  ANON_KEY="$(echo "$KEYS" | sed -n 1p)"
  SERVICE_KEY="$(echo "$KEYS" | sed -n 2p)"

  PG_PASS="$(openssl rand -hex 24)"
  DASH_PASS="$(openssl rand -hex 16)"
  APP_JWT="$(openssl rand -hex 32)"
  META_KEY="$(openssl rand -hex 16)"
  PIN="$(shuf -i 100000-999999 -n 1)"

  set_env() {  # remplace la valeur d'une clé, ou l'ajoute si absente
    if grep -qE "^$1=" "$ENV_FILE"; then
      sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"
    else
      printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"
    fi
  }

  set_env POSTGRES_PASSWORD  "$PG_PASS"
  set_env JWT_SECRET         "$JWT_SECRET"
  set_env ANON_KEY           "$ANON_KEY"
  set_env SERVICE_ROLE_KEY   "$SERVICE_KEY"
  set_env DASHBOARD_PASSWORD "$DASH_PASS"
  set_env PG_META_CRYPTO_KEY "$META_KEY"
  set_env APP_JWT_SECRET     "$APP_JWT"
  set_env AUTH_ENFORCE       "on"
  set_env BOOTSTRAP_PIN      "$PIN"
  set_env APP_PORT           "$APP_PORT"

  # Studio et PostgreSQL : par défaut joignables depuis la VM SEULEMENT.
  # Seul le port de l'application est publié sur le réseau.
  if [ "$EXPOSE_STUDIO" = "1" ]; then
    set_env KONG_HTTP_PORT "8000"
    set_env POSTGRES_BIND  "54322"
  else
    set_env KONG_HTTP_PORT "127.0.0.1:8000"
    set_env POSTGRES_BIND  "127.0.0.1:54322"
  fi

  chmod 600 "$ENV_FILE"
  ok "secrets générés · Studio et PostgreSQL restreints à la VM"
fi

# ── 3. Démarrage ───────────────────────────────────────────────────────────
etape "Démarrage de la stack « $PROJECT »"
docker compose --env-file "$ENV_FILE" up -d --build

etape "Attente des services"
for _ in $(seq 1 60); do
  total=$(docker compose --env-file "$ENV_FILE" ps --format '{{.Name}}' | wc -l)
  sains=$(docker compose --env-file "$ENV_FILE" ps --format '{{.Name}} {{.Status}}' \
          | grep -cE 'healthy|Up ' || true)
  [ "$total" -gt 0 ] && [ "$sains" -ge "$total" ] && break
  sleep 5
done
docker compose --env-file "$ENV_FILE" ps --format 'table {{.Name}}\t{{.Status}}'

# ── 4. Données (optionnel) ─────────────────────────────────────────────────
if [ "$SEED" = "1" ]; then
  etape "Chargement des données depuis la Supabase cloud"
  ENV_FILE="$ENV_FILE" "$DOCKER_DIR/scripts/erp-docker.sh" mirror
fi

# ── 5. Récapitulatif ───────────────────────────────────────────────────────
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
etape "Prêt"
cat <<FIN
  Application    http://${IP:-<ip-de-la-vm>}:${APP_PORT}
  Studio         http://127.0.0.1:8000   (depuis la VM ; identifiant « supabase »)
  PostgreSQL     127.0.0.1:54322         (utilisateur « postgres »)

  Identifiants et secrets : $DOCKER_DIR/$ENV_FILE  (chmod 600)
    · connexion ERP        BOOTSTRAP_MATRICULE / BOOTSTRAP_PIN
    · Studio               DASHBOARD_USERNAME / DASHBOARD_PASSWORD

  Ouvrir le port de l'app au réseau :  sudo ufw allow ${APP_PORT}/tcp
  Piloter la stack au quotidien     :  $DOCKER_DIR/scripts/erp-docker.sh ps|logs|up|down
FIN
