-- ════════════════════════════════════════════════════════════════
-- TEMPS MACHINE ALLOUÉ sur les bons de travail (BDT)
-- ----------------------------------------------------------------
-- Le temps RÉEL mesuré d'un BDT = son temps total (reçu → soldé) : on ne
-- peut PAS séparer le temps homme du temps machine à l'exécution. On ne
-- conserve donc que le TEMPS MACHINE ALLOUÉ (planifié), récupérable de
-- l'analyse DT / nomenclature (étape « machine »).
--
-- temps_machine_alloue : heures machine PLANIFIÉES, alimentées lors de la
--                        génération du BDT depuis l'analyse DT. Tant que la
--                        colonne est nulle, le code dérive le temps machine
--                        de la gamme à la volée (étape machine × qté lot).
--
-- À exécuter dans Supabase → SQL Editor (la clé anon ne fait pas de DDL).
-- Idempotent.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE bons_de_travail ADD COLUMN IF NOT EXISTS temps_machine_alloue numeric;
