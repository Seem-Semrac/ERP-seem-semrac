-- ═══════════════════════════════════════════════════════════════════════════
-- 013 · Mise en stock (file « À ranger »), types d'objet et zones de stockage, emplacement fixe par
--       référence avec historique, BC de reliquat — lot F (15/09/2026)
--
-- Demande : « un nouvel onglet qui sera la mise en stock […] quand on aura fini le PV de réception, ce qui
-- a été validé conforme va directement, référence par référence, dans la liste des choses à rentrer dans le
-- stock. Un bouton pour accepter l'entrée en stock avec la ref et le type d'objet ; pour chaque type une
-- liste déroulante de la zone géographique. Chaque ref a son endroit défini […] il doit rester fixe, avec une
-- option pour le changer à la main. » + reliquat annoncé au PV ⇒ BC du restant, date à valider aux Achats.
--
-- 1) stock_types_objet (code pk, libelle, ordre, actif, created_at) — liste MODIFIABLE dans l'ERP, amorcée
--    avec les six types donnés par l'utilisateur (Matière première, Accessoire, Consommable, Outillage,
--    Produit chimique, EPI). Aucune zone n'est amorcée : l'utilisateur fournira ses listes.
-- 2) stock_zones (id, type_objet, zone, ordre, actif, created_at, cree_par) ; unique (type_objet, lower(btrim(zone))).
-- 3) stock.type_objet text ; stock.emplacement (existante) = emplacement FIXE de la référence.
--    Index unique ux_stock_reference sur lower(btrim(reference)) créé SEULEMENT sans doublons ; sinon WARNING
--    avec la requête pour les lister (rien n'est effacé ni fusionné).
-- 4) stock_emplacements_historique (id, stock_id, reference, type_objet, avant, apres, motif, par, le,
--    mise_en_stock_id) — journal en AJOUT SEUL (droits : lecture + ajout).
-- 5) mises_en_stock (file) : statut a_ranger | range | annule ; origine pv | decision_qualite | excedent_valide |
--    entree_manuelle ; contexte (bc_id, bl_id, pv_id, ligne_idx, quarantaine_id, validation_id), article
--    (reference, designation, type_objet, quantite > 0, unite, num_affaire, fournisseur_nom, motif d'une entrée manuelle), rangement
--    (stock_id, emplacement, mouvement_id, range_le, range_par), création (cree_le, cree_par), annulation
--    (annule_le, annule_par, annule_motif). Pas d'effacement : une ligne s'annule avec un motif.
--    Anti-doublon en base : ux_mes_pv_ligne_origine (pv_id, ligne, origine) where pv_id not null,
--    ux_mes_pv_bl_ligne (bl_id, ligne) pour l'origine pv (une ligne d'une reception n'entre qu'une fois),
--    ux_mes_quarantaine_ligne (quarantaine_id, ligne) pour decision_qualite,
--    ux_mes_validation_ligne (validation_id, ligne) pour excedent_valide (ligne absente = -1).
-- 6) mouvements_stock.mise_en_stock_id text + index unique partiel : une ligne de file ne crédite qu'une fois.
-- 7) bons_de_commande.bc_parent_id text (BC de reliquat ⇒ BC d'origine), bons_de_commande.date_a_valider boolean
--    (BC né sans date d'arrivée : les Achats doivent la valider).
-- 8) quarantaines.ligne_idx integer : repère de la ligne du BC mise en quarantaine (PV ligne par ligne).
--
-- Additive et idempotente. Équivalent cloud : docker/db/cloud/cloud-11-mise-en-stock.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) Types d'objet ─────────────────────────────────────────────────────────
create table if not exists public.stock_types_objet (
  code        text primary key,
  libelle     text not null,
  ordre       integer not null default 100,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.stock_types_objet'::regclass and conname = 'stock_types_objet_code_valide') then
    alter table public.stock_types_objet add constraint stock_types_objet_code_valide check (code ~ '^[a-z0-9_]{2,40}$');
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.stock_types_objet'::regclass and conname = 'stock_types_objet_libelle_non_vide') then
    alter table public.stock_types_objet add constraint stock_types_objet_libelle_non_vide check (btrim(libelle) <> '');
  end if;
end
$$;
insert into public.stock_types_objet (code, libelle, ordre) values
  ('matiere_premiere', 'Matière première', 10),
  ('accessoire', 'Accessoire', 20),
  ('consommable', 'Consommable', 30),
  ('outillage', 'Outillage', 40),
  ('chimique', 'Produit chimique', 50),
  ('epi', 'EPI', 60)
on conflict (code) do nothing;
comment on table public.stock_types_objet is
  'Types d objet du stock (liste modifiable dans l ERP, Stock > Rangement > Types et zones). Un type ne se supprime pas : il se desactive.';

alter table public.stock_types_objet enable row level security;
drop policy if exists sto_lecture on public.stock_types_objet;
drop policy if exists sto_ajout   on public.stock_types_objet;
drop policy if exists sto_maj     on public.stock_types_objet;
create policy sto_lecture on public.stock_types_objet for select to anon, authenticated using (true);
create policy sto_ajout   on public.stock_types_objet for insert to anon, authenticated with check (true);
create policy sto_maj     on public.stock_types_objet for update to anon, authenticated using (true) with check (true);
revoke all on table public.stock_types_objet from anon, authenticated;
grant select, insert, update on table public.stock_types_objet to anon, authenticated;

-- ── 2) Zones de stockage par type ────────────────────────────────────────────
create table if not exists public.stock_zones (
  id          text primary key default gen_random_uuid()::text,
  type_objet  text not null,
  zone        text not null,
  ordre       integer not null default 100,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  cree_par    text
);
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.stock_zones'::regclass and conname = 'stock_zones_zone_non_vide') then
    alter table public.stock_zones add constraint stock_zones_zone_non_vide check (btrim(zone) <> '');
  end if;
