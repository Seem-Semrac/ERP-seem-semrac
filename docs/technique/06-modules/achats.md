# Module Achats

<!-- auto:entete -->
- **Route** : `/achats/service` · **Fichier source** : `src/achats.tsx`
- **Accès (RBAC)** : écriture — achats, stock · lecture — commercial, be, production, expéditions, maintenance
<!-- /auto -->

## Mission
<!-- auto:mission -->
Demandes de prix (RFQ), demandes d'achat, bons de commande, fournisseurs & sous-traitants.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `rfq` — Demandes de prix
- `da` — Demandes d'achat
- `fourn` — Fournisseurs / ST
- `scorecard` — Scorecard
- `dashboard` — Dashboard achats
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`achats` · `da` · `bc` · `fournisseur(s)` · `sous-traitant(s)` · `demandes-prix` · `catalogue-fournisseurs`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`fournisseurs` · `sous_traitants` · `demandes_prix` · `demandes_achat` · `bons_commande` · `factures_fournisseur`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
RFQ = source de vérité des prix → catalogue. BC n'écrit jamais le prix. Scorecard fournisseur/ST.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/achats.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
