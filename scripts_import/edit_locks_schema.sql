-- Verrou d'édition GÉNÉRIQUE (verrouillage pessimiste) — empêche deux personnes
-- d'éditer la même ressource en même temps. Source de vérité DDL.
-- Utilisé par l'API /api/locks/* (acquérir / battement / relâcher / statut) et le
-- helper client réutilisable (src/shared.ts) branché sur les formulaires éditables.
--
-- « resource » = clé unique de la chose éditée, ex :
--   nomenclature:7365635125:A   ·   commande:CMD-2026-0007   ·   client:CL-4116097
-- Un verrou est considéré « périmé » si heartbeat_at date de plus de ~60 s
-- (la personne a fermé l'onglet sans relâcher) → il peut alors être repris.

create table if not exists public.edit_locks (
  resource      text primary key,            -- 1 verrou max par ressource
  holder_id     text,                        -- matricule / id de session
  holder_label  text,                        -- nom affiché (« en cours par X »)
  acquired_at   timestamptz default now(),
  heartbeat_at  timestamptz default now()
);

create index if not exists idx_edit_locks_heartbeat on public.edit_locks (heartbeat_at);

-- RLS permissive (posture assumée, cf. docs/technique/08-securite.md)
alter table public.edit_locks enable row level security;
create policy edit_locks_all on public.edit_locks for all using (true) with check (true);

notify pgrst, 'reload schema';
