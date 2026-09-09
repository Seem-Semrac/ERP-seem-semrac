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

**Traitement d'une DA → BC** : le champ *Fournisseur / ST* de la fenêtre de traitement est une **liste déroulante filtrée** sur la référence portée par la DA. Les fournisseurs qui référencent l'article au catalogue (`produits_fournisseurs`) sont regroupés en tête sous « Référencés pour \<article\> » ; tous les autres restent accessibles dans un second groupe, de sorte qu'aucune DA ne se retrouve bloquée si l'article n'est pas encore au catalogue. Une valeur déjà enregistrée mais absente du catalogue est conservée et signalée « hors catalogue ».

**Mode de règlement sur le BC** : même liste que les offres (`MODES_FACTURATION`, exportée depuis `src/commercial.tsx`), stockée dans `bons_de_commande.conditions_paiement`.

**Proforma sur un BC** — on paie *avant* que le fournisseur expédie :
1. à la création du BC, une **facture fournisseur** est émise (`FF-<id du BC>`, statut `a_valider`, écriture d'achat générée) et apparaît dans Comptabilité ;
2. le BC prend le statut **`attente_paiement`**, absent de `_bcEmise` (`src/expeditions.tsx:1425`) — il **ne figure donc pas** dans les réceptions à venir ;
3. au passage de la facture à `payee`, `libererBcProforma()` repasse le BC en `envoye`, qui rejoint alors les réceptions.

Le rattachement facture ↔ BC se lit dans l'identifiant `FF-<bcId>` **et** dans les notes : la table `factures_fournisseur` **n'a pas de colonne `bc_id`**.

**N° d'affaire** : repris de la DA, **modifiable** avec suggestions (`<datalist>` des affaires connues, hors références libres). Une demande libre peut ainsi être **rattachée à une affaire** au moment du traitement — la valeur saisie prime sur celle héritée de la DA. Sans affaire, `prochaineRefLibre()` attribue `LIBRE-001`, `LIBRE-002`… calculé sur les BC existants.

**Facture du fournisseur en pièce jointe** : un champ fichier (PDF ou image) dans le formulaire. Le document part en GED **après** la création du BC, sous la référence `BC:<id du BC>` et la catégorie `facture_fournisseur`. Il est ensuite **ouvrable depuis Comptabilité › Factures fournisseurs** : la route `/compta/service` remonte du numéro de facture (`FF-<bcId>`) au document, et affiche un bouton *Facture* pointant sur `/api/ged/file/:id`. Aucune colonne de liaison n'a été nécessaire.

La GED accepte désormais un **propriétaire générique** : le champ `ref` de `POST /api/ged/upload` (ex. `BC:BC-2026-002`) remplace `nomenclature_id`, et `GET /api/ged/ref/:ref` liste les documents rattachés. Le préfixe évite toute collision avec un identifiant de nomenclature.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/achats.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
