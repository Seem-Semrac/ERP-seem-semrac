-- ══════════════════════════════════════════════════════════════
-- CONFORMITÉ — côté CLOUD (à jouer dans Supabase Studio → SQL Editor)
-- 2026-08-25
--
-- 7 colonnes existent dans le schéma local mais PAS dans la base cloud.
-- Elles ne sont pas supprimées côté local : le code en a besoin, et l'une
-- d'elles cache un BUG DE PRODUCTION ACTIF.
--
-- ⚠ BUG CORRIGÉ PAR CE SCRIPT — `lots.updated_at`
-- Dans src/queries.ts (cascade de soldage), quand TOUS les BDT d'un lot sont
-- soldés, le code exécute :
--     supabase.from('lots').update({ statut: 'termine', updated_at: … })
-- La colonne `updated_at` n'existant pas au cloud, PostgREST refuse la requête
-- entière (PGRST204). Le lot n'est donc JAMAIS marqué « terminé » en production,
-- et l'erreur passe inaperçue car le retour n'est pas contrôlé.
-- Vérifié le 25/08/2026 par sonde PATCH sur un id inexistant : HTTP 400.
--
-- Toutes les colonnes sont NULLABLES : aucun effet sur les données existantes.
-- Idempotent : rejouable sans risque.
-- ══════════════════════════════════════════════════════════════

alter table public.lots             add column if not exists updated_at    text;
alter table public.bons_de_travail  add column if not exists operateur_nom text;
alter table public.mouvements_stock add column if not exists bc_id         text;
alter table public.mouvements_stock add column if not exists reference     text;
alter table public.pieces_rechange  add column if not exists nom           text;
alter table public.pieces_rechange  add column if not exists machine_nom   text;
alter table public.pieces_rechange  add column if not exists stock         numeric;

-- PostgREST met son schéma en cache : sans ce signal, les colonnes restent
-- invisibles de l'API pendant quelques minutes.
notify pgrst, 'reload schema';

-- ─── Contrôle après exécution ─────────────────────────────────
-- Doit renvoyer 7 lignes :
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (table_name, column_name) in (
    ('lots','updated_at'), ('bons_de_travail','operateur_nom'),
    ('mouvements_stock','bc_id'), ('mouvements_stock','reference'),
    ('pieces_rechange','nom'), ('pieces_rechange','machine_nom'), ('pieces_rechange','stock')
  )
order by table_name, column_name;
