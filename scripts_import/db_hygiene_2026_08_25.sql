-- ══════════════════════════════════════════════════════════════
-- HYGIÈNE BASE — 2026-08-25
--
-- Répond aux diagnostics de Supabase Studio (Advisors) ET remet le schéma local
-- en phase avec le cloud. Script IDEMPOTENT : rejouable sans risque, à appliquer
-- des DEUX côtés (Docker et cloud) pour que les bases restent identiques.
--
--   1. Colonnes présentes au CLOUD mais absentes du schéma local (45)
--   2. Colonnes présentes en LOCAL mais absentes du cloud (7)
--   3. RLS activée sur les 51 tables qui ne l'avaient pas (advisor : 51 ERROR)
--   4. search_path figé sur 3 fonctions (advisor : 3 WARN)
--   5. Doublon de policy retiré sur hse_produits_chimiques (advisor : 4 WARN)
--   6. Clé primaire sur edit_locks (advisor : 1 INFO) — corrige AUSSI un vrai bug :
--      le code fait upsert(onConflict:'resource') sans contrainte unique.
--
-- ⚠ CE QUI N'EST VOLONTAIREMENT PAS « CORRIGÉ »
-- Les 51 avertissements `rls_policy_always_true` ne sont PAS des défauts à taire :
-- l'ERP est rendu côté serveur et s'authentifie avec la CLÉ ANON (src/db.ts). La
-- clé anon EST l'identité de l'application. Restreindre ces policies couperait
-- l'accès à l'application elle-même. La sécurité repose ici sur le fait que la clé
-- ne quitte jamais le serveur, et sur le mur d'authentification matricule + PIN
-- (AUTH_ENFORCE). C'est une posture assumée, documentée — pas un oubli.
-- ══════════════════════════════════════════════════════════════

-- ─── 1. Colonnes du CLOUD absentes du schéma local ────────────
-- Types déduits des valeurs réelles du cloud ; cout_reel et avancement sont typés
-- numériques d'après leur usage dans le code (Number(...) et pourcentage arrondi).
alter table public.bons_de_travail add column if not exists client_nom          text;
alter table public.bons_de_travail add column if not exists debut               integer;
alter table public.bons_de_travail add column if not exists priorite            text;
alter table public.bons_de_travail add column if not exists baseline            text;
alter table public.bons_de_travail add column if not exists pv_requis           boolean;
alter table public.bons_de_travail add column if not exists affaire_id          text;
alter table public.bons_de_travail add column if not exists statut_init         text;
alter table public.bons_de_travail add column if not exists date_echeance       text;
alter table public.bons_de_travail add column if not exists temps_alloue        numeric;
alter table public.bons_de_travail add column if not exists debut_reel          text;
alter table public.bons_de_travail add column if not exists fin_reel            text;
alter table public.bons_de_travail add column if not exists process_id          text;
alter table public.bons_de_travail add column if not exists resultat            text;
alter table public.bons_de_travail add column if not exists oas_apres           boolean;
alter table public.bons_de_travail add column if not exists oas_avant           boolean;
alter table public.bons_de_travail add column if not exists prioritaire         boolean;
alter table public.bons_de_travail add column if not exists poste_id            text;

alter table public.commandes add column if not exists client_id       text;
alter table public.commandes add column if not exists offre_id        text;
alter table public.commandes add column if not exists pieces          jsonb;
alter table public.commandes add column if not exists activite        text;
alter table public.commandes add column if not exists has_st          boolean;
alter table public.commandes add column if not exists retard          boolean;
alter table public.commandes add column if not exists affaire_id      text;
alter table public.commandes add column if not exists nomenclature_id text;
alter table public.commandes add column if not exists prioritaire     boolean;
alter table public.commandes add column if not exists origine_nc      text;

alter table public.hse_epi_catalogue add column if not exists fournisseur_id text;

alter table public.hse_epi_dotations add column if not exists fournisseur    text;
alter table public.hse_epi_dotations add column if not exists marque         text;
alter table public.hse_epi_dotations add column if not exists reference      text;
alter table public.hse_epi_dotations add column if not exists prix           numeric;
alter table public.hse_epi_dotations add column if not exists categorie      text;
alter table public.hse_epi_dotations add column if not exists fournisseur_id text;
alter table public.hse_epi_dotations add column if not exists updated_at     text;

alter table public.lots add column if not exists client_nom         text;
alter table public.lots add column if not exists date_debut         text;
alter table public.lots add column if not exists date_fin           text;
alter table public.lots add column if not exists affaire_id         text;
alter table public.lots add column if not exists statut_matiere     text;
alter table public.lots add column if not exists statut_prepa_tech  text;
alter table public.lots add column if not exists statut_ref_interne text;
alter table public.lots add column if not exists cout_reel          numeric;
alter table public.lots add column if not exists avancement         numeric;
alter table public.lots add column if not exists prioritaire        boolean;

