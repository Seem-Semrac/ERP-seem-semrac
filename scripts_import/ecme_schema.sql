-- ══════════════════════════════════════════════════════════════════════════
-- ECME — Catalogue des Équipements de Contrôle, Mesure & Essai (table de base).
--
-- La table `ecme` du CLOUD a été créée à l'origine via la Management API (import
-- QHSE). Ce fichier archive son DDL pour toute RÉINSTALLATION (ex. Supabase local
-- Docker), afin que le parc ECME + la fiche de vie soient reproductibles.
-- L'historique des vérifications est dans `ecme_verifications_schema.sql`.
--
-- Application : psql direct (Docker) ou Management API (cloud).
-- ══════════════════════════════════════════════════════════════════════════
create table if not exists public.ecme (
  id                       uuid primary key default gen_random_uuid(),
  code                     text,           -- identification (ex. « JP 1 »)
  designation              text,
  type                     text,           -- code famille (JP, PC, MI, CO, FO, TFD, BA… cf. ECME_TYPES)
  marque                   text,
  modele                   text,           -- modèle / référence fabricant (fiche de vie)
  numero_serie             text,
  num_commande             text,           -- N° de commande d'achat (fiche de vie)
  localisation             text,           -- emplacement / affectation
  activite                 text,           -- Seem | Semrac | both
  responsable              text,           -- responsable du matériel (fiche de vie)
  etendue_mesure           text,           -- capacité (ex. « 0-150 mm »)
  resolution               text,           -- précision / résolution
  incertitude              text,
  organisme                text,           -- laboratoire si étalonnage externe
  certificat_ref           text,
  periodicite_mois         integer,        -- périodicité de vérification
  date_dernier_etalonnage  date,
  date_prochain_etalonnage date,           -- = dernière + périodicité (recalé à chaque PV)
  date_mise_service        date,
  statut                   text,           -- indicatif ; le statut réel est recalculé live (ecmeStatutLive)
  reforme                  boolean not null default false, -- placé en indicateur / hors service définitif
  notes                    text,
  created_at               timestamptz not null default now()
);

alter table public.ecme enable row level security;
drop policy if exists ecme_all on public.ecme;
create policy ecme_all on public.ecme for all using (true) with check (true);

notify pgrst, 'reload schema';
