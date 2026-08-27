-- ══════════════════════════════════════════════════════════════
-- Maquette « BIM » du bâtiment — Phase 1
-- Un plan (image hébergée via la GED) + des repères ponctuels
-- reliés aux entités de l'ERP (machines, zones, extincteurs, ATEX…).
-- Exécuté via la Management API. RLS anon (posture assumée, cf. security-posture).
-- ══════════════════════════════════════════════════════════════

create table if not exists public.plans_batiment (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  entite       text,
  image_doc_id uuid,                       -- → documents.id (image de fond, servie par /api/ged/file/:id)
  notes        text,
  actif        boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.plan_marqueurs (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null,
  type       text not null default 'point',  -- machine|zone|extincteur|issue_secours|premiers_secours|atex|chimie|point
  x          numeric not null default 50,     -- % 0–100 (horizontal)
  y          numeric not null default 50,     -- % 0–100 (vertical)
  w          numeric,                          -- Phase 2 (zones)
  h          numeric,                          -- Phase 2 (zones)
  label      text,
  ref_table  text,                             -- table de l'entité liée
  ref_id     text,                             -- id de l'entité liée
  couleur    text,
  icone      text,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists idx_marqueurs_plan on public.plan_marqueurs (plan_id);

alter table public.plans_batiment enable row level security;
alter table public.plan_marqueurs enable row level security;
drop policy if exists "plans_batiment anon all" on public.plans_batiment;
create policy "plans_batiment anon all" on public.plans_batiment for all to anon using (true) with check (true);
drop policy if exists "plan_marqueurs anon all" on public.plan_marqueurs;
create policy "plan_marqueurs anon all" on public.plan_marqueurs for all to anon using (true) with check (true);

notify pgrst, 'reload schema';
