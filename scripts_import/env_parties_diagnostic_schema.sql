-- ══════════════════════════════════════════════════════════════
-- Phase 4 — Parties intéressées (ISO 14001 §4.2) + Diagnostic ISO 14001
-- Deux nouvelles tables hse_*. Les getters sont fail-soft (renvoient [] si absentes),
-- donc l'appli fonctionne avant migration ; à jouer une fois dans Supabase. Idempotent.
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.hse_parties_interessees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  partie text NOT NULL,
  type text,
  attentes text,
  influence integer,
  maitrise integer,
  score integer,
  exigence_retenue text,
  mode_reponse text,
  statut text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hse_diagnostic_iso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  chapitre text,
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

-- RLS permissive (posture assumée, clé anon serveur-only — cf. autres tables hse_*).
ALTER TABLE public.hse_parties_interessees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hse_diagnostic_iso ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY hse_pi_all ON public.hse_parties_interessees FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY hse_diag_all ON public.hse_diagnostic_iso FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
