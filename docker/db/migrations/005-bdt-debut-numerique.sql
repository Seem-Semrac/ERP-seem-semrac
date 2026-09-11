-- ═══════════════════════════════════════════════════════════════════════════
-- 005 · BDT : heure de début au quart d'heure (bons_de_travail.debut -> numeric)
--
-- Le planning dépose un BDT au quart d'heure (7,25 = 7 h 15). La colonne debut était
-- un ENTIER : PostgreSQL refusait « 7.25 » (invalid input syntax for type integer) et le
-- glisser-déposer échouait avec « Affectation échouée » dès qu'on ne visait pas une heure
-- pleine.
--
-- Élargissement entier -> décimal : aucune valeur n'est perdue ni modifiée.
-- Idempotente : ne fait rien si la colonne est déjà décimale, ou absente.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('public.bons_de_travail') is null then
    raise notice '005 : table bons_de_travail absente, ignoree.';
    return;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'bons_de_travail'
               and column_name = 'debut' and data_type in ('integer', 'smallint', 'bigint')) then
    alter table public.bons_de_travail alter column debut type numeric using debut::numeric;
    raise notice '005 : bons_de_travail.debut passe en numeric (quart d''heure).';
  else
    raise notice '005 : bons_de_travail.debut deja decimal ou absent, rien a faire.';
  end if;
end
$$;

notify pgrst, 'reload schema';
