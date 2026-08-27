-- ══════════════════════════════════════════════════════════════
-- AES multi-axes (ISO 14001 §6.1.2 — cotation INRS)
-- Ajoute les axes Probabilité / Sensibilité + décomposition de la Maîtrise
-- (technique / humaine / organisationnelle) à l'analyse environnementale.
-- Note de criticité = P × F × G × S × (maîtrise_moyenne / 5) ; AES si note ≥ 1000.
-- Le code est FAIL-SOFT : ces colonnes sont retirées du payload tant que la
-- migration n'est pas jouée (queries.ts hseAspectsHasMultiaxe). À jouer une fois
-- dans le SQL Editor de Supabase (cloud). Idempotent.
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.hse_aspects_impacts
  ADD COLUMN IF NOT EXISTS probabilite integer,
  ADD COLUMN IF NOT EXISTS sensibilite integer,
  ADD COLUMN IF NOT EXISTS maitrise_technique integer,
  ADD COLUMN IF NOT EXISTS maitrise_humaine integer,
  ADD COLUMN IF NOT EXISTS maitrise_organisationnelle integer;

-- Recharge le cache de schéma PostgREST pour exposer les nouvelles colonnes.
NOTIFY pgrst, 'reload schema';
