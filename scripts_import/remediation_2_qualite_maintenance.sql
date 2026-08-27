-- ═══════════════════════════════════════════════════════════════════════════
-- REMEDIATION — Lot 2 : portes qualité (rattachement NC) + maintenance préventive
-- Idempotent. À exécuter via l'API Management Supabase (PAT) — skill erp-db.
-- Puis : NOTIFY pgrst, 'reload schema';
-- ═══════════════════════════════════════════════════════════════════════════

-- Porte qualité : rattachement FIABLE d'une NC à son affaire (au lieu du fallback sous-chaîne lot_ref)
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS num_affaire text;
ALTER TABLE non_conformites ADD COLUMN IF NOT EXISTS affaire_id  text;
-- (bdt_id existe déjà via interop_schema.sql)

-- Maintenance préventive : OM idempotents par source (usure pièce / échéance calendaire)
ALTER TABLE ordres_maintenance ADD COLUMN IF NOT EXISTS piece_id text;
ALTER TABLE ordres_maintenance ADD COLUMN IF NOT EXISTS origine  text;   -- 'usure' | 'calendaire' | 'curatif' | ...
-- Unicité d'un OM préventif ouvert par (machine, pièce, origine) → empêche les doublons au re-scan.
-- (statut clos exclu de l'unicité pour permettre un nouvel OM après clôture)
CREATE UNIQUE INDEX IF NOT EXISTS uq_om_preventif_ouvert
  ON ordres_maintenance (machine_id, coalesce(piece_id,''), origine)
  WHERE statut IS DISTINCT FROM 'termine' AND statut IS DISTINCT FROM 'cloture' AND statut IS DISTINCT FROM 'annule';

-- NOTE congés→absences (à n'appliquer QUE si une sonde erp-db montre l'INSERT anon bloqué sur `absences`) :
-- ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY absences_anon_all ON absences FOR ALL TO anon USING (true) WITH CHECK (true);

-- (Reco) recharger PostgREST après DDL :
-- NOTIFY pgrst, 'reload schema';
