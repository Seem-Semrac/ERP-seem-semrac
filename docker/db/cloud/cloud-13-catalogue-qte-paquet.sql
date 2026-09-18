-- ═══════════════════════════════════════════════════════════════════════════
-- cloud-13 · Catalogue fournisseurs : quantité par paquet + unicité normalisée de la référence — lot H1
--            (équivalent CLOUD de la migration Docker 017)
--
-- À JOUER À LA MAIN dans Supabase Studio → SQL Editor, en une fois. Additif et rejouable.
--   1) produits_fournisseurs.qte_paquet numeric : nombre de PIÈCES par paquet pour le couple
--      (fournisseur, référence). Le prix catalogue d'un accessoire reste le prix du PAQUET ; le prix à la
--      pièce = prix / qte_paquet (src/prix_moyen.ts). La colonne TEXTE `conditionnement` est conservée
--      (libellé libre, jamais écrite) et sert de repli en lecture. Contrainte qte_paquet > 0 (NOT VALID).
--   2) ⚠ MODIFIE des données, sans jamais rien écraser : la quantité par paquet n'était saisie que dans
--      les nomenclatures (fournitures_nomenclature.qte_paquet). Elle est recopiée sur la ligne catalogue
--      de même référence (normalisée) ET de même nom de fournisseur, UNIQUEMENT si cette ligne n'a pas
--      déjà une valeur et si la nomenclature n'en donne qu'une seule, sans ambiguïté. Chaque copie est
--      listée par un NOTICE (onglet « Messages »). Aperçu sans rien écrire : jouer le script entre
--      « begin; » et « rollback; ».
--   3) demandes_prix_reponses.qte_paquet numeric : pour un accessoire, le conditionnement auquel se rapporte
--      le prix chiffré par CE fournisseur (saisi par les Achats à côté du prix, recopié au catalogue à la
--      validation de la demande de prix). Contrainte > 0 (NOT VALID).
--   4) Index unique ux_produits_fournisseurs_ref_norm (fournisseur_id, lower(btrim(reference))) : la même
--      référence ne peut plus être déclarée deux fois chez le MÊME fournisseur à la casse ou aux espaces
--      près (la même référence chez PLUSIEURS fournisseurs reste normale : c'est la base du prix moyen).
--      Créé SEULEMENT sans doublons ; sinon WARNING avec la requête pour les lister, rien n'est effacé.
--      L'index ux_produits_fournisseurs_upsert (cloud-8) reste en place : c'est lui qu'exige le
--      « on conflict (fournisseur_id, reference) » des upserts.
--
-- Sans ce script, côté cloud : tout fonctionne SANS la quantité par paquet — les lectures ignorent la
-- colonne absente, l'estimation du prix d'un accessoire compte « 1 pièce par paquet » et l'affiche en
-- orange (« conditionnement non déclaré »), et l'enregistrement d'une qté par paquet depuis le
-- catalogue est accepté puis SIGNALÉ comme non conservé (« jouez cloud-13 »). Aucune page cassée,
-- aucune erreur bloquante.
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

-- ── 1) Colonne numérique + garde-fou ─────────────────────────────────────────
do $$
begin
  if to_regclass('public.produits_fournisseurs') is null then
    raise notice 'cloud-13 : table produits_fournisseurs absente, rien a faire.';
    return;
  end if;
  alter table public.produits_fournisseurs add column if not exists qte_paquet numeric;
  comment on column public.produits_fournisseurs.qte_paquet is
    'Nombre de PIECES par paquet pour ce couple (fournisseur, reference). Le prix catalogue d un accessoire est le prix du PAQUET : prix a la piece = prix / qte_paquet (src/prix_moyen.ts). NULL = conditionnement non declare (compte 1 et signale a l ecran). La colonne texte conditionnement reste un libelle libre.';
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.produits_fournisseurs'::regclass
       and conname = 'produits_fournisseurs_qte_paquet_positive') then
    alter table public.produits_fournisseurs
      add constraint produits_fournisseurs_qte_paquet_positive
      check (qte_paquet is null or qte_paquet > 0) not valid;
    raise notice 'cloud-13 : contrainte produits_fournisseurs_qte_paquet_positive ajoutee (NOT VALID).';
  end if;
end
$$;

-- ── 2) Reprise : qté par paquet des nomenclatures → catalogue (création seule) ─
do $$
declare
  r record;
  n integer := 0;
