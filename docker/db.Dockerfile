# ══════════════════════════════════════════════════════════════
# Image PostgreSQL Supabase + scripts d'init CUITS DANS L'IMAGE.
# Raison : sur Docker Desktop Windows, les bind-mounts de FICHIERS uniques
# sont montés comme des dossiers vides (bug connu WSL2, aggravé par l'espace
# dans le chemin). On copie donc les scripts dans l'image → 100% fiable.
# Contexte de build = dossier docker/ (voir docker-compose.yml).
# ══════════════════════════════════════════════════════════════
FROM supabase/postgres:17.6.1.136

# init-scripts (rôles, JWT, webhooks) puis migrations (schémas _supabase/realtime/…).
COPY supabase/volumes/db/webhooks.sql   /docker-entrypoint-initdb.d/init-scripts/98-webhooks.sql
COPY supabase/volumes/db/roles.sql      /docker-entrypoint-initdb.d/init-scripts/99-roles.sql
COPY supabase/volumes/db/jwt.sql        /docker-entrypoint-initdb.d/init-scripts/99-jwt.sql
COPY supabase/volumes/db/_supabase.sql  /docker-entrypoint-initdb.d/migrations/97-_supabase.sql
COPY supabase/volumes/db/realtime.sql   /docker-entrypoint-initdb.d/migrations/99-realtime.sql
COPY supabase/volumes/db/logs.sql       /docker-entrypoint-initdb.d/migrations/99-logs.sql
COPY supabase/volumes/db/pooler.sql     /docker-entrypoint-initdb.d/migrations/99-pooler.sql

# ⚠ ORDRE D EXECUTION : les scripts sont joués par ordre ALPHABETIQUE. D ou les
# prefixes zz1..zz4 : schema -> policies storage -> hygiene -> conformite.
# Sans eux, "zz-erp-conformite" passait AVANT "zz-erp-schema" et echouait.
# Schéma métier ERP complet (101 tables + RLS + grants), exécuté EN DERNIER (après les
# rôles/extensions Supabase). Une base vierge obtient donc tout le schéma sans le cloud.
COPY db/seed/schema.sql                 /docker-entrypoint-initdb.d/migrations/zz1-erp-schema.sql

# Policies RLS du bucket « ged ». SANS elles, la clé anon (identité de l'application SSR)
# ne voit AUCUN fichier : createSignedUrl répond « Object not found », /api/ged/file/:id
# renvoie 500, et le service Plan / Bâtiment affiche une maquette vide — l'écran paraît
# cassé alors que la donnée est intacte. Le cloud porte ces policies, pas le Docker.
# Fail-soft : si le schéma `storage` n'existe pas encore, le script ne bloque pas l'init
# (le relancer alors à la main : docker exec erp-db psql -U postgres -f /tmp/storage_policies.sql).
COPY db/seed/storage_policies.sql       /docker-entrypoint-initdb.d/migrations/zz2-erp-storage-policies.sql

# Hygiene base (2026-08-25) : colonnes remises en phase avec le cloud, RLS activee sur
# TOUTES les tables de public (51 ne l avaient pas), search_path fige sur les fonctions,
# doublon de policy retire, cle primaire sur edit_locks (le code y fait un upsert
# onConflict:resource qui EXIGE une contrainte unique). Idempotent.
COPY db/seed/hygiene.sql                /docker-entrypoint-initdb.d/migrations/zz3-erp-hygiene.sql

# Conformite cloud <-> Docker : retire ce qui n existe QUE en local et ne sert a rien
# (import_staging + ses 3 fonctions, residus de test). Le cloud fait reference.
COPY db/seed/conformite.sql             /docker-entrypoint-initdb.d/migrations/zz4-erp-conformite.sql
