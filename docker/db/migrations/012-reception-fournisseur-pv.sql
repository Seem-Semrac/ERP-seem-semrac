-- ═══════════════════════════════════════════════════════════════════════════
-- 012 · Réception fournisseur (références, import hors France), certificat matière du BC,
--       PV de contrôle de réception détaillé (lignes, contrôleur) — lot D Expéditions
--
-- Demande du 14/09/2026 : « dans le formulaire de réception […] le numéro de commande de chez eux et le
-- num de BL de chez eux, retirer le nom du transporteur, et la quantité. Quand on reçoit de pays hors France
-- (case oui non). Si c'est oui : le poids matière, le num de nomenclature, un code EWX soit 1 soit 2, mode
-- d'arrivée. » + PV non conforme ligne par ligne + « confirmer le certificat matière s'il le fallait dans le
-- BC » + « le contrôleur ne peut être que quelqu'un qui a les accès écriture dans expéditions ».
--
-- 1) bons_de_livraison (une réception = un BL de type 'reception') :
--      num_commande_fournisseur text, num_bl_fournisseur text, hors_france boolean,
--      poids_matiere_kg numeric (>= 0), num_nomenclature text (code douanier), code_ewx smallint (1 ou 2),
--      mode_arrivee text (liste fermée côté application : Routier, Maritime, Aérien, Ferroviaire,
--      Messagerie / express).
--    PAS de contrainte « si hors France alors les 4 champs » : elle casserait les écritures en deux temps ;
--    l'obligation est contrôlée par l'application (src/reception.ts), côté client ET serveur.
-- 2) bons_de_commande.certificat_matiere_requis boolean : exigence portée par le BC (NULL = non requis).
-- 3) pv_controle :
--      detail jsonb (instantané du BC, lignes Oui / Non + observations, certificat, contrôleur),
--      controleur_id text, controleur_nom text, saisi_par text (sans clé étrangère, comme le journal 006),
--      certificat_matiere text ('non_requis' | 'confirme' | 'absent').
--    Les valeurs de statut / decision / anomalie / nc_ouverte ne changent PAS (contraintes CHECK du cloud).
-- 4) Un seul PV de réception par BL : index unique PARTIEL
--      ux_pv_controle_reception_bl on pv_controle (bl_id) where type_controle = 'reception' and bl_id is not null
--    créé seulement s'il n'existe AUCUN doublon. Sinon : WARNING avec la requête pour les lister, rien n'est
--    effacé, le contrôle applicatif (409) reste la seule garde.
--
-- Additive et idempotente (add column if not exists, contraintes et index créés s'ils manquent).
-- Équivalent cloud : docker/db/cloud/cloud-10-reception-fournisseur-pv.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) bons_de_livraison ─────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.bons_de_livraison') is null then
    raise notice '012 : table bons_de_livraison absente, ignoree.';
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

  raise notice '012 : bons_de_livraison.num_commande_fournisseur, num_bl_fournisseur, hors_france, poids_matiere_kg, num_nomenclature, code_ewx, mode_arrivee en place.';
end
$$;

-- ── 2) bons_de_commande ──────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.bons_de_commande') is null then
    raise notice '012 : table bons_de_commande absente, ignoree.';
    return;
  end if;

  alter table public.bons_de_commande add column if not exists certificat_matiere_requis boolean;

  comment on column public.bons_de_commande.certificat_matiere_requis is
    'Le fournisseur doit joindre un certificat matiere. Confirme au PV de controle de reception (conforme impossible sans). NULL = non requis.';

  raise notice '012 : bons_de_commande.certificat_matiere_requis en place.';
end
$$;

-- ── 3) pv_controle ───────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.pv_controle') is null then
    raise notice '012 : table pv_controle absente, ignoree.';
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

  raise notice '012 : pv_controle.detail, controleur_id, controleur_nom, saisi_par, certificat_matiere en place.';
end
$$;

-- ── 4) Un seul PV de réception par BL ────────────────────────────────────────
do $$
declare
  doublons bigint;
begin
  if to_regclass('public.pv_controle') is null then
    raise notice '012 : table pv_controle absente, index unique ignore.';
    return;
  end if;
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'pv_controle' and column_name in ('bl_id', 'type_controle')) <> 2 then
    raise warning '012 : pv_controle sans bl_id ou type_controle, index unique NON cree.';
    return;
  end if;
  if to_regclass('public.ux_pv_controle_reception_bl') is not null then
    raise notice '012 : index ux_pv_controle_reception_bl deja present, rien a faire.';
    return;
  end if;
  select count(*) into doublons from (
    select 1 from public.pv_controle
     where type_controle = 'reception' and bl_id is not null
     group by bl_id having count(*) > 1) d;
  if doublons > 0 then
    raise warning '012 : % BL portent plusieurs PV de reception : index unique ux_pv_controle_reception_bl NON cree (rien n est efface, le controle applicatif reste la seule garde). Lister : select bl_id, count(*), array_agg(num_pv) from public.pv_controle where type_controle = ''reception'' and bl_id is not null group by bl_id having count(*) > 1; puis, une fois les doublons traites a la main : create unique index ux_pv_controle_reception_bl on public.pv_controle (bl_id) where type_controle = ''reception'' and bl_id is not null;', doublons;
    return;
  end if;
  create unique index if not exists ux_pv_controle_reception_bl on public.pv_controle (bl_id)
    where type_controle = 'reception' and bl_id is not null;
  raise notice '012 : index unique ux_pv_controle_reception_bl cree (un seul PV de reception par BL).';
end
$$;

notify pgrst, 'reload schema';
