-- Installation module SÉCURITÉ (schéma + seed) — coller dans Supabase SQL Editor et Run.

-- ══════════════════════════════════════════════════════════════
-- Module SÉCURITÉ (HSE / RSE) — schéma Supabase
-- À exécuter dans l'éditeur SQL Supabase (projet réveillé si en pause).
-- Idempotent : CREATE TABLE IF NOT EXISTS + policies recréées.
-- RLS : l'app utilise la clé ANON → une policy FOR ALL TO anon par table.
-- Convention : id uuid (défaut), entite text (Seem/Semrac), created_at timestamptz.
-- ══════════════════════════════════════════════════════════════

-- 1. DUER — recensement des dangers / évaluation des risques
CREATE TABLE IF NOT EXISTS hse_risques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  unite_travail text,
  zone text,
  danger text,
  situation text,
  risque text,
  gravite int,
  frequence int,
  maitrise int,
  criticite int,
  mesures_existantes text,
  mesures_prevues text,
  responsable text,
  echeance date,
  statut text DEFAULT 'a_traiter',
  created_at timestamptz DEFAULT now()
);

-- 2. Accidents / presqu'accidents / maladies pro
CREATE TABLE IF NOT EXISTS hse_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  type text,
  date_incident date,
  heure text,
  salarie_id text,
  salarie_nom text,
  zone text,
  poste text,
  partie_corps text,
  nature_lesion text,
  gravite text,
  avec_arret boolean DEFAULT false,
  jours_arret int DEFAULT 0,
  temoins text,
  description text,
  premiers_secours text,
  declaration_cpam_date date,
  analyse_causes text,
  actions_correctives text,
  responsable text,
  statut text DEFAULT 'nouveau',
  date_cloture date,
  created_at timestamptz DEFAULT now()
);

-- 3. Catalogue EPI
CREATE TABLE IF NOT EXISTS hse_epi_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  nom text,
  categorie text,
  norme_en text,
  duree_vie_mois int,
  ref_stock text,
  fournisseur text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. Dotations EPI nominatives
CREATE TABLE IF NOT EXISTS hse_epi_dotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  salarie_id text,
  salarie_nom text,
  epi_id uuid,
  epi_nom text,
  taille text,
  quantite int DEFAULT 1,
  date_remise date,
  date_peremption date,
  signature boolean DEFAULT false,
  statut text DEFAULT 'en_service',
  created_at timestamptz DEFAULT now()
);

-- 5. Produits chimiques / FDS
CREATE TABLE IF NOT EXISTS hse_produits_chimiques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  nom text,
  fournisseur_id text,
  fournisseur_nom text,
  ref_stock text,
  cas text,
  fds_ref text,
  fds_url text,
  fds_date date,
  etat text,
  pictogrammes jsonb DEFAULT '[]'::jsonb,
  mentions_danger jsonb DEFAULT '[]'::jsonb,
  cmr text,
  vlep text,
  zone_stockage text,
  retention boolean DEFAULT false,
  compatibilites text,
  quantite numeric,
  unite text,
  statut text DEFAULT 'en_stock',
  created_at timestamptz DEFAULT now()
);

-- 6. Registre des déchets (BSDD / Trackdéchets)
CREATE TABLE IF NOT EXISTS hse_dechets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  date_dechet date,
  code_dechet text,
  designation text,
  dangereux boolean DEFAULT false,
  quantite numeric,
  unite text,
  zone_producteur text,
  filiere text,
  transporteur text,
  exutoire text,
  bsdd_num text,
  trackdechets_id text,
  statut text DEFAULT 'enleve',
  created_at timestamptz DEFAULT now()
);

-- 7. Mesures environnementales (eau / air / bruit / énergie)
CREATE TABLE IF NOT EXISTS hse_mesures_env (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  type text,
  date_mesure date,
  point_mesure text,
  parametre text,
  valeur numeric,
  unite text,
  vle numeric,
  conforme boolean DEFAULT true,
  organisme text,
  observations text,
  created_at timestamptz DEFAULT now()
);

