-- ════════════════════════════════════════════════════════════════
-- QHSE — schéma complémentaire (Tableau de bord Qualité V2)
-- À exécuter dans Supabase › SQL Editor (projet vyqgrasezpyqjwvijwvv).
-- Idempotent. Débloque : Pareto NC live, module Dérogations, Actions
-- correctives / 5 Pourquoi, Flash Sécurité, suivi conformité ISO 9001.
-- ════════════════════════════════════════════════════════════════

-- 1) Colonnes riches sur non_conformites (→ Pareto LIVE + détail NC).
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS type_defaut       text;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS type_cause        text;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS description       text;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS ref_article       text;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS n_commande        text;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS designation       text;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS action_corrective text;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS nb_pieces         integer;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS nb_litige         integer;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS frc               text;

-- 2) Dérogations (registre PMQ3-D4 + formulaire PMQ3-D3).
CREATE TABLE IF NOT EXISTS derogations (
  id              text PRIMARY KEY,
  numero          integer,
  date_demande    date,
  emetteur        text,
  client          text,
  contact         text,
  tel             text,
  email           text,
  designation     text,
  cmd_client      text,
  ref_client      text,
  ar              text,
  notre_ref       text,
  type_demande    text,           -- AC / AE / AR
  descriptif      text,
  quantite        integer,
  decision        text,           -- R (Refus) / AT (Accord Total) / AL (Accord Limité)
  decision_client text,
  commentaire     text,
  date_cloture    date,
  statut          text DEFAULT 'en_cours',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 3) Actions correctives + 5 Pourquoi (Qualité & Sécurité : AC / PAC / SD).
CREATE TABLE IF NOT EXISTS actions_correctives (
  id              text PRIMARY KEY,
  numero          integer,
  type            text,           -- AC / PAC / SD
  origine         text,           -- secteur / lieu
  source          text,           -- NC / audit / sécurité / réclamation
  description     text,
  analyse_5p      jsonb,          -- 5 Pourquoi : ["...","...","...","...","..."]
  cause_racine    text,
  action          text,
  responsable     text,
  diffusion       text,
  date_ouverture  date,
  date_echeance   date,
  date_cloture    date,
  efficacite      text,
  statut          text DEFAULT 'en_cours',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 4) Flash Sécurité (alertes terrain).
CREATE TABLE IF NOT EXISTS hse_flash (
  id          text PRIMARY KEY,
  numero      integer,
  date        date,
  secteur     text,
  evenement   text,
  mesures     text,
  diffusion   text,
  gravite     text,
  pilote      text,
  statut      text DEFAULT 'diffuse',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 5) Suivi de conformité ISO 9001 par audit (grille PMQ).
CREATE TABLE IF NOT EXISTS audit_conformite (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  audit_ref   text,               -- A-01 .. A-10
  clause      text,               -- 4.1, 5.1.1, ...
  statut      text,               -- aborde / na / a_auditer / ecart
  commentaire text,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (audit_ref, clause)
);

-- 6) RLS permissive (cohérent avec le reste du projet : clé anon SSR).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['derogations','actions_correctives','hse_flash','audit_conformite'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_all ON %I', t, t);
    EXECUTE format('CREATE POLICY %I_all ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
