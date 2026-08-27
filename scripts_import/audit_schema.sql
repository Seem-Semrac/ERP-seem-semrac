-- ══════════════════════════════════════════════════════════════
-- MODULE AUDITS DE CONFORMITÉ (SMI QSE + SI) — schéma (2026-07-30)
--
-- Porte le classeur « Planning daudits.xlsx » dans l'ERP :
--   • audit_programme  = l'ORDONNANCEMENT annuel (audits processus + poste/flash
--                        + procédés spéciaux), mapping 1:1 des feuilles Excel.
--   • audit_grille     = bibliothèque de grilles réutilisables (les 4 grilles
--                        détaillées : contrôle final, soudure, emballage, informatique…).
--   • audit_question   = questions d'une grille, avec le RATTACHEMENT ERP :
--                        mode (auto/assiste/manuel) + sonde (source ERP auto-observée).
--   • fai              = enregistrement Premier Article EN 9102 (comble le seul
--                        trou structurel → rend le FAI auto-observable).
--
-- La table `audits` existante (audits de CERTIFICATION externe) N'EST PAS touchée.
-- La table `audit_conformite` existante (grille clause ISO) reste et sert à
-- persister les résultats d'auto-évaluation clause-par-clause.
--
-- CLÉS : id text GÉNÉRÉ CÔTÉ SERVEUR (jamais gen_random_uuid() — le miroir Docker
-- n'a pas le default). RLS anon all (posture assumée, cf. security-posture).
-- Idempotent. À exécuter avec un rôle habilité (PAT / service_role).
-- ══════════════════════════════════════════════════════════════

-- ── 1) audit_programme : l'ordonnancement (une ligne = une ligne Excel) ──
create table if not exists public.audit_programme (
  id                 text primary key,
  exercice           int,                    -- année du programme (ex 2026)
  type               text not null default 'process',  -- process | poste | flash | procede | client
  entite_auditee     text,                   -- processus / poste / procédé audité
  famille            text,                   -- PILOTAGE | REALISATION | SUPPORT (audits process)
  perimetre          text,                   -- ex « Usine »
  themes             text,                   -- CSV codes thèmes ('A,I,J,K' ou 'T1,T2,...')
  themes_transverses text,                   -- CSV thèmes transverses (feuille process)
  referentiels       text,                   -- CSV référentiels couverts ('9001,9100,45001,14001,27001')
  trimestre          int,                    -- 1..4 (déduit de date_cible sinon)
  date_cible         date,                   -- « à planifier avant »
  temps_estime_min   int,
  auditeur           text,
  auditeur_2         text,
  audite_principal   text,
  statut             text not null default 'a_planifier',  -- a_planifier|planifie|realise|rapport_envoye|retour_recu|cloture
  date_realisation   date,
  date_rapport       date,                   -- date d'envoi du rapport à l'audité
  date_retour_audite date,
  plan_action_solde  boolean not null default false,
  date_cloture       date,
  grille_id          text,                   -- FK molle → audit_grille
  rapport_url        text,
  reponses           jsonb,                  -- [{question_id, etat:'C'|'NC'|'AXE', preuve, nc_id}]
  constat            text,                   -- constat/observation terrain (flash)
  non_conformite     text,                   -- colonne Excel (texte libre historique)
  axe_amelioration   text,                   -- colonne Excel
  observations       text,
  created_at         timestamptz not null default now()
);
create index if not exists idx_audit_prog_exercice on public.audit_programme (exercice);
create index if not exists idx_audit_prog_cible    on public.audit_programme (date_cible);
create index if not exists idx_audit_prog_statut   on public.audit_programme (statut);

alter table public.audit_programme enable row level security;
drop policy if exists "audit_programme anon all" on public.audit_programme;
create policy "audit_programme anon all" on public.audit_programme for all to anon using (true) with check (true);

-- ── 2) audit_grille : bibliothèque de grilles réutilisables ──
create table if not exists public.audit_grille (
  id           text primary key,
  titre        text not null,
  cible        text not null default 'poste',   -- poste | process | procede
  referentiel  text,                             -- combine | 45001 | 27001 | 14001 | 9100 …
  version      int not null default 1,
  active       boolean not null default true,
  description  text,
  created_at   timestamptz not null default now()
);
alter table public.audit_grille enable row level security;
drop policy if exists "audit_grille anon all" on public.audit_grille;
create policy "audit_grille anon all" on public.audit_grille for all to anon using (true) with check (true);

-- ── 3) audit_question : questions d'une grille + rattachement ERP (mode + sonde) ──
create table if not exists public.audit_question (
  id              text primary key,
  grille_id       text not null,           -- → audit_grille (FK molle)
  ordre           int not null default 0,
  section         text,                    -- ex « T1 - Documentation au poste »
  theme_code      text,                    -- 'T1','A','I','K'…
  clause_ref      text,                    -- ex « EN 9100 §8.5.2 »
  libelle         text not null,           -- la question
  preuve_attendue text,
  mode            text not null default 'manuel',  -- auto | assiste | manuel
  sonde           text,                    -- clé de sonde ERP (ex 'ecme', 'certifications', 'duer', 'releves_bains'…)
  created_at      timestamptz not null default now()
);
create index if not exists idx_audit_q_grille on public.audit_question (grille_id);
alter table public.audit_question enable row level security;
drop policy if exists "audit_question anon all" on public.audit_question;
create policy "audit_question anon all" on public.audit_question for all to anon using (true) with check (true);

-- ── 4) fai : Premier Article / First Article Inspection EN 9102 ──
create table if not exists public.fai (
  id               text primary key,
  nomenclature_id  text,
  num_nom          text,                    -- réf pièce
  indice           text,                    -- indice de définition (plan) figé
  commande_ref     text,
  type             text default 'complet',  -- complet | partiel | delta
  statut           text not null default 'a_faire',  -- a_faire | en_cours | valide | refuse
  date_realisation date,
  realise_par      text,
  conforme         boolean,
  caracteristiques jsonb,                   -- ballooning (formulaire 3 EN 9102)
  rapport_url      text,
  observations     text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_fai_nom on public.fai (nomenclature_id);
alter table public.fai enable row level security;
drop policy if exists "fai anon all" on public.fai;
create policy "fai anon all" on public.fai for all to anon using (true) with check (true);

notify pgrst, 'reload schema';
