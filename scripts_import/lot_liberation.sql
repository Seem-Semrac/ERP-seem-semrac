-- ══════════════════════════════════════════════════════════════
-- Libération des lots — contrôle qualité FINAL avant expédition (2026-07-30)
--
-- Un lot dont tous les BDT sont soldés (production terminée) doit passer un
-- PV de libération (type_controle='final', décision libère/bloque) AVANT de
-- pouvoir être expédié. lots.statut passe à 'libere' (aucun CHECK sur lots.statut,
-- vérifié). On ajoute la traçabilité de la libération.
--
-- La quarantaine reste un flux SÉPARÉ (table quarantaines) ; un lot « bloqué »
-- au contrôle final y est envoyé.
--
-- À exécuter avec un rôle habilité (PAT / service_role), une seule fois. Idempotent.
-- ══════════════════════════════════════════════════════════════
alter table public.lots add column if not exists libere_le  timestamptz;
alter table public.lots add column if not exists libere_par text;

notify pgrst, 'reload schema';
