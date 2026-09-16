# Module Stocks

<!-- auto:entete -->
- **Route** : `/stock/service` · **Fichier source** : `src/stock_service.tsx`
- **Accès (RBAC)** : écriture — stock (achats, logistique) · lecture — —
<!-- /auto -->

## Mission
<!-- auto:mission -->
Stock temps réel, gestion, mouvements, alertes & réapprovisionnement.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `mes` — Rangement / Mise en stock
- `gestion` — Gestion du stock
- `rt` — Stock en temps réel
- `mvts` — Mouvements
- `alertes` — Alertes et Réappro.
- `dashboard` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`stock(s)` · `mouvement(s)` · `article(s)`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`stock` · `mouvements_stock` · `mises_en_stock` · `stock_types_objet` · `stock_zones` · `stock_emplacements_historique`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
⚠ table `stock` (singulier). Sortie matière consomme le stock et alimente l'OPEX machine. Lot F (15/09/2026) : le stock n'est crédité qu'au RANGEMENT (1er onglet « Rangement / Mise en stock », file `mises_en_stock`) — PV de réception, décision Qualité, excédent validé et entrée manuelle y ajoutent des lignes à ranger ; emplacement FIXE par référence (changement historisé dans Niveaux d'approvisionnement), types d'objet et zones modifiables, jamais supprimés ; toutes les écritures /api/stock/… exigent l'écriture Stock, revérifiée dans le handler ; base sans 013 / cloud-11 : l'onglet le dit et le PV entre le stock directement (avertissement).
<!-- /auto -->
## Ordre des onglets — Gestion du stock en 2ᵉ (16/09/2026)

Demande de l'utilisateur : « Gestion du stock » passe juste après « Rangement / Mise en stock », avant « Stock en temps
réel ». Ordre de la page : `mes` · `gestion` · `rt` · `mvts` · `alertes` · `dashboard`.

