# Module Commercial

<!-- auto:entete -->
- **Route** : `/commercial/service` · **Fichier source** : `src/commercial.tsx`
- **Accès (RBAC)** : écriture — commercial · lecture — be, production, qualité, expéditions, stock
<!-- /auto -->

## Mission
<!-- auto:mission -->
Relation client, demandes de travaux, offres, commandes, avoirs & commandes prioritaires.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `site` — Demandes site internet
- `dt` — DT / Demande travaux
- `offre` — Offre (PRC1-D5)
- `avoirs` — Avoirs & Commandes P
- `clients` — Liste clients
- `cmd` — Commandes validées
- `dashboard` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`clients` · `dt` · `offre` · `commandes` · `commande` · `commandes-p` · `interlocuteurs` · `credit(s)`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`clients` · `demandes_travaux` · `offres` · `commandes` · `commandes_prioritaires` · `credits` · `interlocuteurs` · `demandes_site`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Avoir = prix de vente × pièces (AV-AAAA-XX) ; Commande P = coût de revient (CMDP-AAAA-XX) → « Lancer la production ». DT sans NADCAP/AS9100 ; datalists réf/plan/client.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/commercial.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
