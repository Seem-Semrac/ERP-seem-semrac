-- ══════════════════════════════════════════════════════════════
-- Déchets automatiques — traçabilité + idempotence
-- source_type = origine (quarantaine / nc_rebut / perissable / oas_vidange / chute)
-- source_ref  = id de l'objet source (évite les doublons si l'événement est rejoué).
-- Fail-soft : hseDechetsHasSource (queries.ts) crée sans ces colonnes si absentes.
-- À jouer une fois dans Supabase. Idempotent.
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.hse_dechets
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_ref text;

NOTIFY pgrst, 'reload schema';
