# Module Stocks

<!-- auto:entete -->
- **Route** : `/stock/service` · **Fichier source** : `src/stock_service.tsx`
- **Accès (RBAC)** : écriture — stock (achats, logistique) · lecture — —
<!-- /auto -->

## Mission
<!-- auto:mission -->
Stock temps réel, gestion, mouvements, alertes & réapprovisionnement.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `rt` — Stock en temps réel
- `gestion` — Gestion du stock
- `mvts` — Mouvements
- `alertes` — Alertes et Réappro.
- `dashboard` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`stock(s)` · `mouvement(s)` · `article(s)`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`stock` · `mouvements_stock`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
⚠ table `stock` (singulier). Sortie matière consomme le stock et alimente l'OPEX machine.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/stock.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
