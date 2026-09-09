-- ═══════════════════════════════════════════════════════════════════════════
-- 001 · demandes_achat.bc_draft : text → jsonb
--
-- Contexte : la colonne est jsonb sur la Supabase cloud mais text dans le dump
-- Docker. Elle porte le brouillon de bon de commande ET, depuis le 09/09/2026,
-- la composition d'une fusion de demandes d'achat (clés `_fusion` /
-- `_regroupee_dans`). L'écart n'est pas bloquant — le serveur réessaie en
-- sérialisant — mais l'aligner évite un aller-retour inutile à chaque écriture.
--
-- ⚠ AUCUNE DONNÉE N'EST PERDUE. La conversion est tentée dans un bloc
--    `exception` : si UNE seule valeur n'est pas du JSON valide, PostgreSQL
--    annule l'ALTER (sous-transaction), la colonne reste en `text`, la migration
--    se termine SANS erreur et l'application continue de fonctionner — elle sait
--    écrire dans les deux types (helper `majDaDraft`, src/index.tsx).
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  type_actuel text;
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

  -- Tentative de conversion. En cas d'echec, PostgreSQL annule l'ALTER et on
  -- poursuit : c'est volontaire, mieux vaut un schema en retard qu'une migration
  -- qui bloque. Aucune ligne n'est modifiee ni supprimee dans ce cas.
  begin
    execute 'alter table public.demandes_achat '
         || 'alter column bc_draft type jsonb '
         || 'using (nullif(btrim(bc_draft::text), '''')::jsonb)';
    raise notice '001 : bc_draft converti en jsonb, valeurs existantes conservees.';
  exception when others then
    raise notice '001 : conversion abandonnee (%) — la colonne reste en text, aucune donnee touchee.', sqlerrm;
  end;
end
$$;
