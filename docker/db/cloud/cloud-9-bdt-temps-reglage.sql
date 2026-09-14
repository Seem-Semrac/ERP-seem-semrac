-- ═══════════════════════════════════════════════════════════════════════════
-- cloud-9 · BDT : temps de RÉGLAGE stocké, durée d'avant découpe (bons_de_travail)
--           (équivalent CLOUD de la migration Docker 011)
--
-- À JOUER À LA MAIN dans Supabase Studio → SQL Editor, en une fois.
-- Purement additif et rejouable : ajoute trois colonnes numeric (heures) et une contrainte.
--   temps_reglage               : réglage compris dans la durée du BDT (NULL = inconnu) ;
--   duree_avant_decoupe         : durée de la racine avant sa 1re découpe (« Annuler la découpe ») ;
--   temps_machine_avant_decoupe : idem pour le temps machine.
-- Aucune donnée n'est modifiée.
--
-- Sans ce script, côté cloud : les BDT se créent et se découpent quand même, mais leur réglage n'est pas
-- enregistré (avertissement renvoyé par le serveur), la découpe traite tout le temps en réalisation et
-- « Annuler la découpe » recolle sur la somme des morceaux.
--
-- APRÈS ce script : compléter les BDT existants depuis leur gamme (usage détaillé dans
-- docs/technique : route POST /api/production/bdt/reglage/reconstituer) :
--   1. { "appliquer": false } → rapport certain / incertain / inconnu ;
--   2. { "appliquer": true }  → n'écrit QUE les certains, puis relit.
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
    raise notice 'cloud-9 : table bons_de_travail absente, ignoree.';
    return;
  end if;

  alter table public.bons_de_travail add column if not exists temps_reglage numeric;
  alter table public.bons_de_travail add column if not exists duree_avant_decoupe numeric;
  alter table public.bons_de_travail add column if not exists temps_machine_avant_decoupe numeric;

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.bons_de_travail'::regclass
                    and conname = 'bons_de_travail_temps_reglage_positif') then
    alter table public.bons_de_travail add constraint bons_de_travail_temps_reglage_positif
      check (temps_reglage is null or temps_reglage >= 0);
  end if;

  comment on column public.bons_de_travail.temps_reglage is
    'Heures de reglage (fixe, fait une seule fois) comprises dans duree. NULL = inconnu. Realisation = duree - temps_reglage. Famille decoupee : porte par le morceau 1 seulement.';
  comment on column public.bons_de_travail.duree_avant_decoupe is
    'Duree de la racine avant sa 1re decoupe (retour arriere exact), NULL si jamais decoupee ou decoupe annulee.';
  comment on column public.bons_de_travail.temps_machine_avant_decoupe is
    'temps_machine_alloue de la racine avant sa 1re decoupe, NULL sinon.';

  raise notice 'cloud-9 : bons_de_travail.temps_reglage, duree_avant_decoupe, temps_machine_avant_decoupe en place.';
end
$$;

notify pgrst, 'reload schema';
