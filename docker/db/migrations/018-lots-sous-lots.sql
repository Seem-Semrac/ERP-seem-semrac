-- ═══════════════════════════════════════════════════════════════════════════
-- 018 · Lots : sous-lots des nomenclatures mères (arbre de fabrication) — lot H2 (18/09/2026)
--
-- Demande : « lors de fabrication de nomenclatures mères envoyées en prod le lot pièce mère contient des
-- sous lots qui sont les nomenclatures filles, si dans les nomenclatures filles il y a des nomenclatures
-- mères elle aura donc des sous sous lots. »
--
-- Le lot d'une pièce MÈRE porte un sous-lot par composant (qté = qté du composant × qté du lot parent,
-- arrondie à l'entier supérieur), récursivement, 5 niveaux au plus (racine = niveau 0). Un sous-lot est
-- une ligne `lots` ordinaire : même table, ses BDT / BDS, sa préparation, ses besoins matière.
-- Numérotation (src/nomenclature_arbre.ts) : la racine reste LOT-YYYY-AFF-ZZ ; un sous-lot ajoute
-- « .RR » (rang parmi ses frères = ordre de fabrication) : LOT-2026-0001-01.02, LOT-2026-0001-01.02.01.
--
-- 1) lot_parent text : id du lot parent (NULL = racine). PAS de clé étrangère : lien souple, comme
--    lot_ref (un parent annulé ne doit rien bloquer). Index ix_lots_lot_parent.
-- 2) rang integer : position parmi les frères = ordre de fabrication (racine : son n° ZZ). NULL toléré
--    (lots existants : l'application retombe sur le suffixe de l'id).
-- 3) niveau integer NOT NULL DEFAULT 0 : 0 = racine … 4 (les lots existants valent 0 : ce sont des racines).
-- 4) nomenclature_id text : nomenclature VALIDÉE retenue au lancement pour CE lot (traçabilité EN 9100 :
--    la production prend le dernier indice validé de la fille, pas forcément celui choisi au BE).
-- 5) qte_par_parent numeric : qté du composant par unité du parent (NULL = racine).
-- Contraintes NOT VALID (contrôlent les écritures à venir sans relire l'existant) :
--    lots_niveau_valide (niveau entre 0 et 4), lots_rang_valide (rang NULL ou >= 1),
--    lots_parent_distinct (un lot n est pas son propre parent).
--
-- Additive et idempotente : aucune donnée modifiée, aucune suppression. Rejouable sans effet.
-- nomenclatures.composants : AUCUNE DDL (jsonb partout depuis 015 ; rang / type_nom / indice vivent dans le jsonb).
-- Équivalent cloud : docker/db/cloud/cloud-14-lots-sous-lots.sql (à jouer APRÈS cloud-13).
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('public.lots') is null then
    raise notice '018 : table lots absente, rien a faire.';
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

  raise notice '018 : lots.lot_parent, rang, niveau, nomenclature_id, qte_par_parent en place (index ix_lots_lot_parent, contraintes NOT VALID).';
end
$$;

notify pgrst, 'reload schema';
