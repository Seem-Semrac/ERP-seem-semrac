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

**Traitement d'une DA → BC — référence du matériel** : la fenêtre porte **deux champs distincts**, *Référence du matériel* (`#bc_reference`) et *Désignation* (`#bc_articles`).

Point de conception important : **`demandes_achat` ne possède aucune colonne `reference`**, et il n'en a pas été ajouté. La référence n'est pas une donnée que la demande transporte — sur les 7 générateurs de DA du dépôt, 4 ne produisent que du texte libre. C'est une donnée que **l'acheteur arrête au moment de commander**, au catalogue. Elle est donc saisie dans ce formulaire et voyage ensuite dans `bons_de_commande.lignes` (jsonb, déjà présente), jamais dans une colonne nouvelle.

- **Liste de choix** : `<datalist id="dl_bc_ref">` rendue **côté serveur** depuis `produits_fournisseurs`, dédupliquée par référence, chaque entrée libellée par sa désignation.
- **Pré-remplissage** (`achRefDepuisDA`) : brouillon → égalité stricte sur la référence → égalité stricte sur la désignation → **vide**. Aucune déduction hors catalogue : une référence proposée existe toujours. Quand elle vient de la désignation, l'interface l'annonce « déduite — à vérifier » ; la mention disparaît dès que l'acheteur saisit lui-même (`achRefSaisie`).
- **Fournisseurs** (`achFournStricte`) : **égalité stricte** sur `produits_fournisseurs.reference` (normalisée majuscules + espaces). Les porteurs sont groupés en tête sous « Référencés pour \<réf\> », **avec leur désignation catalogue** — indispensable, un même code peut désigner deux produits différents (cas réel : `510056` chez TTA et QUAKER). Un porteur unique est présélectionné.
- **Repli** : sans référence saisie, on retombe sur `achFournPourRef`, le rapprochement approximatif historique (inclusion bidirectionnelle sur référence **ou** désignation). Son optgroup est désormais libellé « Proches de … (rapprochement approximatif) » : il produit des faux positifs et ne doit pas se faire passer pour un référencement.
- Une valeur déjà enregistrée mais absente du catalogue est conservée et signalée « hors catalogue ». Le catalogue ne couvrant que les fournisseurs, un BC **sous-traitant** n'a jamais de porteur — le message le dit.
- **En aval** : `POST /api/achats/da/:id/soumettre` écrit `lignes: [{ article, reference, designation, qte, fournisseur }]`. La clé `article` est **conservée** (d'autres lecteurs de `lignes` ne connaissent qu'elle) et la colonne `articles` continue d'être écrite — la référence s'ajoute, elle ne remplace rien. Le **PDF du BC** porte une colonne *Référence* (tiret si absente) et la **réception** apparie l'entrée en stock sur `lignes[0].reference` avant de retomber sur le libellé libre.

⚠ **Ce que le catalogue permet réellement** (sondé le 09/09/2026) : 144 lignes, 143 références distinctes, 31 fournisseurs — **une seule** référence portée par deux fournisseurs, et c'est une anomalie de données, pas du multi-sourcing. Prix renseignés : 2/144 ; délais : 0/144. La liste « fournisseurs qui portent cette référence » renverra donc presque toujours **un seul** nom. Le formulaire ne pré-remplit volontairement **pas** le montant depuis le catalogue : ce serait un chiffre faux 99 fois sur 100.

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
