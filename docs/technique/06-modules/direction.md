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

### Congés des fonctions support (14/09/2026, lot C)
`validerCongeSupport` appelle `POST /api/rh/conge/:id/valider` (`valide_par: 'Direction'`). Depuis la revue du
lot C, la décision est **conditionnelle** (409 si le congé n'est plus `demande` — double clic, autre écran)
et un effet raté (absences, BDT renvoyés au pool, solde) revient dans `warning`, affiché en notification
orange. Les congés des **opérateurs** se traitent aussi dans Production › Présence
(`/api/production/conge/:id/valider`). Détail : `06-modules/rh.md`.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/direction.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
