-- ════════════════════════════════════════════════════════════════
-- Lots 2-4 : Plan de contrôle EN9100, suivi périssables par lot, EPI×zone.
-- Idempotent. Exécuter via Management API (PAT) ou SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- Lot 2 — Plan de contrôle EN9100 / ISO9001
CREATE TABLE IF NOT EXISTS plans_controle (
  id          text PRIMARY KEY,
  num_ligne   int,
  operation   text,
  classification_client text,
  parametres  text,
  ecme_outils text,
  frequence_echantillonnage text,
  critere_acceptation text,
  responsable text,
  type_controle text,
  plan_reaction text,
  activite    text,
  ordre       int,
  statut      text DEFAULT 'actif',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Lot 3 — Périssables : colonnes lot + table mouvements (sorties FIFO)
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS code_produit            text;
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS date_reception          date;
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS delai_appro             text;
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS date_alerte             date;
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS lieu_utilisation        text;
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS n_commande_fournisseur  text;
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS n_lot_fournisseur       text;
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS qte_initiale            numeric;

CREATE TABLE IF NOT EXISTS mouvements_perissables (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  perissable_id text,
  date_sortie   date,
  qte_sortie    numeric,
  n_commande_client text,
  motif         text,
  inventaire_apres numeric,
  created_at    timestamptz DEFAULT now()
);

-- Lot 4 — Matrice EPI obligatoires par zone
CREATE TABLE IF NOT EXISTS hse_epi_zone (
  id          text PRIMARY KEY,
  entite      text,
  zone        text,
  epi         text,
  obligatoire boolean DEFAULT true,
  consignes   text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- RLS permissive (cohérent avec le reste du projet : clé anon SSR)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['plans_controle','mouvements_perissables','hse_epi_zone'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_all ON %I', t, t);
    EXECUTE format('CREATE POLICY %I_all ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