- Deux listes à garder **dans le même ordre** dans `src/stock_service.tsx` (`pageServiceStock`) : le tableau serveur
  `TABS` (boutons de la barre d'onglets) et la variable client `STK_TABS` (affichage des panneaux, restauration du hash).
- Rien d'autre ne bouge : l'onglet ouvert par défaut reste `mes` (hash absent ou inconnu), les hashes (`#gestion-entree`,
  `#gestion-sortie`, `#gestion-catalogue`, `#rt`…), les identifiants `stk-tab-*` / `stk-panel-*` utilisés par
  `scripts_doc/capture_screens.mjs`, les badges et les routes. Aucune migration.
- Le manifeste `scripts_doc/gen_module_fiches.mjs` suit le même ordre (bloc `auto:onglets` ci-dessus).

## Lot F — Rangement / Mise en stock, emplacement fixe, types et zones (15/09/2026)

> « Il va falloir créer un nouvel onglet qui sera la mise en stock, qui sera le premier onglet du stock, dans lequel
> quand on aura fini le PV de réception, ce qui a été validé conforme va directement, référence par référence, dans la
> liste des choses à rentrer dans le stock. Il faut avoir un bouton pour accepter l'entrée en stock avec la ref et le
> type d'objet […] pour chaque type une liste déroulante concernant la zone géographique […] chaque ref a son endroit
> défini […] quand la ref est ancienne et qu'on a déjà déterminé l'endroit il doit rester fixe, mais on veut quand même
> une option pour le changer à la main […] dans les stocks on veut pouvoir masquer les produits vides. »

Fichiers : règles pures `src/mise_en_stock.ts` (sans base ni DOM) ; lectures et écritures `src/queries.ts`
(`getMisesEnStock`, `getMiseEnStockStricte`, `createMiseEnStock`, `trouverMiseEnStock`, `majMiseEnStockSi`,
`getStockTypesObjet` / `createStockTypeObjet` / `majStockTypeObjet`, `getStockZones` / `createStockZone` /
`majStockZone`, `getHistoriqueEmplacements` / `createHistoriqueEmplacement`, `lireStockStricte` (paginée),
`lireTypesObjetStock`, `getStockArticleStricte`, `createStockArticleStricte`, `majStockSi`, `lireSignauxTypeObjet`,
`getCategoriesBcs`) ; routes `src/index.tsx` (bloc « STOCK · RANGEMENT / MISE EN STOCK ») ; page
`src/stock_service.tsx` (`panelMiseEnStock`, `panelGestion`). Base : migration **013** / `cloud-11` (voir
[03-base-de-donnees](../03-base-de-donnees.md), section Stock). Contrats : [07-api-reference](../07-api-reference.md),
bloc « Lot F ».

### Le principe : rien n'est crédité avant le rangement

La réception, le PV, la décision Qualité et la validation d'un excédent **n'écrivent plus le stock** : ils ajoutent des
lignes à la file `mises_en_stock` (statut `a_ranger`). Le stock n'est crédité, et la porte matière des BDT ne s'ouvre,
qu'au **rangement accepté** par une personne qui écrit en Stock.

| Origine (`origine`) | Qui ajoute la ligne | Clé d'idempotence (index uniques 013) |
|---|---|---|
| `pv` | `POST /api/expeditions/bc/:id/pv` : une ligne par ligne du BC dont `qte_a_ranger > 0` (hors achat machine et sous-traitance) | PV + ligne + origine **et** BL + ligne (une ligne d'une réception n'entre qu'une fois, quel que soit le n° de PV) |
| `decision_qualite` | `POST /api/qualite/quarantaine/:id/decision-fournisseur` : part acceptée, ligne par ligne du BC | quarantaine + ligne |
| `excedent_valide` | `POST /api/validations/:id/decision` (type `excedent_reception`, Accepter) | validation + ligne |
| `entree_manuelle` | `POST /api/stock/entree` (Gestion du stock › Entrée stock) | aucune (motif obligatoire) |

`ajouterAMettreEnStock(entrees)` (`src/index.tsx`, non exportée) → `{ ok, ids, deja, error, table_absente, refusees }` :
chaque entrée est validée par `normaliserEntreeFile` (origine connue, quantité > 0, référence ou désignation, clé
obligatoire selon l'origine) ; une ligne déjà présente pour la même clé revient dans `deja` (rien n'est recréé ; un
23505 sur ajout simultané est relu) ; une entrée refusée n'empêche pas les autres et sa position est rendue dans
`refusees` — les appelants ne listent **que** celles-là à ressaisir (relister les autres les ferait créditer deux fois).
`table_absente` : base sans 013, **rien** n'est ajouté, l'appelant retombe sur l'entrée directe. Les appelants n'ont
**pas** besoin du droit Stock (écriture Expéditions, Qualité ou Direction suffit).

### Onglet « Rangement / Mise en stock » (premier onglet, ouvert par défaut)

- Onglets de la page : `mes` Rangement / Mise en stock · `gestion` · `rt` · `mvts` · `alertes` · `dashboard` (ordre
  du 16/09/2026 : Gestion du stock en 2ᵉ). Badge
  `mes` = nombre de lignes à ranger (« ? » si la file est illisible). Onglet et sous-onglet sont écrits dans le hash
  (`history.replaceState`) et restaurés au chargement : `#mes`, `#mes-ajustement`, `#mes-types`, `#rt`,
  `#gestion-entree`, `#gestion-sortie`, `#gestion-catalogue`, `#mvts`…
- Sous-onglets (`stkSwitchMes`) : **À ranger** (défaut) · **Ajustement de stock** (déplacé depuis Gestion) · **Types &
  zones**.
- **À ranger** : une ligne par entrée de file, de la plus ancienne à la plus récente — Arrivée, Origine (pastille
  `libelleOrigine` : « PV-… · BC … · BL … · ligne n », « Décision Qualité », « Excédent validé », « Entrée manuelle » +
  motif + auteur), Référence, Désignation, Quantité (+ stock actuel de la référence), Affaire, Fournisseur, Type d'objet
  (proposé, avec sa source), Emplacement (cadenas = emplacement fixe de la référence ; sinon « à choisir · nouvelle
  référence / référence sans emplacement »), boutons **« Accepter l'entrée en stock »** et **Annuler** (motif). Dessous,
  « Derniers rangements et annulations » (40 dernières lignes rangées ou annulées ; triangle orange si une ligne rangée
  n'a pas de mouvement rattaché).
- **Type proposé** (`deduireTypeObjet`, jamais imposé, seulement parmi les types actifs) : type porté par la ligne →
  type de la référence en stock → famille « outillage » → catégorie puis famille du stock (INOX / ALU / ACIER / matière
  → Matière première…) → catégorie du BC → catalogue fournisseur (`produits_fournisseurs.categorie`) → registre chimique
  (`hse_produits_chimiques.ref_stock`) → catalogue EPI (`hse_epi_catalogue.ref_stock`) → nomenclature
  (`fournitures_nomenclature.categorie`) ; rien → « à choisir ».
- **Fenêtre d'acceptation** (`stkOuvrirRangement`) : référence (lecture ; saisie avec liste des références connues si la
  ligne n'en porte pas), quantité (lecture, pas de conversion d'unité), désignation, **Type d'objet*** (pré-rempli),
  puis le cadre d'emplacement (`stkMesMajEmplacement`, redessiné seulement si le type ou l'emplacement fixe change) :
  emplacement fixe verrouillé ; ou **Zone de rangement*** dans la liste des zones actives du type, avec le lien
  « Nouvelle zone pour ce type » (la liste est alors vidée et grisée, « Revenir à la liste ») ; ou, si le type n'a
  **aucune zone**, le champ « Nouvelle zone pour ce type » obligatoire (elle rejoint la liste — jamais de texte libre non
  référencé). Bouton **« Ranger en stock »** anti double-clic ; succès → notification durable (référence, quantité, zone,
  stock après, BDT débloqués ou manque matière) puis rechargement sur `#mes`.

### Accepter l'entrée en stock — déroulé serveur

`POST /api/stock/mise-en-stock/:id/accepter` `{type_objet?, emplacement?, nouvelle_zone?, reference?}` :

1. écriture Stock (`droitEcritureStock` → 403 `MSG_STOCK_RESERVE`) → ligne relue strictement (503 / 404 ; base sans 013
   → 409 `{table_absente}`) → types, zones et **tout le stock** relus strictement (503) ;
2. plusieurs articles avec la même référence (`lower(btrim)`) → 409 « régularisez ces doublons » ;
3. `validerRangement` contre les données relues : ligne plus `a_ranger` → 409 ; type absent ou désactivé → 400
   `type_objet` ; référence avec emplacement fixe et zone différente → 409 `MSG_EMPLACEMENT_FIXE` ; nouvelle référence
   sans zone → 400 `emplacement` ; type sans zone et pas de nouvelle zone → 400 `nouvelle_zone` ; zone hors liste → 400 ;
   nouvelle zone qui existe désactivée → 409 ;
4. nouvelle zone créée **avant** de ranger (`cree_par`) ; 23505 → relue (désactivée → 409) ;
5. **réservation conditionnelle** `a_ranger → range` (`majMiseEnStockSi`) : deux clics simultanés → un seul passe
   (409 pour l'autre) ;
6. article : **créé** pour une nouvelle référence (`type_objet`, `categorie` = code du type, `emplacement`, `unite`,
   `stock_actuel 0`, `actif`) — 23505 → relu, la règle de l'emplacement fixe s'applique ; sinon **complété**
   (type, emplacement, unité seulement s'ils sont vides ; l'emplacement conditionnellement sur sa valeur lue). Une
   référence qui porte déjà un autre type le **garde** (avertissement : le changer dans Niveaux d'approvisionnement) ;
7. première affectation d'emplacement **historisée aussitôt** (`avant null`, motif « Première mise en stock »,
   `mise_en_stock_id`) — elle reste fixe même si la suite échoue ;
8. crédit : anti-doublon sur le motif « Mise en stock <id> » (`mouvementEntreeExiste`, 503 si illisible) ; mise à jour
   **conditionnelle** de `stock_actuel` sur la valeur lue (4 essais, puis 409), `derniere_entree`,
   `dernier_mouvement` ; mouvement `entree` (`stock_id`, `reference`, `quantite_avant/apres`, `categorie` = type,
   `bc_id`, `operateur`, `mise_en_stock_id` — index unique) ;
9. mouvement refusé → crédit **défait** conditionnellement et ligne **rendue** `a_ranger` avec sa référence, son type et
   son emplacement d'origine (23505 = déjà créditée par ailleurs → 409) ; si la remise en état échoue, l'erreur le dit ;
10. `stock_id` et `mouvement_id` reportés sur la ligne ; porte matière évaluée (ci-dessous).

Réponse : `{ok, ligne_id, stock_id, reference, type_objet, emplacement, emplacement_fixe, zone_creee, quantite, unite,
mouvement_id, stock_avant, stock_apres, bdt_debloques, manque_matiere, avertissements}`.

### Annuler, entrée manuelle, sortie, ajustement

- **Annuler** (`POST /api/stock/mise-en-stock/:id/annuler` `{motif ≥ 3}`) : seulement une ligne `a_ranger` (409 sinon),
  transition conditionnelle vers `annule` (`annule_le`, `annule_par`, `annule_motif`), rien n'est crédité ; la porte
  matière est réévaluée (la dernière ligne d'un BC contrôlé annulée, plus aucun rangement ne l'aurait fait).
- **Entrée manuelle** (`POST /api/stock/entree`) : `validerEntreeManuelle` — référence obligatoire (existante ou
  nouvelle, 120 caractères), quantité > 0, motif ≥ 3, type facultatif mais actif ; ajoute une ligne `entree_manuelle` à la
  file, **ne crédite rien**. Formulaire Gestion › Entrée stock (`ent_ref` avec liste des références, désignation / unité /
  type repris d'une référence connue).
- **Sortie** (`POST /api/stock/sortie`) : `validerSortie` — quantité > 0, motif ≥ 3, **refus 409 au-delà du stock**.
  Imputation **relue, jamais crue du client** : BDT saisi relu (inconnu → 400 `bdt_id`, 503 si illisible), lot déduit du
  BDT (BDT d'un autre lot ou d'une autre affaire → 400), affaire sans BDT vérifiée (`affaireExisteStricte`, commande ou
  BDT ; inconnue → 400 `num_affaire`) — avertissement si la sortie n'est pas valorisable (pas de lot). Mise à jour
  conditionnelle du stock (4 essais), mouvement `sortie` (`bdt_id`, `lot_id`, motif + « · affaire X ») ; mouvement
  refusé → stock rétabli. Motifs de l'écran : Consommation production, Rebut / casse, Retour fournisseur, Transfert
  inter-atelier, Autre (précision obligatoire) ; confirmation `appConfirm`.
- **Ajustement d'inventaire** (`POST /api/stock/ajustement` `{stock_id, nouvelle_quantite, motif}`) : `validerAjustement`
  — quantité **constatée** ≥ 0, motif obligatoire, écart nul refusé ; mouvement `ajustement` dont `quantite` est
  l'**écart signé**, motif « Ajustement d'inventaire : … » ; même mise à jour conditionnelle et remise en état.
  Sous-onglet Rangement › Ajustement de stock : formulaire à gauche, « Derniers ajustements » (écart, avant → après,
  par) à droite.

### Types d'objet, zones, emplacement fixe

- **Types** (`/api/stock/types-objet`) : `POST {libelle, code?, ordre?}` — code dérivé du libellé (`codeDepuisLibelle`),
  doublon de code ou de libellé → 409 ; `PATCH /:code {libelle?, ordre?, actif?}`. Jamais de suppression : un type se
  désactive (il ne se propose plus, les références qui le portent le gardent).
- **Zones** (`/api/stock/zones`) : `GET ?type_objet=` ; `POST {type_objet, zone, ordre?}` (type actif obligatoire,
  80 caractères ; zone existante → rendue avec `existante: true` ; existante désactivée → 409) ; `PATCH /:id {zone?,
  ordre?, actif?}` — **une zone qui est l'emplacement de références ne se renomme pas** (409 : créer la nouvelle,
  déplacer les références, désactiver l'ancienne).
- **Niveaux d'approvisionnement** (ex « Catalogue & seuils », Gestion du stock) : colonnes **Type d'objet** et
  **Emplacement** éditables en ligne, bouton historique. `PATCH /api/stock/:id/emplacement {type_objet?, emplacement?,
  motif?}` → `validerChangementEmplacement` : un type ne se vide pas ; la zone doit appartenir aux zones actives du type
  (choisir le type d'abord) ; `emplacement: ''` retire l'emplacement ; « Rien à modifier » → 400 ; mise à jour
  **conditionnelle** sur le type et l'emplacement lus (409 si modifiés par ailleurs) ; changement d'emplacement
  **historisé** (`avant`, `apres`, `motif`, `par`) ; avertissement si le nouvel type ne contient pas l'emplacement actuel.
  L'écran demande confirmation avec motif facultatif (`appMotif`). `GET /api/stock/:id/emplacement/historique` (200
  dernières lignes) alimente la fenêtre « Historique des emplacements ». Un emplacement antérieur au lot (ex. `A1-01`)
  s'affiche « (hors liste) » et reste l'emplacement fixe.

### Porte matière : elle s'ouvre au rangement

`ouvrirPorteMatiere(bc)` rend désormais `EtatPorteMatiere {debloques, erreur, ouverte, manqueNonComble, raison}` et
n'ouvre `matiere_ok` des BDT d'une affaire que si **tous** ses BC matière (hors sous-traitance et machine) sont
`controle` / `cloture`, **aucune ligne n'est à ranger** pour ces BC (`bcsAvecLignesARanger`) et aucun manque n'est
laissé sans remplacement. Lectures **strictes** (BC, BDT, quarantaines, file) : une panne ⇒ porte **non évaluée**
(avertissement), jamais « matière OK » par ignorance. Un BC de reliquat (`bc_parent_id`) ne compte pas comme rachat ; une
quarantaine de compensation `aucune` (excédent refusé) n'est pas un manque. `evaluerPorteMatiere` pousse l'avertissement ;
`porteApresFile(ligne)` cible le BC de la ligne s'il est contrôlé, sinon l'affaire d'une entrée manuelle.

Appels : rangement accepté, annulation d'une ligne, décision Qualité quand le BC devient contrôlé sans manque. Le PV ne
l'appelle **que** dans le repli sans la file (crédit direct complet).

### Ce qui compte la quantité « à ranger »

`quantitesARangerParRef()` → `{parRef, panne}` (file absente ⇒ `{}` sans panne). Ajoutée au stock rangé par :
`cascadeDAManques` (acceptation d'offre ; en panne, les DA sont créées quand même avec le demandeur « Acceptation offre
(stock à ranger non vérifié) »), `POST /api/commandes/:id/generer-da` (503 en panne ; « stock suffisant (N dispo dont M à
ranger) »), `autoReappro` à l'affichage de la page Stock (**pas** de réappro auto si la file est en panne),
`POST /api/direction/scan-alertes` (une référence en attente de rangement n'est pas une rupture ; en panne :
`ruptures_non_evaluees`), stocks critiques du cockpit Direction, `kpi.ts stock()` ruptures et « sous le mini »
(`DashboardData.misesEnStockARanger`, chargé avec l'extra `stock`). La **valorisation** reste celle du stock rangé.

### Autres changements de la page

- **Stock en temps réel** : « Ajouter article » ouvre Gestion › Entrée stock (l'ancienne fenêtre « Ajouter un article
  au catalogue », qui n'enregistrait rien, est supprimée — une référence naît au rangement) ; flèches Entrée / Sortie →
  formulaires pré-remplis ; emplacement affiché sous la référence ; case **« Masquer les produits vides »**
  (`stock_actuel <= 0`, cochée par défaut, mémorisée par poste dans `localStorage.stkMasquerVides`, partagée avec
  Niveaux d'approvisionnement) et compteur « N référence(s) vide(s) masquée(s) ».
- **Gestion du stock** : sous-onglets Entrée stock · Sortie stock · Niveaux d'approvisionnement (l'ajustement est parti
  dans Rangement).
- **Mouvements** : origines « Mise en stock · BC … » (`mise_en_stock_id`), « Ajustement d'inventaire », « Réception
  BC … » (`bc_id`, entrées d'avant le lot F).
- **Lecteurs** : boutons d'écriture grisés (`peutEcrire` = `peutEcrireService(user, 'stock')`).
- **Pannes** : « File illisible » (jamais « Rien à ranger »), badge « ? », rangement et administration désactivés si
  types ou zones sont illisibles ; base sans 013 : bandeau « jouez cloud-11 ».
- Données : `pageServiceStock(arts, mvts, fournisseurs, dbMes?: DonneesMiseEnStock)` ; projections `STK_ARTS` (+
  `quantite`, `emplacement`, `type_objet`), `STK_TYPES`, `STK_ZONES`, `STK_FILE` ; délégation d'événements
  (`data-act`, `data-act-change`) ; tout texte venu de la base échappé (`stkEsc`). `ArticleStock` gagne `type_objet`,
  `actif` ; nouveaux types `MiseEnStock`, `StockTypeObjet`, `StockZone`, `StockEmplacementHistorique` (`src/types.ts`).
- `notifDurable(type, icon, msgÉchappé, durée)` (`src/shared.ts`) : notification réaffichée après `softReload` (même
  page, 30 s au plus) — utilisée par le rangement, le PV, la décision Qualité et la Direction.

### Base sans 013 (cloud avant `cloud-11`)

Onglet Rangement : bandeau rouge, file vide, routes d'écriture → 409 `{table_absente, error: MSG_CLOUD11}`. Colonnes Type
et Emplacement grisées. Le PV de réception et la décision Qualité créditent **directement** le stock ligne par ligne
(`crediterLignesRepli` : article trouvé par référence exacte puis désignation exacte, motif « Réception BC … · BL … ·
ligne n · PV p » ou « · quarantaine q », idempotent) avec un avertissement, et la porte matière suit la règle d'avant
(ouverte seulement si tout est crédité).

### Limites connues et choix à valider

- **Aucune zone n'est amorcée** : les listes de zones par type restent à fournir par l'utilisateur. Les 20 emplacements
  existants (`A1-01`…`D1-05`, références `STK-*`) ne sont dans aucune zone (« hors liste ») et restent l'emplacement fixe
  de ces références.
- « Masquer les produits vides » coché par défaut : sur une base où toutes les références sont à 0 (Docker : 402), les
  onglets Stock en temps réel et Niveaux d'approvisionnement paraissent vides — le compteur l'explique.
- Choix : une référence créée au rangement reçoit `categorie` = code du type ; un type choisi au rangement différent
  de celui de la référence ne change pas la référence ; une zone utilisée ne se renomme pas.
- Pas de conversion d'unité ni de fractionnement d'une ligne au rangement (annuler puis ressaisir en entrée manuelle).
- La porte matière est aussi évaluée à l'**annulation** d'une ligne (elle peut s'ouvrir alors que la ligne annulée n'a
  jamais été rangée) et au rangement d'une entrée manuelle rattachée à une affaire ; une entrée manuelle sans affaire
  n'ouvre jamais de porte.
- Une sortie saisie avec une affaire mais sans BDT n'est pas valorisée dans le coût matière (avertissement).
- `getMouvementsStock` reste limité aux 200 derniers mouvements (onglet Mouvements, derniers ajustements).

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/stock.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
