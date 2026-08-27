# Module Comptabilité

<!-- auto:entete -->
- **Route** : `/compta/service` · **Fichier source** : `src/compta_service.tsx + src/finances.tsx`
- **Accès (RBAC)** : écriture — compta (comptable) · lecture — —
<!-- /auto -->

## Mission
<!-- auto:mission -->
Facturation, grand livre, TVA & déclarations, balance & trésorerie, coûts & marges.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `0` — Facturation
- `1` — Grand Livre
- `2` — TVA & Déclarations
- `3` — Balance & Trésorerie
- `4` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`factures` · `factures-fournisseur` · `ecritures` · `compta`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`factures_client` · `factures_fournisseur` · `ecritures`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Écritures format FEC (export /api/compta/export-fec, réservé compta/direction). Marge brute + base 100. Pages /finances/* (taux, coûts) réservées compta.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/compta.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
