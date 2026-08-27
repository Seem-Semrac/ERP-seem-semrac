-- ══════════════════════════════════════════════════════════════
-- Ingestion IA : table tampon + promotion sécurisée.
-- Le workflow n8n écrit ici le mapping produit par le LLM (statut 'pending').
-- On VALIDE (statut 'validated') après revue, puis on PROMEUT vers la vraie table.
-- Appliquer :  docker exec -i erp-db psql -U postgres -d postgres < import_staging.sql
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.import_staging (
  id           bigserial PRIMARY KEY,
  batch_id     text NOT NULL,                     -- 1 upload = 1 lot
  created_at   timestamptz NOT NULL DEFAULT now(),
  source_file  text,
  target_table text NOT NULL,                     -- table cible (décidée en input)
  row_index    int,                               -- n° de ligne source
  source_row   jsonb,                             -- ligne CSV/XLS brute
  mapped       jsonb,                             -- {colonne: valeur} produit par le LLM
  status       text NOT NULL DEFAULT 'pending',   -- pending|validated|inserted|rejected|error
  error        text,
  validated_by text,
  validated_at timestamptz,
  inserted_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_import_staging_batch  ON public.import_staging(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_staging_status ON public.import_staging(status);

-- ── Promotion d'UNE ligne validée vers sa table cible ──
-- Sécurité : n'insère QUE les clés du mapping qui sont de VRAIES colonnes de la
-- table cible (intersection via information_schema) → une colonne hallucinée par
-- le LLM est ignorée, et les colonnes absentes gardent leur DEFAULT (id/uuid, dates…).
CREATE OR REPLACE FUNCTION public.promote_import_row(p_id bigint)
RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE
  r     public.import_staging%ROWTYPE;
  v_cols text;
  v_sql  text;
BEGIN
  SELECT * INTO r FROM public.import_staging WHERE id = p_id;
  IF r.id IS NULL THEN RETURN 'not_found'; END IF;
  IF r.status <> 'validated' THEN RETURN 'skip: statut=' || r.status; END IF;

  -- Colonnes = clés du mapping ∩ colonnes réelles de la table cible.
  SELECT string_agg(quote_ident(c.column_name), ', ')
    INTO v_cols
    FROM information_schema.columns c
   WHERE c.table_schema = 'public'
     AND c.table_name = r.target_table
     AND r.mapped ? c.column_name;

  IF v_cols IS NULL THEN
    UPDATE public.import_staging SET status='error', error='aucune colonne du mapping ne correspond à '||r.target_table WHERE id=p_id;
    RETURN 'error: aucune colonne valide';
  END IF;

  v_sql := format(
    'INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)',
    r.target_table, v_cols, v_cols, r.target_table);

  BEGIN
    EXECUTE v_sql USING r.mapped;
    UPDATE public.import_staging SET status='inserted', inserted_at=now(), error=NULL WHERE id=p_id;
    RETURN 'inserted';
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.import_staging SET status='error', error=SQLERRM WHERE id=p_id;
    RETURN 'error: ' || SQLERRM;
  END;
END $fn$;

-- ── Promotion de TOUT un lot validé ──
CREATE OR REPLACE FUNCTION public.promote_import_batch(p_batch text)
RETURNS TABLE(id bigint, result text) LANGUAGE plpgsql AS $fn$
DECLARE r record;
BEGIN
  FOR r IN SELECT s.id FROM public.import_staging s
            WHERE s.batch_id = p_batch AND s.status = 'validated' ORDER BY s.id LOOP
    id := r.id; result := public.promote_import_row(r.id); RETURN NEXT;
  END LOOP;
END $fn$;

-- ── Raccourci : valider toutes les lignes 'pending' d'un lot (après revue) ──
CREATE OR REPLACE FUNCTION public.validate_import_batch(p_batch text, p_by text DEFAULT 'manuel')
RETURNS bigint LANGUAGE sql AS $fn$
  WITH upd AS (
    UPDATE public.import_staging
       SET status='validated', validated_by=p_by, validated_at=now()
     WHERE batch_id=p_batch AND status='pending'
     RETURNING 1)
  SELECT count(*) FROM upd;
$fn$;
