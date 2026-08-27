-- ══════════════════════════════════════════════════════════════
-- Cascade acceptation d'offre — SCHÉMA
-- À exécuter UNE fois dans Supabase → SQL Editor (idempotent : ré-exécutable sans risque).
-- Décisions : négociation = version in-place ; goulotte = BC 'recu' + prépa complète.
-- ══════════════════════════════════════════════════════════════

-- 1) NÉGOCIATION — compteur de version sur les offres (révision sur place)
alter table offres add column if not exists version integer not null default 1;
alter table offres add column if not exists motif_negociation text;

-- 2) PRÉPARATIONS TECHNIQUES — persistance des demandes générées à l'acceptation
--    (une ligne par nomenclature de la DT à préparer : code programme CN et/ou plan manquant)
create table if not exists preparations_techniques (
  id                text primary key,
  num_affaire       text,
  dt_ref            text,
  cmd_ref           text,
  code_ref_produit  text,          -- lien nomenclature (code_ref_produit)
  piece             text,          -- libellé pièce
  type              text default 'nouvelle',   -- nouvelle | maj (pièce déjà connue à mettre à jour)
  manque_code_cnc   boolean default false,     -- au moins une étape CNC sans n° programme CN
  manque_plan       boolean default false,     -- pas de plan (num_plan / fichier GED)
  statut            text default 'a_faire',    -- a_faire | en_cours | faite
  responsable       text,
  echeance          date,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
alter table preparations_techniques enable row level security;
drop policy if exists prep_all on preparations_techniques;
create policy prep_all on preparations_techniques for all to anon using (true) with check (true);

-- 3) LIAISON matière → commande (porte "matière reçue")
--    demandes_achat / bons_de_commande ne portaient pas le n° d'affaire de la commande.
alter table demandes_achat   add column if not exists num_affaire text;
alter table demandes_achat   add column if not exists cmd_ref     text;
alter table bons_de_commande add column if not exists num_affaire text;
alter table bons_de_commande add column if not exists cmd_ref     text;

-- (la réception écrira mouvements_stock + stock.stock_actuel ; colonnes déjà présentes)
-- (le flag bons_de_travail.matiere_ok existe déjà — sera enfin positionné par le code)

-- Recharger le cache de schéma PostgREST (sinon les nouvelles colonnes ne sont pas exposées)
notify pgrst, 'reload schema';
