-- ═══════════════════════════════════════════════════════════════════════════
-- 011 · BDT : temps de RÉGLAGE stocké, durée d'avant découpe (bons_de_travail)
--
-- Demande du 14/09/2026 : « quand on découpe un BDT seul le temps variable est découpable, les temps
-- de réglages sont fixes, nous avons besoin de les faire qu'une seule fois » + « pouvoir revenir en
-- arrière » + « voir visuellement sur le BDT les temps de réglages et les temps de réalisation ».
--
-- Jusqu'ici le réglage était FONDU dans duree / temps_alloue dès la création du BDT : rien ne permettait
-- de le garder sur un seul morceau à la découpe, ni de l'afficher.
--
-- 1) temps_reglage numeric (heures) : NULL = inconnu ; réalisation = duree - temps_reglage.
--    Une famille découpée (racine + morceaux -Mk) ne le porte que sur UN bon (le morceau 1), 0 ailleurs.
-- 2) duree_avant_decoupe numeric (heures) : durée de la racine au moment de sa 1re découpe ; remise à
--    NULL quand la découpe est annulée (retour arrière exact).
-- 3) temps_machine_avant_decoupe numeric (heures) : idem pour temps_machine_alloue.
-- 4) Contrainte : temps_reglage positif ou nul. PAS de contrainte temps_reglage <= duree : elle casserait
--    les écritures en deux temps ; le contrôle est fait par l'application.
--
-- AUCUN remplissage ici : la formule du réglage vit en TypeScript (src/shared.ts). Les BDT existants se
-- complètent par la route POST /api/production/bdt/reglage/reconstituer (rapport, puis appliquer:true).
--
-- Additive et idempotente (add column if not exists, contrainte créée si absente).
-- Équivalent cloud : docker/db/cloud/cloud-9-bdt-temps-reglage.sql
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('public.bons_de_travail') is null then
    raise notice '011 : table bons_de_travail absente, ignoree.';
    return;
  end if;

  alter table public.bons_de_travail add column if not exists temps_reglage numeric;
  alter table public.bons_de_travail add column if not exists duree_avant_decoupe numeric;
  alter table public.bons_de_travail add column if not exists temps_machine_avant_decoupe numeric;

  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.bons_de_travail'::regclass
                    and conname = 'bons_de_travail_temps_reglage_positif') then
    alter table public.bons_de_travail add constraint bons_de_travail_temps_reglage_positif
      check (temps_reglage is null or temps_reglage >= 0);
  end if;

  comment on column public.bons_de_travail.temps_reglage is
    'Heures de reglage (fixe, fait une seule fois) comprises dans duree. NULL = inconnu. Realisation = duree - temps_reglage. Famille decoupee : porte par le morceau 1 seulement.';
  comment on column public.bons_de_travail.duree_avant_decoupe is
    'Duree de la racine avant sa 1re decoupe (retour arriere exact), NULL si jamais decoupee ou decoupe annulee.';
  comment on column public.bons_de_travail.temps_machine_avant_decoupe is
    'temps_machine_alloue de la racine avant sa 1re decoupe, NULL sinon.';

  raise notice '011 : bons_de_travail.temps_reglage, duree_avant_decoupe, temps_machine_avant_decoupe en place.';
end
$$;

notify pgrst, 'reload schema';
