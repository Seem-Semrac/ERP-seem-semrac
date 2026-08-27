-- ══════════════════════════════════════════════════════════════════════════
-- ECME — Fiche de vie enrichie + historique des vérifications (PV de vérification)
-- Source métier : documents réels SEEM-SEMRAC (Fiche de vie matériel, PV de
-- vérification JP/MI/CO/FO/PC, Catalogue ECME PGE1-D1).
--
-- Objectif : l'onglet ECME devient conforme au process réel — contrôles
-- périodiques auto-actualisés (statut calculé live sur date_prochain_etalonnage)
-- + fiche de vie par ECME (journal d'opérations) alimentée par la saisie du
-- PV de vérification (justesse Ej / fidélité Ef / classe / décision / visa).
--
-- Application : Management API (PAT) sur le cloud ; psql direct sur le Docker.
-- Terminer par `notify pgrst, 'reload schema';` (sinon PostgREST ne voit rien).
-- ══════════════════════════════════════════════════════════════════════════

-- 1) Extension « fiche de vie » sur le catalogue ECME existant ---------------
alter table public.ecme add column if not exists responsable   text;   -- responsable du matériel (fiche de vie)
alter table public.ecme add column if not exists modele        text;   -- modèle / référence fabricant
alter table public.ecme add column if not exists num_commande  text;   -- N° de commande d'achat
alter table public.ecme add column if not exists reforme       boolean not null default false; -- placé en indicateur / hors service définitif

-- 2) Historique des vérifications = fiche de vie (journal) + PV de vérification
--    Pas de FK dure vers ecme (pattern « FK souple » du dépôt : ecme_id uuid +
--    ecme_code dénormalisé pour l'affichage et la robustesse d'insertion).
create table if not exists public.ecme_verifications (
  id              uuid primary key default gen_random_uuid(),
  ecme_id         uuid,                              -- référence souple vers ecme.id
  ecme_code       text,                              -- code ECME dénormalisé (ex. « JP 1 »)
  date_verif      date not null default current_date,
  intervenant     text,
  lieu            text default 'interne',            -- interne | externe (labo)
  famille         text,                              -- JP | PC | MI | CO | FO | autre (type ECME)
  interventions   text,                              -- interventions réalisées (texte libre)
  mesures         jsonb,                             -- grille métrologique brute (justesse/fidélité/becs) — permet de re-rendre le PV
  ej              numeric,                           -- erreur de justesse retenue (max |Ej|)
  ef              numeric,                           -- erreur de fidélité retenue
  classe_justesse text,                              -- classe lue sur le tableau des écarts (saisie opérateur)
  classe_fidelite text,
  classe_globale  text,                              -- classe retenue de l'appareil
  resultat        text,                              -- B (bon) | M (moyen) | HS (hors service)
  decision        text,                              -- conforme | non_conforme
  motif_nc        text,                              -- motif si non conforme
  visa            text,                              -- visa du responsable (validation O/N + initiales)
  a_refaire_avant date,                              -- prochaine échéance (report sur le catalogue)
  cale_etalon     text,                              -- étalon utilisé (cale / pige n°)
  pv_ref          text,                              -- référence du PV (ex. H2025089)
  indice          text,                              -- indice du document PV
  certificat_ref  text,                              -- réf. certificat (étalonnage externe)
  organisme       text,                              -- laboratoire externe le cas échéant
  created_at      timestamptz not null default now()
);

create index if not exists idx_ecme_verif_ecme on public.ecme_verifications(ecme_id);
create index if not exists idx_ecme_verif_code on public.ecme_verifications(ecme_code);
create index if not exists idx_ecme_verif_date on public.ecme_verifications(date_verif desc);

-- RLS permissive (posture anon assumée, comme les autres tables applicatives)
alter table public.ecme_verifications enable row level security;
drop policy if exists ecme_verif_all on public.ecme_verifications;
create policy ecme_verif_all on public.ecme_verifications for all using (true) with check (true);

-- 3) Recharger le cache de schéma PostgREST
notify pgrst, 'reload schema';
