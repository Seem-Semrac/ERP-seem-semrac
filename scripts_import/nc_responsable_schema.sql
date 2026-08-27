-- Non-conformités : colonne 'responsable' (liste déroulante Responsable de la NC).
-- Fail-soft app : le champ est écrit seulement si la colonne existe (ncHasResponsable + strip).
-- Exécuter sur Supabase cloud (SQL Editor) pour activer la saisie en ligne ; Docker mis à jour par ce script.
alter table public.non_conformites add column if not exists responsable text;
notify pgrst, 'reload schema';
