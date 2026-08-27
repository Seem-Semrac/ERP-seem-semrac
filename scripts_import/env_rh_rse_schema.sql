-- ══════════════════════════════════════════════════════════════
-- Phase 4 — Données sociales RSE : diversité & turnover
-- Ajoute sexe / OETH (travailleur handicapé) / date de sortie aux salariés,
-- pour calculer l'index égalité F/H, le taux OETH (obligation 6 %) et le turnover.
-- Fail-soft : salariesHasRse (queries.ts) retire ces colonnes du payload si absentes.
-- À jouer une fois dans Supabase. Idempotent.
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.salaries
  ADD COLUMN IF NOT EXISTS sexe text,
  ADD COLUMN IF NOT EXISTS oeth boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_sortie date;

NOTIFY pgrst, 'reload schema';
