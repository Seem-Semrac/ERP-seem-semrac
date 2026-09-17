-- ═══════════════════════════════════════════════════════════════════════════
-- 015 · nomenclatures.composants : text → jsonb (lot H0, 17/09/2026)
--
-- Symptôme : « les composants d'une nomenclature mère disparaissent ». Sur la base
-- Docker (et la VM, née de schema.sql), la colonne était en TEXT : le miroir cloud →
-- local avait déduit le type d'une colonne vide. PostgREST la rendait donc en CHAÎNE
-- JSON ; l'éditeur BE n'accepte qu'un tableau → à la réouverture la mère semblait sans
-- composant (total 0,00 €), et l'enregistrement suivant écrasait la base avec [].
-- Le cloud est déjà en jsonb (sondé en lecture le 17/09/2026 : filtre @> accepté) :
-- AUCUN script cloud n'est nécessaire.
--
-- Conversion : texte vide ou NULL → '[]'::jsonb ; JSON valide → cast à l'identique.
-- Filets complémentaires côté application : helper composantsDe() (src/shared.ts) qui
-- lit un tableau OU une chaîne, et refus 409 d'un PUT qui viderait une liste non vide.
--
-- ⚠ AUCUNE DONNÉE N'EST PERDUE. Idempotente : ne fait rien si la colonne est déjà en jsonb.
--
-- ⚠ RELECTURE H0 (17/09/2026) — ce fichier LÈVE UNE EXCEPTION quand la conversion n'a pas
--    pu se faire, au lieu d'un simple NOTICE :
--    - erreur passagère ou d'environnement (verrou occupé plus de 5 s pendant que l'app
--      tourne — 55P03, droits insuffisants — 42501, objet dépendant, rôle propriétaire…) ;
--    - valeur non JSON dans la colonne (jamais remplacée : requête de diagnostic dans le
--      message, correction à la main).
--    Le lanceur (docker/scripts/migrate.sh) annule alors la transaction — la base est
--    INTACTE —, ne journalise PAS le fichier et le RETENTE au démarrage suivant (même modèle
--    que 016). Avant, l'erreur devenait un NOTICE, psql sortait en 0 et 015 était journalisé :
--    la colonne restait en text pour de bon sur la VM, sans signal visible.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  type_actuel text;
  proprio     text;
  invalides   bigint;
begin
  select c.data_type into type_actuel
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name   = 'nomenclatures'
     and c.column_name  = 'composants';

  if type_actuel is null then
    raise notice '015 : colonne nomenclatures.composants absente — rien a faire.';
    return;
  end if;
  if type_actuel = 'jsonb' then
    raise notice '015 : composants est deja en jsonb — rien a faire.';
    return;
  end if;

  -- Ne jamais bloquer la base derriere un verrou : si la table est occupee, on renonce (et on retente plus tard).
  set local lock_timeout = '5s';

  -- ALTER TABLE exige d'etre PROPRIETAIRE de la table : on prend le role proprietaire si on le peut
  -- (sinon on tente avec le role courant ; un refus de droits fera echouer l'ALTER plus bas).
  select t.tableowner into proprio
    from pg_tables t where t.schemaname = 'public' and t.tablename = 'nomenclatures';
  if proprio is not null and proprio <> current_user then
    begin
      execute format('set local role %I', proprio);
    exception when others then
      raise notice '015 : role % indisponible, tentative avec % — %', proprio, current_user, sqlerrm;
    end;
  end if;

  -- Validite JSON REELLE (IS JSON, PostgreSQL 16+).
  begin
    execute 'select count(*) from public.nomenclatures
              where composants is not null
                and btrim(composants::text) <> ''''
                and not (btrim(composants::text) is json)'
      into invalides;
  exception when others then
    raise exception '015 : controle JSON impossible (% — SQLSTATE %). Conversion NON faite, aucune donnee touchee ; fichier NON journalise, retente au prochain demarrage.', sqlerrm, sqlstate;
  end;

  if invalides > 0 then
    raise exception '015 : % valeur(s) de nomenclatures.composants ne sont pas du JSON valide. Conversion NON faite, la colonne reste en text, aucune donnee touchee ; fichier NON journalise, retente a chaque demarrage jusqu a correction. Diagnostic : select id, num_nom, composants from public.nomenclatures where composants is not null and btrim(composants) <> '''' and not (btrim(composants) is json);', invalides;
  end if;

  begin
    execute 'alter table public.nomenclatures
               alter column composants type jsonb
               using (case when composants is null or btrim(composants::text) = ''''
                           then ''[]''::jsonb
                           else btrim(composants::text)::jsonb end)';
  exception when others then
    -- Verrou, droits insuffisants, objet dependant… : rien n'est modifie, on laisse le lanceur retenter.
    raise exception '015 : conversion NON faite (% — SQLSTATE %). Aucune donnee touchee ; fichier NON journalise, retente au prochain demarrage.', sqlerrm, sqlstate;
  end;
  raise notice '015 : nomenclatures.composants converti en jsonb (vide/NULL -> [], valeurs existantes conservees).';
end
$$;
