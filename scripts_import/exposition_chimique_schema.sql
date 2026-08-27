-- ══════════════════════════════════════════════════════════════
-- SEIRICH intermédiaire (Phase 2) — EXPOSITION par SITUATION DE TRAVAIL
-- Relie un produit chimique (hse_produits_chimiques.id) à une situation réelle
-- (unité de travail, tâche, procédé, fréquence, protections, volatilité).
-- Cotation SANTÉ = Danger(produit, Phase 1) × Exposition(situation), méthode
-- INRS ND 2233 / R 409 : score POTENTIEL + score RÉSIDUEL (Sinh).
--
-- Fail-soft app : sans cette table, getHseExpositions() renvoie [] (le sous-onglet
-- reste vide, aucune erreur) jusqu'à exécution de ce script.
-- À exécuter sur Supabase (SQL Editor) puis sur le miroir Docker si utilisé.
-- ══════════════════════════════════════════════════════════════

create table if not exists hse_exposition_chimique (
  id                    uuid primary key default gen_random_uuid(),
  produit_id            uuid references hse_produits_chimiques(id) on delete set null,
  produit_nom           text,                     -- dénormalisé (résilient : l'évaluation survit si le produit est supprimé)
  unite_travail         text,                     -- unité de travail (cohérent DUER / UT_CANONIQUES)
  zone                  text,                     -- zone / secteur atelier
  tache                 text,                     -- tâche exposante (dégraissage, pistolage, pesée…)
  procede               text,                     -- dispersif / ouvert / clos_ouvert / clos_permanent
  quantite_utilisee     numeric,                  -- quantité mise en œuvre par opération
  unite                 text,                     -- g / kg / t / mL / L
  frequence             text,                     -- occasionnelle / reguliere / quotidienne / permanente
  volatilite            text,                     -- gaz / liquide_volatil / liquide_moyen / liquide_peu / solide_poudre / solide_grains / solide_massif
  protection_collective text,                     -- aucune / ventilation / captage / vase_clos
  epi                   boolean default false,    -- EPI adapté porté (informatif — n'abaisse pas le niveau, R409)
  maintenance_ko        boolean default false,    -- protection collective non maintenue → dégradée d'une classe
  issu_transformation   boolean default false,    -- fumée soudage / poussière usinage → potentiel = fréquence seule
  non_utilise_1an       boolean default false,    -- produit non utilisé depuis ≥ 1 an → hors hiérarchisation
  rejet_milieu          boolean default false,    -- rejet possible vers l'environnement (axe Env, Phase 3)
  -- ── valeurs cotées (snapshot calculé côté serveur au create/update ; l'affichage recote LIVE) ──
  score_sante           integer,                  -- score résiduel santé (Sinh), triable
  niveau_sante          integer,                  -- 0 — · 1 Faible · 2 Moyen · 3 Élevé  (SEIRICH_NIVEAUX)
  score_incendie        integer,                  -- placeholder Phase 3
  score_env             integer,                  -- placeholder Phase 3
  significatif          boolean default false,    -- exposition significative (niveau ≥ 3 ou CMR)
  observations          text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- RLS : même posture assumée que les autres tables hse_* (clé anon serveur-only).
alter table hse_exposition_chimique enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='hse_exposition_chimique' and policyname='hse_exposition_chimique_all') then
    create policy hse_exposition_chimique_all on hse_exposition_chimique for all using (true) with check (true);
  end if;
end $$;

create index if not exists idx_hse_expo_produit on hse_exposition_chimique (produit_id);
create index if not exists idx_hse_expo_niveau  on hse_exposition_chimique (niveau_sante);
create index if not exists idx_hse_expo_signif  on hse_exposition_chimique (significatif);
