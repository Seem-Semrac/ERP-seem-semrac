-- ═══════════════════════════════════════════════════════════════════════════
-- cloud-10 · Réception fournisseur (références, import hors France), certificat matière du BC,
--            PV de contrôle de réception détaillé (lignes, contrôleur) — lot D Expéditions
--            (équivalent CLOUD de la migration Docker 012)
--
-- À JOUER À LA MAIN dans Supabase Studio → SQL Editor, en une fois.
-- Purement additif et rejouable : ajoute des colonnes, trois contraintes CHECK et un index unique partiel.
-- Aucune donnée n'est modifiée ni effacée.
--   bons_de_livraison : num_commande_fournisseur, num_bl_fournisseur, hors_france, poids_matiere_kg (>= 0),
--                       num_nomenclature (code douanier), code_ewx (1 ou 2), mode_arrivee ;
--   bons_de_commande  : certificat_matiere_requis ;
--   pv_controle       : detail (jsonb), controleur_id, controleur_nom, saisi_par,
--                       certificat_matiere ('non_requis' | 'confirme' | 'absent') ;
--   index unique ux_pv_controle_reception_bl : un seul PV de réception par BL — créé SEULEMENT s'il n'y a
--   aucun doublon ; sinon WARNING avec la requête pour les lister (rien n'est effacé).
-- Les valeurs de statut / decision de pv_controle ne changent pas (contraintes CHECK existantes).
--
-- Sans ce script, côté cloud : la réception est enregistrée quand même, mais le N° de commande et le N° de BL
-- fournisseur, le « hors France » et ses quatre champs NE SONT PAS enregistrés (avertissement renvoyé par le
-- serveur et affiché à l'écran) ; le certificat matière d'un BC et le détail du PV ne sont pas conservés.
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

-- ── 1) bons_de_livraison ─────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.bons_de_livraison') is null then
    raise notice 'cloud-10 : table bons_de_livraison absente, ignoree.';
    return;
  end if;

  alter table public.bons_de_livraison add column if not exists num_commande_fournisseur text;
  alter table public.bons_de_livraison add column if not exists num_bl_fournisseur text;
  alter table public.bons_de_livraison add column if not exists hors_france boolean;
  alter table public.bons_de_livraison add column if not exists poids_matiere_kg numeric;
  alter table public.bons_de_livraison add column if not exists num_nomenclature text;
  alter table public.bons_de_livraison add column if not exists code_ewx smallint;
  alter table public.bons_de_livraison add column if not exists mode_arrivee text;

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.bons_de_livraison'::regclass
                    and conname = 'bons_de_livraison_poids_matiere_positif') then
    alter table public.bons_de_livraison add constraint bons_de_livraison_poids_matiere_positif
      check (poids_matiere_kg is null or poids_matiere_kg >= 0);
  end if;
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.bons_de_livraison'::regclass
                    and conname = 'bons_de_livraison_code_ewx_valide') then
    alter table public.bons_de_livraison add constraint bons_de_livraison_code_ewx_valide
      check (code_ewx is null or code_ewx in (1, 2));
  end if;

  comment on column public.bons_de_livraison.num_commande_fournisseur is
    'Reception fournisseur : numero de commande chez le fournisseur (saisi a la reception).';
  comment on column public.bons_de_livraison.num_bl_fournisseur is
    'Reception fournisseur : numero du bon de livraison du fournisseur.';
  comment on column public.bons_de_livraison.hors_france is
    'Reception fournisseur : marchandise recue de hors France. NULL = non renseigne (reception anterieure).';
  comment on column public.bons_de_livraison.poids_matiere_kg is
    'Reception hors France : poids matiere en kg (obligatoire si hors_france, controle applicatif).';
  comment on column public.bons_de_livraison.num_nomenclature is
    'Reception hors France : code de nomenclature douaniere du produit importe.';
  comment on column public.bons_de_livraison.code_ewx is
    'Reception hors France : code EWX, 1 ou 2.';
  comment on column public.bons_de_livraison.mode_arrivee is
    'Reception hors France : mode d arrivee (Routier, Maritime, Aerien, Ferroviaire, Messagerie / express).';

  raise notice 'cloud-10 : bons_de_livraison.num_commande_fournisseur, num_bl_fournisseur, hors_france, poids_matiere_kg, num_nomenclature, code_ewx, mode_arrivee en place.';
