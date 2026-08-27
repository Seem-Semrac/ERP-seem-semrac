# Module Maintenance

<!-- auto:entete -->
- **Route** : `/maintenance/service` · **Fichier source** : `src/maintenance_service.tsx`
- **Accès (RBAC)** : écriture — maintenance · lecture — achats, production, oas, sécurité, stock
<!-- /auto -->

## Mission
<!-- auto:mission -->
GMAO : interventions/OM, plan préventif, MTBF, fiche machine 360, pièces détachées.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `interventions` — Interventions / OM
- `preventif` — Plan Préventif
- `mtbf` — MTBF & Historique
- `fiche` — Fiche 360
- `pieces` — Pièces & PDR
- `dashboard` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`om` · `maintenance` · `piece(s)`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`ordres_maintenance` · `plans_preventif` · `pieces_detachees` · `machines`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Fiche Machine 360 (TCO + heures via gamme + Disponibilité/TRS). Préventif → OM. Deep-link depuis le plan bâtiment (#machine=<id>).
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/maintenance.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
