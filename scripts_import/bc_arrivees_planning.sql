-- ════════════════════════════════════════════════════════════════════════════
-- Planning des arrivées fournisseurs/ST (onglet Expéditions) + OTD figé
-- ----------------------------------------------------------------------------
-- date_livraison        = date d'arrivée PRÉVUE ACTUELLE (éditable, colonne existante)
-- date_livraison_initiale = 1ʳᵉ date prévue, GELÉE au premier changement → base de l'OTD
--                           (reste NULL tant qu'on n'a pas changé la date ; l'OTD lit
--                            alors `date_livraison_initiale || date_livraison`)
-- date_reception_reelle = date d'arrivée RÉELLE, posée à la 1ʳᵉ réception (affichage + OTD)
-- ════════════════════════════════════════════════════════════════════════════
alter table bons_de_commande add column if not exists date_livraison_initiale date;
alter table bons_de_commande add column if not exists date_reception_reelle   date;

-- Recharger le cache de schéma PostgREST (sinon les nouvelles colonnes ne sont pas exposées)
notify pgrst, 'reload schema';
