-- DRPCE : critères additionnels des zones ATEX (Document Relatif à la Protection Contre les Explosions).
-- Fail-soft app : la colonne est écrite seulement si présente (prepare hseCrud). Exécuter sur Supabase cloud
-- (SQL Editor) pour activer la saisie en ligne ; la base Docker est mise à jour par ce même script.
alter table public.hse_atex_zones add column if not exists sources_inflammation text;
alter table public.hse_atex_zones add column if not exists mesures_protection text;
alter table public.hse_atex_zones add column if not exists evaluateur text;
notify pgrst, 'reload schema';
