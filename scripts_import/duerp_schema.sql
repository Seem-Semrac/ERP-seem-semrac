-- ════════════════════════════════════════════════════════════════
-- DUERP — extension de hse_risques (fusion 2 fichiers, versionnage annuel)
-- Idempotent. À exécuter via Management API (PAT) ou SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- Classement par exercice (R.4121-2 : mise à jour ≥ 1×/an)
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS annee        int NOT NULL DEFAULT extract(year from now())::int;
-- Taxonomie INRS 2026 (famille canon)
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS famille      text;
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS famille_code int;
-- Traçabilité de l'unité de travail d'origine avant canonisation
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS ut_source    text;
-- Cotation brute Kinney conservée (P × F × G × coef)
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS probabilite   int;
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS freq_expo     int;
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS gravite_brute int;
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS coef          int DEFAULT 1;
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS score_brut    int;
-- Détail produits chimiques (CLP) + plan d'action (PAPRIPACT) + priorité unifiée
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS produits     text;
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS plan_action  text;
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS priorite     int;   -- 1 critique / 2 / 3 faible
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS source       text;  -- F1 | F2 | F1+F2 | manuel
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS cle_naturelle text; -- hash dedup
ALTER TABLE hse_risques ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now();

-- Idempotence de l'import + du clone annuel (NULL cle = lignes manuelles, non concernées)
CREATE UNIQUE INDEX IF NOT EXISTS hse_risques_annee_cle ON hse_risques(annee, cle_naturelle);

-- Priorité des lignes déjà présentes (saisies manuelles) dérivée de la criticité G×F
UPDATE hse_risques
   SET priorite = CASE WHEN COALESCE(criticite,0) >= 9 THEN 1
                       WHEN COALESCE(criticite,0) >= 4 THEN 2
                       ELSE 3 END
 WHERE priorite IS NULL;
