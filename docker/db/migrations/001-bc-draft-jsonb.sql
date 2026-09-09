-- ═══════════════════════════════════════════════════════════════════════════
-- 001 · demandes_achat.bc_draft : text → jsonb
--
-- Contexte : la colonne est jsonb sur la Supabase cloud mais text dans le dump
-- Docker. Elle porte le brouillon de bon de commande ET, depuis le 09/09/2026,
-- la composition d'une fusion de demandes d'achat (clés `_fusion` /
-- `_regroupee_dans`). L'écart n'est pas bloquant — le serveur réessaie en
-- sérialisant — mais l'aligner évite un aller-retour inutile à chaque écriture.
--
-- ⚠ AUCUNE DONNÉE N'EST PERDUE : la conversion relit chaque valeur existante.
--    Si une seule ligne contient du texte qui n'est pas du JSON valide, la
--    conversion est ABANDONNÉE proprement et la colonne reste en text — la
--    migration se termine sans erreur et l'application continue de fonctionner.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  type_actuel text;
  non_json    bigint;
begin
  select data_type into type_actuel
    from information_schema.columns
   where table_schema = 'public' and table_name = 'demandes_achat' and column_name = 'bc_draft';

  if type_actuel is null then
    raise notice '001 : colonne demandes_achat.bc_draft absente — rien à faire.';
    return;
  end if;

  if type_actuel = 'jsonb' then
    raise notice '001 : bc_draft est déjà en jsonb — rien à faire.';
    return;
  end if;

  -- Combien de valeurs NON vides ne sont pas du JSON valide ?
  select count(*) into non_json
    from public.demandes_achat
   where bc_draft is not null
     and btrim(bc_draft::text) <> ''
     and not (btrim(bc_draft::text) ~ '^\s*[\[{]');

  if non_json > 0 then
    raise notice '001 : % ligne(s) contiennent du texte non-JSON dans bc_draft — conversion ABANDONNÉE, la colonne reste en text (aucune donnée touchée).', non_json;
    return;
  end if;

  alter table public.demandes_achat
    alter column bc_draft type jsonb
    using (case
             when bc_draft is null or btrim(bc_draft::text) = '' then null
             else bc_draft::text::jsonb
           end);

  raise notice '001 : bc_draft converti en jsonb, valeurs existantes conservées.';
end $$;
