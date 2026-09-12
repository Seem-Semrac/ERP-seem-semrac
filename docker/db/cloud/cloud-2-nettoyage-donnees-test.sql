-- ═══════════════════════════════════════════════════════════════════════════
-- NETTOYAGE DES DONNÉES DE TEST — Supabase CLOUD, dans le SQL Editor.
--
-- ⚠ CE FICHIER SUPPRIME DES LIGNES. Contrairement aux migrations, il est
--   DESTRUCTIF par nature — c'est son but : retirer les jeux d'essai créés
--   pendant le développement, tous préfixés « TEST ».
--
-- MODE D'EMPLOI : exécutez d'abord l'ÉTAPE 1 seule, regardez ce qu'elle liste.
-- Si, et seulement si, tout ce qui s'affiche est bien du test, exécutez l'ÉTAPE 2.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ÉTAPE 1 — REGARDER (aucune suppression) ────────────────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
-- GARDE-FOU : ce script est pour la base CLOUD (Supabase Studio du projet en ligne).
-- La base Docker / la VM appliquent docker/db/migrations/ TOUTES SEULES (erp-docker.sh maj) :
-- les y rejouer à la main échoue de façon déroutante (« must be owner of table … », parce que
-- le lanceur de migrations crée ses objets sous le rôle supabase_admin, pas sous le vôtre).
-- Signature d'une base Docker / VM : la table _erp_migrations, que le cloud n'a pas.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = '_erp_migrations') then
    raise exception 'MAUVAISE BASE : vous etes sur la base Docker / VM (table _erp_migrations presente). Ce script ne sert QUE pour la base cloud. Sur une VM, lancez plutot : ~/erp/docker/scripts/erp-docker.sh maj';
  end if;
end
$$;

select 'bon de commande' as type, id, num_bc as numero, fournisseur_nom, statut, date_bc
  from public.bons_de_commande
 where id like 'BC-TESTARB%' or id in ('BC-2026-001', 'BC-TESTP3', '-TEST-REF-SONDE-BC')
union all
select 'demande achat', id, id, demandeur, statut, date_da
  from public.demandes_achat
 where id in ('DA-TEST-DELPROBE-1', '-TEST-FUSION-PROBE', 'DA-TESTCASC3-MATTESTXZ99-M')
 order by 1, 2;

-- Ce qui est rattaché à ces bons de commande et partira avec eux :
select 'facture proforma' as type, id, num_facture, statut, montant_ttc::text
  from public.factures_fournisseur
 where id like 'FF-BC-TESTARB%' or id in ('FF-BC-2026-001', 'FF-BC-TESTP3')
union all
select 'bon de livraison', id, coalesce(to_jsonb(l) ->> 'num_bl', id), statut, bc_id
  from public.bons_de_livraison l
 where bc_id like 'BC-TESTARB%' or bc_id in ('BC-2026-001', 'BC-TESTP3')
 order by 1, 2;


-- ── ÉTAPE 2 — SUPPRIMER (à n'exécuter qu'après avoir lu l'étape 1) ─────────
-- L'ordre compte : on retire d'abord ce qui pointe vers les BC, puis les BC.
begin;

delete from public.factures_fournisseur
 where id like 'FF-BC-TESTARB%' or id in ('FF-BC-2026-001', 'FF-BC-TESTP3');

delete from public.bons_de_livraison
 where bc_id like 'BC-TESTARB%' or bc_id in ('BC-2026-001', 'BC-TESTP3');

delete from public.bons_de_commande
 where id like 'BC-TESTARB%' or id in ('BC-2026-001', 'BC-TESTP3', '-TEST-REF-SONDE-BC');

delete from public.demandes_achat
 where id in ('DA-TEST-DELPROBE-1', '-TEST-FUSION-PROBE', 'DA-TESTCASC3-MATTESTXZ99-M');

-- Relisez le compte de lignes affiché par chaque DELETE.
-- Si un chiffre vous surprend : ROLLBACK; au lieu de COMMIT;
commit;