end
$$;

-- ── 2) bons_de_commande ──────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.bons_de_commande') is null then
    raise notice 'cloud-10 : table bons_de_commande absente, ignoree.';
    return;
  end if;

  alter table public.bons_de_commande add column if not exists certificat_matiere_requis boolean;

  comment on column public.bons_de_commande.certificat_matiere_requis is
    'Le fournisseur doit joindre un certificat matiere. Confirme au PV de controle de reception (conforme impossible sans). NULL = non requis.';

  raise notice 'cloud-10 : bons_de_commande.certificat_matiere_requis en place.';
end
$$;

-- ── 3) pv_controle ───────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.pv_controle') is null then
    raise notice 'cloud-10 : table pv_controle absente, ignoree.';
    return;
  end if;

  alter table public.pv_controle add column if not exists detail jsonb;
  alter table public.pv_controle add column if not exists controleur_id text;
  alter table public.pv_controle add column if not exists controleur_nom text;
  alter table public.pv_controle add column if not exists saisi_par text;
  alter table public.pv_controle add column if not exists certificat_matiere text;

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.pv_controle'::regclass
                    and conname = 'pv_controle_certificat_matiere_valide') then
    alter table public.pv_controle add constraint pv_controle_certificat_matiere_valide
      check (certificat_matiere is null or certificat_matiere in ('non_requis', 'confirme', 'absent'));
  end if;

  comment on column public.pv_controle.detail is
    'PV de reception : instantane du BC, lignes (idx, reference, designation, quantite, conforme, observation), observation generale, certificat, controleur. Version dans la cle v.';
  comment on column public.pv_controle.controleur_id is
    'PV de reception : id du salarie controleur (ecriture sur les Expeditions), sans cle etrangere.';
  comment on column public.pv_controle.controleur_nom is
    'PV de reception : nom du controleur au moment du PV.';
  comment on column public.pv_controle.saisi_par is
    'PV de reception : personne connectee qui a enregistre le PV.';
  comment on column public.pv_controle.certificat_matiere is
    'PV de reception : non_requis, confirme ou absent.';

  raise notice 'cloud-10 : pv_controle.detail, controleur_id, controleur_nom, saisi_par, certificat_matiere en place.';
end
$$;

-- ── 4) Un seul PV de réception par BL ────────────────────────────────────────
do $$
declare
  doublons bigint;
begin
  if to_regclass('public.pv_controle') is null then
    raise notice 'cloud-10 : table pv_controle absente, index unique ignore.';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'pv_controle' and column_name in ('bl_id', 'type_controle')) <> 2 then
    raise warning 'cloud-10 : pv_controle sans bl_id ou type_controle, index unique NON cree.';
    return;
  end if;
  if to_regclass('public.ux_pv_controle_reception_bl') is not null then
    raise notice 'cloud-10 : index ux_pv_controle_reception_bl deja present, rien a faire.';
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.pv_controle
     where type_controle = 'reception' and bl_id is not null
     group by bl_id having count(*) > 1) d;
  if doublons > 0 then
    raise warning 'cloud-10 : % BL portent plusieurs PV de reception : index unique ux_pv_controle_reception_bl NON cree (rien n est efface, le controle applicatif reste la seule garde). Lister : select bl_id, count(*), array_agg(num_pv) from public.pv_controle where type_controle = ''reception'' and bl_id is not null group by bl_id having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_pv_controle_reception_bl on public.pv_controle (bl_id) where type_controle = ''reception'' and bl_id is not null;', doublons;
    return;
  end if;
  create unique index if not exists ux_pv_controle_reception_bl on public.pv_controle (bl_id)
    where type_controle = 'reception' and bl_id is not null;
  raise notice 'cloud-10 : index unique ux_pv_controle_reception_bl cree (un seul PV de reception par BL).';
end
$$;

notify pgrst, 'reload schema';
