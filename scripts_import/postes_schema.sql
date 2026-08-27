-- ══════════════════════════════════════════════════════════════
-- POSTES D'ATELIER — regroupent machines + process, planning par poste, OPEX par poste
-- Source de vérité DDL (cf. skill erp-db). À exécuter dans l'éditeur SQL Supabase.
-- Modèle : un POSTE = conteneur de plusieurs machines ET plusieurs process d'atelier.
--   • chaque process garde son type (Manuel / Machine / OAS via requiert_machine + est_oas)
--   • une machine appartient à un poste (machines.poste_id)
--   • un process est relié à un poste (process_atelier.poste_id)
--   • le planning place les BDT PAR POSTE (via le process du BDT → son poste)
--   • OPEX poste = somme de l'OPEX de ses machines (+ consommables suivis au poste pour les postes manuels)
-- ══════════════════════════════════════════════════════════════

create table if not exists public.postes (
  id         text primary key,
  nom        text not null,
  code       text,
  activite   text,                         -- 'Seem' | 'Semrac' | 'both'
  couleur    text default '#6366f1',
  ordre      integer default 100,
  statut     text default 'actif',         -- 'actif' | 'inactif'
  notes      text,
  created_at timestamptz default now()
);

-- Rattachements (FK souples : si un poste est supprimé, on détache sans casser machines/process)
alter table public.machines        add column if not exists poste_id text references public.postes(id) on delete set null;
alter table public.process_atelier add column if not exists poste_id text references public.postes(id) on delete set null;

-- OPEX des postes MANUELS (sans machine) : une sortie de consommable peut être rattachée à un poste
alter table public.mouvements_stock add column if not exists poste_id text references public.postes(id) on delete set null;

-- Planning par poste : un BDT peut être placé explicitement à un poste (sinon il hérite du poste de son process)
alter table public.bons_de_travail add column if not exists poste_id text references public.postes(id) on delete set null;

create index if not exists idx_machines_poste        on public.machines(poste_id);
create index if not exists idx_process_atelier_poste on public.process_atelier(poste_id);
create index if not exists idx_mouvements_stock_poste on public.mouvements_stock(poste_id);
create index if not exists idx_bons_de_travail_poste on public.bons_de_travail(poste_id);

-- RLS permissive (posture assumée, identique au reste du projet — clé anon serveur-only)
alter table public.postes enable row level security;
drop policy if exists postes_all on public.postes;
create policy postes_all on public.postes for all using (true) with check (true);

-- IMPORTANT : recharge le cache de schéma PostgREST (sinon les nouvelles colonnes/tables sont invisibles)
notify pgrst, 'reload schema';
