# Module Direction

<!-- auto:entete -->
- **Route** : `/direction/service` · **Fichier source** : `src/direction_service.tsx`
- **Accès (RBAC)** : écriture — ALL (perm all) · lecture — ALL
<!-- /auto -->

## Mission
<!-- auto:mission -->
Cockpit : à valider, jalons critiques, par affaire, pilotage KPIs, budget, santé des données.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `avalider` — À valider
- `jalons` — Jalons critiques
- `affaire` — Par affaire
- `pilotage` — Pilotage
- `budget` — Budget
- `sante` — Santé des données
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`direction` · `validations` · `kpi-objectifs`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`validations` · `kpi_objectifs` · `affaires`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
File de validation générique (décision réservée Direction). Moteur d'alertes → validations (scan-alertes). Santé des données (DICT). Fiches 360.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/direction.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