-- 8. Zones ATEX
CREATE TABLE IF NOT EXISTS hse_atex_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  nom text,
  type_zone text,
  localisation text,
  origine_risque text,
  substances text,
  materiel_requis text,
  mesures text,
  date_revue date,
  created_at timestamptz DEFAULT now()
);

-- 9. Vérifications générales périodiques (VGP)
CREATE TABLE IF NOT EXISTS hse_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  type text,
  equipement text,
  machine_id text,
  organisme text,
  date_controle date,
  date_prochaine date,
  periodicite_mois int,
  resultat text,
  levee_reserves text,
  rapport_url text,
  statut text DEFAULT 'a_jour',
  created_at timestamptz DEFAULT now()
);

-- 10. Matrice des formations requises (les enregistrements réels = certifications/habilitations)
CREATE TABLE IF NOT EXISTS hse_formations_requises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  poste text,
  formation text,
  obligatoire boolean DEFAULT true,
  periodicite_mois int,
  created_at timestamptz DEFAULT now()
);

-- 11. Exercices d'évacuation / incendie
CREATE TABLE IF NOT EXISTS hse_exercices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  type text,
  date_exercice date,
  site text,
  nb_participants int,
  duree_min int,
  scenario text,
  observations text,
  conforme boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 12. Plans de prévention / protocoles chargement / permis de feu
CREATE TABLE IF NOT EXISTS hse_plans_prevention (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  type text,
  entreprise_exterieure text,
  operation text,
  date_debut date,
  date_fin date,
  risques text,
  mesures text,
  signataires text,
  valide_par text,
  statut text DEFAULT 'en_cours',
  created_at timestamptz DEFAULT now()
);

-- 13. Indicateurs RSE
CREATE TABLE IF NOT EXISTS hse_rse_indicateurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  periode text,
  categorie text,
  code text,
  libelle text,
  valeur numeric,
  unite text,
  cible numeric,
  created_at timestamptz DEFAULT now()
);

-- 14. Matrice de conformité réglementaire
CREATE TABLE IF NOT EXISTS hse_conformite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite text,
  domaine text,
  obligation text,
  reference_reglementaire text,
  applicable boolean DEFAULT true,
  statut text DEFAULT 'a_verifier',
  date_dernier_controle date,
  date_echeance date,
  responsable text,
  preuve_url text,
  observations text,
  created_at timestamptz DEFAULT now()
);

-- ─── RLS : accès clé anon (FOR ALL) sur chaque table ──────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'hse_risques','hse_incidents','hse_epi_catalogue','hse_epi_dotations',
    'hse_produits_chimiques','hse_dechets','hse_mesures_env','hse_atex_zones',
    'hse_verifications','hse_formations_requises','hse_exercices',
    'hse_plans_prevention','hse_rse_indicateurs','hse_conformite'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_anon_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO anon USING (true) WITH CHECK (true);', t || '_anon_all', t);
  END LOOP;
END $$;

-- ─── Index utiles (échéances / filtres) ───────────────────────
CREATE INDEX IF NOT EXISTS idx_hse_incidents_date ON hse_incidents (date_incident DESC);
CREATE INDEX IF NOT EXISTS idx_hse_verifs_prochaine ON hse_verifications (date_prochaine);
CREATE INDEX IF NOT EXISTS idx_hse_epi_dot_perem ON hse_epi_dotations (date_peremption);
CREATE INDEX IF NOT EXISTS idx_hse_conformite_echeance ON hse_conformite (date_echeance);

-- ─────────── SEED ───────────

-- ══════════════════════════════════════════════════════════════
-- Module SÉCURITÉ — données de référence (seed)
-- À exécuter APRÈS securite_schema.sql. Idempotent : chaque bloc
-- n'insère que si la table cible est vide (WHERE NOT EXISTS).
-- ══════════════════════════════════════════════════════════════

