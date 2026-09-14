-- ═══════════════════════════════════════════════════════════════════════════
-- 009 · Taux horaire MACHINE saisi à la main sur le PROCESS (process_atelier.taux_horaire_machine)
--
-- Demande du 14/09/2026 : « dans les machines et process et postes de travail, seuls les process ont
-- un coût horaire […] le process machine porte le taux horaire machine uniquement, et le taux
-- horaire homme c'est son coût chargé dans RH ».
--
-- 1) Nouvelle colonne numeric, en €/h HT. NULL = « taux à saisir » (affiché comme tel, compté 0).
--    Contrainte : positif ou nul.
-- 2) Recopie de DÉPART, pour que le coût de revient ne bouge pas le jour de la mise à jour : un
--    process MACHINE (même règle que typeProcess dans src/shared.ts : pas OAS, requiert_machine vrai,
--    ou non renseigné avec une machine rattachée) reçoit le coût horaire actuel de sa machine
--    (machines.cout_h), s'il n'a pas déjà un taux. Garde regex : cout_h peut être du texte sur une
--    base née d'un miroir.
-- Les anciennes sources (machines.cout_h, postes.taux_horaire_manuel, machines_opex.taux_horaire)
-- RESTENT en base : elles ne sont simplement plus lues ni écrites par l'application.
--
-- Additive et rejouable sans dommage : la recopie de départ n'a lieu qu'au moment où la colonne est CRÉÉE.
-- Rejouée sur une base qui a déjà la colonne, elle ne fait rien — un taux vidé volontairement (« à saisir »)
-- n'est jamais ré-alimenté par machines.cout_h.
-- Équivalent cloud : docker/db/cloud/cloud-7-process-taux-horaire-machine.sql
-- ═══════════════════════════════════════════════════════════════════════════

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
