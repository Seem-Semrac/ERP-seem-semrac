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
NC « client » → bouton « Retour » → avoir / commande P. Porte qualité : BL bloqués (409) si quarantaine/NC bloquante. Capabilité via écart réduit → Cp/Cpk. QUARANTAINE : un lot issu d’une réception fournisseur (PV de contrôle non conforme) se tranche par « Décider » (POST /api/qualite/quarantaine/:id/decision-fournisseur) — renvoi au fournisseur, dérogation fournisseur ou entrée partielle (lot F : la part acceptée part dans Stock › Mise en stock, ligne par ligne du BC — répartition obligatoire quand le lot couvre plusieurs articles), compensé par un avoir (registre des Achats) ou un remplacement (le BC rouvre sa réception de la quantité non acceptée) ; la décision est réservée atomiquement (pas de double clic) et son motif est obligatoire. « Statuer » reste réservé aux quarantaines INTERNES et refuse un lot de réception (409).
<!-- /auto -->
## Lot reçu non conforme : la décision fournisseur (12/09/2026)

> « Pour la quarantaine quand c'est une NC fournisseur, une libération de lot, on doit choisir si on
> renvoie au fournisseur, si on fait une dérogation avec le fournisseur ou si on rentre en stock
> partiellement. »

Une quarantaine née d'un **PV de contrôle réception** (`pv_controle.type_controle = 'reception'`) n'est
pas un lot de production bloqué : derrière, il y a de la marchandise payée, un fournisseur, et de
l'argent. Elle se tranche par
`POST /api/qualite/quarantaine/:id/decision-fournisseur` — bouton **« Décider »**.

| Décision | Stock | Quarantaine | Suite |
|---|---|---|---|
| Renvoi au fournisseur | rien n'entre | `statut=rejete`, `issue=retour_fournisseur` | retour à expédier (Expéditions) |
| Dérogation fournisseur | tout le lot entre (lot F : part dans Stock › Mise en stock, crédité au rangement) | `statut=libere_derogation`, `issue=derogation_fournisseur` | réfaction facultative → avoir |
| Entrée partielle | la part acceptée entre (lot F : idem, répartie par ligne du BC) | `statut=libere`, `issue=entree_partielle` | le reste repart ou part au rebut (registre des déchets) |

**Compensation** (renvoi et entrée partielle) : `avoir` — inscrit dans `avoirs_fournisseurs`, montant
pré-rempli au prix unitaire du BC (`prixUnitaireBc`), corrigeable — ou `remplacement` : `qte_recue` du
BC est décrémentée de la quantité non acceptée et le BC repasse `recu_partiel`, en attente de
relivraison.

**Ce qui protège le circuit**
- La décision est **réservée atomiquement** avant tout effet : `majQuarantaineSi(id, …, { statut: 'en_cours' })`.
  Zéro ligne modifiée ⇒ 409 « déjà statué ». Un double clic ne peut ni créditer le stock deux fois,
  ni créer deux avoirs (index unique partiel sur `avoirs_fournisseurs.quarantaine_id`).
- Les effets sont idempotents (entrée en stock par motif) et **chaque échec est rendu** dans
  `avertissements` — jamais avalé.
- `motif` obligatoire (≥ 3 caractères), auteur **tiré de la session** (`auteurDe`), jamais du corps.
- Sans la migration 008 (`quarantaineDecisionDispo()` → faux), la route **refuse en 409** en nommant
  le script à jouer, plutôt que de décider sans rien tracer.
- Les anciennes voies sont fermées pour ces lots : `Statuer`, `/api/quarantaine/:id/liberer`,
  `/rejeter` et le hook de décision Direction renvoient le lot à la décision fournisseur — la branche
  « dérogation » de `Statuer` créait une dérogation **CLIENT** au nom du fournisseur.
- `recalculerStatutBc` : le BC devient `controle` quand **toutes** ses réceptions sont tranchées (PV
  conforme **ou** décision) ; la porte matière ne s'ouvre pas si une quantité est repartie **sans
  remplacement** (`matiereManquanteBc`) — il faut repasser commande, et la réponse le dit.

## PV de réception détaillé : ce qui arrive en Qualité (lot D, 14/09/2026)

Le PV de contrôle d'une réception fournisseur se remplit aux **Expéditions** (voir
[Expéditions](expeditions.md), section « Lot D ») ; la Qualité en reçoit les conséquences.

