-- A JOUER UNE FOIS dans Supabase Studio > SQL Editor (base CLOUD uniquement).
-- Docker local et VM le font tout seuls via le conteneur erp-migrate.
-- Idempotent : relancable sans risque, ne reecrit que ce qui differe.
-- Ne touche QUE les numeros affiches. Les identifiants (id) restent intacts.

-- ═══════════════════════════════════════════════════════════════════════════
-- 002 · RENUMÉROTATION des bons de commande et des bons de livraison
--       existants, pour que TOUT LE FLUX D'UNE AFFAIRE porte son numéro.
--
--   BC-YYYY-<affaire>-NN        ·  BL-YYYY-<affaire>-<rang BC>-NN
--
-- Pourquoi : la nouvelle numérotation ne s'appliquait qu'aux documents CRÉÉS
-- ensuite. Une affaire 0001 gardait donc des BC « BC-2026-003 » — le flux était
-- renuméroté à moitié, ce qui ne sert à rien.
--
-- ⚠ CE QUI EST MODIFIÉ, ET CE QUI NE L'EST PAS :
--    · on écrit le NUMÉRO AFFICHÉ (`bons_de_commande.num_bc`, et une colonne
--      `num_bl` ajoutée aux bons de livraison) ;
--    · les IDENTIFIANTS TECHNIQUES (`id`) ne bougent PAS. Ce sont eux qui portent
--      tous les rattachements : `bons_de_livraison.bc_id`, la facture proforma
--      `FF-<id du BC>`, la pièce jointe GED `BC:<id>`, `demande_achat_id`,
--      les écritures comptables. Les renommer casserait ces liens en silence.
--    · l'ancien numéro reste donc lisible dans `id` : RIEN N'EST PERDU.
--
-- Idempotente : relancée, elle ne réécrit que ce qui diffère.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Colonne du numéro affiché des BL (les BC ont déjà `num_bc`) ─────────
alter table public.bons_de_livraison add column if not exists num_bl text;

-- ── 2. Bons de commande : un rang par (année, affaire) ─────────────────────
with calc as (
  select b.id,
         coalesce(nullif(btrim(b.num_affaire), ''), nullif(btrim(b.affaire_id), ''), 'LIBRE') as aff,
         coalesce(nullif(left(coalesce(b.date_bc, b.created_at, ''), 4), ''), '2026')         as an,
         row_number() over (
           partition by coalesce(nullif(btrim(b.num_affaire), ''), nullif(btrim(b.affaire_id), ''), 'LIBRE'),
                        coalesce(nullif(left(coalesce(b.date_bc, b.created_at, ''), 4), ''), '2026')
           order by coalesce(b.date_bc, b.created_at, ''), b.id
         ) as rang
    from public.bons_de_commande b
)
update public.bons_de_commande b
   set num_bc = 'BC-' || c.an || '-' || upper(regexp_replace(c.aff, '[^A-Za-z0-9-]', '', 'g'))
                || '-' || lpad(c.rang::text, 2, '0')
  from calc c
 where b.id = c.id
   and b.num_bc is distinct from ('BC-' || c.an || '-' || upper(regexp_replace(c.aff, '[^A-Za-z0-9-]', '', 'g'))
                                  || '-' || lpad(c.rang::text, 2, '0'));

-- ── 3. Bons de livraison de RÉCEPTION : adossés à leur bon de commande ─────
--     Le numéro du BC (déjà renuméroté ci-dessus) devient le préfixe du BL.
with calc as (
  select l.id,
         replace(bc.num_bc, 'BC-', '') as base,
         row_number() over (
           partition by l.bc_id
           order by coalesce(l.date_bl, l.created_at, ''), l.id
         ) as rang
    from public.bons_de_livraison l
    join public.bons_de_commande bc on bc.id = l.bc_id
   where nullif(btrim(l.bc_id), '') is not null
     and nullif(btrim(bc.num_bc), '') is not null
)
update public.bons_de_livraison l
   set num_bl = 'BL-' || c.base || '-' || lpad(c.rang::text, 2, '0')
  from calc c
 where l.id = c.id
   and l.num_bl is distinct from ('BL-' || c.base || '-' || lpad(c.rang::text, 2, '0'));

-- ── 4. Bons de livraison SANS bon de commande (BL clients, retours) ────────
--     Ils répondent à une commande CLIENT, pas à un BC : on les numérote par affaire.
with calc as (
  select l.id,
         coalesce(nullif(btrim(l.affaire_id), ''), nullif(btrim(l.cmd_id), ''), 'LIBRE') as aff,
         coalesce(nullif(left(coalesce(l.date_bl, l.created_at, ''), 4), ''), '2026')      as an,
         row_number() over (
           partition by coalesce(nullif(btrim(l.affaire_id), ''), nullif(btrim(l.cmd_id), ''), 'LIBRE'),
                        coalesce(nullif(left(coalesce(l.date_bl, l.created_at, ''), 4), ''), '2026')
           order by coalesce(l.date_bl, l.created_at, ''), l.id
         ) as rang
    from public.bons_de_livraison l
   where nullif(btrim(l.bc_id), '') is null
)
update public.bons_de_livraison l
   set num_bl = 'BL-' || c.an || '-' || upper(regexp_replace(c.aff, '[^A-Za-z0-9-]', '', 'g'))
                || '-' || lpad(c.rang::text, 2, '0')
  from calc c
 where l.id = c.id
   and l.num_bl is distinct from ('BL-' || c.an || '-' || upper(regexp_replace(c.aff, '[^A-Za-z0-9-]', '', 'g'))
                                  || '-' || lpad(c.rang::text, 2, '0'));

notify pgrst, 'reload schema';

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