-- ─── Matrice de conformité réglementaire ──────────────────────
INSERT INTO hse_conformite (domaine, obligation, reference_reglementaire)
SELECT * FROM (VALUES
  ('travail',     'DUERP rédigé et mis à jour (≥ 1×/an et à chaque changement)', 'Code du travail R.4121-1'),
  ('travail',     'Registre des AT + déclaration CPAM < 48 h',                   'Code SS L.441-2'),
  ('travail',     'Registre des accidents bénins tenu à jour',                   'Code SS L.441-4'),
  ('travail',     'Affichages obligatoires (consignes, n° urgence, interdiction de fumer)', 'Code du travail D.4711-1'),
  ('travail',     'EPI fournis, adaptés et vérifiés',                            'Code du travail R.4321-4'),
  ('travail',     'Vérifications périodiques (levage, électrique, incendie, ESP)', 'Code du travail R.4323-23'),
  ('travail',     'Formations sécurité : accueil, SST, habilitations à jour',    'Code du travail L.4141-2'),
  ('travail',     'Exercice d''évacuation ≥ 1×/an',                              'Code du travail R.4227-39'),
  ('travail',     'Plan de prévention / protocole de sécurité (entreprises ext.)', 'Décret 92-158'),
  ('chimique',    'FDS à jour et accessibles aux salariés',                      'Code du travail R.4412-38'),
  ('chimique',    'Étiquetage CLP des produits et contenants',                   'Règlement CE 1272/2008 (CLP)'),
  ('chimique',    'Suivi agents CMR + mesures VLEP',                             'Code du travail R.4412-149'),
  ('atex',        'DRPCE rédigé + zonage ATEX + matériel conforme',              'Code du travail R.4227-52'),
  ('icpe',        'Conformité arrêté ICPE rubrique 2565 (traitement de surface)', 'Code de l''environnement'),
  ('icpe',        'Autosurveillance des rejets aqueux',                          'Arrêté préfectoral ICPE'),
  ('icpe',        'Registre des déchets + BSDD + Trackdéchets',                  'Code de l''environnement R.541-43'),
  ('icpe',        'Déclaration annuelle des émissions et déchets (GEREP)',       'Code de l''environnement'),
  ('rse',         'Index égalité F/H calculé et publié',                         'Code du travail D.1142-2'),
  ('rse',         'Déclaration obligatoire d''emploi des travailleurs handicapés (DOETH)', 'Code du travail L.5212-1'),
  ('iso45001',    'Système de management de la santé-sécurité au travail',       'ISO 45001'),
  ('iso14001',    'Système de management environnemental',                       'ISO 14001'),
  ('en9100',      'Gestion des risques & sécurité produit (lien Qualité)',       'EN 9100:2018')
) AS v(domaine, obligation, reference_reglementaire)
WHERE NOT EXISTS (SELECT 1 FROM hse_conformite);

-- ─── Matrice des formations sécurité requises ─────────────────
INSERT INTO hse_formations_requises (poste, formation, obligatoire, periodicite_mois)
SELECT * FROM (VALUES
  ('Tous',        'Accueil sécurité nouvel arrivant', true,  NULL::int),
  ('Tous',        'Évacuation / incendie',            true,  12),
  ('Tous',        'SST — Sauveteur Secouriste (recyclage)', true, 24),
  ('Production',  'Gestes et postures',               true,  24),
  ('Production',  'Risque chimique (ACD)',            true,  24),
  ('OAS',         'Risque chimique acides/bases',     true,  12),
  ('OAS',         'ATEX niveau 1',                    true,  36),
  ('Magasin',     'CACES chariot R489',               true,  60),
  ('Maintenance', 'Habilitation électrique (NF C18-510)', true, 36),
  ('Atelier',     'Travail en hauteur',               true,  36)
) AS v(poste, formation, obligatoire, periodicite_mois)
WHERE NOT EXISTS (SELECT 1 FROM hse_formations_requises);

