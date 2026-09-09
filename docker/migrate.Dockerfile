# ══════════════════════════════════════════════════════════════
# Runner de MIGRATIONS de schéma — conteneur éphémère, lancé à chaque
# démarrage de la stack, qui applique à une base DÉJÀ EN SERVICE les
# fichiers de db/migrations/ jamais encore joués. Il sort ensuite.
#
# Même image de base que le service `db` : le client psql est déjà dedans
# et la couche est donc déjà présente localement (aucun téléchargement).
# Contexte de build = dossier docker/ (voir docker-compose.yml).
# ══════════════════════════════════════════════════════════════
FROM supabase/postgres:17.6.1.136

# Le script et les migrations sont CUITS dans l'image : sur Windows, les
# bind-mounts de fichiers uniques deviennent des dossiers vides (bug WSL2).
COPY scripts/migrate.sh   /usr/local/bin/migrate.sh
COPY db/migrations/       /migrations/

RUN chmod +x /usr/local/bin/migrate.sh

# Pas de serveur ici : le conteneur applique les migrations puis s'arrête.
ENTRYPOINT ["/usr/local/bin/migrate.sh"]
