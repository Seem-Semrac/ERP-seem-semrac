-- ══════════════════════════════════════════════════════════════
-- DUERP — recalage des familles de risque sur la brochure INRS ED 840 (oct. 2023)
-- Renomme dans hse_risques.famille les libellés recalés, pour préserver la
-- présélection du <select> des lignes DUER déjà saisies.
-- Idempotent. À exécuter sur Supabase (SQL Editor).
-- ══════════════════════════════════════════════════════════════

update hse_risques set famille = '3. Circulation interne / engins'          where famille = '3. Circulation / engins';
update hse_risques set famille = '4. Accidents routiers en mission'         where famille = '4. Accidents routiers';
update hse_risques set famille = '5. Charge physique de travail'            where famille = '5. Charge physique de travail / TMS';
update hse_risques set famille = '7. Produits chimiques, emissions, dechets' where famille = '7. Produits chimiques, dechets';
update hse_risques set famille = '13. Incendie / explosion'                 where famille = '13. Incendies / explosions / ATEX';
update hse_risques set famille = '15. Ambiances lumineuses'                 where famille = '15. Ambiances lumineuses / eclairement';

-- ⚠ Anomalie d'import héritée (À VÉRIFIER, hors périmètre ED 840) : d'anciens risques biologiques
--   ont pu être rangés sous le code 22 « Coupures » (bug FAM_F1/FAM_F2 de import_duerp.py).
--   Décommenter APRÈS contrôle si des lignes biologiques doivent revenir en famille 8 :
-- update hse_risques set famille = '8. Agents biologiques', famille_code = 8
--   where famille = '22. Coupures' and lower(coalesce(danger,'')||' '||coalesce(risque,'')) like '%biolog%';
