-- ══════════════════════════════════════════════════════════════
-- Non-conformités — champs Qualité ajoutés (2026-07-30)
--   fournisseur_nom  : NC fournisseur/ST → raison sociale du fournisseur
--   lieu_detection   : là où la NC a été DÉTECTÉE
--   lieu_imputation  : là où la NC a été FAITE (imputée)
-- (Le n° NC côté client = colonne `frc` déjà existante ; lot/code article/désignation
--  = lot_ref / ref_article / designation déjà existants.)
--
-- À exécuter avec un rôle habilité (PAT / service_role), une seule fois. Idempotent.
-- ══════════════════════════════════════════════════════════════
alter table public.non_conformites add column if not exists fournisseur_nom text;
alter table public.non_conformites add column if not exists lieu_detection  text;
alter table public.non_conformites add column if not exists lieu_imputation text;

notify pgrst, 'reload schema';
