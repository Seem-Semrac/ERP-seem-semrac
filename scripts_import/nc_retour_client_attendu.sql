-- ════════════════════════════════════════════════════════════════════════════
-- RETOUR CLIENT ANNONCÉ EN QUALITÉ → RÉCEPTIONNÉ EN EXPÉDITIONS
-- ----------------------------------------------------------------------------
-- Flux métier (règle utilisateur) : on déclare d'abord une NON-CONFORMITÉ CLIENT
-- en Qualité, dans laquelle on précise qu'un RETOUR de marchandise est prévu et
-- sur QUELLE COMMANDE CLIENT. Les Expéditions voient alors ce retour dans leur
-- onglet « Réceptions » et enregistrent son arrivée → BL de retour rattaché à la
-- commande d'origine (bons_de_livraison.type_bl = 'retour_client').
--
-- `non_conformites.n_commande` EXISTE DÉJÀ (renseignée sur l'historique importé) :
-- rien à créer, il faut simplement que les formulaires l'alimentent enfin.
-- Aucune contrainte CHECK sur bons_de_livraison.type_bl → 'retour_client' passe.
-- ════════════════════════════════════════════════════════════════════════════
alter table public.non_conformites
  add column if not exists retour_attendu      boolean default false,  -- un retour physique est annoncé
  add column if not exists qte_retour_attendue numeric,                -- quantité que le client renvoie
  add column if not exists date_retour_prevue  text,                   -- date annoncée (texte : cohérent avec date_nc)
  add column if not exists retour_statut       text,                   -- attendu | recu | annule
  add column if not exists bl_retour_id        text,                   -- BL créé à la réception du retour
  add column if not exists date_retour_reelle  text;                   -- date d'arrivée constatée

-- Traçabilité inverse : depuis le BL de retour, retrouver la non-conformité.
alter table public.bons_de_livraison
  add column if not exists nc_id text;

-- Recharger le cache de schéma PostgREST (sinon les colonnes ne sont pas exposées)
notify pgrst, 'reload schema';
