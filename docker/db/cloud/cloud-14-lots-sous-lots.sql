-- ═══════════════════════════════════════════════════════════════════════════
-- cloud-14 · Lots : sous-lots des nomenclatures mères (arbre de fabrication) — lot H2
--            (équivalent CLOUD de la migration Docker 018)
--
-- À JOUER À LA MAIN dans Supabase Studio → SQL Editor, en une fois, APRÈS cloud-13
-- (ordre : cloud-13-catalogue-qte-paquet.sql, puis ce script). Additif et rejouable.
--
-- Le lot d'une pièce MÈRE porte un sous-lot par composant (qté = qté du composant × qté du lot parent,
-- arrondie à l'entier supérieur), récursivement, 5 niveaux au plus (racine = niveau 0). Un sous-lot est
-- une ligne `lots` ordinaire. Numérotation : la racine reste LOT-YYYY-AFF-ZZ ; un sous-lot ajoute
-- « .RR » (rang = ordre de fabrication) : LOT-2026-0001-01.02, puis LOT-2026-0001-01.02.01.
--   1) lots.lot_parent text      : id du lot parent (NULL = racine), sans clé étrangère (lien souple).
--   2) lots.rang integer         : position parmi les frères = ordre de fabrication (racine : son n° ZZ).
--   3) lots.niveau integer       : 0 = racine … 4 ; NOT NULL DEFAULT 0 (les lots existants sont des racines).
--   4) lots.nomenclature_id text : nomenclature VALIDÉE retenue au lancement (traçabilité EN 9100).
--   5) lots.qte_par_parent numeric : qté du composant par unité du parent (NULL = racine).
--   Index ix_lots_lot_parent ; contraintes NOT VALID lots_niveau_valide (0 à 4), lots_rang_valide
--   (NULL ou >= 1), lots_parent_distinct (un lot n'est pas son propre parent).
-- AUCUNE donnée modifiée. nomenclatures.composants : rien à faire (déjà jsonb sur le cloud).
--
-- Sans ce script, côté cloud : AUCUNE page cassée. Une pièce mère est lancée SANS sous-lots, comme avant
-- le lot H2, avec un AVERTISSEMENT à l'acceptation de l'offre et sur la fiche du lot (« sous-lots non
-- créés — jouez cloud-14 ») ; le bouton « Créer les sous-lots » de la fiche lot répond 409 « jouez
-- cloud-14 » et n'écrit rien. L'ordre des composants, la mère dans la mère et les refus de cycle /
-- profondeur fonctionnent déjà (jsonb, aucune DDL).
-- Après ce script : les affaires lancées AVANT se complètent lot par lot avec « Créer les sous-lots »
-- (fiche du lot racine d'une pièce mère).
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

-- ── Colonnes, index, contraintes ─────────────────────────────────────────────
do $$
begin
  if to_regclass('public.lots') is null then
    raise notice 'cloud-14 : table lots absente, rien a faire.';
    return;
  end if;

  alter table public.lots add column if not exists lot_parent text;
  alter table public.lots add column if not exists rang integer;
  alter table public.lots add column if not exists niveau integer not null default 0;
  alter table public.lots add column if not exists nomenclature_id text;
  alter table public.lots add column if not exists qte_par_parent numeric;

  create index if not exists ix_lots_lot_parent on public.lots (lot_parent);

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.lots'::regclass and conname = 'lots_niveau_valide') then
    alter table public.lots add constraint lots_niveau_valide check (niveau between 0 and 4) not valid;
  end if;
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.lots'::regclass and conname = 'lots_rang_valide') then
    alter table public.lots add constraint lots_rang_valide check (rang is null or rang >= 1) not valid;
  end if;
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.lots'::regclass and conname = 'lots_parent_distinct') then
    alter table public.lots add constraint lots_parent_distinct check (lot_parent is null or lot_parent <> id) not valid;
  end if;

  comment on column public.lots.lot_parent is
    'Id du lot parent (sous-lot d une piece mere). NULL = lot racine. Lien souple, sans cle etrangere. Numerotation : parent + .RR (src/nomenclature_arbre.ts).';
  comment on column public.lots.rang is
    'Position parmi les freres = ordre de fabrication, du haut vers le bas de la nomenclature mere (racine : son numero ZZ). NULL = lot anterieur au lot H2 (suffixe de l id).';
  comment on column public.lots.niveau is
    'Profondeur dans l arbre : 0 = racine, 1 = sous-lot, 2 = sous-sous-lot, 4 au plus (5 niveaux, racine comprise).';
  comment on column public.lots.nomenclature_id is
    'Nomenclature VALIDEE retenue au lancement pour ce lot (derniere revision validee du code de la piece). Tracabilite EN 9100.';
  comment on column public.lots.qte_par_parent is
    'Quantite du composant par unite du lot parent (NULL = racine). qte du sous-lot = arrondi superieur de qte parent x qte_par_parent.';

  raise notice 'cloud-14 : lots.lot_parent, rang, niveau, nomenclature_id, qte_par_parent en place (index ix_lots_lot_parent, contraintes NOT VALID).';
end
$$;

notify pgrst, 'reload schema';

-- Vérification (lecture seule) : doit rendre les 5 colonnes.
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lots'
   and column_name in ('lot_parent', 'rang', 'niveau', 'nomenclature_id', 'qte_par_parent')
 order by column_name;