-- ─── 2. Colonnes LOCALES absentes du cloud ────────────────────
-- Elles existent dans le schéma reproductible ; on les ajoute au cloud pour que
-- les deux bases soient réellement identiques. Toutes nullables : sans effet sur
-- l'existant. (Vérifié : aucune n'est écrite par l'application sur ces tables —
-- `operateur_nom` alimente operateur_bdt_historique, pas bons_de_travail.)
alter table public.bons_de_travail  add column if not exists operateur_nom text;
alter table public.lots             add column if not exists updated_at    text;
alter table public.mouvements_stock add column if not exists bc_id         text;
alter table public.mouvements_stock add column if not exists reference     text;
alter table public.pieces_rechange  add column if not exists nom           text;
alter table public.pieces_rechange  add column if not exists machine_nom   text;
alter table public.pieces_rechange  add column if not exists stock         numeric;

-- ─── 2 bis. Type erroné : demandes_prix_lignes.demande_prix_id ──
-- Déclaré `numeric` en local alors que le cloud y stocke un UUID. Toute insertion
-- de ligne de demande de prix échouait sur Docker (« invalid input syntax for type
-- numeric »), et le miroir laissait donc la table vide. On l'aligne sur text.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'demandes_prix_lignes'
      and column_name = 'demande_prix_id' and data_type = 'numeric'
  ) then
    alter table public.demandes_prix_lignes alter column demande_prix_id type text using demande_prix_id::text;
    raise notice 'demandes_prix_lignes.demande_prix_id : numeric -> text';
  end if;
end $$;

-- ─── 3. RLS activée partout, avec une policy explicite ────────
-- 51 tables de `public` n'avaient PAS la RLS activée (advisor : ERROR), alors que
-- les 50 autres l'avaient avec une policy permissive. Cette incohérence est le
-- vrai défaut : on l'aligne. Le comportement de l'application ne change pas — la
-- policy accorde exactement ce dont la clé anon disposait déjà — mais toutes les
-- tables passent désormais par le même point de contrôle, ce qui rend possible un
-- durcissement futur table par table.
do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    execute format('drop policy if exists %I on public.%I', t.relname || '_anon_all', t.relname);
    execute format('create policy %I on public.%I for all to anon, authenticated using (true) with check (true)',
                   t.relname || '_anon_all', t.relname);
    raise notice 'RLS activée + policy sur %', t.relname;
  end loop;
end $$;

-- ─── 4. search_path figé sur les fonctions ────────────────────
-- Sans search_path fixe, un schéma malveillant placé en tête de chemin peut
-- détourner un appel de fonction non qualifié (advisor : function_search_path_mutable).
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' and p.proconfig is null
  loop
    execute format('alter function %s set search_path = public, pg_temp', f.sig);
    raise notice 'search_path figé sur %', f.sig;
  end loop;
end $$;

-- ─── 5. Doublon de policy sur hse_produits_chimiques ──────────
-- Deux policies identiques coexistaient (l'une nommée avec des espaces), d'où
-- 4 avertissements « multiple_permissive_policies ». On garde la nomenclature
-- standard `<table>_anon_all` et on retire le doublon.
drop policy if exists "hse_produits_chimiques anon all" on public.hse_produits_chimiques;

-- ─── 6. Clé primaire sur edit_locks ───────────────────────────
-- Table sans clé primaire (advisor : no_primary_key). Ce n'est pas cosmétique :
-- le code appelle upsert(payload, { onConflict: 'resource' }), ce qui EXIGE une
-- contrainte unique sur `resource`. Sans elle, l'upsert échoue ou duplique — et
-- l'on constatait effectivement 2 lignes pour 1 seule ressource.
-- Déduplication : on garde UNE ligne par ressource — la plus récente, et à
-- horodatage égal la dernière physiquement écrite (ctid départage, sinon deux
-- doublons parfaitement identiques ne s'éliminent pas).
delete from public.edit_locks a
  using public.edit_locks b
  where a.resource = b.resource
    and ( coalesce(a.heartbeat_at, a.acquired_at, '') < coalesce(b.heartbeat_at, b.acquired_at, '')
       or ( coalesce(a.heartbeat_at, a.acquired_at, '') = coalesce(b.heartbeat_at, b.acquired_at, '')
            and a.ctid < b.ctid ) );

delete from public.edit_locks where resource is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.edit_locks'::regclass and contype = 'p'
  ) then
    alter table public.edit_locks add constraint edit_locks_pkey primary key (resource);
    raise notice 'clé primaire posée sur edit_locks(resource)';
  end if;
end $$;