end
$$;
create unique index if not exists ux_stock_zones_type_zone on public.stock_zones (type_objet, lower(btrim(zone)));
comment on table public.stock_zones is
  'Zones geographiques de stockage, par type d objet. L emplacement d une reference (stock.emplacement) est le libelle d une de ces zones. Une zone ne se supprime pas : elle se desactive.';

alter table public.stock_zones enable row level security;
drop policy if exists stz_lecture on public.stock_zones;
drop policy if exists stz_ajout   on public.stock_zones;
drop policy if exists stz_maj     on public.stock_zones;
create policy stz_lecture on public.stock_zones for select to anon, authenticated using (true);
create policy stz_ajout   on public.stock_zones for insert to anon, authenticated with check (true);
create policy stz_maj     on public.stock_zones for update to anon, authenticated using (true) with check (true);
revoke all on table public.stock_zones from anon, authenticated;
grant select, insert, update on table public.stock_zones to anon, authenticated;

-- ── 3) stock : type d'objet + unicité de la référence ────────────────────────
do $$
declare
  doublons bigint;
begin
  if to_regclass('public.stock') is null then
    raise notice '013 : table stock absente, ignoree.';
    return;
  end if;
  alter table public.stock add column if not exists type_objet text;
  comment on column public.stock.type_objet is
    'Type d objet de la reference (code de stock_types_objet). Fixe l ensemble des zones proposees pour son emplacement.';
  comment on column public.stock.emplacement is
    'Emplacement FIXE de la reference (libelle d une zone de stock_zones). Fixe a la premiere mise en stock ; se change dans Niveaux d approvisionnement (historise dans stock_emplacements_historique).';

  if to_regclass('public.ux_stock_reference') is not null then
    raise notice '013 : index ux_stock_reference deja present, rien a faire.';
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.stock
     where reference is not null and btrim(reference) <> ''
     group by lower(btrim(reference)) having count(*) > 1) d;
  if doublons > 0 then
    raise warning '013 : % references de stock sont en double : index unique ux_stock_reference NON cree (rien n est efface ni fusionne ; la mise en stock refusera ces references tant qu elles ne sont pas regularisees). Lister : select lower(btrim(reference)), count(*), array_agg(id) from public.stock where reference is not null and btrim(reference) <> '''' group by 1 having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_stock_reference on public.stock (lower(btrim(reference))) where reference is not null and btrim(reference) <> '''';', doublons;
    return;
  end if;
  create unique index if not exists ux_stock_reference on public.stock (lower(btrim(reference)))
    where reference is not null and btrim(reference) <> '';
  raise notice '013 : stock.type_objet en place, index unique ux_stock_reference cree.';
