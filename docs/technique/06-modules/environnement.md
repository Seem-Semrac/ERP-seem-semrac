# Module Environnement (QSE — volet E)

- **Route** : `/environnement/service` · **Fichier source** : `src/environnement.tsx`
- **Accès (RBAC)** : service `environnement` (calqué sur `securite`) — écriture : qualité, OAS, direction · lecture : be, production, maintenance, RH

## Mission
Regroupe tout l'environnement (déplacé de Sécurité) : déchets & Trackdéchets, rejets/mesures (eau/air/bruit/énergie), ATEX, aspects & impacts (ISO 14001), RSE (ISO 26000), conformité environnementale (ICPE/DREAL), tableau de bord.

## Onglets
- `dechets` — Registre des déchets (BSDD / Trackdéchets)
- `rejets` — Rejets & mesures (eau / air / bruit / énergie) + relevés d'eau OAS
- `atex` — Zones ATEX (DRPCE)
- `aspects` — Aspects & impacts environnementaux (ISO 14001 §6.1.2, AES)
- `rse` — Indicateurs RSE (ISO 26000)
- `conformite` — Conformité environnementale (ICPE, ISO 14001 — filtrée depuis `hse_conformite`)
- `dashboard` — Tableau de bord (déchets, conso eau, rejets hors VLE, axe env SEIRICH, AES, alertes conformité, ATEX)

## API (familles de routes)
Réutilise **`/api/securite/*`** (aucune API dédiée) — les entités restent des tables `hse_*`. Le CRUD est enregistré via `hseCrud(...)` dans `src/index.tsx` (dont `aspects-impacts`, avec calcul serveur de la criticité + AES significatif si criticité ≥ 9).

## Tables principales
`hse_dechets` · `hse_mesures_env` · `hse_atex_zones` · `hse_rse_indicateurs` · `hse_conformite` (vue filtrée domaines env) · **`hse_aspects_impacts`** (nouvelle, ISO 14001)

## Points d'attention
- **Page autonome** : copies propres des helpers de rendu (dataTable/panelHeader/kpi) et du script client CRUD (secOpen/secSave/secDel/secShowTab/fldHtml), palette verte — **découplée** du moteur de Sécurité (`SEC_VD_MAP`, `fdsPdf`) pour ne pas le fragiliser. Réutilise l'API `/api/securite/*`.
- **`hse_aspects_impacts` est fail-soft** : si la table n'existe pas, l'onglet reste vide sans erreur. Schéma DDL à exécuter : `scripts_import/env_aspects_schema.sql` (Supabase + miroir Docker).
- **Conformité partagée** : `hse_conformite` est une table unique ; Environnement affiche les domaines `icpe/iso14001/rse/iso26000/atex`, Sécurité affiche le complément (SST). Une obligation créée depuis Environnement pointe vers la même API/table.
- **Liens** : axe Environnement de SEIRICH (lecture, depuis Sécurité › Chimie) ; relevés d'eau OAS ; audit thème J (Qualité) ; cartographie Plan / Bâtiment.

- **Onglet « Audit Conformité » aligné sur la Qualité (2026-08-24)** : **exactement les 4 sous-onglets standard** `Programme · Constats & plans d'action · Grilles · Référentiels`, rendus par `panelAudit(..., { domaine: 'environnement', nu: true })` — **plus aucun `extras`**. Les 4 écrans qui y étaient imbriqués (veille, parties intéressées, autodiagnostics ISO 14001 et ISO 26000/RSE) **ne sont pas des audits** : ils sont remontés au premier niveau. **Planning annuel COMMUN avec la Qualité**, filtré **ISO 14001**. Avant : deux barres empilées (celle du service + celle de l'audit) et un compteur de programme non filtré.
- ⚠ Mêmes deux bugs que Sécurité corrigés (wrapper `#qual-panel-audit` masqué hérité → `nu: true` ; `auditSub()` à liste figée → liste dynamique).

- **2026-08-24 — aplatissement** : 8 → **10 onglets**. `veille` (registre d'obligations) et `autodiag` (grilles ISO 14001 + ISO 26000 + indicateurs RSE, groupe `['autodiag-iso','autodiag-rse']`) deviennent des onglets de premier niveau ; **Parties intéressées** rejoint `aspects` (contexte ISO 14001 §4.2 / §6.1.2, groupe `['aspects','parties']`), l'onglet étant renommé « Aspects & parties ».


- **2026-08-24 — le service ne montre que les critères de SA norme (ISO 14001)** : mêmes correctifs qu'en Sécurité (chargement effectif des grilles, **Référentiels** réduits au thème **J** + grille ISO 14001). ⚠ **Le sous-onglet Grilles est vide** : aucune question de `audit_question` ne porte le thème **J** en base (67 questions réparties sur B, C, H et T1–T9). Ce n'est **pas un bug** — il manque la donnée. Créer une grille environnement pour qu'elle apparaisse.
---
> Fiche générée à la main (le service peut ne pas être repris par le générateur). Manuel : `docs/manuel/environnement.md`. Voir aussi `04-auth-rbac.md`, `06-modules/securite.md`, `07-api-reference.md`.
