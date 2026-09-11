-- ═══════════════════════════════════════════════════════════════════════════
-- 007 · Identifiant généré par défaut — le Docker s'aligne sur le cloud
--
-- Constat (11/09/2026) : la base Docker naît de db/seed/schema.sql, un pg_dump du miroir local
-- où 50 tables ont une colonne « id text NOT NULL » SANS valeur par défaut (et une, numérique :
-- mouvements_perissables). Toute insertion qui n'envoie pas d'id y échoue (« null value in column
-- "id" ... violates not-null constraint »), alors qu'en cloud la base génère l'id. Effets sur une
-- VM : créer une nomenclature, créer un nouvel indice, créer l'entrée de stock vide d'une
-- nouvelle référence, enregistrer une sortie de périssable… échouaient.
--
-- Correctif, uniquement sur les colonnes id qui n'ont AUCUN défaut :
--   1) id texte     → « default gen_random_uuid()::text » ;
--   2) id numérique → une séquence, reprise au-delà du plus grand id existant.
-- Sans risque par construction : une insertion qui fournit son id n'est pas concernée, et une
-- insertion qui n'en fournit pas échouait jusqu'ici. Une colonne qui a déjà un défaut (base
-- restaurée depuis un dump du cloud) n'est pas touchée. Idempotente. Aucune donnée modifiée.
-- Pas d'équivalent cloud : il génère déjà ses identifiants.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  r record;
  n int := 0;
  m int := 0;
  seq text;
begin
  for r in
    select c.table_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
     where c.table_schema = 'public'
       and c.column_name = 'id'
       and c.data_type = 'text'
       and c.column_default is null
     order by c.table_name
  loop
    execute format('alter table public.%I alter column id set default gen_random_uuid()::text', r.table_name);
    n := n + 1;
  end loop;

  for r in
    select c.table_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
     where c.table_schema = 'public'
       and c.column_name = 'id'
       and c.data_type in ('smallint', 'integer', 'bigint', 'numeric')
       and c.column_default is null
     order by c.table_name
  loop
    seq := format('%s_id_seq', r.table_name);
    execute format('create sequence if not exists public.%I', seq);
    execute format('select setval(%L, coalesce((select max(id)::bigint from public.%I), 0) + 1, false)', format('public.%I', seq), r.table_name);
    execute format('alter table public.%I alter column id set default nextval(%L)', r.table_name, format('public.%I', seq));
    execute format('grant usage, select on sequence public.%I to anon, authenticated, service_role', seq);
    m := m + 1;
  end loop;
  raise notice '007 : identifiant par defaut pose sur % table(s) texte et % table(s) numerique(s).', n, m;
end
$$;

notify pgrst, 'reload schema';