begin
  if to_regclass('public.produits_fournisseurs') is null or to_regclass('public.fournitures_nomenclature') is null then
    raise notice 'cloud-13 : reprise ignoree (table absente).';
    return;
  end if;
  for r in
    with source as (
      select lower(btrim(f.ref_stock))    as refn,
             lower(btrim(f.fournisseur))  as fournn,
             min(f.qte_paquet)            as qte
        from public.fournitures_nomenclature f
       where f.qte_paquet is not null
         and f.qte_paquet > 0
         and f.ref_stock is not null   and btrim(f.ref_stock) <> ''
         and f.fournisseur is not null and btrim(f.fournisseur) <> ''
       group by 1, 2
      having count(distinct f.qte_paquet) = 1
    )
    select p.id, p.reference, p.fournisseur_nom, s.qte
      from public.produits_fournisseurs p
      join source s
        on lower(btrim(p.reference)) = s.refn
       and lower(btrim(coalesce(p.fournisseur_nom, ''))) = s.fournn
     where p.qte_paquet is null
  loop
    update public.produits_fournisseurs set qte_paquet = r.qte where id = r.id and qte_paquet is null;
    n := n + 1;
    raise notice 'cloud-13 : qte par paquet reprise depuis les nomenclatures — reference %, fournisseur %, qte %', r.reference, r.fournisseur_nom, r.qte;
  end loop;
  if n = 0 then
    raise notice 'cloud-13 : aucune qte par paquet a reprendre (aucune ligne de nomenclature exploitable, ou catalogue deja renseigne).';
  else
    raise notice 'cloud-13 : % ligne(s) catalogue completee(s) (aucune valeur existante ecrasee).', n;
  end if;
end
$$;

-- ── 3) Réponses de demande de prix : qté par paquet chiffrée par le fournisseur ─
-- La validation d'une demande de prix écrit le prix de CHAQUE réponse chiffrée sur la ligne
-- catalogue de son fournisseur. Pour un accessoire, le prix n'a de sens qu'avec le conditionnement
-- auquel il se rapporte : les Achats le saisissent à côté du prix, et il part au catalogue avec lui.
do $$
begin
  if to_regclass('public.demandes_prix_reponses') is null then
    raise notice 'cloud-13 : table demandes_prix_reponses absente, rien a faire.';
    return;
  end if;
  alter table public.demandes_prix_reponses add column if not exists qte_paquet numeric;
  comment on column public.demandes_prix_reponses.qte_paquet is
    'Accessoires : nombre de PIECES par paquet auquel se rapporte le prix chiffre par ce fournisseur. Recopie sur produits_fournisseurs.qte_paquet a la validation de la demande. NULL = non precise (le prix est alors pris pour un prix a la piece, et signale).';
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.demandes_prix_reponses'::regclass
       and conname = 'demandes_prix_reponses_qte_paquet_positive') then
    alter table public.demandes_prix_reponses
      add constraint demandes_prix_reponses_qte_paquet_positive
      check (qte_paquet is null or qte_paquet > 0) not valid;
    raise notice 'cloud-13 : contrainte demandes_prix_reponses_qte_paquet_positive ajoutee (NOT VALID).';
  end if;
end
$$;

-- ── 4) Unicité NORMALISÉE (fournisseur, référence) ───────────────────────────
do $$
declare
  doublons bigint;
begin
  if to_regclass('public.produits_fournisseurs') is null then
    return;
  end if;
  if to_regclass('public.ux_produits_fournisseurs_ref_norm') is not null then
    raise notice 'cloud-13 : index ux_produits_fournisseurs_ref_norm deja present, rien a faire.';
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.produits_fournisseurs
     where reference is not null and btrim(reference) <> '' and fournisseur_id is not null
     group by fournisseur_id, lower(btrim(reference)) having count(*) > 1) d;
  if doublons > 0 then
    raise warning 'cloud-13 : % couple(s) (fournisseur, reference a la casse pres) en double dans produits_fournisseurs : index unique ux_produits_fournisseurs_ref_norm NON cree (rien n est efface ni fusionne ; la declaration d une reference refusera ces couples tant qu ils ne sont pas regularises). Lister : select fournisseur_id, lower(btrim(reference)), count(*), array_agg(id) from public.produits_fournisseurs where reference is not null and btrim(reference) <> '''' and fournisseur_id is not null group by 1, 2 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_produits_fournisseurs_ref_norm on public.produits_fournisseurs (fournisseur_id, lower(btrim(reference))) where reference is not null and btrim(reference) <> '''' and fournisseur_id is not null;', doublons;
    return;
  end if;
  create unique index if not exists ux_produits_fournisseurs_ref_norm
    on public.produits_fournisseurs (fournisseur_id, lower(btrim(reference)))
    where reference is not null and btrim(reference) <> '' and fournisseur_id is not null;
  raise notice 'cloud-13 : index unique ux_produits_fournisseurs_ref_norm cree.';
end
$$;
