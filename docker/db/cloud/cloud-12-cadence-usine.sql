-- ═══════════════════════════════════════════════════════════════════════════
-- cloud-12 · Cadence usine par site (modèles d'horaires Bas / Moyen / Haut), remise en goulotte, process OAS — lot G
--            (équivalent CLOUD de la migration Docker 014)
--
-- À JOUER À LA MAIN dans Supabase Studio → SQL Editor, en une fois.
-- Additif et rejouable. Crée et AMORCE :
--   horaires_modeles  : modèles d'horaires par niveau (bas / moyen / haut) × jour × créneau (matin, apmidi, soir, journee)
--                       × partie (Journée en deux parties) — 65 lignes, celles fournies le 16/09/2026 ; une ligne déjà
--                       présente (modifiée ou fermée dans l'ERP) n'est jamais réécrite. Dimanche toujours fermé (contrainte).
--                       ⚠ Haut, jeudi et vendredi : Après-midi 13:15-21:00 et Soirée 21:00-05:30 (horaires du lundi : le
--                       modèle fourni répétait 05:30-13:15, l'utilisateur a confirmé que ces équipes travaillent).
--   cadence_site      : cadence par site (Seem, Semrac), historique en ajout seul, avec sa date d'effet (`effet`) ;
--                       amorce Moyen pour chaque site sans ligne.
--   bons_de_travail.remis_goulotte_le : BDT remis en goulotte par le déplacement d'une étape précédente.
--   bons_de_travail.recu_le           : instant de la réception d'un BDT (date réelle d'un BDT reçu après minuit).
-- MODIFIE des données (et le dit, ligne par ligne, par des NOTICE dans l'onglet « Messages » du Studio) :
--   process_atelier   : les process rattachés à une MACHINE d'activité OAS deviennent est_oas = true, activite = 'OAS',
--                       poste = poste de cette machine, taux_horaire_machine = null. Si l'un d'eux ne porte pas un nom de
--                       traitement de surface (Surtec, désoxydation, oxydation, lavage, OAS), RIEN n'est modifié : WARNING
--                       avec la liste, marquage à faire à la main (Production › Process Ateliers, type OAS).
--   Aperçu sans rien écrire : jouer le script entre « begin; » et « rollback; » et lire les NOTICE.
--
-- Sans ce script, côté cloud : l'écran Production › Process Ateliers › Cadence usine affiche « jouez cloud-12 » et
-- n'écrit rien ; présences, planning d'affectation et RH gardent les horaires par défaut des créneaux (aucun créneau
-- refusé) ; aucune erreur bloquante.
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

-- ── 1) Modèles d'horaires ────────────────────────────────────────────────────
create table if not exists public.horaires_modeles (
  id            text primary key default gen_random_uuid()::text,
  niveau        text not null,
  jour_semaine  integer not null,
  creneau       text not null,
  partie        integer not null default 1,
  debut         text not null,
  fin           text not null,
  actif         boolean not null default true,
  maj_le        timestamptz not null default now(),
  maj_par       text
);
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.horaires_modeles'::regclass and conname = 'horaires_modeles_niveau_valide') then
    alter table public.horaires_modeles add constraint horaires_modeles_niveau_valide check (niveau in ('bas', 'moyen', 'haut'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.horaires_modeles'::regclass and conname = 'horaires_modeles_jour_valide') then
    alter table public.horaires_modeles add constraint horaires_modeles_jour_valide check (jour_semaine between 1 and 7);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.horaires_modeles'::regclass and conname = 'horaires_modeles_creneau_valide') then
    alter table public.horaires_modeles add constraint horaires_modeles_creneau_valide check (creneau in ('matin', 'apmidi', 'soir', 'journee'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.horaires_modeles'::regclass and conname = 'horaires_modeles_partie_valide') then
    alter table public.horaires_modeles add constraint horaires_modeles_partie_valide check (partie = 1 or (partie = 2 and creneau = 'journee'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.horaires_modeles'::regclass and conname = 'horaires_modeles_heures_valides') then
    alter table public.horaires_modeles add constraint horaires_modeles_heures_valides
      check (debut ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and fin ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and debut <> fin);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.horaires_modeles'::regclass and conname = 'horaires_modeles_dimanche_ferme') then
    alter table public.horaires_modeles add constraint horaires_modeles_dimanche_ferme check (jour_semaine <> 7 or actif = false);
  end if;
  -- Samedi : un créneau qui finirait le lendemain travaillerait le dimanche (toujours fermé). NOT VALID : contrôle les
  -- écritures à venir sans bloquer la migration sur une ligne saisie à la main auparavant (le moteur la coupe à 24:00).
  if not exists (select 1 from pg_constraint where conrelid = 'public.horaires_modeles'::regclass and conname = 'horaires_modeles_samedi_sans_nuit') then
    alter table public.horaires_modeles add constraint horaires_modeles_samedi_sans_nuit check (jour_semaine <> 6 or actif = false or fin > debut) not valid;
  end if;
end
$$;
create unique index if not exists ux_horaires_modeles_cle on public.horaires_modeles (niveau, jour_semaine, creneau, partie);
comment on table public.horaires_modeles is
  'Modeles d horaires de l usine par niveau de cadence (Production > Process Ateliers > Cadence usine). Creneau ferme un jour = pas de ligne active (une ligne ne s efface pas : actif = false). Fin < debut = creneau qui finit le lendemain, rattache au jour ou il commence. Dimanche toujours ferme.';

insert into public.horaires_modeles (id, niveau, jour_semaine, creneau, partie, debut, fin) values
  -- BAS : lundi, mardi, mercredi
  ('bas-1-matin-1', 'bas', 1, 'matin', 1, '05:30', '13:15'), ('bas-1-apmidi-1', 'bas', 1, 'apmidi', 1, '13:15', '21:00'),
  ('bas-1-soir-1', 'bas', 1, 'soir', 1, '21:00', '05:30'), ('bas-1-journee-1', 'bas', 1, 'journee', 1, '07:30', '12:00'),
  ('bas-1-journee-2', 'bas', 1, 'journee', 2, '12:45', '16:00'),
  ('bas-2-matin-1', 'bas', 2, 'matin', 1, '05:30', '13:15'), ('bas-2-apmidi-1', 'bas', 2, 'apmidi', 1, '13:15', '21:00'),
  ('bas-2-soir-1', 'bas', 2, 'soir', 1, '21:00', '05:30'), ('bas-2-journee-1', 'bas', 2, 'journee', 1, '07:30', '12:00'),
  ('bas-2-journee-2', 'bas', 2, 'journee', 2, '12:45', '16:00'),
  ('bas-3-matin-1', 'bas', 3, 'matin', 1, '05:30', '13:15'), ('bas-3-apmidi-1', 'bas', 3, 'apmidi', 1, '13:15', '21:00'),
  ('bas-3-soir-1', 'bas', 3, 'soir', 1, '21:00', '05:30'), ('bas-3-journee-1', 'bas', 3, 'journee', 1, '07:30', '12:00'),
  ('bas-3-journee-2', 'bas', 3, 'journee', 2, '12:45', '16:00'),
  -- BAS : jeudi (vendredi, samedi, dimanche fermés)
  ('bas-4-matin-1', 'bas', 4, 'matin', 1, '04:30', '13:15'), ('bas-4-journee-1', 'bas', 4, 'journee', 1, '07:30', '12:30'),
  -- MOYEN : lundi → jeudi
  ('moyen-1-matin-1', 'moyen', 1, 'matin', 1, '05:30', '13:15'), ('moyen-1-apmidi-1', 'moyen', 1, 'apmidi', 1, '13:15', '21:00'),
  ('moyen-1-soir-1', 'moyen', 1, 'soir', 1, '21:00', '05:30'), ('moyen-1-journee-1', 'moyen', 1, 'journee', 1, '07:30', '12:00'),
  ('moyen-1-journee-2', 'moyen', 1, 'journee', 2, '12:45', '16:00'),
  ('moyen-2-matin-1', 'moyen', 2, 'matin', 1, '05:30', '13:15'), ('moyen-2-apmidi-1', 'moyen', 2, 'apmidi', 1, '13:15', '21:00'),
  ('moyen-2-soir-1', 'moyen', 2, 'soir', 1, '21:00', '05:30'), ('moyen-2-journee-1', 'moyen', 2, 'journee', 1, '07:30', '12:00'),
  ('moyen-2-journee-2', 'moyen', 2, 'journee', 2, '12:45', '16:00'),
  ('moyen-3-matin-1', 'moyen', 3, 'matin', 1, '05:30', '13:15'), ('moyen-3-apmidi-1', 'moyen', 3, 'apmidi', 1, '13:15', '21:00'),
  ('moyen-3-soir-1', 'moyen', 3, 'soir', 1, '21:00', '05:30'), ('moyen-3-journee-1', 'moyen', 3, 'journee', 1, '07:30', '12:00'),
  ('moyen-3-journee-2', 'moyen', 3, 'journee', 2, '12:45', '16:00'),
  ('moyen-4-matin-1', 'moyen', 4, 'matin', 1, '05:30', '13:15'), ('moyen-4-apmidi-1', 'moyen', 4, 'apmidi', 1, '13:15', '21:00'),
  ('moyen-4-soir-1', 'moyen', 4, 'soir', 1, '21:00', '05:30'), ('moyen-4-journee-1', 'moyen', 4, 'journee', 1, '07:30', '12:00'),
  ('moyen-4-journee-2', 'moyen', 4, 'journee', 2, '12:45', '16:00'),
  -- MOYEN : vendredi (samedi, dimanche fermés)
  ('moyen-5-matin-1', 'moyen', 5, 'matin', 1, '04:50', '13:15'), ('moyen-5-journee-1', 'moyen', 5, 'journee', 1, '07:30', '12:00'),
  -- HAUT : lundi → vendredi (jeudi et vendredi : Après-midi et Soirée = horaires du lundi, voir en-tête)
  ('haut-1-matin-1', 'haut', 1, 'matin', 1, '05:30', '13:15'), ('haut-1-apmidi-1', 'haut', 1, 'apmidi', 1, '13:15', '21:00'),
  ('haut-1-soir-1', 'haut', 1, 'soir', 1, '21:00', '05:30'), ('haut-1-journee-1', 'haut', 1, 'journee', 1, '07:30', '12:00'),
  ('haut-1-journee-2', 'haut', 1, 'journee', 2, '12:45', '16:45'),
  ('haut-2-matin-1', 'haut', 2, 'matin', 1, '05:30', '13:15'), ('haut-2-apmidi-1', 'haut', 2, 'apmidi', 1, '13:15', '21:00'),
  ('haut-2-soir-1', 'haut', 2, 'soir', 1, '21:00', '05:30'), ('haut-2-journee-1', 'haut', 2, 'journee', 1, '07:30', '12:00'),
  ('haut-2-journee-2', 'haut', 2, 'journee', 2, '12:45', '16:45'),
  ('haut-3-matin-1', 'haut', 3, 'matin', 1, '05:30', '13:15'), ('haut-3-apmidi-1', 'haut', 3, 'apmidi', 1, '13:15', '21:00'),
  ('haut-3-soir-1', 'haut', 3, 'soir', 1, '21:00', '05:30'), ('haut-3-journee-1', 'haut', 3, 'journee', 1, '07:30', '12:00'),
  ('haut-3-journee-2', 'haut', 3, 'journee', 2, '12:45', '16:45'),
  ('haut-4-matin-1', 'haut', 4, 'matin', 1, '05:30', '13:15'), ('haut-4-apmidi-1', 'haut', 4, 'apmidi', 1, '13:15', '21:00'),
  ('haut-4-soir-1', 'haut', 4, 'soir', 1, '21:00', '05:30'), ('haut-4-journee-1', 'haut', 4, 'journee', 1, '07:30', '12:00'),
  ('haut-4-journee-2', 'haut', 4, 'journee', 2, '12:45', '16:45'),
  ('haut-5-matin-1', 'haut', 5, 'matin', 1, '05:30', '13:15'), ('haut-5-apmidi-1', 'haut', 5, 'apmidi', 1, '13:15', '21:00'),
  ('haut-5-soir-1', 'haut', 5, 'soir', 1, '21:00', '05:30'), ('haut-5-journee-1', 'haut', 5, 'journee', 1, '07:30', '12:00'),
  ('haut-5-journee-2', 'haut', 5, 'journee', 2, '12:45', '16:45'),
  -- HAUT : samedi, Matin seulement (dimanche fermé)
  ('haut-6-matin-1', 'haut', 6, 'matin', 1, '05:30', '12:00')
on conflict do nothing;

alter table public.horaires_modeles enable row level security;
drop policy if exists hmod_lecture on public.horaires_modeles;
drop policy if exists hmod_ajout   on public.horaires_modeles;
drop policy if exists hmod_maj     on public.horaires_modeles;
create policy hmod_lecture on public.horaires_modeles for select to anon, authenticated using (true);
create policy hmod_ajout   on public.horaires_modeles for insert to anon, authenticated with check (true);
create policy hmod_maj     on public.horaires_modeles for update to anon, authenticated using (true) with check (true);
revoke all on table public.horaires_modeles from anon, authenticated;
grant select, insert, update on table public.horaires_modeles to anon, authenticated;

-- ── 2) Cadence par site (historique, ajout seul) ─────────────────────────────
create table if not exists public.cadence_site (
  id      text primary key default gen_random_uuid()::text,
  site    text not null,
  niveau  text not null,
  depuis  timestamptz not null default now(),
  par     text,
  motif   text
);
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.cadence_site'::regclass and conname = 'cadence_site_site_valide') then
    alter table public.cadence_site add constraint cadence_site_site_valide check (site in ('Seem', 'Semrac'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.cadence_site'::regclass and conname = 'cadence_site_niveau_valide') then
    alter table public.cadence_site add constraint cadence_site_niveau_valide check (niveau in ('bas', 'moyen', 'haut'));
  end if;
end
$$;
-- Date d'effet (revue du 16/09/2026) : un changement s'applique à partir d'un JOUR choisi (le lendemain par défaut), pas
-- à toute la journée où il est décidé. NULL (lignes d'amorce) = le jour de `depuis` à Paris.
alter table public.cadence_site add column if not exists effet date;
comment on column public.cadence_site.effet is
  'Jour a partir duquel cette cadence s applique (Paris). NULL = jour de depuis. Cadence d un site a une date D = ligne de plus grand (effet, depuis) avec effet <= D.';
create index if not exists idx_cadence_site_depuis on public.cadence_site (site, depuis desc);
comment on table public.cadence_site is
  'Cadence de l usine par site (Bas / Moyen / Haut), historique en ajout seul : la cadence courante d un site est sa derniere ligne ; a une date donnee, la derniere ligne dont le jour de depuis (Paris) precede ou egale cette date.';

insert into public.cadence_site (id, site, niveau, par, motif)
select v.id, v.site, 'moyen', 'migration 014', 'Amorce : cadence Moyen (a ajuster dans Production > Process Ateliers > Cadence usine)'
  from (values ('amorce-seem', 'Seem'), ('amorce-semrac', 'Semrac')) as v(id, site)
 where not exists (select 1 from public.cadence_site c where c.site = v.site)
on conflict do nothing;

alter table public.cadence_site enable row level security;
drop policy if exists cads_lecture on public.cadence_site;
drop policy if exists cads_ajout   on public.cadence_site;
create policy cads_lecture on public.cadence_site for select to anon, authenticated using (true);
create policy cads_ajout   on public.cadence_site for insert to anon, authenticated with check (true);
revoke all on table public.cadence_site from anon, authenticated;
grant select, insert on table public.cadence_site to anon, authenticated;

-- ── 3) bons_de_travail : remise en goulotte ──────────────────────────────────
do $$
begin
  if to_regclass('public.bons_de_travail') is null then
    raise notice '014 : table bons_de_travail absente, ignoree.';
    return;
  end if;
  alter table public.bons_de_travail add column if not exists remis_goulotte_le timestamptz;
  create index if not exists idx_bdt_remis_goulotte on public.bons_de_travail (remis_goulotte_le) where remis_goulotte_le is not null;
  comment on column public.bons_de_travail.remis_goulotte_le is
    'BDT deprogramme (remis en goulotte) parce que le deplacement d une etape precedente le rendait incoherent. La goulotte les affiche en premier. NULL = jamais remis.';
  -- Horodatage complet de la réception (revue du 16/09/2026) : debut_reel n'est qu'une heure « HH:MM » ; avec des équipes
  -- de nuit, un BDT posé à 22 h et reçu à 00:30 se plaçait 24 h trop tôt sur sa date prévue (chemin critique, OAS).
  alter table public.bons_de_travail add column if not exists recu_le timestamptz;
  comment on column public.bons_de_travail.recu_le is
    'Instant de la reception du BDT (debut reel date). NULL = BDT recu avant cette colonne : la date du debut reel est deduite de la date prevue.';
end
$$;

-- ── 4) Process OAS (données) ─────────────────────────────────────────────────
do $$
declare
  n_mach     integer;
  n_cand     integer;
  n_modif    integer := 0;
  a_taux     boolean;
  liste      text;
  r          record;
  poste_cible text;
begin
  if to_regclass('public.process_atelier') is null or to_regclass('public.machines') is null then
    raise notice '014 (OAS) : tables process_atelier / machines absentes, rien a faire.';
    return;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'process_atelier' and column_name = 'est_oas')
     or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'process_atelier' and column_name = 'poste_id') then
    raise warning '014 (OAS) : colonnes process_atelier.est_oas / poste_id absentes, AUCUN process modifie (marquage a faire a la main : Production > Process Ateliers, type OAS).';
    return;
  end if;
  a_taux := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'process_atelier' and column_name = 'taux_horaire_machine');

  select count(*) into n_mach from public.machines m where upper(btrim(coalesce(m.activite, ''))) = 'OAS';
  if n_mach = 0 then
    raise notice '014 (OAS) : aucune machine d activite OAS, AUCUN process modifie (marquage a faire a la main : Production > Process Ateliers, type OAS).';
    return;
  end if;

  select count(*) into n_cand
    from public.process_atelier p join public.machines m on m.id = p.machine_id
   where upper(btrim(coalesce(m.activite, ''))) = 'OAS';
  if n_cand = 0 then
    raise notice '014 (OAS) : % machine(s) OAS mais aucun process rattache, AUCUN process modifie.', n_mach;
    return;
  end if;

  -- Garde-fou : un process rattaché à une machine OAS mais qui ne porte pas un nom de traitement de surface rend le critère ambigu.
  select string_agg(format('%s (%s)', p.id, coalesce(p.nom, '?')), ', ' order by p.nom) into liste
    from public.process_atelier p join public.machines m on m.id = p.machine_id
   where upper(btrim(coalesce(m.activite, ''))) = 'OAS'
     and lower(coalesce(p.nom, '')) !~ '(surtec|d[eé]soxyd|oxydation|lavage|oas)';
  if liste is not null then
    raise warning '014 (OAS) : critere AMBIGU, AUCUN process modifie. Rattaches a une machine OAS sans nom de traitement de surface : %. Marquez les vrais process OAS a la main (Production > Process Ateliers, crayon du process, type OAS).', liste;
    return;
  end if;

  for r in
    select p.id, p.nom, p.est_oas, p.activite, p.poste_id, (to_jsonb(p) ->> 'taux_horaire_machine') as taux,
           m.id as mach_id, m.nom as mach_nom,
           (select po.id from public.postes po where po.id = m.poste_id) as poste_machine
      from public.process_atelier p join public.machines m on m.id = p.machine_id
     where upper(btrim(coalesce(m.activite, ''))) = 'OAS'
     order by p.nom
  loop
    poste_cible := coalesce(r.poste_machine, r.poste_id);
    if r.est_oas is distinct from true or r.activite is distinct from 'OAS' or r.taux is not null or poste_cible is distinct from r.poste_id then
      update public.process_atelier set est_oas = true, activite = 'OAS', poste_id = poste_cible where id = r.id;
      if a_taux and r.taux is not null then
        execute 'update public.process_atelier set taux_horaire_machine = null where id = $1' using r.id;
      end if;
      n_modif := n_modif + 1;
      raise notice '014 (OAS) : % "%" (machine % "%") : est_oas % -> true ; activite % -> OAS ; taux_horaire_machine % -> null ; poste % -> %',
        r.id, r.nom, r.mach_id, r.mach_nom, coalesce(r.est_oas::text, 'null'), coalesce(r.activite, 'null'),
        coalesce(r.taux, 'null'), coalesce(r.poste_id, 'null'), coalesce(poste_cible, 'null');
    end if;
  end loop;

  -- Signalés, NON modifiés : process nommés comme un traitement de surface mais pas rattachés à une machine OAS.
  select string_agg(format('%s (%s)', p.id, coalesce(p.nom, '?')), ', ' order by p.nom) into liste
    from public.process_atelier p
   where lower(coalesce(p.nom, '')) ~ '(surtec|d[eé]soxyd|oxydation|lavage)'
     and coalesce(p.est_oas, false) = false
     and not exists (select 1 from public.machines m where m.id = p.machine_id and upper(btrim(coalesce(m.activite, ''))) = 'OAS');
  if liste is not null then
    raise notice '014 (OAS) : NON modifies (pas rattaches a une machine OAS, a verifier a la main) : %', liste;
  end if;
  raise notice '014 (OAS) : % process marque(s) OAS sur % rattache(s) a une machine OAS (% deja a jour).', n_modif, n_cand, n_cand - n_modif;
end
$$;

notify pgrst, 'reload schema';
