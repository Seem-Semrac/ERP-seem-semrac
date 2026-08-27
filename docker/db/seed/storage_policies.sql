-- ══════════════════════════════════════════════════════════════
-- POLICIES RLS DU STOCKAGE (bucket « ged ») — socle reproductible
--
-- POURQUOI CE FICHIER
-- La stack Docker créait bien le bucket `ged` mais SANS aucune policy sur
-- `storage.objects` / `storage.buckets`, alors que la RLS y est activée.
-- Conséquence : la clé anon — qui EST l'identité de l'application (SSR, cf.
-- src/db.ts) — ne voyait aucun fichier. `createSignedUrl()` répondait
-- « Object not found », `/api/ged/file/:id` renvoyait 500 « Lien indisponible »,
-- et le service Plan / Bâtiment affichait une maquette vide avec ses repères
-- posés sur rien : l'écran paraissait totalement cassé alors que la donnée
-- était intacte. Le cloud, lui, porte ces policies — d'où un bug invisible
-- en production et présent uniquement en local.
--
-- POSTURE : identique au cloud. La clé anon est serveur-only (rendu SSR, elle
-- n'est jamais envoyée au navigateur) ; c'est un choix assumé du projet.
-- ══════════════════════════════════════════════════════════════

-- ⚠ Le schéma `storage` est créé par l'image Supabase ; selon l'ordre d'exécution des
-- scripts d'init il peut ne pas encore exister. Tout est donc encapsulé et FAIL-SOFT :
-- si `storage.objects` est absent, le script n'échoue pas et l'init se poursuit.
do $$
begin
  if to_regclass('storage.objects') is null then
    raise notice 'storage.objects absent — policies GED non créées (rejouer ce script après le démarrage du service storage).';
    return;
  end if;

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

  raise notice 'Policies GED créées (bucket ged accessible à la clé anon).';
end $$;
