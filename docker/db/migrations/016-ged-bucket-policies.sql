-- ═══════════════════════════════════════════════════════════════════════════
-- 016 · Bucket « ged » + policies ged_* du stockage — DOCKER SEUL (lot H0, 17/09/2026)
--
-- Symptôme possible sur une VM : « Stockage : Bucket not found » ou « new row violates
-- row-level security policy » au dépôt d'un document, ou « 500 Lien indisponible » à
-- l'ouverture. Cause : sur une base NEUVE, le schéma `storage` est encore vide quand les
-- scripts d'init s'exécutent (ses tables sont créées plus tard par storage-api). Le script
-- zz2 (db/seed/storage_policies.sql) sortait alors sans rien faire, et install.sh ne crée
-- ni le bucket ni les policies (`erp-docker.sh ged-bucket` était une étape manuelle).
--
-- Ce fichier reprend À L'IDENTIQUE le contenu de storage_policies.sql, plus la création du
-- bucket privé `ged`. Le cloud a déjà son bucket et ses policies : AUCUN script cloud.
--
-- ⚠ Il LÈVE UNE EXCEPTION si storage.buckets ou storage.objects est absent : le lanceur
--    (docker/scripts/migrate.sh) annule alors la transaction, ne journalise PAS le fichier
--    et le RETENTE au démarrage suivant — le temps que storage-api ait créé ses tables.
--    Volontairement SANS `depends_on: storage` dans docker-compose.yml : erp-storage peut
--    être « unhealthy » au démarrage, et la dépendance bloquerait TOUTES les migrations.
--
-- Idempotent : bucket en `on conflict do nothing` (un bucket existant n'est pas modifié),
-- policies remplacées par drop policy if exists / create policy (autorisé par le lanceur).
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception '016 : storage.buckets / storage.objects absents — le service storage n''a pas encore cree ses tables. Migration retentee au prochain demarrage (aucune donnee touchee).';
  end if;

  -- Bucket PRIVÉ : les fichiers ne sont servis que par /api/ged/file/:id (derrière l'authentification ERP).
  insert into storage.buckets (id, name, public)
  values ('ged', 'ged', false)
  on conflict (id) do nothing;

  -- Lecture des buckets (nécessaire avant toute opération sur les objets)
  drop policy if exists "ged_buckets_read" on storage.buckets;
  create policy "ged_buckets_read" on storage.buckets
    for select to anon, authenticated
    using (id = 'ged');

  -- Lecture / signature des fichiers du bucket ged
  drop policy if exists "ged_objects_read" on storage.objects;
  create policy "ged_objects_read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'ged');

  -- Dépôt de fichiers (upload GED : plans, CAO/FAO, fond de maquette bâtiment)
  drop policy if exists "ged_objects_insert" on storage.objects;
  create policy "ged_objects_insert" on storage.objects
    for insert to anon, authenticated
    with check (bucket_id = 'ged');

  -- Remplacement (upsert) et suppression (removeGedFile)
  drop policy if exists "ged_objects_update" on storage.objects;
  create policy "ged_objects_update" on storage.objects
    for update to anon, authenticated
    using (bucket_id = 'ged')
    with check (bucket_id = 'ged');

  drop policy if exists "ged_objects_delete" on storage.objects;
  create policy "ged_objects_delete" on storage.objects
    for delete to anon, authenticated
    using (bucket_id = 'ged');

  raise notice '016 : bucket ged present (prive) et policies ged_* en place.';
end
$$;
