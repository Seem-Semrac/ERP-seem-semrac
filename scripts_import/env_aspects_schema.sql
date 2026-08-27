-- ══════════════════════════════════════════════════════════════
-- Service ENVIRONNEMENT — Analyse environnementale (ISO 14001 §6.1.2)
-- Table des ASPECTS & IMPACTS environnementaux.
-- Fail-soft côté app : si la table n'existe pas, getHseAspectsImpacts()
-- renvoie [] (l'onglet reste vide, sans erreur) jusqu'à exécution de ce script.
--
-- À exécuter sur le projet Supabase (SQL Editor / Management API, PAT requis)
-- puis sur le miroir Docker si utilisé pour la démo.
-- ══════════════════════════════════════════════════════════════

create table if not exists hse_aspects_impacts (
  id                uuid primary key default gen_random_uuid(),
  entite            text,                       -- Seem / Semrac
  activite          text,                       -- activité / processus (traitement de surface, usinage…)
  aspect            text,                       -- aspect environnemental (rejet aqueux, déchet dangereux, conso eau…)
  impact            text,                       -- impact sur l'environnement (pollution eau, épuisement ressource…)
  milieu            text,                       -- eau / air / sol / dechet / energie / bruit / ressource
  condition         text,                       -- normal / anormal / urgence
  gravite           integer,                    -- 1-4
  frequence         integer,                    -- 1-4
  maitrise          integer,                    -- 1-4
  criticite         integer,                    -- = gravite * frequence (calculé côté serveur)
  significatif      boolean default false,      -- Aspect Environnemental Significatif (AES)
  exigence          text,                       -- exigence légale / réglementaire associée
  maitrise_moyens   text,                       -- moyens de maîtrise existants
  action            text,                       -- action / objectif (programme environnemental)
  responsable       text,
  echeance          date,
  statut            text default 'a_traiter',   -- a_traiter / en_cours / maitrise
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- RLS : même posture assumée que les autres tables hse_* (accès via clé anon serveur-only).
alter table hse_aspects_impacts enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='hse_aspects_impacts' and policyname='hse_aspects_impacts_all') then
    create policy hse_aspects_impacts_all on hse_aspects_impacts for all using (true) with check (true);
  end if;
end $$;

create index if not exists idx_hse_aspects_significatif on hse_aspects_impacts (significatif);
create index if not exists idx_hse_aspects_activite on hse_aspects_impacts (activite);
