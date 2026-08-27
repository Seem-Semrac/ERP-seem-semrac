-- ══════════════════════════════════════════════════════════════
-- GED (Gestion Électronique de Documents) — Phase 1
-- Bucket Supabase Storage privé + registre `documents`.
-- Exécuté via la Management API (POST .../database/query).
-- Posture sécurité assumée (cf. security-posture) : le rôle `anon` est
-- utilisé UNIQUEMENT côté serveur (worker/fonction SSR) — un navigateur
-- ne possède pas la clé et ne peut donc pas atteindre Storage directement.
-- ══════════════════════════════════════════════════════════════

-- ── Bucket privé `ged` (50 Mo/fichier) ────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('ged', 'ged', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- ── Policies storage.objects pour le bucket `ged` (anon = serveur) ──
drop policy if exists "ged anon insert" on storage.objects;
drop policy if exists "ged anon select" on storage.objects;
drop policy if exists "ged anon update" on storage.objects;
drop policy if exists "ged anon delete" on storage.objects;
create policy "ged anon insert" on storage.objects for insert to anon with check (bucket_id = 'ged');
create policy "ged anon select" on storage.objects for select to anon using (bucket_id = 'ged');
create policy "ged anon update" on storage.objects for update to anon using (bucket_id = 'ged');
create policy "ged anon delete" on storage.objects for delete to anon using (bucket_id = 'ged');

-- ── Table registre `documents` ────────────────────────────────
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  categorie       text not null default 'autre',   -- plan_client | plan_cao | programme_fao | autre
  nomenclature_id text,                              -- lien souple (pas de FK dure : robustesse)
  version_groupe  text,                              -- suit le doc à travers les indices
  etape_ordre     int,                               -- FAO rattaché à une étape machine (sinon null)
  fichier_nom     text not null,                     -- nom d'origine
  storage_path    text not null,                     -- chemin dans le bucket ged
  mime            text,
  taille          bigint,
  plan_num        text,                              -- n° de plan (base) — pour la recherche (Phase 2)
  plan_indice     text,                              -- indice du plan client
  uploaded_par    text,
  uploaded_at     timestamptz not null default now(),
  actif           boolean not null default true
);
create index if not exists idx_documents_nom  on public.documents (nomenclature_id);
create index if not exists idx_documents_plan on public.documents (plan_num);

-- RLS cohérente avec le reste de la base (anon all) — posture assumée
alter table public.documents enable row level security;
drop policy if exists "documents anon all" on public.documents;
create policy "documents anon all" on public.documents for all to anon using (true) with check (true);

notify pgrst, 'reload schema';
