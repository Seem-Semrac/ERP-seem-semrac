-- ═══════════════════════════════════════════════════════════════════════════
-- APERÇU (lecture seule) — ce que les migrations 002 et 003 CHANGERAIENT.
--
-- Aucune écriture : que des SELECT. À lancer avant de mettre à jour, pour voir
-- exactement quelles lignes seraient renumérotées, et lesquelles ne bougent pas.
--
--   docker exec -i erp-db psql -U postgres -d postgres -f - < docker/db/apercu-renumerotation.sql
--   (ou : erp-docker.sh psql   puis coller le contenu)
--
-- Colonne « verdict » :
--   INCHANGE  → la ligne ne sera pas touchée
--   RENUMEROTE→ le numéro AFFICHÉ change ; l'identifiant technique, lui, ne bouge pas
--
-- ⚠ Lecture des sections 2 et 3 : elles dérivent du numéro du BC **tel qu'il est
--   aujourd'hui**. À l'exécution réelle, la migration 002 renumérote d'abord les BC,
--   donc BL et proforma suivront le numéro NOUVEAU (colonne « numero_apres » de la
--   section 1), pas celui affiché ici. Ce qui compte dans cet aperçu, c'est la colonne
--   « verdict » : quelles lignes bougent, et surtout lesquelles ne bougent pas.
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '=== 1. BONS DE COMMANDE ==='
with calc as (
  select b.id, b.num_bc as avant,
         coalesce(nullif(btrim(b.num_affaire), ''), nullif(btrim(b.affaire_id), ''), 'LIBRE') as aff,
         coalesce(nullif(left(coalesce(b.date_bc, b.created_at, ''), 4), ''), '2026')         as an,
         row_number() over (
           partition by coalesce(nullif(btrim(b.num_affaire), ''), nullif(btrim(b.affaire_id), ''), 'LIBRE'),
                        coalesce(nullif(left(coalesce(b.date_bc, b.created_at, ''), 4), ''), '2026')
           order by coalesce(b.date_bc, b.created_at, ''), b.id
         ) as rang
    from public.bons_de_commande b
)
select id as identifiant_technique, avant as numero_actuel,
       'BC-' || an || '-' || upper(regexp_replace(aff, '[^A-Za-z0-9-]', '', 'g')) || '-' || lpad(rang::text, 2, '0') as numero_apres,
       case when avant is not distinct from
                 ('BC-' || an || '-' || upper(regexp_replace(aff, '[^A-Za-z0-9-]', '', 'g')) || '-' || lpad(rang::text, 2, '0'))
            then 'INCHANGE' else 'RENUMEROTE' end as verdict
  from calc order by aff, rang;

\echo ''
\echo '=== 2. BONS DE LIVRAISON adosses a un bon de commande ==='
-- to_jsonb() : fonctionne meme si la colonne num_bl n'existe pas encore.
with calc as (
  select l.id, to_jsonb(l) ->> 'num_bl' as avant,
         replace(coalesce(nullif(btrim(bc.num_bc), ''), bc.id), 'BC-', '') as base,
         row_number() over (partition by l.bc_id order by coalesce(l.date_bl, l.created_at, ''), l.id) as rang
    from public.bons_de_livraison l
    join public.bons_de_commande bc on bc.id = l.bc_id
   where nullif(btrim(l.bc_id), '') is not null
)
select id as identifiant_technique, coalesce(avant, '(colonne absente)') as numero_actuel,
       'BL-' || base || '-' || lpad(rang::text, 2, '0') as numero_apres,
       case when avant is not distinct from ('BL-' || base || '-' || lpad(rang::text, 2, '0'))
            then 'INCHANGE' else 'RENUMEROTE' end as verdict
  from calc order by base, rang;

\echo ''
\echo '=== 3. FACTURES PROFORMA fournisseur ==='
-- Seuls les numeros encore AUTO-GENERES sont concernes. Un numero saisi par le
-- comptable (le vrai numero du fournisseur) ne correspond pas au motif : il apparait
-- ici en SAISIE MANUELLE - JAMAIS TOUCHEE.
select f.id as identifiant_technique, f.num_facture as numero_actuel,
       case when coalesce(f.num_facture, '') ~ '^(FOURN|ST)-[0-9]{4}-[0-9]+$'
            then 'PRO-' || regexp_replace(coalesce(nullif(btrim(bc.num_bc), ''), bc.id), '^BC-', '')
            else f.num_facture end as numero_apres,
       case when f.num_facture is not distinct from
                 ('PRO-' || regexp_replace(coalesce(nullif(btrim(bc.num_bc), ''), bc.id), '^BC-', ''))
              then 'INCHANGE (deja renumerote)'
            when coalesce(f.num_facture, '') !~ '^(FOURN|ST)-[0-9]{4}-[0-9]+$'
              then 'SAISIE MANUELLE - JAMAIS TOUCHEE'
            when f.num_facture is not distinct from
                 ('PRO-' || regexp_replace(coalesce(nullif(btrim(bc.num_bc), ''), bc.id), '^BC-', ''))
              then 'INCHANGE'
            else 'RENUMEROTE' end as verdict
  from public.factures_fournisseur f
  join public.bons_de_commande bc on f.id = 'FF-' || bc.id
 order by f.id;

\echo ''
\echo '=== 4. VOLUMETRIE — ces comptages doivent etre IDENTIQUES avant et apres ==='
select 'bons_de_commande'     as table_, count(*) from public.bons_de_commande
union all select 'bons_de_livraison',      count(*) from public.bons_de_livraison
union all select 'demandes_achat',         count(*) from public.demandes_achat
union all select 'factures_fournisseur',   count(*) from public.factures_fournisseur;
