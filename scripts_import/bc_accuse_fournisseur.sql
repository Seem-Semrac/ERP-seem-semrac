-- ══════════════════════════════════════════════════════════════
-- BC : suivi « commande validée par le fournisseur » (accusé de commande)
--
-- Le statut des bons de commande est verrouillé par un CHECK
-- (bons_de_commande_statut_check : brouillon / a_envoyer / envoye / recu) — on ne
-- peut donc PAS y ajouter une valeur « validée fournisseur ». On stocke l'accusé
-- dans une colonne dédiée, nullable : NULL = pas encore validée, timestamp = date de
-- validation par le fournisseur.
--
-- La « relance à J+7 » n'a besoin d'AUCUNE colonne : elle est dérivée côté application
-- de date_bc (BC envoyé depuis > 7 jours calendaires et non validé → « à relancer »).
--
-- À exécuter avec un rôle habilité (PAT / service_role), une seule fois. Idempotent.
-- ══════════════════════════════════════════════════════════════
alter table public.bons_de_commande
  add column if not exists accuse_fournisseur_le timestamptz;   -- validée par le fournisseur/ST → passe en attente de réception
alter table public.bons_de_commande
  add column if not exists date_relance timestamptz;            -- dernière relance notifiée (la relance à J+7 repart de cette date)

-- Recharge le cache de schéma PostgREST (sinon les nouvelles colonnes restent invisibles via REST).
notify pgrst, 'reload schema';
