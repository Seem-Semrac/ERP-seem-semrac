-- ═══════════════════════════════════════════════════════════════════════════
-- 001 · demandes_achat.bc_draft : text → jsonb
--
-- Contexte : la colonne est jsonb sur la Supabase cloud mais text dans le dump
-- Docker. Elle porte le brouillon de bon de commande ET, depuis le 09/09/2026,
-- la composition d'une fusion de demandes d'achat (clés `_fusion` /
-- `_regroupee_dans`). L'écart n'est PAS bloquant — le serveur réessaie en
-- sérialisant (helper `majDaDraft`, src/index.tsx) — mais l'aligner évite un
-- aller-retour inutile à chaque écriture.
--
-- ⚠ AUCUNE DONNÉE N'EST PERDUE, ET CE FICHIER NE PEUT PAS FAIRE ÉCHOUER LA
--    MIGRATION. Tout ce qui peut lever est exécuté en SQL dynamique à l'intérieur
--    d'un bloc `exception` : validité JSON, prise du rôle propriétaire, ALTER.
--    Au moindre refus, PostgreSQL annule la sous-transaction, la colonne reste en
--    `text`, un `notice` explique pourquoi, et la migration se termine en SUCCÈS.
--
--    Historique : la première version faisait l'ALTER SANS filet et testait la
--    validité JSON sur le seul PREMIER caractère (`~ '^\s*[\[{]'`). Une valeur
--    commençant par « { » sans être du JSON valide (écriture tronquée,
--    « [object Object] ») franchissait le test puis faisait exploser le cast —
--    d'où le `exit 3` du conteneur erp-migrate.
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
     and c.table_name   = 'demandes_achat'
     and c.column_name  = 'bc_draft';

  if type_actuel is null then
    raise notice '001 : colonne demandes_achat.bc_draft absente — rien a faire.';
    return;
  end if;
  if type_actuel = 'jsonb' then
    raise notice '001 : bc_draft est deja en jsonb — rien a faire.';
    return;
  end if;

  begin
    -- Ne jamais bloquer la base derriere un verrou : si la table est occupee, on renonce.
    set local lock_timeout = '5s';

    -- ALTER TABLE exige d'etre PROPRIETAIRE de la table. Sur l'image Supabase, le role
    -- « postgres » ne l'est pas toujours : on prend le role proprietaire si on le peut.
    select t.tableowner into proprio
      from pg_tables t where t.schemaname = 'public' and t.tablename = 'demandes_achat';
    if proprio is not null and proprio <> current_user then
      begin
        execute format('set local role %I', proprio);
      exception when others then
        raise notice '001 : role % indisponible, tentative avec % — %', proprio, current_user, sqlerrm;
      end;
    end if;

    -- Validite JSON REELLE (et non « ca commence par { »). En SQL dynamique : si le
    -- serveur ne connait pas « IS JSON » (PostgreSQL < 16), l'erreur est rattrapee ici
    -- meme et la conversion est simplement abandonnee.
    execute 'select count(*) from public.demandes_achat '
         || 'where bc_draft is not null and btrim(bc_draft::text) <> '''' '
         || 'and not (btrim(bc_draft::text) is json)'
      into invalides;

    if invalides > 0 then
      raise notice '001 : % valeur(s) de bc_draft ne sont pas du JSON valide — conversion abandonnee, la colonne reste en text (aucune donnee touchee).', invalides;
      return;
    end if;

    execute 'alter table public.demandes_achat '
         || 'alter column bc_draft type jsonb '
         || 'using (nullif(btrim(bc_draft::text), '''')::jsonb)';
    raise notice '001 : bc_draft converti en jsonb, valeurs existantes conservees.';

  exception when others then
    -- Verrou, droits insuffisants, vue/policy/contrainte dependante, version de
    -- PostgreSQL trop ancienne… : on renonce proprement. Rien n'est modifie.
    raise notice '001 : conversion abandonnee (%) — la colonne reste en text, aucune donnee touchee.', sqlerrm;
  end;
end
$$;
