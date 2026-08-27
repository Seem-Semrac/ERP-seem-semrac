-- ══════════════════════════════════════════════════════════════
-- OBJECTIFS / CIBLES KPI — schéma Supabase
-- À exécuter dans l'éditeur SQL Supabase (projet réveillé si en pause).
-- Idempotent : CREATE TABLE IF NOT EXISTS + policy recréée + seed ON CONFLICT.
-- RLS : l'app utilise la clé ANON → une policy FOR ALL TO anon.
-- Lu par src/kpi.ts (resolveur objectif()) ; si table vide/absente,
-- le moteur retombe sur des défauts codés (jamais bloquant).
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS kpi_objectifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,              -- identifiant KPI : otd, otk, marge_pct, dso, ...
  libelle text,                    -- libellé affiché
  cible numeric,                   -- valeur cible
  unite text DEFAULT '%',          -- %, j, €, ratio
  sens text DEFAULT 'haut',        -- 'haut' (plus haut = mieux) / 'bas' (plus bas = mieux)
  seuil_alerte numeric,            -- bascule rouge en-deçà (sens=haut) / au-delà (sens=bas)
  entite text DEFAULT 'global',    -- Seem / Semrac / global
  updated_at timestamptz DEFAULT now()
);

-- Une cible unique par (code, entite)
CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_objectifs_code_entite ON kpi_objectifs (code, entite);

-- ─── RLS : accès clé anon (FOR ALL) ───────────────────────────
ALTER TABLE kpi_objectifs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kpi_objectifs_anon_all ON kpi_objectifs;
CREATE POLICY kpi_objectifs_anon_all ON kpi_objectifs FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── Seed des cibles standard (global) ────────────────────────
-- sens=haut : on veut être AU-DESSUS de la cible ; sens=bas : EN-DESSOUS.
INSERT INTO kpi_objectifs (code, libelle, cible, unite, sens, seuil_alerte, entite) VALUES
  ('otd',            'OTD — Livré à l''heure',          95,   '%',     'haut', 90,   'global'),
  ('otk',            'OTK — À l''heure & conforme',     92,   '%',     'haut', 85,   'global'),
  ('conversion',     'Taux de conversion offres',       30,   '%',     'haut', 20,   'global'),
  ('marge_pct',      'Taux de marge brute',             25,   '%',     'haut', 15,   'global'),
  ('dso',            'DSO — Délai de règlement client',  45,   'j',     'bas',  60,   'global'),
  ('dpo',            'DPO — Délai de règlement fourn.',  45,   'j',     'haut', 30,   'global'),
  ('dispo_machine',  'Disponibilité parc machines',     90,   '%',     'haut', 80,   'global'),
  ('oee',            'TRS / OEE',                        75,   '%',     'haut', 60,   'global'),
  ('taux_nc',        'Taux de non-conformité',          2,    '%',     'bas',  5,    'global'),
  ('cpk',            'Cpk moyen (capabilité)',          1.33, 'ratio', 'haut', 1.0,  'global'),
  ('liberation_pv',  'Taux de libération PV',           95,   '%',     'haut', 90,   'global'),
  ('absenteisme',    'Taux d''absentéisme',             4,    '%',     'bas',  8,    'global'),
  ('rotation_stock', 'Rotation des stocks',             6,    'ratio', 'haut', 3,    'global'),
  ('couverture_stock','Couverture stock (mois)',        2,    'mois',  'bas',  4,    'global'),
  ('fill_rate',      'Fill rate fournisseur',           95,   '%',     'haut', 85,   'global'),
  ('reprise',        'Taux de reprise production',      3,    '%',     'bas',  8,    'global')
ON CONFLICT (code, entite) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_kpi_objectifs_code ON kpi_objectifs (code);
