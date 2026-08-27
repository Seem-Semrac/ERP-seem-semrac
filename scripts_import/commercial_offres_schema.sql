-- ═══════════════════════════════════════════════════════════════════════════
-- COMMERCIAL — Lot offres de prix : paiement/livraison/transport, TVA intra,
-- contacts multiples, devis PDF, avoirs avec mode de restitution.
-- Idempotent. À exécuter via PAT (skill erp-db). Puis : NOTIFY pgrst, 'reload schema';
-- NB : le « mode de paiement » réutilise clients.mode_facturation (déjà présent) —
--      aucune colonne de paiement n'est ajoutée.
-- ═══════════════════════════════════════════════════════════════════════════

-- FICHE CLIENT : TVA intracommunautaire + liste de contacts + contact principal
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tva_intra        text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contacts         jsonb DEFAULT '[]'::jsonb;   -- [{nom,poste,email,tel}]
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_principal text;                         -- nom/clé du contact principal
-- Rétro-compat : rapatrier le contact unique existant comme 1er contact de la liste.
UPDATE clients
   SET contacts = jsonb_build_array(jsonb_build_object('nom', coalesce(contact,''), 'poste', coalesce(poste,''), 'email', coalesce(email,''), 'tel', coalesce(tel,'')))
 WHERE (contacts IS NULL OR contacts = '[]'::jsonb)
   AND coalesce(contact,'') <> '';
UPDATE clients SET contact_principal = contact WHERE contact_principal IS NULL AND coalesce(contact,'') <> '';

-- OFFRE : mode de livraison + frais de transport + date d'envoi (statut « à relancer ») + snapshots PDF
ALTER TABLE offres ADD COLUMN IF NOT EXISTS mode_livraison text;                 -- 'franco' | 'depart_usine'
ALTER TABLE offres ADD COLUMN IF NOT EXISTS frais_transport numeric DEFAULT 0;   -- montant si franco
ALTER TABLE offres ADD COLUMN IF NOT EXISTS date_envoi     timestamptz;          -- posée à /envoyer → base du « à relancer » (>7j)
ALTER TABLE offres ADD COLUMN IF NOT EXISTS mode_reglement text;                 -- snapshot du mode_facturation client au moment du devis

-- AVOIRS (credits) : mode de restitution + origine + liaisons factures (avoir matière)
ALTER TABLE credits ADD COLUMN IF NOT EXISTS mode_restitution text;    -- 'deduire_facture' (facture en cours) | 'rembourser' | 'deduire_suivante' (reste en mémoire → proposé à la prochaine offre du client)
ALTER TABLE credits ADD COLUMN IF NOT EXISTS origine          text;    -- 'nc' | 'matiere' | 'commercial'
ALTER TABLE credits ADD COLUMN IF NOT EXISTS facture_source_id text;   -- avoir matière : facture matière (achat) qui justifie le montant
ALTER TABLE credits ADD COLUMN IF NOT EXISTS facture_cible_id  text;   -- facture de l'affaire interne sur laquelle on déduit l'avoir

-- (Reco) recharger PostgREST après DDL :
-- NOTIFY pgrst, 'reload schema';
