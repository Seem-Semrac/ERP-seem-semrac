# ══════════════════════════════════════════════════════════════
# Image Kong + config déclarative + entrypoint CUITS DANS L'IMAGE.
# Même raison que db.Dockerfile : les bind-mounts de fichiers uniques
# deviennent des dossiers vides sur Docker Desktop Windows → Kong ne démarrait
# pas (« /bin/sh <dossier> » sortait immédiatement). On les copie dans l'image.
# Contexte de build = dossier docker/.
# ══════════════════════════════════════════════════════════════
FROM kong/kong:3.9.1

USER root
COPY supabase/volumes/api/kong.yml           /home/kong/temp.yml
COPY supabase/volumes/api/kong-entrypoint.sh /home/kong/kong-entrypoint.sh
RUN chmod +x /home/kong/kong-entrypoint.sh
USER kong
