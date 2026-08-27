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
