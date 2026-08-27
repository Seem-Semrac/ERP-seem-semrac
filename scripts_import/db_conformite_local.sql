-- ══════════════════════════════════════════════════════════════
-- CONFORMITÉ — côté DOCKER (aligne le local sur le cloud)
-- 2026-08-25
--
-- Objectif : copie CONFORME entre la base cloud (production) et la base Docker.
-- Le cloud fait référence : tout ce qui n'existe qu'en local et ne sert à rien
-- est retiré. Ce qui n'existe qu'en local MAIS dont le code a besoin n'est PAS
-- retiré — il est ajouté au cloud (voir db_conformite_cloud.sql).
--
-- Idempotent. Cuit dans l'image db (db.Dockerfile) : une stack neuve est conforme.
-- ══════════════════════════════════════════════════════════════

-- ─── 1. import_staging + ses 3 fonctions : n'existent qu'en local ──
-- Vérifié : aucune occurrence dans src/, et les 3 fonctions renvoient 404 côté
-- cloud (absentes). Artefact d'un import ponctuel, jamais porté en production.
drop function if exists public.promote_import_batch(text)   cascade;
drop function if exists public.promote_import_row(bigint)   cascade;
drop function if exists public.validate_import_batch(text, text) cascade;
drop table    if exists public.import_staging               cascade;

-- ─── 2. Résidus de test locaux, absents du cloud ──────────────
-- 37 lignes créées lors des essais de juillet (références CMD-TEST, FAC1,
-- article S1, lot L1). Le cloud en compte 0 : on remet le local à 0.
-- ⚠ Le miroir ne vide PAS une table locale quand la table cloud est vide
--   (volontaire : on ne détruit pas du travail local). D'où leur persistance.
delete from public.ecritures_comptables;
delete from public.factures_client;
delete from public.mouvements_stock;
