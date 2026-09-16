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
Process « OAS » = porte de lot (soldage BDT précédent → OAS → BDT suivant). Un bain non conforme génère une NC. Lot G (16/09/2026) : section « Lots à venir » (lots dont l’étape qui précède l’OAS est programmée ou reçue au planning, fin prévue en heures ouvrées de la cadence usine) ; les process de la machine OAS portent est_oas = true et l’activité « OAS » (migration 014 / cloud-12).
<!-- /auto -->

### Lots à venir et process OAS — lot G (16/09/2026)
- **Pourquoi** : aucune goulotte ni aucun BDT n'existe pour l'OAS (une étape OAS de la gamme ne crée pas de BDT) ; il
  fallait « savoir que le process d'après dans le planning est de l'OAS ». C'est l'étape qui **précède** l'OAS (BDT
  `oas_apres`) qui annonce le lot.
- **Section « Lots à venir »** (onglet Lots & Balancelles, au-dessus de « Lots arrivés à l'OAS », `#oasLotsAVenir`) :
  `GET /oas/service` calcule `lotsAVenirOas(allBdts, lots, oasSuivantParBdt(allBdts, nomenclatures, process), { ajouter:
  ajouterPourOp(cadence), nuits })` (`src/poste_oas.ts`) et le passe en 10ᵉ paramètre de `pageServiceOAS`. Une ligne par
  étape `oas_apres` (clé de lot + `seq`, morceaux `-Mk` compris) dont au moins un morceau est **posé ou reçu** et qui
  n'est pas entièrement soldée : Lot / affaire, Client, Pièce, Quantité (`lots.qte`), **Process OAS suivant** (étapes
  `est_oas` consécutives après le rang du BDT dans la nomenclature validée d'indice max de la pièce ; « OAS (process non
  retrouvé) » sinon), BDT précédent + opération, **Fin prévue** (la plus tardive des morceaux posés : début — début réel
  daté par `recu_le` pour un reçu — + durée en **heures ouvrées** de la cadence du site ; « aujourd'hui » ; « non
  calculable »), Statut du BDT (Programmé / Reçu dès qu'un morceau est reçu). Morceaux restés en goulotte : comptés à
  part, hors fin prévue. Tri par fin prévue. Cadence illisible (absente ou en panne) : grille 5 h–23 h, jamais bloquant.
- **Process OAS** : la migration 014 / `cloud-12` marque `est_oas = true`, `activite = 'OAS'` et le poste de la machine
  pour les process rattachés à une **machine d'activité OAS** (garde-fou : rien n'est modifié si l'un d'eux ne porte pas
  un nom de traitement de surface). Les types de bain de l'onglet Relevés restent les process d'activité OAS
  (`est_oas`, activité OAS ou poste OAS). Côté Production, le BDT qui précède porte le badge « → OAS : <process> »
  (`production.md`, section Lot G · G2).
- ⚠ **Existant, non corrigé** : `computeLotsOAS` (« Lots arrivés à l'OAS ») regroupe les BDT par `lot_id` seulement
  alors que la cascade n'écrit que `lot_ref` ; la page lit les BDT par `getBonsDeTravail` (erreurs avalées, 1 000 lignes
  au plus).
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/oas.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
