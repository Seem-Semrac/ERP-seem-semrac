-- ══════════════════════════════════════════════════════════════
-- Phase 4 (fin) — Cycle de vie (§6.1.2) + Autodiagnostic ISO 26000
-- Fail-soft : hseAspectsHasCycleVie + getter iso26000 -> [] si absents.
-- À jouer une fois dans Supabase. Idempotent.
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.hse_aspects_impacts
  ADD COLUMN IF NOT EXISTS etape_cycle_vie text;

CREATE TABLE IF NOT EXISTS public.hse_diagnostic_iso26000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  code text,
  titre text,
  niveau_actuel integer,
  niveau_cible integer,
  constat text,
  action text,
  responsable text,
  echeance date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.hse_diagnostic_iso26000 ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY hse_iso26000_all ON public.hse_diagnostic_iso26000 FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