end
$$;

-- ── 4) Historique des emplacements (ajout seul) ──────────────────────────────
create table if not exists public.stock_emplacements_historique (
  id                text primary key default gen_random_uuid()::text,
  stock_id          text,
  reference         text,
  type_objet        text,
  avant             text,
  apres             text,
  motif             text,
  par               text,
  le                timestamptz not null default now(),
  mise_en_stock_id  text
);
create index if not exists idx_stk_emp_hist_stock on public.stock_emplacements_historique (stock_id, le desc);
comment on table public.stock_emplacements_historique is
  'Journal des emplacements de stock (premiere affectation a la mise en stock, changements manuels) : qui, quand, avant, apres, motif. Ajout seul.';

alter table public.stock_emplacements_historique enable row level security;
drop policy if exists steh_lecture on public.stock_emplacements_historique;
drop policy if exists steh_ajout   on public.stock_emplacements_historique;
create policy steh_lecture on public.stock_emplacements_historique for select to anon, authenticated using (true);
create policy steh_ajout   on public.stock_emplacements_historique for insert to anon, authenticated with check (true);
revoke all on table public.stock_emplacements_historique from anon, authenticated;
grant select, insert on table public.stock_emplacements_historique to anon, authenticated;

-- ── 5) File « À ranger » ─────────────────────────────────────────────────────
create table if not exists public.mises_en_stock (
  id               text primary key default gen_random_uuid()::text,
  statut           text not null default 'a_ranger',
  origine          text not null,
  bc_id            text,
  bl_id            text,
  pv_id            text,
  ligne_idx        integer,
  quarantaine_id   text,
  validation_id    text,
  reference        text,
  designation      text,
  type_objet       text,
  quantite         numeric not null,
  unite            text,
  num_affaire      text,
  fournisseur_nom  text,
  motif            text,
  stock_id         text,
  emplacement      text,
  mouvement_id     text,
  cree_le          timestamptz not null default now(),
  cree_par         text,
  range_le         timestamptz,
  range_par        text,
  annule_le        timestamptz,
  annule_par       text,
  annule_motif     text
);
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.mises_en_stock'::regclass and conname = 'mises_en_stock_statut_valide') then
    alter table public.mises_en_stock add constraint mises_en_stock_statut_valide check (statut in ('a_ranger', 'range', 'annule'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.mises_en_stock'::regclass and conname = 'mises_en_stock_origine_valide') then
    alter table public.mises_en_stock add constraint mises_en_stock_origine_valide check (origine in ('pv', 'decision_qualite', 'excedent_valide', 'entree_manuelle'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.mises_en_stock'::regclass and conname = 'mises_en_stock_quantite_positive') then
    alter table public.mises_en_stock add constraint mises_en_stock_quantite_positive check (quantite > 0);
  end if;
end
$$;
create index if not exists idx_mes_statut    on public.mises_en_stock (statut, cree_le);
create index if not exists idx_mes_bc        on public.mises_en_stock (bc_id);
create index if not exists idx_mes_reference on public.mises_en_stock (lower(btrim(reference)));
create unique index if not exists ux_mes_pv_ligne_origine on public.mises_en_stock (pv_id, coalesce(ligne_idx, -1), origine)
  where pv_id is not null;
-- Une ligne d'une meme RECEPTION (BL) n'entre qu'une fois dans la file, quel que soit le n du PV (deux PV du meme BL sur
-- une base sans l'index unique ux_pv_controle_reception_bl ne crediteraient pas deux fois).
create unique index if not exists ux_mes_pv_bl_ligne on public.mises_en_stock (bl_id, coalesce(ligne_idx, -1))
  where bl_id is not null and origine = 'pv';
create unique index if not exists ux_mes_quarantaine_ligne on public.mises_en_stock (quarantaine_id, coalesce(ligne_idx, -1))
  where quarantaine_id is not null and origine = 'decision_qualite';
create unique index if not exists ux_mes_validation_ligne on public.mises_en_stock (validation_id, coalesce(ligne_idx, -1))
  where validation_id is not null and origine = 'excedent_valide';
comment on table public.mises_en_stock is
  'File des entrees a ranger (Stock > Rangement / Mise en stock) : lignes conformes des PV de reception, part acceptee des decisions Qualite, excedents valides, entrees manuelles. Le stock n est credite qu au rangement accepte. Pas d effacement : une ligne s annule avec un motif.';

alter table public.mises_en_stock enable row level security;
drop policy if exists mes_lecture on public.mises_en_stock;
drop policy if exists mes_ajout   on public.mises_en_stock;
drop policy if exists mes_maj     on public.mises_en_stock;
create policy mes_lecture on public.mises_en_stock for select to anon, authenticated using (true);
create policy mes_ajout   on public.mises_en_stock for insert to anon, authenticated with check (true);
create policy mes_maj     on public.mises_en_stock for update to anon, authenticated using (true) with check (true);
revoke all on table public.mises_en_stock from anon, authenticated;
grant select, insert, update on table public.mises_en_stock to anon, authenticated;

-- ── 6) mouvements_stock : lien vers la ligne de file ─────────────────────────
do $$
begin
  if to_regclass('public.mouvements_stock') is null then
    raise notice '013 : table mouvements_stock absente, ignoree.';
    return;
  end if;
  alter table public.mouvements_stock add column if not exists mise_en_stock_id text;
  create unique index if not exists ux_mvt_mise_en_stock on public.mouvements_stock (mise_en_stock_id)
    where mise_en_stock_id is not null;
  comment on column public.mouvements_stock.mise_en_stock_id is
    'Ligne de mises_en_stock creditee par ce mouvement d entree (unique : une ligne ne credite qu une fois).';
end
$$;

-- ── 7) bons_de_commande : BC de reliquat ─────────────────────────────────────
do $$
begin
  if to_regclass('public.bons_de_commande') is null then
    raise notice '013 : table bons_de_commande absente, ignoree.';
    return;
  end if;
  alter table public.bons_de_commande add column if not exists bc_parent_id text;
  alter table public.bons_de_commande add column if not exists date_a_valider boolean;
  create index if not exists idx_bc_parent on public.bons_de_commande (bc_parent_id) where bc_parent_id is not null;
  comment on column public.bons_de_commande.bc_parent_id is
    'BC de reliquat : id du bon de commande d origine (reliquat annonce par le fournisseur au PV de reception).';
  comment on column public.bons_de_commande.date_a_valider is
    'Vrai tant que les Achats n ont pas valide la date d arrivee (BC de reliquat ne sans date). NULL = sans objet.';
end
$$;

-- ── 8) quarantaines : repère de ligne ────────────────────────────────────────
do $$
begin
  if to_regclass('public.quarantaines') is null then
    raise notice '013 : table quarantaines absente, ignoree.';
    return;
  end if;
  alter table public.quarantaines add column if not exists ligne_idx integer;
  comment on column public.quarantaines.ligne_idx is
    'Repere (0 = premiere) de la ligne du BC mise en quarantaine par un PV de reception ligne par ligne. NULL = tout le BL (avant le lot F).';
end
$$;

notify pgrst, 'reload schema';
