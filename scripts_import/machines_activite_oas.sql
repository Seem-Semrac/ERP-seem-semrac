-- ─────────────────────────────────────────────────────────────────────────────
-- Autoriser l'activité « OAS » (traitement de surface) sur les MACHINES.
--
-- Contexte : une machine peut désormais être en activité OAS (comme les postes et
-- les process). Le CHECK actuel `machines_activite_check` ne connaît que
-- 'Seem' / 'Semrac' / 'both' → l'INSERT/UPDATE avec 'OAS' échoue
-- (« new row for relation "machines" violates check constraint "machines_activite_check" »)
-- MÊME après le correctif applicatif (whitelist route élargie à 'OAS').
--
-- Les tables `postes` et `process_atelier` acceptent déjà 'OAS' (pas de CHECK
-- restrictif) — rien à faire de ce côté.
--
-- Idempotent : rejouable sans risque.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.machines DROP CONSTRAINT IF EXISTS machines_activite_check;
ALTER TABLE public.machines ADD  CONSTRAINT machines_activite_check
  CHECK (activite IN ('Seem', 'Semrac', 'both', 'OAS'));
