-- ═══════════════════════════════════════════════════════════════════════════
-- Préparations techniques : site et rattachement au lot — MIGRATION OPTIONNELLE
--
-- ⚠ RIEN N'EN DÉPEND. Depuis le 09/09/2026 la page Préparations techniques déduit
--   le site et le lot par jointure, et la goulotte de production s'appuie sur le
--   couple (cmd_ref, piece). Cette migration ne fait que FIGER ces deux valeurs à
--   la création, ce qui les rend insensibles à une nomenclature modifiée ou
--   supprimée plus tard. Sans elle, tout continue de fonctionner.
--
-- Appliquer via le SQL editor Supabase (ou la Management API avec le PAT), puis
-- reporter le même DDL dans docker/db/seed/schema.sql.
-- ═══════════════════════════════════════════════════════════════════════════

alter table preparations_techniques add column if not exists activite text;   -- 'Seem' | 'Semrac'
alter table preparations_techniques add column if not exists lot_ref  text;   -- LOT-YYYY-XXXX-ZZ
alter table preparations_techniques add column if not exists priorite text default 'normal';
create index if not exists idx_prep_lot      on preparations_techniques (lot_ref);
create index if not exists idx_prep_activite on preparations_techniques (activite);

-- Rétro-remplissage : le site vient de la nomenclature, le lot du couple (commande, pièce).
update preparations_techniques p
   set activite = coalesce(p.activite, n.entite)
  from nomenclatures n
 where p.activite is null
   and lower(trim(n.code_ref_produit)) = lower(trim(coalesce(p.code_ref_produit, p.piece)));

update preparations_techniques p
   set lot_ref = coalesce(p.lot_ref, l.id)
  from lots l
 where p.lot_ref is null
   and l.cmd_id = p.cmd_ref
   and lower(trim(l.piece)) = lower(trim(p.piece));

notify pgrst, 'reload schema';
