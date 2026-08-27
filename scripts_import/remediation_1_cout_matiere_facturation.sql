-- ═══════════════════════════════════════════════════════════════════════════
-- REMEDIATION — Lot 1 : boucle coût réel / matière / facturation
-- Idempotent. À exécuter via l'API Management Supabase (PAT) — skill erp-db.
-- Puis recharger le cache PostgREST : NOTIFY pgrst, 'reload schema';
-- ═══════════════════════════════════════════════════════════════════════════

-- Facturation : dénominateur STABLE du prorata (qté commandée d'origine, jamais décrémentée)
ALTER TABLE lots ADD COLUMN IF NOT EXISTS qte_initiale numeric;
UPDATE lots SET qte_initiale = qte WHERE qte_initiale IS NULL;

-- Avoir consommé à l'acceptation, à déduire du total facturable (plafond = montant - avoir)
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS avoir_applique numeric DEFAULT 0;

-- Porte matière : réception TOTALE requise (comparer cumulé reçu vs commandé)
ALTER TABLE bons_de_commande ADD COLUMN IF NOT EXISTS qte_commandee numeric;
ALTER TABLE bons_de_commande ADD COLUMN IF NOT EXISTS qte_recue     numeric DEFAULT 0;

-- Taux horaire machine = (OPEX annuel + AMORTISSEMENT annuel) / heures productives.
-- Amortissement annuel = valeur_achat / duree_amortissement_ans (0 si machine non amortie / déjà amortie).
ALTER TABLE machines ADD COLUMN IF NOT EXISTS valeur_achat            numeric;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS duree_amortissement_ans numeric;

-- Durcissement goulotte : _pretBDT passera de (matiere_ok !== false) à (matiere_ok === true).
-- Les BDT legacy à NULL doivent donc être fermés explicitement (sinon ils resteraient "prêts").
UPDATE bons_de_travail SET matiere_ok = false WHERE matiere_ok IS NULL;

-- (Reco) recharger PostgREST après DDL :
-- NOTIFY pgrst, 'reload schema';
