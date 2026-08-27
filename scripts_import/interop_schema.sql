-- ══════════════════════════════════════════════════════════════
-- INTEROPÉRABILITÉ — colonnes de roll-up coût/marge & traçabilité
-- À exécuter dans l'éditeur SQL Supabase (anon ne fait pas de DDL).
-- Idempotent : ADD COLUMN IF NOT EXISTS.
-- Alimenté par recomputeCmdCout() (queries.ts), best-effort au soldage BDT.
-- ══════════════════════════════════════════════════════════════

-- Coût de revient RÉEL agrégé (MO temps réel + machine + matière sortie) et marge réelle (CA facturé − coût réel)
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS cout_reel   numeric;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS marge_reelle numeric;

-- Coût réel par lot + avancement (passé à 'termine' quand tous les BDT du lot sont soldés)
ALTER TABLE lots ADD COLUMN IF NOT EXISTS cout_reel  numeric;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS avancement int;

-- Traçabilité NC → BDT (en plus de lot_ref déjà présent) — pour relier la non-conformité au bon de travail exact
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS bdt_id text;

-- (Optionnel) verrouiller la version de nomenclature utilisée à la commande
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS nomenclature_id text;
