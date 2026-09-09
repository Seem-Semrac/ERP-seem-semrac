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

## Numérotation des BC et des BL — alignée sur l'affaire (09/09/2026)

`BC-YYYY-<affaire>-NN` · `BL-YYYY-<affaire>-NN`, même logique que `LOT-YYYY-<affaire>-ZZ` et `BDT-YYYY-<affaire>-ZZ-AA`. L'affaire se lit directement dans le numéro, et **le compteur repart à 01 par affaire et par année** : deux affaires ne se marchent plus dessus.

Générateur `nextAffaireId(prefix, affaire, ids)` dans `src/index.tsx`, appliqué aux points de création. Sans affaire, on retombe sur la référence `LIBRE-XXX` déjà attribuée par `prochaineRefLibre()`.

**Un BL de réception est adossé à SON bon de commande** (`nextBlPourBc`). Une affaire porte plusieurs commandes, et chaque commande plusieurs livraisons — les deux se lisent d'un coup d'œil :

```
BC-2026-0001-03            la 3ᵉ commande de l'affaire 0001
  └─ BL-2026-0001-03-01    sa 1ʳᵉ réception
  └─ BL-2026-0001-03-02    sa 2ᵉ réception (partielle)
BC-2026-0001-04            une autre commande de la même affaire
  └─ BL-2026-0001-04-01    ses réceptions repartent à 01
```

Repli : sans bon de commande identifiable, on retombe sur `BL-YYYY-<affaire>-NN`. C'est le cas des **BL clients** et des **retours client**, qui répondent à une commande CLIENT et non à un bon de commande fournisseur. Un BC à l'ancien format reste exploitable : `BC-2026-007` → `BL-2026-007-01`.

⚠ **Les numéros déjà attribués ne sont pas touchés** : l'ancien format `BC-YYYY-NNN` reste tel quel en base, seul le prochain numéro change de forme. Les deux formats coexistent sans se gêner — le générateur ne compte que les numéros du nouveau format, pour l'affaire concernée.

⚠ **Limite assumée** : supprimer la dernière commande d'une affaire libère son numéro, qui sera réattribué. Éliminer complètement ce cas demanderait une table de séquences (donc une migration) ; l'ancien compteur global avait le même défaut, mais à l'échelle de TOUTES les commandes.

## Demandes d'achat : modifier, retirer, fusionner (09/09/2026)

**Modifier** — `POST /api/achats/da/:id/editer`. Route **distincte** du `PATCH /api/achats/da/:id`, qui sert au brouillon de BC et force `statut='brouillon'`. L'édition ne touche ni au statut, ni à `genere_par_adt`, ni au `bc_draft`. Elle s'applique aux demandes **libres comme automatiques**, mais le **rattachement d'une demande automatique est verrouillé** : `num_affaire` et `cmd_ref` portent la porte « matière reçue » et le coût de l'affaire — les déplacer changerait silencieusement l'imputation de la dépense. La modale l'affiche en lecture seule et l'explique.

**Retirer** — `POST /api/achats/da/:id/masquer`. « Du front, pas de la DB » : la ligne est **masquée** (`visible=false`, `statut='supprimee'`), jamais supprimée — et de toute façon la clé anon **ne peut pas** faire de `DELETE` sur `demandes_achat` (RLS). Refusé sur une demande **automatique** (elle traduit un besoin matière réel issu d'une commande) et sur une demande déjà traitée.

> ⚠ **Prédicat unique `daMasquee(d)`** = `visible === false || statut === 'regroupee' || statut === 'supprimee'`. **Tout** lecteur de `demandes_achat` doit l'appliquer, sinon une demande retirée continue d'être comptée. Branché sur : la page Achats (`isMasquee`), `/achats/da-liste`, les tableaux de bord (`kpi.ts`), et surtout **`autoReappro`** — dont la déduplication par libellé aurait sinon gelé à vie le réapprovisionnement automatique de la référence concernée.

**Fusionner** — `POST /api/achats/da/fusionner` (`{ da_ids[], primary_id?, fournisseur? }`). La sélection est **manuelle** : cases à cocher dans la liste, puis une modale récapitule ce qui sera réuni avant de valider. Le serveur **recharge les demandes en base** (aucune confiance au client) et refuse : moins de deux demandes, une demande introuvable, retirée, déjà traitée ou déjà fusionnée.

- **Règle métier : un seul fournisseur.** Une fusion ne donne **qu'une commande**, donc qu'un fournisseur. Deux fournisseurs distincts → refus (409), annoncé dès la modale. Les demandes **sans** fournisseur héritent de l'unique fournisseur du lot ; si aucune n'en porte, la modale le demande.
- **Multi-affaires.** Quand les demandes viennent d'affaires différentes, la commande devient **commune** aux deux. ⚠ `num_affaire` reste **TOUJOURS scalaire** : c'est la clé d'égalité stricte de la porte matière et du calcul de coût — une valeur composite (« 0001 · 0002 ») gèlerait `matiere_ok` à `false` et ferait disparaître les BDT des **deux** affaires du planning. L'affaire porteuse reste dans `num_affaire` ; les autres voyagent dans les **lignes du bon de commande** (`lignes[].num_affaire`). `bcAffaires(bc)` réunit les deux, et la réception ouvre la porte matière de **chaque** affaire servie.
- **Réversible.** `POST /api/achats/da/:id/defusionner` rend leur autonomie aux demandes absorbées et restaure l'article d'origine de la porteuse. Refusé une fois le BC émis.
- **Aucune migration.** La composition vit dans `demandes_achat.bc_draft` (colonne **jsonb** — vérifié par sonde, le dump la déclarait `text`), sous les clés réservées `_fusion` (sur la porteuse) et `_regroupee_dans` (sur les absorbées). Le brouillon de BC est précisément l'endroit qui décrit ce que la demande va devenir une fois commandée.

L'ancienne route `POST /api/achats/da/regrouper` (regroupement **automatique** par fournisseur, sans choix) est conservée mais n'est plus câblée à aucun bouton.

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
