-- A JOUER dans Supabase Studio > SQL Editor (base CLOUD uniquement).
-- Docker local et VM le font tout seuls via le conteneur erp-migrate (migration 005).
--
-- A FAIRE : sans lui, un BDT depose au quart d'heure sur le planning est arrondi a l'heure
-- pleine (le serveur retombe sur l'entier au lieu d'echouer). Idempotent, sans perte.

-- ═══════════════════════════════════════════════════════════════════════════
-- 005 · BDT : heure de début au quart d'heure (bons_de_travail.debut -> numeric)
--
-- Le planning dépose un BDT au quart d'heure (7,25 = 7 h 15). La colonne debut était
-- un ENTIER : PostgreSQL refusait « 7.25 » (invalid input syntax for type integer) et le
-- glisser-déposer échouait avec « Affectation échouée » dès qu'on ne visait pas une heure
-- pleine.
--
-- Élargissement entier -> décimal : aucune valeur n'est perdue ni modifiée.
-- Idempotente : ne fait rien si la colonne est déjà décimale, ou absente.
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

do $$
begin
  if to_regclass('public.bons_de_travail') is null then
    raise notice '005 : table bons_de_travail absente, ignoree.';
    return;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'bons_de_travail'
               and column_name = 'debut' and data_type in ('integer', 'smallint', 'bigint')) then
    alter table public.bons_de_travail alter column debut type numeric using debut::numeric;
    raise notice '005 : bons_de_travail.debut passe en numeric (quart d''heure).';
  else
    raise notice '005 : bons_de_travail.debut deja decimal ou absent, rien a faire.';
  end if;
end
$$;

notify pgrst, 'reload schema';