- **Qui signe** : seules les personnes ayant l'**écriture Expéditions** (direction, logistique, jeton
  `ecrire:expeditions`), choisies dans une liste et revérifiées par le serveur. ⚠ **Le rôle `qualite` ne peut
  plus faire de PV de réception** (lecture seule sur Expéditions) ; lui cocher `ecrire:expeditions` bascule sa
  fiche en mode jetons (cocher aussi `qualite`, `securite`… sinon il les perd).
- **La NC de réception est enfin renseignée** (`champsNcPV`, `src/pv_reception.ts`) :
  - `description` = observation générale, puis une ligne « Ligne n · réf · désignation : observation » par ligne
    du BC en « Non », puis « Certificat matière absent ou non conforme » le cas échéant, puis « Contrôleur : X » ;
  - `ref_article` / `designation` quand **une seule** ligne est en « Non » ;
  - `nb_pieces` = quantité du BL (repli sans ce nombre si la colonne est entière : 22P02 / 22003) ;
  - **`detecteur` = « Réception »** — une valeur de la liste du formulaire NC. Avant, le nom du contrôleur y était
    écrit : absent de la liste, il était **effacé** au premier ré-enregistrement de la NC (`qualEditNC` →
    `detecteur: null`) et le badge d'origine affichait « Manuel » au lieu de « Fournisseur ».
- **Quarantaine** : toujours créée, `motif` = même description (plusieurs lignes). La fenêtre « Décider » l'affiche
  avec ses retours à la ligne (`white-space: pre-line`) et la liste des quarantaines donne le motif complet au
  survol (`title`).
- **Origine du PV** (`deriverOriginePV`, lu dans `observations`) : préfixe « Contrôleur : X — » conservé ; un BC de
  sous-traitance commence par « Retour sous-traitant », d'où le badge « BL Sous-traitant ».
- **Détail consultable en base** : `pv_controle.detail` (jsonb v1 : instantané du BC et du BL, lignes avec réponse et
  observation, observation générale, gravité, certificat `{requis, confirme}`, contrôleur, saisi par) +
  `controleur_id`, `controleur_nom`, `saisi_par`, `certificat_matiere` (migration 012 / `cloud-10` ; sans elles, tout
  est en texte dans `observations`). L'onglet PV de Contrôle ne l'affiche pas encore.
- ~~**Décision fournisseur**~~ (**remplacé au lot F**, section ci-dessous : répartition par ligne, file Mise en stock) (`/api/qualite/quarantaine/:id/decision-fournisseur`) : pour un **BC à plusieurs
  articles**, l'entrée en stock se fait ligne par ligne et **seulement si toute la commande est acceptée** ; une
  entrée partielle n'est pas répartissable par article → avertissement « Stock non crédité » ou « Entrée en stock
  incomplète ». Le montant de l'avoir reste à 0 avec avertissement quand la quantité commandée du BC est vide.
- Valeurs `statut` / `decision` de `pv_controle` **inchangées** (contraintes CHECK du cloud) : `valide` / `libere`
  (conforme), `nc_ouverte` / `bloque` (non conforme).

## Lot F : NC par ligne, quarantaines par ligne, part acceptée → Stock › Mise en stock (15/09/2026)

Le PV de réception (Expéditions, section « Lot F ») change ce qui arrive en Qualité :

- **Une NC fournisseur par ligne du BC en écart** (plus une NC « Logistique - Certificats » si le certificat exigé
  manque) : `type_nc` « Fournisseur » (liste `NC_TYPE_OPTS`), `categorie` `quantitative` / `qualitative` / `quantitative
  et qualitative`, `type_defaut` « Logistique - Quantité » pour un écart purement quantitatif, sinon « À requalifier » (la
  Qualité précise la nature), `ref_article`, `designation`, `nb_pieces`, description détaillée, `detecteur`
  « Réception ». ⚠ `categorie` sert aussi à « administratif / production » (`ncCategorieKey`, `qualSaveNC`) : à la
  ré-édition, la catégorie est redemandée ; la nature reste en tête de la description.
- **Une quarantaine par ligne qualitative** (part prévue reçue, `ligne_idx`) et **une pour le certificat absent**
  (lignes sans observation) — un PV peut donc en créer plusieurs, ou **aucune** (écarts purement quantitatifs, suivis par
  leurs NC). `recalculerStatutBc` exige que **toutes** les quarantaines d'un BL soient décidées (et au moins le nombre
  annoncé par le PV) pour dire le BC « contrôlé ».
