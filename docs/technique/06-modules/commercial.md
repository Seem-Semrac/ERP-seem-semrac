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

**Mode de règlement « Proforma »** : à l'acceptation de l'offre, la commande et les lots/BDT sont créés comme d'habitude, mais **aucune dépense n'est engagée** — ni préparation technique, ni demande d'achat. Une **facture proforma** est émise immédiatement (rattachée à la commande, sans BL, mode de paiement `Proforma`) et apparaît dans Comptabilité › Facturation. La cascade retenue ne se déclenche qu'au passage de cette facture au statut **payée** (`PATCH /api/factures/:id`), via `debloquerProforma()`. Les BDT restent hors planning entre-temps car ils naissent en `matiere_ok = false`.

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/commercial.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
