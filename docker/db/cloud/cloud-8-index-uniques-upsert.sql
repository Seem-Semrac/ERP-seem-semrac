-- ═══════════════════════════════════════════════════════════════════════════
-- cloud-8 · Index UNIQUES exigés par les upserts de l'application (onConflict)
--           (équivalent CLOUD de la migration Docker 010)
--
-- À JOUER À LA MAIN dans Supabase Studio → SQL Editor, en une fois.
-- Purement additif et rejouable : pour chaque table ci-dessous, crée l'index unique qu'exige l'upsert de l'application
-- SEULEMENT s'il n'existe pas déjà un index ou une contrainte unique équivalent (mêmes colonnes) ET s'il n'y a pas de
-- doublons. Sur le cloud, ces upserts fonctionnent : le résultat attendu est donc cinq messages
-- « a deja un index unique equivalent, rien a faire ». Rien n'est jamais effacé : en cas de doublons, un WARNING les
-- signale avec la requête pour les lister et l'index à créer une fois traités.
--   operateur_presence     (operateur_id, date_presence)
--   affectation_poste      (operateur_id, date_affectation, process_id, shift)
--   competences_operateur  (salarie_id, operation)
--   produits_fournisseurs  (fournisseur_id, reference)
--   kpi_objectifs          (code, entite)
--
-- Sans ce script, si l'un de ces index manque en cloud : l'enregistrement correspondant échoue (erreur 42P10) — pour
-- les présences opérateur, l'écran l'affiche désormais avec un message qui renvoie ici.
-- Contrôle rapide avant de jouer le script :
--   select tablename, indexdef from pg_indexes
--    where schemaname = 'public'
--      and tablename in ('operateur_presence','affectation_poste','competences_operateur','produits_fournisseurs','kpi_objectifs');
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- GARDE-FOU : ce script est pour la base CLOUD (Supabase Studio du projet en ligne).
-- La base Docker / la VM appliquent docker/db/migrations/ TOUTES SEULES (erp-docker.sh maj) :
-- les y rejouer à la main échoue de façon déroutante (« must be owner of table … », parce que
-- le lanceur de migrations crée ses objets sous le rôle supabase_admin, pas sous le vôtre).
-- Signature d'une base Docker / VM : la table _erp_migrations, que le cloud n'a pas.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = '_erp_migrations') then
    raise exception 'MAUVAISE BASE : vous etes sur la base Docker / VM (table _erp_migrations presente). Ce script ne sert QUE pour la base cloud. Sur une VM, lancez plutot : ~/erp/docker/scripts/erp-docker.sh maj';
  end if;
end
$$;

-- ── operateur_presence (operateur_id, date_presence) ──────────────────────────
do $$
declare
  cols text[] := array['operateur_id', 'date_presence'];
  equivalent text;
  doublons bigint;
begin
  if to_regclass('public.operateur_presence') is null then
    raise notice 'cloud-8 : table operateur_presence absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'operateur_presence' and column_name = any (cols)) <> cardinality(cols) then
    raise warning 'cloud-8 : operateur_presence n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
    return;
  end if;
  select ic.relname into equivalent
    from pg_index x
    join pg_class ic on ic.oid = x.indexrelid
   where x.indrelid = 'public.operateur_presence'::regclass
     and x.indisunique and x.indisvalid and x.indpred is null and x.indexprs is null
     and x.indnatts = cardinality(cols)
     and (select array_agg(a.attname::text order by a.attname::text)
            from pg_attribute a
           where a.attrelid = x.indrelid and a.attnum = any (x.indkey::int2[]))
         = (select array_agg(c order by c) from unnest(cols) as c)
   limit 1;
  if equivalent is not null then
    raise notice 'cloud-8 : operateur_presence a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.operateur_presence
     where operateur_id is not null and date_presence is not null
     group by operateur_id, date_presence having count(*) > 1) d;
  if doublons > 0 then
    raise warning 'cloud-8 : % couple(s) (operateur_id, date_presence) en double dans operateur_presence : index unique NON cree, l enregistrement des presences restera en echec. Lister : select operateur_id, date_presence, count(*) from public.operateur_presence group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_operateur_presence_upsert on public.operateur_presence (operateur_id, date_presence);', doublons;
    return;
  end if;
  create unique index if not exists ux_operateur_presence_upsert on public.operateur_presence (operateur_id, date_presence);
  raise notice 'cloud-8 : index unique ux_operateur_presence_upsert cree';