- **L'excédent n'est jamais en quarantaine** : il attend la validation de la Direction, « sous réserve Qualité » quand la
  ligne est qualitative ou le certificat absent (la Direction ne peut l'accepter qu'après la décision de la Qualité, et
  pas si tout le lot a été renvoyé). Un excédent refusé crée une quarantaine **déjà décidée** `QEXC-<id validation>`
  (`retour_fournisseur`, `rejete`, compensation `aucune`) qui apparaît aussi dans les listes de quarantaines.

### Décision fournisseur : la part acceptée part dans la file

`POST /api/qualite/quarantaine/:id/decision-fournisseur` — la part acceptée (dérogation = tout le lot, entrée partielle
= `qte_acceptee`) **n'entre plus en stock** : elle devient des lignes `decision_qualite` de la file Stock › Mise en stock
(une par ligne du BC couverte, `quarantaine_id`, `ligne_idx`, `pv_id`, BC, BL). Le stock est crédité et la porte matière
s'ouvre **au rangement**.

1. **Lignes couvertes** (`lignesDeQuarantaine`, `src/mise_en_stock.ts`), dans l'ordre de preuve : `quarantaines.ligne_idx`
   → identifiant de la quarantaine dans `pv_controle.detail` v2 (ligne, ou `certificat_absent`) → motif « Ligne n · … » /
   « Certificat matière absent … » → toute la réception (PV d'avant le lot F : lignes du BC, quantité commandée). Source
   rendue : `ligne` / `certificat` / `reception`.
2. **Répartition** (`repartirPartAcceptee`) : une seule ligne, ou plusieurs lignes du même article → toute la part sur la
   première ; plusieurs articles tout acceptés → chaque ligne pour sa quantité ; plusieurs articles avec une part qui n'est
   pas « tout » → corps **`repartition: [{idx, qte}]` obligatoire** (somme = part acceptée, chaque ligne ≤ sa quantité
   en quarantaine). Sinon **400** `{champ: 'repartition', repartition_requise, lignes, error}` — vérifié **avant** la
   réservation de la décision : elle n'est pas consommée. On n'invente jamais quelle référence entre en stock.
3. Lecture du PV en panne (`getPVReceptionParNumStricte`) → **503**, rien n'est décidé.
4. Réservation atomique (inchangée), puis `ajouterAMettreEnStock` ; entrées refusées listées « à saisir en entrée
   manuelle ». Base sans la file → `crediterLignesRepli` (entrée directe ligne par ligne, motif « … · quarantaine q »)
   + avertissement cloud-11.
5. **Porte matière** : quand le BC devient `controle`, sans manque non remplacé (`matiereManquanteBc`, lecture stricte ;
   panne → « réévaluée au prochain rangement »), elle est **évaluée** (`evaluerPorteMatiere`) — elle reste fermée tant
   qu'une ligne est à ranger, mais s'ouvre si tout avait déjà été rangé (ex. lignes conformes rangées, puis renvoi sans rien
   à ranger). Repli sans la file : ouverte seulement si le crédit direct est complet.
6. Réponse : + `mise_en_stock {lignes, qte, ids, deja}` ; `resume` « N accepté(s), inscrit(s) dans Stock › Mise en stock (à
   ranger) » ; `stock` et `bdt_debloques` seulement en repli.

**Écran** (`quarFournModal`, `src/qualite.tsx`) : projection `QUAR_DATA[].reception` + `source_lignes` et `lignes` ; bloc
**« Part acceptée par ligne du bon de commande »** dès que le lot couvre plusieurs lignes — pré-rempli en dérogation ;
en entrée partielle, la quantité acceptée devient la **somme des lignes** (lecture seule), aucune ligne remplie ou somme
nulle refusées avant envoi. Textes « entre en stock » remplacés par « part dans Stock › Mise en stock (le stock est
crédité au rangement) » ; suite de la décision : « Part acceptée → Stock › Mise en stock ». Erreurs et avertissements
échappés (`qfEsc`) et durables (`notifDurable`).

## NC émises depuis la Production : le « PV de non-conformité » (15/09/2026)

> « Il faut dans la production que les personnes habilitées à écrire puissent instruire des non-conformités
> librement en la rattachant à une affaire ou pas pour que ça aille ensuite dans la liste des NC en qualité. »

Le formulaire vit en Production (bouton rouge « PV de non-conformité » du bandeau, `src/prod_da_nc.ts`) et écrit par
`POST /api/production/nc` ; détail des règles : [Production](production.md), section du 15/09/2026. Ce qui arrive dans
**Qualité › Non-Conformités** :

- **Qui** : un salarié actif ayant l'**écriture Production**, identifié par matricule + PIN et revérifié par le serveur
  (droits recalculés comme au login). Rattachement **facultatif** à une affaire, un lot, un BDT.
- **Mêmes valeurs que le formulaire Qualité** : type (Interne / Client / Fournisseur), gravité, listes `qref.ts`
  (poste de détection, imputation, nature, cause, action immédiate) ramenées à la valeur canonique ; `statut 'Ouvert'` ;
  `categorie 'prod'` (filtre « Production ») ; `entite` obligatoire.
- **Numéro** `NC-AAAA-NNN` sur le **compteur continu** du formulaire Qualité (lecture paginée, renumérotation une fois
  sur conflit).
- **`detecteur` = nom de l'émetteur**. ⚠ Défaut existant : le select « Détecteur » de la fenêtre d'édition (Opérateur,
  Contrôleur, Client, Auditeur, Réception) **efface** cette valeur au ré-enregistrement, ainsi que le statut
  « quarantaine ». L'émetteur est donc **aussi écrit dans la description** (« PV de non-conformité émis en Production
  par X (constat du JJ/MM/AAAA). »), avec la cause présumée et le traitement proposé.
