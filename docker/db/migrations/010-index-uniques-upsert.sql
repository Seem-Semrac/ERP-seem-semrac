-- ═══════════════════════════════════════════════════════════════════════════
-- 010 · Index UNIQUES exigés par les upserts de l'application (onConflict)
--
-- Demande du 14/09/2026 : « dans production […] quand on clique sur les présences opérateur sur une seule case ça ne
-- s'enregistre pas pour le responsable prod ».
--
-- Cause prouvée sur la base Docker (et la VM, nées de schema.sql) : l'enregistrement d'une présence est un upsert
-- `onConflict: 'operateur_id,date_presence'`. Postgres exige alors un index (ou une contrainte) UNIQUE sur exactement
-- ces colonnes ; la table n'avait que sa clé primaire → erreur 42P10 « there is no unique or exclusion constraint
-- matching the ON CONFLICT specification » → la case revenait vide. Même défaut pour quatre autres upserts :
--   operateur_presence     (operateur_id, date_presence)                     présence d'un opérateur par jour
--   affectation_poste      (operateur_id, date_affectation, process_id, shift) affectation d'un opérateur à un process
--   competences_operateur  (salarie_id, operation)                            matrice de compétences
--   produits_fournisseurs  (fournisseur_id, reference)                        catalogue fournisseurs
--   kpi_objectifs          (code, entite)                                     cibles des tableaux de bord
--
-- Pour chaque couple table/colonnes, un bloc indépendant qui :
--   · ne fait rien si la table ou une des colonnes n'existe pas (base partielle) ;
--   · ne fait rien si un index unique ÉQUIVALENT existe déjà (mêmes colonnes, sans condition ni expression) — c'est le
--     cas attendu sur le cloud, où ces upserts fonctionnent ;
--   · s'il existe des DOUBLONS, n'efface RIEN : il le signale (WARNING) et passe au suivant — l'upsert de cette table
--     restera en échec tant que les doublons n'auront pas été traités à la main (requête donnée dans le message) ;
--   · sinon crée l'index unique, nommé explicitement ux_<table>_upsert.
-- Les valeurs NULL ne sont pas des doublons (sémantique standard d'un index unique) : elles sont écartées du comptage.
--
-- Additive et rejouable sans dommage. Équivalent cloud : docker/db/cloud/cloud-8-index-uniques-upsert.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── operateur_presence (operateur_id, date_presence) ──────────────────────────
do $$
declare
  cols text[] := array['operateur_id', 'date_presence'];
  equivalent text;
  doublons bigint;
begin
  if to_regclass('public.operateur_presence') is null then
    raise notice '010 : table operateur_presence absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'operateur_presence' and column_name = any (cols)) <> cardinality(cols) then
    raise warning '010 : operateur_presence n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
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
    raise notice '010 : operateur_presence a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.operateur_presence
     where operateur_id is not null and date_presence is not null
     group by operateur_id, date_presence having count(*) > 1) d;
  if doublons > 0 then
    raise warning '010 : % couple(s) (operateur_id, date_presence) en double dans operateur_presence : index unique NON cree, l enregistrement des presences restera en echec. Lister : select operateur_id, date_presence, count(*) from public.operateur_presence group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_operateur_presence_upsert on public.operateur_presence (operateur_id, date_presence);', doublons;
    return;
  end if;
  create unique index if not exists ux_operateur_presence_upsert on public.operateur_presence (operateur_id, date_presence);
  raise notice '010 : index unique ux_operateur_presence_upsert cree';
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
    raise notice '010 : table affectation_poste absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'affectation_poste' and column_name = any (cols)) <> cardinality(cols) then
    raise warning '010 : affectation_poste n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
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
    raise notice '010 : affectation_poste a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.affectation_poste
     where operateur_id is not null and date_affectation is not null and process_id is not null and shift is not null
     group by operateur_id, date_affectation, process_id, shift having count(*) > 1) d;
  if doublons > 0 then
    raise warning '010 : % affectation(s) (operateur_id, date_affectation, process_id, shift) en double dans affectation_poste : index unique NON cree, l affectation aux postes restera en echec. Lister : select operateur_id, date_affectation, process_id, shift, count(*) from public.affectation_poste group by 1, 2, 3, 4 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_affectation_poste_upsert on public.affectation_poste (operateur_id, date_affectation, process_id, shift);', doublons;
    return;
  end if;
  create unique index if not exists ux_affectation_poste_upsert on public.affectation_poste (operateur_id, date_affectation, process_id, shift);
  raise notice '010 : index unique ux_affectation_poste_upsert cree';
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
    raise notice '010 : table competences_operateur absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'competences_operateur' and column_name = any (cols)) <> cardinality(cols) then
    raise warning '010 : competences_operateur n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
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
    raise notice '010 : competences_operateur a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.competences_operateur
     where salarie_id is not null and operation is not null
     group by salarie_id, operation having count(*) > 1) d;
  if doublons > 0 then
    raise warning '010 : % couple(s) (salarie_id, operation) en double dans competences_operateur : index unique NON cree, la mise a jour des competences restera en echec. Lister : select salarie_id, operation, count(*) from public.competences_operateur group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_competences_operateur_upsert on public.competences_operateur (salarie_id, operation);', doublons;
    return;
  end if;
  create unique index if not exists ux_competences_operateur_upsert on public.competences_operateur (salarie_id, operation);
  raise notice '010 : index unique ux_competences_operateur_upsert cree';
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
    raise notice '010 : table produits_fournisseurs absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'produits_fournisseurs' and column_name = any (cols)) <> cardinality(cols) then
    raise warning '010 : produits_fournisseurs n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
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
    raise notice '010 : produits_fournisseurs a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.produits_fournisseurs
     where fournisseur_id is not null and reference is not null
     group by fournisseur_id, reference having count(*) > 1) d;
  if doublons > 0 then
    raise warning '010 : % couple(s) (fournisseur_id, reference) en double dans produits_fournisseurs : index unique NON cree, l enregistrement au catalogue fournisseurs restera en echec. Lister : select fournisseur_id, reference, count(*) from public.produits_fournisseurs group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_produits_fournisseurs_upsert on public.produits_fournisseurs (fournisseur_id, reference);', doublons;
    return;
  end if;
  create unique index if not exists ux_produits_fournisseurs_upsert on public.produits_fournisseurs (fournisseur_id, reference);
  raise notice '010 : index unique ux_produits_fournisseurs_upsert cree';
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
    raise notice '010 : table kpi_objectifs absente, rien a faire';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'kpi_objectifs' and column_name = any (cols)) <> cardinality(cols) then
    raise warning '010 : kpi_objectifs n a pas toutes les colonnes (%), index NON cree', array_to_string(cols, ', ');
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
    raise notice '010 : kpi_objectifs a deja un index unique equivalent (%), rien a faire', equivalent;
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.kpi_objectifs
     where code is not null and entite is not null
     group by code, entite having count(*) > 1) d;
  if doublons > 0 then
    raise warning '010 : % couple(s) (code, entite) en double dans kpi_objectifs : index unique NON cree, l enregistrement des cibles KPI restera en echec. Lister : select code, entite, count(*) from public.kpi_objectifs group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_kpi_objectifs_upsert on public.kpi_objectifs (code, entite);', doublons;
    return;
  end if;
  create unique index if not exists ux_kpi_objectifs_upsert on public.kpi_objectifs (code, entite);
  raise notice '010 : index unique ux_kpi_objectifs_upsert cree';
end
$$;

notify pgrst, 'reload schema';
