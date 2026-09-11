-- A JOUER dans Supabase Studio > SQL Editor (base CLOUD uniquement).
-- Docker local et VM le font tout seuls via le conteneur erp-migrate (migration 006).
--
-- A FAIRE : sans lui, les modifications des nomenclatures validees s'enregistrent mais ne sont
-- PAS tracees (l'ecran l'affiche en orange). Purement additif, idempotent.

-- ═══════════════════════════════════════════════════════════════════════════
-- 006 · JOURNAL EN 9100 des nomenclatures validées (nomenclature_journal)
--
-- « Pour l'EN 9100, je veux pouvoir tracer dans les logs toutes les modifications effectuées
--   sur une nomenclature déjà validée. »
--
-- Une ligne par événement : validation, modification, dévalidation, préparation technique,
-- nouvel indice, suppression, document joint ou retiré, référence client. Qui (auteur tiré de la
-- session, jamais du corps de la requête), quand (heure imposée par la base), quoi (changements
-- champ par champ, avant -> après).
--
-- APPEND-ONLY : des déclencheurs refusent toute modification, tout effacement et tout vidage de
-- table — y compris en mode réplication (« enable always ») —, et les droits UPDATE / DELETE sont
-- retirés à la clé applicative. Seul le PROPRIÉTAIRE de la table peut désactiver un déclencheur
-- (acte d'administration visible, décrit dans le runbook pour purger un jeu de test). PAS de clé
-- étrangère vers nomenclatures : le journal doit SURVIVRE à la suppression d'une fiche.
--
-- Idempotente : if not exists / drop ... if exists / create or replace. Aucune donnée touchée.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.nomenclature_journal (
  id               text primary key default gen_random_uuid()::text,
  created_at       timestamptz not null default now(),
  nomenclature_id  text not null,
  groupe           text,
  code_ref_produit text,
  num_nom          text,
  indice           text,
  entite           text,
  evenement        text not null,
  statut_avant     text,
  statut_apres     text,
  auteur_id        text,
  auteur_matricule text,
  auteur_nom       text not null,
  auteur_role      text,
  auteur_source    text not null,
  route            text,
  motif            text,
  changements      jsonb not null default '[]'::jsonb,
  instantane_avant jsonb,
  lie_a            text
);

create index if not exists idx_nomj_nom    on public.nomenclature_journal (nomenclature_id, created_at desc);
create index if not exists idx_nomj_groupe on public.nomenclature_journal (groupe, created_at desc);

alter table public.nomenclature_journal enable row level security;
drop policy if exists nomj_lecture on public.nomenclature_journal;
drop policy if exists nomj_ajout   on public.nomenclature_journal;
create policy nomj_lecture on public.nomenclature_journal for select to anon, authenticated using (true);
create policy nomj_ajout   on public.nomenclature_journal for insert to anon, authenticated with check (true);

-- Les droits par défaut du projet donnent tout à anon : on les retire, puis on ne rend que
-- la lecture et l'ajout.
revoke all on table public.nomenclature_journal from anon, authenticated;
grant select, insert on table public.nomenclature_journal to anon, authenticated;

-- Heure imposée par la base pour toute écriture venue de l'API (clé anon, session, clé service) :
-- une entrée ne peut pas être antidatée. Une RESTAURATION de sauvegarde — faite par
-- l'administrateur de la base, pas par l'API — garde l'heure d'origine des entrées.
create or replace function public.nomenclature_journal_horodatage() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated', 'service_role') or new.created_at is null then
    new.created_at := now();
  end if;
  if new.id is null then new.id := gen_random_uuid()::text; end if;
  return new;
end
$$;
drop trigger if exists trg_nomj_horodatage on public.nomenclature_journal;
create trigger trg_nomj_horodatage before insert on public.nomenclature_journal
  for each row execute function public.nomenclature_journal_horodatage();

-- Ni modification, ni effacement, ni vidage de table.
create or replace function public.nomenclature_journal_immuable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'nomenclature_journal : journal EN 9100 en ajout seul, modification et effacement interdits';
end
$$;
drop trigger if exists trg_nomj_immuable on public.nomenclature_journal;
create trigger trg_nomj_immuable before update or delete on public.nomenclature_journal
  for each row execute function public.nomenclature_journal_immuable();
drop trigger if exists trg_nomj_immuable_vidage on public.nomenclature_journal;
create trigger trg_nomj_immuable_vidage before truncate on public.nomenclature_journal for each statement execute function public.nomenclature_journal_immuable();
-- « always » : actifs même en mode réplication (session_replication_role = replica), que le rôle
-- d'administration peut activer — sinon la garantie tiendrait tant qu'on ne la contourne pas.
alter table public.nomenclature_journal enable always trigger trg_nomj_immuable;
alter table public.nomenclature_journal enable always trigger trg_nomj_immuable_vidage;

notify pgrst, 'reload schema';
