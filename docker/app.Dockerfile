# ══════════════════════════════════════════════════════════════
# Image de l'APPLICATION ERP (Hono) pour exécution en conteneur Node.
# Contexte de build = RACINE du dépôt (voir docker-compose.yml : context: ..).
# Mode DEV : `tsx watch` recharge l'app dès qu'un fichier de src/ change
#            (src/ et public/ sont montés en bind-mount par docker-compose).
# ══════════════════════════════════════════════════════════════
FROM node:22-slim

WORKDIR /app

# 1) Dépendances d'abord (couche cachée tant que package*.json ne change pas).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2) Code (fallback si les bind-mounts ne sont pas montés — ex. exécution "prod").
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Commit reellement embarque dans cette image : c'est ce que renvoie /api/version.
# Pose par erp-docker.sh au moment du build ; vide si l'image est construite a la main.
ARG GIT_COMMIT=""
ARG BUILD_DATE=""
ENV NODE_ENV=development \
    PORT=3000 \
    GIT_COMMIT=${GIT_COMMIT} \
    BUILD_DATE=${BUILD_DATE}

EXPOSE 3000

# Rechargement automatique en dev. Pour un run "figé", remplacer par : npm run start:node
CMD ["npm", "run", "dev:node"]
