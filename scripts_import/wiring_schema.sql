-- ════════════════════════════════════════════════════════════════════
-- Branchement des données QHSE entre elles (fournisseurs / coûts / liens inter-modules)
-- Plan « snuggly-foraging-clock ». Exécuté via Supabase Management API (PAT) cette session.
-- Style assumé : colonnes *_id / *_ref nullable (PAS de FK dure — orphelins existants).
-- Après exécution : NOTIFY pgrst, 'reload schema';
-- ════════════════════════════════════════════════════════════════════

-- ── Lot 1 — Fournisseurs reliés aux EPI / périssables / demandes d'achat ──
ALTER TABLE hse_epi_catalogue   ADD COLUMN IF NOT EXISTS fournisseur_id text;
ALTER TABLE hse_epi_dotations   ADD COLUMN IF NOT EXISTS fournisseur_id text;
ALTER TABLE produits_perissables ADD COLUMN IF NOT EXISTS fournisseur_id text;
ALTER TABLE demandes_achat      ADD COLUMN IF NOT EXISTS fournisseur_id text;
-- (hse_produits_chimiques.fournisseur_id existait déjà — modèle de référence.)

-- ── Lot 4 — Liens inter-modules fonctionnels (traçabilité métier) ──
-- Action corrective rattachée à son événement source (incident HSE, NC qualité…).
ALTER TABLE actions_correctives ADD COLUMN IF NOT EXISTS source_type text;  -- 'incident' | 'nc' | …
ALTER TABLE actions_correctives ADD COLUMN IF NOT EXISTS source_ref  text;  -- id de l'enregistrement source
-- Dérogation rattachée à la NC qui l'a déclenchée (décision « Accepté en dérogation »).
ALTER TABLE derogations         ADD COLUMN IF NOT EXISTS nc_ref text;

-- ── Lot 6 — Traçabilité : updated_at auto-renseigné sur les tables sensibles ──
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

ALTER TABLE certifications        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE hse_incidents         ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE hse_epi_dotations     ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE competences_operateur ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
-- (non_conformites a déjà updated_at.) Trigger BEFORE UPDATE sur chacune :
DROP TRIGGER IF EXISTS trg_set_updated_at ON certifications;        CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON certifications        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at ON hse_incidents;         CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON hse_incidents         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at ON hse_epi_dotations;     CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON hse_epi_dotations     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_set_updated_at ON competences_operateur; CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON competences_operateur FOR EACH ROW EXECUTE FUNCTION set_updated_at();

NOTIFY pgrst, 'reload schema';