- **Case quarantaine** → quarantaine `en_cours` liée à la NC et NC en `quarantaine`, comme « Mettre en quarantaine ».
  **Action immédiate « Rebut »** → registre des déchets (`nc_rebut`), comme la création Qualité ; un échec est rendu en
  avertissement.
- **Portes qualité inchangées** : NC Critique/Bloquante rattachée à une affaire → BL de l'affaire bloqués ; quarantaine →
  expédition du lot bloquée, quelle que soit la gravité.

**Changements côté Qualité, même jour**
- `POST /api/production/non-conformites` (formulaire « Nouvelle NC » de la Qualité) **n'est plus self-service** :
  `serviceFor` le classe `qualite` et le handler revérifie `peutEcrireService(user, 'qualite')`. Avant, tout compte
  connecté — y compris une borne en lecture seule — créait une NC, même Bloquante. ⚠ Le bouton reste affiché aux
  lecteurs : l'envoi répond 403 et renvoie au PV de la Production.
- `ncEstClose` (`src/queries.ts`) reconnaît **« Soldé »**, statut de clôture de `NC_STATUTS_LISTE` : une NC soldée ne
  bloque plus l'expédition et ne remonte plus dans le cockpit Direction (qui utilise désormais ce même prédicat).

## Libération d'une pièce mère : le lot racine, quand tout l'arbre est fini (lot H2, 18/09/2026)

Le lot d'une pièce mère porte des **sous-lots** (un par composant de la nomenclature mère, récursivement — voir
[production.md](production.md#lot-h2--sous-lots-des-pièces-mères-18092026)). Un sous-lot est **interne** (arbitrage A8) : pas
de PV ni de libération propres.

- **Liste « à libérer »** (données de `/qualite/service`, `src/index.tsx`) : seulement les lots **racines** dont **tout
  l'arbre** est fini (`lotFini` : toutes les opérations du lot et de ses sous-lots, BDT soldés et BDS revenus) et qui ont au
  moins une opération dans l'arbre ; un sous-lot n'y figure jamais. Correctif au passage : les bons étaient indexés par
  `lot_id` **seul**, or les BDT de la cascade n'ont que `lot_ref` — `prod_finie` était toujours faux pour eux ; ils sont
  désormais rattachés par `lot_id` **ou** `lot_ref`.
- **`POST /api/qualite/lot/:id/liberer`** (décision « libéré ») : **409 `sous_lot_non_liberable`** `{ lot_racine }` sur un
  sous-lot (« Un sous-lot se libère avec son lot racine … ») ; **409 `arbre_non_termine`** `{ sous_lots }` sur une racine dont
  un sous-lot n'est pas fini (« Libération refusée : n sous-lot(s) de cette pièce mère … pas terminé(s) (…) ») ; **503** si
  la lecture de l'arbre échoue — **aucun PV n'est écrit**. Seuls les sous-lots sont vérifiés, pas les étapes propres du lot
  (comme avant H2). La **mise en quarantaine** d'un sous-lot reste possible.
- Les **quarantaines** et NC d'un sous-lot comptent pour l'affaire (porte qualité des BL), comme toute quarantaine.
- Points ouverts : si l'EN 9100 exige un PV propre à certains sous-ensembles, ce sera un lot ultérieur.

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/qualite.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
