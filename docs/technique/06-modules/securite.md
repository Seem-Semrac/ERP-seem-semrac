# Module Sécurité (HSE/RSE)

<!-- auto:entete -->
- **Route** : `/securite/service` · **Fichier source** : `src/securite.tsx`
- **Accès (RBAC)** : écriture — qualité (+ sécurité via qualité) · lecture — be, production, oas, maintenance, RH
<!-- /auto -->

## Mission
Santé-Sécurité au travail : DUER, accidents, EPI, risque chimique (FDS + SEIRICH), VGP, formations, conformité SST.
> **L'environnement a migré** vers le service dédié `Environnement` (`docs/technique/06-modules/environnement.md`) : déchets, rejets, ATEX, ISO 14001, RSE ne sont plus dans Sécurité.

## Onglets
- `duer` — DUER / Risques
- `evenements` — Événements
- `epi` — EPI
- `chimie` — Chimie / FDS (+ sous-onglets Risque chimique SEIRICH et **Exposition par situation de travail** — cotation ND 2233/R 409 sur **3 axes** Santé/Incendie/Environnement, ATEX, matrice produits × unités de travail, **bouton « → Action »**, **rapport PDF** de marque, **export SEIRICH** `/api/export/seirich.xlsx`) + **fiche produit 360** `/securite/chimique/:id` (danger + SEIRICH + FDS + péremption + stock + actions, jointures souples via `getHseChimiqueDetail`)
- `controles` — Contrôles & prévention (VGP, formations, plans de prévention)
- `conformite` — Conformité (domaines SST uniquement ; env filtré vers Environnement)
- `referentiels` — Référentiels
- `dashboard` — Tableau de bord

## API (familles de routes)
<!-- auto:api -->
`securite`
<!-- /auto -->
## Tables principales
`hse_risques` · `hse_incidents` · `hse_epi*` · `hse_produits_chimiques` · **`hse_exposition_chimique`** (SEIRICH Phase 2, fail-soft) · `hse_verifications` · `hse_formations` · `hse_conformite`
> Les tables environnement (`hse_dechets`, `hse_mesures_env`, `hse_atex_zones`, `hse_rse_indicateurs`, `hse_aspects_impacts`) sont désormais pilotées par le **service Environnement** (mêmes tables, CRUD partagé `/api/securite/*`).

## Points d'attention
Matrice EPI × zone éditable. Export FDS PDF par produit. CRUD générique hseCrud. **SEIRICH** : moteur `computeRisqueChimique` (Phase 1, `qref.ts`) + `computeExpositionSante` (Phase 2, ND 2233/R 409, cotation potentiel + résiduel) ; cotation **indicative**. `hse_exposition_chimique` **fail-soft** (schéma `scripts_import/exposition_chimique_schema.sql` à exécuter).

- **Onglet « Audit Conformité » aligné sur la Qualité (2026-08-24)** : **exactement les 4 sous-onglets standard** `Programme · Constats & plans d'action · Grilles · Référentiels`, rendus par `panelAudit(..., { domaine: 'securite', nu: true })` — **plus aucun `extras`**. La **veille réglementaire** est devenue un **onglet de premier niveau** (`veille`) : un registre d'obligations n'est pas un audit, et l'imbriquer obligeait à deviner où il se trouvait. Le **planning annuel est COMMUN avec la Qualité** (table `audit_programme`), filtré sur le référentiel **ISO 45001** ; ajout de ligne, exercice, reconduction et calendrier identiques.
- ⚠ Deux bugs corrigés à cette occasion : (1) `panelAudit` enveloppait son rendu dans `#qual-panel-audit` (`display:none`, piloté par `qualShowTab`) — hérité par Sécurité/Environnement, il rendait le **planning et le bouton « Nouvelle ligne » invisibles à jamais** → option `nu: true` ; (2) `auditSub()` itérait sur une liste **figée** de 4 onglets → les onglets du domaine ne s'ouvraient pas (liste désormais construite depuis le DOM).

- **2026-08-24 — aplatissement** : 8 → **9 onglets** (ajout `veille`). `TABS`, `TAB_BADGE`, `SEC_GROUPS` et l'assemblage des panneaux mis à jour ; `pVeille = panelWrap('veille', …)`. Onglet Audit renommé « Audit Conformité » (même libellé que la Qualité).


- **2026-08-24 — le service ne montre que les critères de SA norme (ISO 45001)** : la route chargeait `getAuditProgramme()` mais **ni `getAuditGrilles()` ni `getAuditQuestions()`** → `panelAudit` recevait `[]` et `[]`, donc le sous-onglet **Grilles était structurellement vide**. Corrigé. Le sous-onglet **Référentiels** n'affiche plus que le thème **I**, les thèmes terrain **T5/T7/T8/T9** et la grille de conformité **ISO 45001** (avant : les 5 normes du SMI, ouvert par défaut sur ISO 9001). ⚠ Le filtre des grilles porte sur le **thème des questions**, PAS sur `audit_grille.referentiel` — celui-ci vaut `"combine"` pour 4 grilles sur 5 et ne discrimine rien. Chaque grille reste affichée **entière** (cohérence avec le PDF vierge imprimable) et porte un compteur « N question(s) ISO 45001 ». Moteur : `DOMAINE_NORME` + `_codesDomaine` dans `panelAudit` (`src/qualite.tsx`).
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/securite.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