-- ─── Catalogue EPI standard ───────────────────────────────────
INSERT INTO hse_epi_catalogue (nom, categorie, norme_en, duree_vie_mois)
SELECT * FROM (VALUES
  ('Casque de protection',         'tete',        'EN 397',          60),
  ('Lunettes de sécurité',         'yeux',        'EN 166',          24),
  ('Casque/bouchons anti-bruit',   'audition',    'EN 352',          12),
  ('Masque FFP3',                  'respiratoire','EN 149',          1),
  ('Gants nitrile (chimie)',       'mains',       'EN 374',          1),
  ('Gants anti-coupure',           'mains',       'EN 388',          6),
  ('Chaussures de sécurité S3',    'pieds',       'EN ISO 20345',    24),
  ('Combinaison/tablier chimique', 'corps',       'EN 13034',        12),
  ('Harnais antichute',            'antichute',   'EN 361',          120),
  ('Visière de soudage',           'yeux',        'EN 175',          36)
) AS v(nom, categorie, norme_en, duree_vie_mois)
WHERE NOT EXISTS (SELECT 1 FROM hse_epi_catalogue);

-- ─── Bibliothèque de dangers DUER (exemples) ──────────────────
INSERT INTO hse_risques (entite, unite_travail, zone, danger, risque, gravite, frequence, maitrise, statut)
SELECT * FROM (VALUES
  ('Seem',   'Usinage CN',          'Atelier Seem',   'Projection de copeaux',        'Lésion oculaire',     3, 3, 2, 'en_cours'),
  ('Seem',   'OAS — bains',         'Ligne OAS',      'Acide sulfurique (bains)',     'Brûlure chimique',    4, 2, 2, 'en_cours'),
  ('Semrac', 'Pliage / poinçonnage','Atelier Semrac', 'Pièce/outil en mouvement',     'Écrasement de la main', 4, 2, 2, 'en_cours'),
  ('Semrac', 'Magasin',             'Zone stockage',  'Circulation chariot élévateur','Collision piéton',    4, 2, 2, 'en_cours'),
  ('Seem',   'Atelier',             'Atelier Seem',   'Bruit des machines',           'Surdité / acouphènes', 3, 4, 2, 'a_traiter')
) AS v(entite, unite_travail, zone, danger, risque, gravite, frequence, maitrise, statut)
WHERE NOT EXISTS (SELECT 1 FROM hse_risques);

-- ─── Indicateurs RSE (modèles, période 2026) ──────────────────
INSERT INTO hse_rse_indicateurs (periode, categorie, code, libelle, unite, cible)
SELECT * FROM (VALUES
  ('2026', 'social',       'TF',         'Taux de fréquence des AT',          '',     0::numeric),
  ('2026', 'social',       'TG',         'Taux de gravité des AT',            '',     0::numeric),
  ('2026', 'social',       'ABS',        'Taux d''absentéisme',               '%',    4::numeric),
  ('2026', 'social',       'FORM',       'Heures de formation / salarié',     'h',    NULL::numeric),
  ('2026', 'social',       'EGAPRO',     'Index égalité F/H',                 '/100', 75::numeric),
  ('2026', 'environnement','EAU',        'Consommation d''eau',               'm³',   NULL::numeric),
  ('2026', 'environnement','DECHET',     'Taux de déchets valorisés',         '%',    70::numeric),
  ('2026', 'environnement','ENERGIE',    'Consommation électrique',           'kWh',  NULL::numeric),
  ('2026', 'gouvernance',  'ACHAT_RESP', 'Fournisseurs évalués RSE',          '%',    80::numeric)
) AS v(periode, categorie, code, libelle, unite, cible)
WHERE NOT EXISTS (SELECT 1 FROM hse_rse_indicateurs);
