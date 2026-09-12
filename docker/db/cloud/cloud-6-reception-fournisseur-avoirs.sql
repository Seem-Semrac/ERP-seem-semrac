-- ═══════════════════════════════════════════════════════════════════════════
-- cloud-6 · Lot fournisseur non conforme : décision tracée + registre des avoirs fournisseurs
--           (équivalent CLOUD de la migration Docker 008)
--
-- À JOUER À LA MAIN dans Supabase Studio → SQL Editor, en une fois.
-- Purement additif, idempotent : aucune ligne existante n'est modifiée, aucune colonne n'est
-- retirée, aucune valeur de `statut` nouvelle n'est écrite (donc aucune contrainte CHECK à revoir).
--
-- Sans ce script, côté cloud : la Qualité ne peut PAS statuer sur un lot de réception non conforme
-- (l'écran le dit et la route refuse, plutôt que de décider sans rien tracer), et l'onglet
-- « Avoirs fournisseurs » des Achats affiche un bandeau « registre absent de la base ».
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1 · Décision sur un lot en quarantaine ────────────────────────────────────────────────
alter table public.quarantaines add column if not exists issue              text;   -- retour_fournisseur | derogation_fournisseur | entree_partielle
alter table public.quarantaines add column if not exists qte               numeric; -- quantité du lot mis en quarantaine
alter table public.quarantaines add column if not exists qte_acceptee      numeric; -- entrée en stock
alter table public.quarantaines add column if not exists qte_retour        numeric; -- repart chez le fournisseur
alter table public.quarantaines add column if not exists qte_rebut         numeric; -- mise au rebut chez nous
alter table public.quarantaines add column if not exists compensation      text;    -- avoir | remplacement | aucune
alter table public.quarantaines add column if not exists bc_id             text;
alter table public.quarantaines add column if not exists bl_id             text;
alter table public.quarantaines add column if not exists fournisseur_nom   text;
alter table public.quarantaines add column if not exists derogation_ref    text;    -- référence de la dérogation convenue avec le fournisseur
alter table public.quarantaines add column if not exists decision_par      text;
alter table public.quarantaines add column if not exists decision_le       text;
alter table public.quarantaines add column if not exists decision_motif    text;
alter table public.quarantaines add column if not exists avoir_id          text;    -- avoirs_fournisseurs.id (lien souple, pas de FK)
alter table public.quarantaines add column if not exists retour_expedie_le  text;
alter table public.quarantaines add column if not exists retour_expedie_par text;
alter table public.quarantaines add column if not exists retour_ref         text;   -- bon de retour / n° de suivi

create index if not exists idx_quar_bl    on public.quarantaines (bl_id);
create index if not exists idx_quar_issue on public.quarantaines (issue);

-- ── 2 · Registre des avoirs fournisseurs / sous-traitants ─────────────────────────────────
create table if not exists public.avoirs_fournisseurs (
  id              text primary key default gen_random_uuid()::text,
  num_avoir       text not null,                      -- AVF-AAAA-NNN (numérotation ERP)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  tiers_type      text not null default 'fournisseur', -- fournisseur | sous_traitant
  tiers_id        text,
  tiers_nom       text not null,
  origine         text not null default 'manuel',      -- reception_non_conforme | refaction | manuel
  motif           text,
  montant         numeric not null default 0,          -- HT
  montant_impute  numeric not null default 0,          -- déjà utilisé (solde = montant - montant_impute)
  statut          text not null default 'a_recevoir',  -- a_recevoir | recu | partiel | solde | annule
  date_demande    text,
  ref_fournisseur text,                                -- n° de l'avoir émis par le fournisseur
  date_reception  text,
  bc_id           text,
  bl_id           text,
  quarantaine_id  text,
  nc_id           text,
  num_affaire     text,
  imputations     jsonb not null default '[]'::jsonb,  -- [{date, montant, ref, note, par}]
  cree_par        text,
  annule_le       text,
  annule_par      text,
  annule_motif    text
);

create unique index if not exists uq_avf_num   on public.avoirs_fournisseurs (num_avoir);
create index        if not exists idx_avf_tiers on public.avoirs_fournisseurs (tiers_nom);
create index        if not exists idx_avf_statut on public.avoirs_fournisseurs (statut);
-- Un seul avoir par décision de quarantaine : deux clics simultanés ne peuvent pas en créer deux.
create unique index if not exists uq_avf_quarantaine on public.avoirs_fournisseurs (quarantaine_id) where quarantaine_id is not null;

alter table public.avoirs_fournisseurs enable row level security;
drop policy if exists avf_lecture on public.avoirs_fournisseurs;
drop policy if exists avf_ajout   on public.avoirs_fournisseurs;
drop policy if exists avf_maj     on public.avoirs_fournisseurs;
create policy avf_lecture on public.avoirs_fournisseurs for select to anon, authenticated using (true);
create policy avf_ajout   on public.avoirs_fournisseurs for insert to anon, authenticated with check (true);
create policy avf_maj     on public.avoirs_fournisseurs for update to anon, authenticated using (true) with check (true);

-- Les droits par défaut du projet donnent tout à anon : on les retire, puis on ne rend que la
-- lecture, l'ajout et la mise à jour. Pas d'effacement : un avoir s'annule (statut + motif).
revoke all on table public.avoirs_fournisseurs from anon, authenticated;
grant select, insert, update on table public.avoirs_fournisseurs to anon, authenticated;

notify pgrst, 'reload schema';
