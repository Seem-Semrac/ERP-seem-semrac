-- A JOUER dans Supabase Studio > SQL Editor (base CLOUD uniquement).
-- Docker local et VM le font tout seuls via le conteneur erp-migrate (migration 004).
--
-- PAS URGENT : aucun code deploye n' ecrit encore ces colonnes (verifie : 0 occurrence
-- dans src/). Elles servent aux lots L2 a L4 de l' annulation, pas encore ecrits.
-- Purement additif et idempotent : vous pouvez le jouer quand vous voulez.

-- ═══════════════════════════════════════════════════════════════════════════
-- 004 · ANNULATION DE COMMANDE — colonnes de traçabilité (lot L0)
--
-- Une annulation engage : elle arrête une production, immobilise de la matière,
-- et déclenche une refacturation au client. Savoir QUI a annulé, QUAND et POURQUOI
-- n'est pas un confort — c'est ce qu'on cherchera le jour où quelqu'un contestera.
--
-- ⚠ CE FICHIER N'AJOUTE QUE DES COLONNES. Il ne modifie aucune donnée existante,
--    ne supprime rien, et ne pose aucune contrainte : les statuts de ce dépôt sont
--    des colonnes `text` libres (aucun CHECK nulle part — vérifié).
--    Les colonnes naissent NULL : une ligne jamais annulée reste indiscernable de
--    ce qu'elle était avant.
--
-- Idempotente : `add column if not exists`, relançable sans effet.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  t text;
  cibles text[] := array[
    'offres',
    'commandes',
    'lots',
    'bons_de_travail',
    'bons_sous_traitance',
    'demandes_achat',
    'bons_de_commande',
    'preparations_techniques'
  ];
  n int := 0;
begin
  foreach t in array cibles loop
    -- Table absente (schéma partiel, instance ancienne) : on passe, sans échouer.
    if to_regclass('public.' || t) is null then
      raise notice '004 : table % absente, ignoree.', t;
      continue;
    end if;
    execute format('alter table public.%I add column if not exists annule_le timestamptz', t);
    execute format('alter table public.%I add column if not exists annule_par text', t);
    execute format('alter table public.%I add column if not exists annule_motif text', t);
    -- Rattache la ligne à l'annulation qui l'a produite : une commande peut être
    -- annulée en plusieurs fois (annulation partielle, lot par lot).
    execute format('alter table public.%I add column if not exists annulation_ref text', t);
    n := n + 1;
  end loop;
  raise notice '004 : tracabilite d''annulation posee sur % table(s).', n;
end
$$;

-- La facture d'annulation doit se distinguer d'une facture de vente ordinaire :
-- elle n'a pas de BL, et son montant ne correspond à aucune livraison.
do $$
begin
  if to_regclass('public.factures_client') is null then
    raise notice '004 : factures_client absente, ignoree.';
    return;
  end if;
  alter table public.factures_client add column if not exists motif_annulation text;
  alter table public.factures_client add column if not exists annulation_ref text;
  raise notice '004 : factures_client marquee pour les factures d''annulation.';
end
$$;

notify pgrst, 'reload schema';
