-- ══════════════════════════════════════════════════════════════
-- RÉORG ATELIER — Machines CNC · Achats opérateur → OPEX machine → taux horaire (exercice) → CRU
-- Source de vérité DDL (cf. skill erp-db). À exécuter dans l'éditeur SQL Supabase.
-- Idempotent, non destructif (add column if not exists). Colonnes en liens SOUPLES (text, pas de FK dure)
-- pour rester tolérant à l'import ; écritures conditionnées « si fourni » côté appli (compat pré-migration).
-- Prérequis : la table `postes` doit exister (migration scripts_import/postes_schema.sql).
-- ══════════════════════════════════════════════════════════════

-- 1) Machines : marqueur CNC (les machines CNC portent des codes programme ; les non-CNC non)
alter table public.machines add column if not exists cnc boolean default false;

-- 2) Demandes d'achat : catégorie + rattachement machine/poste + opérateur (DA libre opérateur restreinte au poste)
alter table public.demandes_achat add column if not exists categorie   text;   -- 'machine' | 'matiere' | 'accessoire'
alter table public.demandes_achat add column if not exists machine_id  text;   -- si categorie='machine' : machine déclarée (→ OPEX)
alter table public.demandes_achat add column if not exists poste_id    text;   -- poste de l'opérateur (affectation du jour)
alter table public.demandes_achat add column if not exists operateur_id text;  -- opérateur demandeur (borne PIN)

-- 3) Bons de commande : mêmes champs, hérités de la DA à la validation (pour router le prix à la réception)
alter table public.bons_de_commande add column if not exists categorie  text;
alter table public.bons_de_commande add column if not exists machine_id text;
alter table public.bons_de_commande add column if not exists poste_id   text;
-- Marqueur d'idempotence : la greffe OPEX d'un BC machine ne doit se faire qu'UNE fois (anti double-clic / ré-réception).
-- Réclamé atomiquement (UPDATE ... WHERE opex_greffe is not true) à la première réception.
alter table public.bons_de_commande add column if not exists opex_greffe boolean default false;

-- 4) OPEX machine annuel (par machine × année d'exercice). La réception d'un BC 'machine' incrémente `achats_ht`
--    (colonne DÉDIÉE aux achats machine reçus) — SURTOUT PAS `cout_total_ht`, qui garde partout ailleurs (Maintenance,
--    Finances) le sens d'« OPEX annuel COMPLET » ; les mélanger casserait la non-régression du CRU.
--    Incrément du taux du poste = (Σ achats_ht des machines du poste, année civile) / (Σ capacité × 220).
--    `achats_ht` est NULL/0 par défaut ⇒ incrément 0 tant qu'aucun achat machine n'est reçu ⇒ CRU inchangé.
--    (La table machines_opex existe déjà : machine_id, annee, cout_total_ht, heures_productives, taux_horaire, notes.)
alter table public.machines_opex add column if not exists base_cout_h numeric;   -- coût/h de base (informatif)
alter table public.machines_opex add column if not exists achats_ht   numeric;   -- Σ achats machine reçus (BL) de l'exercice → incrément du taux poste → CRU
-- La greffe machine peut créer une ligne en ne renseignant QUE achats_ht : cout_total_ht doit donc pouvoir rester NULL
-- (sinon INSERT refusé, code 23502). Quand cout_total_ht est NULL, Maintenance/Finances retombent sur le théorique cout_h×capacité×220.
alter table public.machines_opex alter column cout_total_ht drop not null;
-- pas de contrainte UNIQUE(machine_id,annee) posée ici (l'appli fait l'upsert : lire la ligne machine+année, incrémenter sinon insérer)
create index if not exists idx_machines_opex_machine_annee on public.machines_opex(machine_id, annee);

-- RLS permissive sur machines_opex (posture assumée, identique au reste du projet — clé anon serveur-only).
-- INDISPENSABLE : sans policy INSERT/UPDATE, la greffe de l'achat machine à la réception (BL) est refusée (42501)
-- et l'OPEX poste → taux → CRU ne se met jamais à jour.
alter table public.machines_opex enable row level security;
drop policy if exists machines_opex_all on public.machines_opex;
create policy machines_opex_all on public.machines_opex for all using (true) with check (true);

-- 5) Override manuel du taux horaire d'un POSTE (Phase E). Si posé, prime EN ABSOLU sur le taux auto
--    (base + achats machine reçus / heures budgétées). À remettre à null au nouvel exercice pour re-baser sur l'auto.
--    Prérequis : la table `postes` doit exister (migration scripts_import/postes_schema.sql).
alter table public.postes add column if not exists taux_horaire_manuel numeric;

-- IMPORTANT : recharge le cache de schéma PostgREST
notify pgrst, 'reload schema';