end
$$;

-- ── affectation_poste (operateur_id, date_affectation, process_id, shift) ─────
do $$
declare
  cols text[] := array['operateur_id', 'date_affectation', 'process_id', 'shift'];
  equivalent text;
  doublons bigint;
begin
  if to_regclass('public.affectation_poste') is null then
    raise notice 'cloud-8 : table affectation_poste absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'affectation_poste' and column_name = any (cols)) <> cardinality(cols) then
    raise warning 'cloud-8 : affectation_poste n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
    return;
  end if;
  select ic.relname into equivalent
    from pg_index x
    join pg_class ic on ic.oid = x.indexrelid
   where x.indrelid = 'public.affectation_poste'::regclass
     and x.indisunique and x.indisvalid and x.indpred is null and x.indexprs is null
     and x.indnatts = cardinality(cols)
     and (select array_agg(a.attname::text order by a.attname::text)
            from pg_attribute a
           where a.attrelid = x.indrelid and a.attnum = any (x.indkey::int2[]))
         = (select array_agg(c order by c) from unnest(cols) as c)
   limit 1;
  if equivalent is not null then
    raise notice 'cloud-8 : affectation_poste a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.affectation_poste
     where operateur_id is not null and date_affectation is not null and process_id is not null and shift is not null
     group by operateur_id, date_affectation, process_id, shift having count(*) > 1) d;
  if doublons > 0 then
    raise warning 'cloud-8 : % affectation(s) (operateur_id, date_affectation, process_id, shift) en double dans affectation_poste : index unique NON cree, l affectation aux postes restera en echec. Lister : select operateur_id, date_affectation, process_id, shift, count(*) from public.affectation_poste group by 1, 2, 3, 4 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_affectation_poste_upsert on public.affectation_poste (operateur_id, date_affectation, process_id, shift);', doublons;
    return;
  end if;
  create unique index if not exists ux_affectation_poste_upsert on public.affectation_poste (operateur_id, date_affectation, process_id, shift);
  raise notice 'cloud-8 : index unique ux_affectation_poste_upsert cree';
end
$$;

-- ── competences_operateur (salarie_id, operation) ─────────────────────────────
do $$
declare
  cols text[] := array['salarie_id', 'operation'];
  equivalent text;
  doublons bigint;
begin
  if to_regclass('public.competences_operateur') is null then
    raise notice 'cloud-8 : table competences_operateur absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'competences_operateur' and column_name = any (cols)) <> cardinality(cols) then
    raise warning 'cloud-8 : competences_operateur n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
    return;
  end if;
  select ic.relname into equivalent
    from pg_index x
    join pg_class ic on ic.oid = x.indexrelid
   where x.indrelid = 'public.competences_operateur'::regclass
     and x.indisunique and x.indisvalid and x.indpred is null and x.indexprs is null
     and x.indnatts = cardinality(cols)
     and (select array_agg(a.attname::text order by a.attname::text)
            from pg_attribute a
           where a.attrelid = x.indrelid and a.attnum = any (x.indkey::int2[]))
         = (select array_agg(c order by c) from unnest(cols) as c)
   limit 1;
  if equivalent is not null then
    raise notice 'cloud-8 : competences_operateur a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.competences_operateur
     where salarie_id is not null and operation is not null
     group by salarie_id, operation having count(*) > 1) d;
  if doublons > 0 then
    raise warning 'cloud-8 : % couple(s) (salarie_id, operation) en double dans competences_operateur : index unique NON cree, la mise a jour des competences restera en echec. Lister : select salarie_id, operation, count(*) from public.competences_operateur group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_competences_operateur_upsert on public.competences_operateur (salarie_id, operation);', doublons;
    return;
  end if;
  create unique index if not exists ux_competences_operateur_upsert on public.competences_operateur (salarie_id, operation);
  raise notice 'cloud-8 : index unique ux_competences_operateur_upsert cree';
