# Module OAS

<!-- auto:entete -->
- **Route** : `/oas/service` · **Fichier source** : `src/oas.tsx`
- **Accès (RBAC)** : écriture — oas · lecture — be, production, qualité, sécurité, stock, maintenance
<!-- /auto -->

## Mission
<!-- auto:mission -->
Traitement de surface : lots & balancelles, relevés eau, relevés périodiques des bains.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `0` — Lots & Balancelles
- `1` — Relevé consommation eau
- `2` — Relevés périodiques bains
- `3` — Dashboard OAS
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`oas` · `balancelle(s)` · `releve(s)`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`(relevés eau/bains, balancelles)`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Process « OAS » = porte de lot (soldage BDT précédent → OAS → BDT suivant). Un bain non conforme génère une NC.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/oas.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
