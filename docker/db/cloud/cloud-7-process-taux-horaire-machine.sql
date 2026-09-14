-- ═══════════════════════════════════════════════════════════════════════════
-- cloud-7 · Taux horaire MACHINE saisi à la main sur le PROCESS (process_atelier.taux_horaire_machine)
--           (équivalent CLOUD de la migration Docker 009)
--
-- À JOUER À LA MAIN dans Supabase Studio → SQL Editor, en une fois.
-- Additif : ajoute la colonne et sa contrainte (positif ou nul), puis recopie le coût horaire actuel de
-- leur machine (machines.cout_h) dans les process MACHINE — le coût de revient ne bouge donc pas le jour
-- où le script est joué. Rejouable sans dommage : la recopie n'a lieu QUE lorsque la colonne est créée
-- par ce script ; rejoué plus tard, il ne ré-alimente pas un taux vidé volontairement (« à saisir »).
-- Le message (NOTICE) affiché en fin d'exécution dit lequel des deux cas s'est produit. Aucune colonne n'est
-- retirée : machines.cout_h, postes.taux_horaire_manuel et machines_opex.taux_horaire restent en base,
-- l'application ne les lit ni ne les écrit plus.
--
-- Sans ce script, côté cloud : l'application lit encore le taux machine d'un process sur sa machine
-- (transition « transition_machine »), et la saisie d'un taux horaire machine sur un process est
-- REFUSÉE avec un message qui renvoie ici (le reste de la fiche process s'enregistre).
-- ═══════════════════════════════════════════════════════════════════════════

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

-- La recopie de départ n'est jouée QUE si la colonne vient d'être créée par ce script : une fois la colonne en
-- place, NULL signifie « taux à saisir » (éventuellement vidé volontairement) et ne doit plus être ré-alimenté par
-- machines.cout_h. Le script peut donc être rejoué sans réintroduire un ancien taux.
do $$
declare
  colonne_neuve boolean;
  nb integer := 0;
begin
  colonne_neuve := not exists (select 1 from information_schema.columns
                                where table_schema = 'public' and table_name = 'process_atelier'
                                  and column_name = 'taux_horaire_machine');
  if colonne_neuve then
    alter table public.process_atelier add column taux_horaire_machine numeric;   -- €/h HT ; null = à saisir
  end if;

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.process_atelier'::regclass
                    and conname = 'process_atelier_taux_horaire_machine_positif') then
    alter table public.process_atelier add constraint process_atelier_taux_horaire_machine_positif
      check (taux_horaire_machine is null or taux_horaire_machine >= 0);
  end if;

  if colonne_neuve then
    update public.process_atelier p
       set taux_horaire_machine = m.cout_h::text::numeric
      from public.machines m
     where m.id = p.machine_id
       and p.taux_horaire_machine is null
       and coalesce(p.est_oas, false) = false
       and coalesce(p.requiert_machine, nullif(p.machine_id, '') is not null) = true
       and m.cout_h is not null
       and m.cout_h::text ~ '^[0-9]+(\.[0-9]+)?$';
    get diagnostics nb = row_count;
    raise notice 'taux_horaire_machine cree : % process machine ont recu le cout horaire de leur machine', nb;
  else
    raise notice 'taux_horaire_machine deja present : recopie de depart NON rejouee (un taux vide reste a saisir)';
  end if;
end
$$;

notify pgrst, 'reload schema';