end
$$;

-- ── produits_fournisseurs (fournisseur_id, reference) ─────────────────────────
do $$
declare
  cols text[] := array['fournisseur_id', 'reference'];
  equivalent text;
  doublons bigint;
begin
  if to_regclass('public.produits_fournisseurs') is null then
    raise notice 'cloud-8 : table produits_fournisseurs absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'produits_fournisseurs' and column_name = any (cols)) <> cardinality(cols) then
    raise warning 'cloud-8 : produits_fournisseurs n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
    return;
  end if;
  select ic.relname into equivalent
    from pg_index x
    join pg_class ic on ic.oid = x.indexrelid
   where x.indrelid = 'public.produits_fournisseurs'::regclass
     and x.indisunique and x.indisvalid and x.indpred is null and x.indexprs is null
     and x.indnatts = cardinality(cols)
     and (select array_agg(a.attname::text order by a.attname::text)
            from pg_attribute a
           where a.attrelid = x.indrelid and a.attnum = any (x.indkey::int2[]))
         = (select array_agg(c order by c) from unnest(cols) as c)
   limit 1;
  if equivalent is not null then
    raise notice 'cloud-8 : produits_fournisseurs a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.produits_fournisseurs
     where fournisseur_id is not null and reference is not null
     group by fournisseur_id, reference having count(*) > 1) d;
  if doublons > 0 then
    raise warning 'cloud-8 : % couple(s) (fournisseur_id, reference) en double dans produits_fournisseurs : index unique NON cree, l enregistrement au catalogue fournisseurs restera en echec. Lister : select fournisseur_id, reference, count(*) from public.produits_fournisseurs group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_produits_fournisseurs_upsert on public.produits_fournisseurs (fournisseur_id, reference);', doublons;
    return;
  end if;
  create unique index if not exists ux_produits_fournisseurs_upsert on public.produits_fournisseurs (fournisseur_id, reference);
  raise notice 'cloud-8 : index unique ux_produits_fournisseurs_upsert cree';
end
$$;

-- ── kpi_objectifs (code, entite) ──────────────────────────────────────────────
do $$
declare
  cols text[] := array['code', 'entite'];
  equivalent text;
  doublons bigint;
begin
  if to_regclass('public.kpi_objectifs') is null then
    raise notice 'cloud-8 : table kpi_objectifs absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'kpi_objectifs' and column_name = any (cols)) <> cardinality(cols) then
    raise warning 'cloud-8 : kpi_objectifs n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
    return;
  end if;
  select ic.relname into equivalent
    from pg_index x
    join pg_class ic on ic.oid = x.indexrelid
   where x.indrelid = 'public.kpi_objectifs'::regclass
     and x.indisunique and x.indisvalid and x.indpred is null and x.indexprs is null
     and x.indnatts = cardinality(cols)
     and (select array_agg(a.attname::text order by a.attname::text)
            from pg_attribute a
           where a.attrelid = x.indrelid and a.attnum = any (x.indkey::int2[]))
         = (select array_agg(c order by c) from unnest(cols) as c)
   limit 1;
  if equivalent is not null then
    raise notice 'cloud-8 : kpi_objectifs a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.kpi_objectifs
     where code is not null and entite is not null
     group by code, entite having count(*) > 1) d;
  if doublons > 0 then
    raise warning 'cloud-8 : % couple(s) (code, entite) en double dans kpi_objectifs : index unique NON cree, l enregistrement des cibles KPI restera en echec. Lister : select code, entite, count(*) from public.kpi_objectifs group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_kpi_objectifs_upsert on public.kpi_objectifs (code, entite);', doublons;
    return;
  end if;
  create unique index if not exists ux_kpi_objectifs_upsert on public.kpi_objectifs (code, entite);
  raise notice 'cloud-8 : index unique ux_kpi_objectifs_upsert cree';
end
$$;

notify pgrst, 'reload schema';
