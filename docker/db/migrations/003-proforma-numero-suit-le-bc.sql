-- ═══════════════════════════════════════════════════════════════════════════
-- 003 · Le NUMÉRO des factures proforma fournisseur suit celui de son bon de
--       commande — donc l'affaire, comme le reste du flux.
--
--   affaire 0001 → BC-2026-0001-01 → proforma PRO-2026-0001-01
--
-- Pourquoi : la proforma était numérotée sur un compteur GLOBAL
-- (« FOURN-2026-0002 »), sans rapport avec l'affaire ni avec son bon de commande.
-- Dans une affaire 0001, la chaîne se lisait 0001 partout SAUF là.
--
-- ⚠ CE QUI EST MODIFIÉ, ET CE QUI NE L'EST PAS :
--    · seul le LIBELLÉ `num_facture` change ;
--    · l'identifiant `id` (`FF-<id du BC>`) ne bouge PAS : c'est lui qui porte le
--      rattachement au bon de commande et aux écritures comptables ;
--    · on ne touche QUE les numéros encore au format auto-généré
--      (FOURN-AAAA-NNNN / ST-AAAA-NNNN). Dès que le comptable a saisi le VRAI
--      numéro du fournisseur, il ne correspond plus à ce motif et reste intact.
--      C'est la garantie qu'aucune saisie humaine n'est écrasée.
--
-- Idempotente : relancée, elle ne réécrit que ce qui diffère.
-- ═══════════════════════════════════════════════════════════════════════════

update public.factures_fournisseur f
   set num_facture = 'PRO-' || regexp_replace(coalesce(nullif(btrim(bc.num_bc), ''), bc.id), '^BC-', '')
  from public.bons_de_commande bc
 where f.id = 'FF-' || bc.id
   -- Numéro encore auto-généré : jamais un numéro saisi par le comptable.
   and coalesce(f.num_facture, '') ~ '^(FOURN|ST)-[0-9]{4}-[0-9]+$'
   and f.num_facture is distinct from
       ('PRO-' || regexp_replace(coalesce(nullif(btrim(bc.num_bc), ''), bc.id), '^BC-', ''));

notify pgrst, 'reload schema';
