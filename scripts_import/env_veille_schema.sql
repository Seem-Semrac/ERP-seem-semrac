-- ══════════════════════════════════════════════════════════════
-- Veille réglementaire vivante — enrichit hse_conformite
-- source de veille (organisme/URL), type de texte et date de parution/MàJ.
-- Fail-soft : hseConformiteHasVeille (queries.ts) retire ces colonnes du payload
-- tant que la migration n'est pas jouée. À jouer une fois dans Supabase. Idempotent.
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.hse_conformite
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS type_texte text,
  ADD COLUMN IF NOT EXISTS date_parution date;

NOTIFY pgrst, 'reload schema';
