# Module Qualité

<!-- auto:entete -->
- **Route** : `/qualite/service` · **Fichier source** : `src/qualite.tsx`
- **Accès (RBAC)** : écriture — qualité, sécurité · lecture — be, production, oas, expéditions, stock, maintenance
<!-- /auto -->

## Mission
<!-- auto:mission -->
Contrôle, non-conformités, 8D, libération de lots, capabilité, dérogations, périssables.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `pv` — PV de Contrôle
- `nc` — Non-Conformités
- `8d` — Rapports 8D
- `liberation` — Libération Lots
- `plan-controle` — Plan de contrôle
- `audit` — Audit Conformité
- `capabilite` — Étude de capabilité
- `ecme` — Contrôle des ECME
- `perissables` — Produits Périssables
- `derogations` — Dérogations
- `referentiels` — Référentiels
- `dashboard` — Dashboard Qualité
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`qualite` · `controles` · `non-conformites` · `rapports-8d` · `quarantaine`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`non_conformites` · `pv_controles` · `quarantaines` · `rapports_8d` · `derogations` · `plans_controle` · `controles_cotes` · `ecme` · `produits_perissables`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
NC « client » → bouton « Retour » → avoir / commande P. Porte qualité : BL bloqués (409) si quarantaine/NC bloquante. Capabilité via écart réduit → Cp/Cpk.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/qualite.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
