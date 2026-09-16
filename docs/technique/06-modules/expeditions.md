# Module Expéditions

<!-- auto:entete -->
- **Route** : `/expeditions/service` · **Fichier source** : `src/expeditions.tsx`
- **Accès (RBAC)** : écriture — expéditions, stock (logistique) · lecture — commercial, achats, production
<!-- /auto -->

## Lot F — PV quantitatif / qualitatif, reliquat, Mise en stock (15/09/2026)

> « Dans le PV de contrôle de réception d'expédition je veux pouvoir avoir à côté de la case observations la quantité
> reçue à côté de la quantité prévue […] s'il y a un reliquat annoncé par le fournisseur, il faut recréer […] ce qu'il
> nous reste à recevoir. […] Quand on aura fini le PV de réception, ce qui a été validé conforme va directement,
> référence par référence, dans la liste des choses à rentrer dans le stock. »

Réponses de l'utilisateur appliquées : écart de **quantité** = NC **quantitative**, **observation** = **qualitative**,
les deux possibles, **une NC fournisseur par ligne** à problème ; excédent : le prévu va au stock, **l'excédent est soumis
à validation hiérarchique** ; PV mixte : les lignes conformes partent en Mise en stock tout de suite ; reliquat annoncé :
un **BC du restant** naît aux Achats, **date à valider** ; Conforme / Non conforme reste un **choix manuel** ; la porte
matière s'ouvre **une fois rangée**. Règles pures `src/pv_reception.ts` (`validerSaisiePV` v2, `qtesPrevuesPV`,
`motifEcart`, `ncsReceptionPV`, `validationExcedentPV`, `entreeExcedentValide`, `numeroBcReliquat`,
`construireBcReliquat`, `sansColonnesReliquat`, `construireDetailPV` v2, `completerDetailPV`) ; Mise en stock :
[Stock](stock.md), section « Lot F ».

### Réception : plus de « Livraison partielle »

La case « Livraison partielle » et sa quantité livrée sont **retirées** du formulaire (Calendrier › « Traiter ») :
la quantité reçue et le reliquat annoncé se déclarent **au PV, ligne par ligne**. `validerSaisieReception` ignore
`livraison_partielle` (un ancien client qui l'enverrait n'a plus d'effet) : la réception prend toujours le **reste à
recevoir**. Reste une exception : quantité commandée du BC **inconnue** (quantité livrée saisie, obligatoire sauf BC à
plusieurs articles). La réception n'écrit plus `bons_de_livraison.partiel` ; `attend_reliquat` ne dépend donc plus que
d'un **remplacement** décidé par la Qualité (et des anciens BL `partiel`). Message de fin : « BL … créé (N attendu(s)).
Faites maintenant le PV de contrôle : quantité reçue ligne par ligne, puis les quantités conformes partent en Mise en
stock. »

### PV : le tableau des lignes est toujours là

Fenêtre « PV de contrôle à réception » (`expOpenPV`) : résultat, contrôleur, case certificat (si exigée), puis le
**tableau des lignes du BC en Conforme comme en Non conforme** — N°, Référence, Désignation, **Qté prévue**, **Qté
reçue** (champ, pré-rempli avec la prévue), **Reliquat annoncé** (case visible seulement si reçue < prévue), **Conforme ?**
(déduit et recalculé à la frappe : « Oui », « Non · quantitatif », « Non · qualitatif », « Non · quantitatif et
qualitatif », « Qté à saisir » ; détail « manque n », « reliquat n », « excédent +n · validation Direction »,
« quarantaine », « prévu inconnu »), **Observation** (facultative : une observation rend la ligne qualitative), PU HT,
Affaire, DA · Lot · Opération. Bouton **« Tout reçu comme prévu »** (reçue = prévue, reliquats décochés, observations
gardées). En Non conforme s'ajoutent l'en-tête du BC, l'observation générale et la gravité.

- **Qté prévue** (`expPvPrevues`, copie exacte de `qtesPrevuesPV`) : BC à plusieurs articles, ou réception sans quantité
  → quantité commandée de la ligne ; une seule ligne → quantité du BL (reste attendu) ; un article sur plusieurs lignes →
  quantité du BL répartie dans l'ordre. Quantité non numérique → pas de comparaison (avertissement). Chaque ligne renvoie
  `qte_prevue_affichee` : si le serveur calcule une autre valeur, **400 « rechargez »**, rien n'est enregistré.
- Corps envoyé : `lignes: [{idx, qte_recue, reliquat, observation, qte_prevue_affichee}]` dans les deux cas. Faute sur une
  ligne : ligne en rouge, curseur dans la quantité — ou dans l'observation quand la faute ne porte que sur elle.
- Succès : notification résumant les effets (« n ligne(s) en Mise en stock », NC, quarantaines, excédents soumis, BC de
  reliquat) puis avertissements **durables** (`notifDurable`, réaffichés après le rechargement).

### Règles de saisie (`validerSaisiePV` v2)

| Cas d'une ligne | Nature | Effet |
|---|---|---|
| reçue = prévue, sans observation | conforme | `qte_a_ranger` = reçue → file Mise en stock |
| reçue < prévue, **reliquat coché** | conforme (le reliquat n'est pas un écart) | reçue → file ; manque → **BC de reliquat** |
| reçue < prévue, sans reliquat | quantitative | reçue → file ; NC « Logistique - Quantité » (`nb_pieces` = manque) |
| reçue > prévue | quantitative | prévue → file ; **excédent** → validation Direction ; NC quantitative |
| observation écrite | qualitative | part **prévue** reçue (min(reçue, prévue)) → **quarantaine** de la ligne ; rien en stock ; excédent éventuel → validation « sous réserve Qualité » |
| manque ou excédent + observation | quantitative et qualitative | comme qualitative, NC « À requalifier » |

- **Conforme** : refuse toute ligne en écart (400 « passez en Non conforme ») ; conforme impossible sans le certificat
  exigé (inchangé). ⚠ **À trancher** : un PV Conforme **accepte** une ligne avec reliquat annoncé (le reçu est bon, le
  reste est recommandé) ; la spécification disait « Conforme ⇒ aucun reliquat » — appliquée à la lettre, un PV dont le
  seul écart est un reliquat était impossible (Non conforme exige une ligne en écart).
- **Non conforme** : au moins une ligne en écart **ou** le certificat exigé absent.
- **Certificat absent** (Non conforme) : toutes les lignes sans observation mettent leur part prévue reçue en quarantaine
  avec une NC « Logistique - Certificats » (réception bloquée) ; `quarantaines_attendues` compte les lignes qualitatives
  reçues + le certificat.

### Déroulé serveur (`POST /api/expeditions/bc/:id/pv`) — effets du lot F

Contrôles d'entrée inchangés (écriture Expéditions, BC / BL / PV stricts, 409 PV existant, certificat changé, contrôleur
éligible). Le PV est écrit (détail v2), puis chaque effet est tenté ; tout échec est **dit** dans `avertissements` sans
défaire le PV.

1. **NC fournisseur par ligne en écart** (`ncsReceptionPV` → `creerNcReceptionPV`) : `id` NC-AAAA-NNN (renumérotée sur
   23505, 3 essais), `type_nc` **« Fournisseur »**, `categorie` `quantitative` / `qualitative` / `quantitative et
   qualitative`, `type_defaut` « Logistique - Quantité » (quantitatif pur) ou « À requalifier » (dès qu'il y a une
   observation), `ref_article`, `designation`, `nb_pieces` (manque / excédent, ou reçue pour le qualitatif), `description`
   (PV · BC · BL, ligne, nature, écart chiffré, observation, reliquat, excédent soumis, quantité en quarantaine,
   observation générale, contrôleur), `detecteur` « Réception », `gravite` du PV, `statut 'ouverte'`, `lot_ref` = BL,
   `operation` « Contrôle réception », `fournisseur_nom` si la colonne existe. + une NC certificat. Replis : colonnes
   absentes → NC sans description ni nature ; `nb_pieces` entier (22P02 / 22003) → sans ce nombre.
2. **Quarantaine** par ligne qualitative (et une pour le certificat) : `qte` = part prévue reçue, motif « Ligne n · réf ·
   désignation — écart », `pv_id`, `nc_id`, `statut en_cours`, `bc_id` / `bl_id` / `fournisseur_nom` (008) et **`ligne_idx`**
   (013, `null` pour le certificat) ; replis sans 013 puis sans 008.
3. **Excédent** (hors achat machine et sous-traitance) : une demande `validations` par ligne (`validationExcedentPV` :
   domaine `expeditions`, type `excedent_reception`, objet « Excédent de réception BC · ligne · +N (reçu … pour …
   prévu) », montant = PU × excédent, `ref_table bons_de_commande`, payload complet, `qualite_requise` et
   `quarantaine_id` quand la ligne est qualitative ou le certificat absent). Décision : [Direction](direction.md).
4. **Reliquat** (`creerBcReliquatPV`) : un BC `<num_bc>-R<n>` pour les lignes à reliquat (voir [Achats](achats.md),
   « BC de reliquat ») ; **idempotent par réception** (un reliquat déjà né de ce BL est repris) ; lecture des BC en panne
   → non créé, dit ; base sans 013 → créé sans `bc_parent_id` / `date_a_valider` (avertissement).
5. **`bons_de_livraison.qte` réécrite** avec la somme des quantités reçues (la quantité attendue reste dans le détail).
6. **Mise en stock** : `ajouterAMettreEnStock` (origine `pv`, une entrée par ligne `qte_a_ranger > 0`) ; lignes refusées
   listées « à saisir en entrée manuelle ». Base sans la file → `crediterLignesRepli` (entrée directe ligne par ligne) +
   avertissement cloud-11.
7. **Détail v2 complété** (`completerDetailPV` : `nc_id`, `quarantaine_id`, `validation_id`, `bc_reliquat_id`,
   `mise_en_stock`).
8. **`recalculerStatutBc`** : une réception est tranchée si son PV est libéré, ou si **toutes** ses quarantaines sont
   décidées et qu'il y en a au moins `quarantaines_attendues` (0 = écarts purement quantitatifs → BC `controle` ; base sans
   `detail` : repère `[Quarantaines attendues : n]` des observations ; PV d'avant le lot F : sa quarantaine décidée).
   **Plus de porte matière au PV** (sauf repli sans la file, crédit complet).

Réponse : champs historiques (`pv_id`, `resultat`, `anomalie`, `certificat_matiere`, `controleur`, `nc_id`,
`quarantaine_id`, `stock`, `bc_statut`, `bdt_debloques`, `manque_matiere`, `avertissements`) + `nc_ids`,
`quarantaine_ids`, `validation_ids`, `bc_reliquat_id`, `mise_en_stock {lignes, qte, ids, deja}`, `lignes[]` (quantités par
ligne). `stock`, `bdt_debloques` et `manque_matiere` ne sont renseignés qu'en repli sans la file.

### Écrans Expéditions : autres changements

- **Réceptions** : bandeau « les quantités conformes partent dans Stock › Mise en stock » ; état d'un PV non conforme :
  toutes les quarantaines du BL (`QUAR_PAR_BL` est une **liste** par BL — avant, la dernière gagnait), « dérogation
  fournisseur · accepté ».
- **Calendrier** (`collecterMouvements`) : un BC de reliquat `date_a_valider` sans réception n'est pas une arrivée.
- **Retours fournisseurs** (Envois) : liste aussi le retour d'un **excédent refusé** (`QEXC-<id validation>`).
- `bcsView` gagne `bc_parent_id` et `date_a_valider` ; `stock_multi_ok` n'est plus lu par l'écran.

### Limites connues (lot F)

- BC à plusieurs articles re-réceptionné après un remplacement Qualité : la quantité prévue d'une ligne reste sa quantité
  commandée (aucune quantité reçue par ligne n'est stockée sur le BC).
- `non_conformites.categorie` porte déjà « administratif / production » côté Qualité : la NC de réception y écrit
  « quantitative / qualitative » — à la ré-édition, la catégorie est redemandée (la nature est aussi en tête de la
  description).
- Un manque purement quantitatif sans reliquat n'est pas compté comme matière manquante (la porte peut s'ouvrir au
  rangement du reçu).
- Contraintes CHECK du cloud sur `type_nc` « Fournisseur », `categorie` et le statut `envoye` du BC de reliquat non
  vérifiées en ligne (essais sur Docker seulement).

## Lot D — réception fournisseur et PV de contrôle détaillé (14/09/2026)

> « Dans le formulaire de réception […] le numéro de commande de chez eux et le num de BL de chez eux,
> retirer le nom du transporteur, et la quantité. Quand on reçoit de pays hors France (case oui non) […]
> Pour le PV de contrôle quand c'est conforme rien à mettre à part le fait que c'est conforme, quand c'est
> non conforme afficher tout ce qui appartient au bon de commande […] Le contrôleur ne peut être que
> quelqu'un qui a les accès écriture dans expéditions. »

Règles pures (testables sans base ni DOM) : `src/reception.ts` (réception), `src/pv_reception.ts` (PV),
`src/certificat_matiere.ts` (exigence du BC, voir [Achats](achats.md)). Lectures strictes dans
`src/queries.ts` (`getBonDeCommandeStricte`, `majBonDeCommandeSi`, `getBonDeLivraisonStricte`,
`getBlsDuBcStricte`, `getPVControlesResumeStricte`, `getSalariesDroitsStricte`) : une panne répond 503,
jamais « introuvable » ni « aucun PV ». Base : migration **012** / `cloud-10` (voir
[03-base-de-donnees](../03-base-de-donnees.md)). Contrats : [07-api-reference](../07-api-reference.md), bloc « Lot D ».

### Qui peut réceptionner, corriger, faire le PV

- `POST /api/expeditions/bc/:id/receptionner` et `/pv` **sortent du self-service** (`SELF_SERVICE_RE`,
  `src/auth.ts`) : ils étaient ouverts à **tout compte connecté**, aucun appelant n'envoyant de PIN. Le
  middleware exige désormais l'écriture Expéditions, et chaque handler la **revérifie** avec
  `peutEcrireService(user, 'expeditions')` (message clair ; seul contrôle quand `AUTH_ENFORCE=off`). Même
  double contrôle sur la nouvelle route `POST /api/expeditions/bl/:id/reception-infos`.
- Ont l'écriture : direction (`all`), rôle `logistique`, ou fiche portant le jeton `ecrire:expeditions`.
  ⚠ **La Qualité ne peut plus signer un PV de réception** (lecture seule sur Expéditions). Lui cocher
  `ecrire:expeditions` fait passer sa fiche en mode jetons : cocher aussi ses autres services, sinon elle
  les perd (voir [04-auth-rbac](../04-auth-rbac.md)).
- Écran : boutons « PV à faire » **grisés avec cadenas** et lien « Corriger » masqué pour un lecteur
  (`extra.peutEcrireExpeditions`). Le bouton « Traiter » du Calendrier reste affiché : le serveur répond
  403 et la fenêtre explique le refus.

### Formulaire de réception (Calendrier › « Traiter »)

| Champ (id) | Règle |
|---|---|
| N° BL interne (`rec_numbl`), N° d'affaire (`rec_affaire`) | repris du BC, verrouillés quand connus (inchangé) |
| **N° de commande fournisseur** (`rec_numcmdf`) | obligatoire, 100 caractères max |
| **N° de BL fournisseur** (`rec_numblf`) | obligatoire, 100 caractères max — remplace « N° réf. livraison transporteur » |
| **Réception hors France ?** (`rec_hf_oui` / `rec_hf_non`) | Oui / Non obligatoire |
| si Oui : **Poids matière (kg)** (`rec_poids`) | nombre > 0 et ≤ 1 000 000, « 125,5 » et « 1 250,5 » acceptés |
| si Oui : **N° de nomenclature (douane)** (`rec_nomenc`) | code de nomenclature douanière, texte ≤ 100 |
| si Oui : **Code EWX** (`rec_ewx`) | 1 ou 2 |
| si Oui : **Mode d'arrivée** (`rec_mode`) | `MODES_ARRIVEE` : Routier, Maritime, Aérien, Ferroviaire, Messagerie / express |
| ~~Livraison partielle (`rec_partiel`)~~ + Quantité livrée (`rec_qte_livree`) | exceptions à la règle de quantité, ci-dessous — ⚠ **la case « Livraison partielle » est retirée au lot F** (le reliquat se déclare au PV) |

**Retirés** : Transporteur, N° réf. livraison transporteur, Quantité reçue. Si « Non », les quatre champs
d'import sont forcés à `null` même s'ils sont envoyés. Pas de contrainte « hors France ⇒ 4 champs » en
base : contrôle applicatif, identique côté client (`expSubmitRecep`) et serveur (`validerSaisieReception`,
400 + `champ`, le champ fautif est encadré en rouge).

**Quantité du BL = reste à recevoir** (`quantitesBc`, `planReception`) : `qte_commandee − qte_recue`, où la
quantité commandée est `qte_commandee` si numérique, sinon la somme des `lignes[].qte` quand toutes les
lignes en portent une numérique, sinon **inconnue**. Un bandeau (`rec_qte_info`) affiche ce que la
réception va écrire. Jamais `qte = 0`. Deux exceptions, ajoutées à la vérification du lot :

- ~~**Livraison partielle**~~ (retirée au lot F, 15/09/2026) (le fournisseur annonce un reliquat) : la quantité livrée est saisie, strictement
  inférieure au reste ; BL = cette quantité, BC `recu_partiel`, le reliquat reste à « Traiter ». Refusée (400)
  sur un BC à plusieurs articles.
- **Quantité commandée inconnue** : la quantité livrée (lue sur le BL fournisseur) est **obligatoire** pour
  un BC à un article, **facultative** pour un BC à plusieurs articles — sans elle, `bl.qte = null` et un
  avertissement. « Corriger le BC » était impossible : aucun écran ne modifie la quantité d'un BC
  (`bcw_qte` du BC direct est désormais un champ numérique).

Un écart de quantité hors de ces cas se signale **au PV non conforme**, sur la ligne concernée.

**Déroulé serveur** (`POST /api/expeditions/bc/:id/receptionner`) :

1. écriture Expéditions (403) → validation de la saisie (400 + `champ`) → lecture **stricte** du BC (503 / 404) ;
2. `planReception` : BC annulé → 409 `annule` ; déjà entièrement reçu (`recu_total`, `recu`, `receptionne`,
   `controle`, `cloture`, ou reste ≤ 0) → 409 `deja_recu`. **Reprise d'un BC figé** : BC `recu_total`
   pointant un BL inexistant, sans aucune réception ni date d'arrivée réelle (réception interrompue) → la
   réception repart, avec avertissement ;
3. **le BC d'abord, conditionnellement** (`majBonDeCommandeSi`, sur le statut lu) : `statut`, `bl_id` et
   `qte_recue` (seulement si la quantité est connue). Deux réceptions simultanées : une seule passe (409
   « modifié par ailleurs »). ⚠ `transporteur` / `transporteur_ref` ne sont **plus écrits** : ils
   écrasaient à `null` ce que le BC portait ;
4. le BL (`construireBlReception`) : `type_bl 'reception'`, `qte`, `statut 'recu'`, les 7 colonnes 012 ; plus
   de `transport` ni `transporteur_ref`. Colonnes absentes (cloud avant `cloud-10`) → nouvel essai sans elles
   + avertissement `AVERT_MIGRATION_012` ;
5. erreur **sans code** (réponse perdue) : le BL est **relu** avant toute remise en état — présent → 200 avec
   avertissement ; base muette → **503 `incertain`**, rien n'est défait. Autre échec → le BC est remis dans
   l'état lu (`bc_remis`), 23505 → 409 ;
6. greffe OPEX machine (inchangée), puis `date_reception_reelle` à la 1ʳᵉ réception — son échec est **dit**
   (plus de `.catch` muet).

**Planning** : `_bcRecu` considère un BC `recu_partiel` comme **non reçu** seulement si `bcsView` a posé
`attend_reliquat` : reste à recevoir > 0 (ou inconnu) **et** soit la dernière réception (`bc.bl_id`) est une
livraison partielle déclarée (`bons_de_livraison.partiel = true`, écrit par `construireBlReception`), soit
une quarantaine de ce BL a été décidée avec `compensation = 'remplacement'` (le fournisseur relivre).
⚠ **Correctif du 15/09/2026** : la première version (reste à recevoir seul) faisait revenir dans « À
réceptionner » des BC déjà réceptionnés et passés au PV avec l'ancienne saisie de quantité (`recu_partiel`
historique, `partiel` null) ; ils sont de nouveau considérés comme reçus.

**Correction des informations** — `POST /api/expeditions/bl/:id/reception-infos`, lien **« Corriger »** sous
chaque réception fournisseur de l'onglet Réceptions (même fenêtre, mode « Corriger les informations »,
`expOpenCorrectionReception`). N'écrit que les 7 colonnes 012 : ni la quantité, ni le statut, ni le stock ; un
PV déjà signé garde l'instantané de `pv_controle.detail`. 409 si le BL n'est pas une réception fournisseur ou
si les colonnes manquent (`needsMigration`). ⚠ Aucune trace de qui a corrigé ni quand.

**Relecture des informations** : onglet Réceptions (« BL fourn. … · Cde fourn. … », pastille « Hors France »
+ poids · nomenclature · EWX · mode), bandeau du PV, `/expedition/bl-liste` (colonne Transport : à défaut de
transporteur, « BL fourn. … » ; commande fournisseur et bloc hors France dessous ; quantité `null` affichée
« — »), historique de l'onglet Fournisseurs (colonne « Transporteur / BL fourn. »).

### PV de contrôle (Réceptions › « PV à faire »)

> ⚠ **Saisie des lignes, NC, quarantaine et entrée en stock remplacées le 15/09/2026** (section « Lot F » ci-dessus) : tableau
> des quantités en Conforme comme en Non conforme, une NC par ligne, excédent, reliquat, file Mise en stock. Le contrôleur,
> le certificat et l'écriture `pv_controle` décrits ci-dessous restent valables.


**Conforme** : le résultat, le contrôleur et — si le BC l'exige — la case « Certificat matière reçu et
conforme ». Rien d'autre (plus d'observation, plus de champ texte « Contrôleur », plus de case quarantaine).
**Conforme impossible sans la case** : l'écran bascule le PV en non conforme et le serveur répond 400
`certificat_confirme`. Aucun résultat n'est pré-sélectionné.

**Non conforme** : en-tête du BC (n° BC, fournisseur, date, livraison prévue, affaire(s) via `bcAffaires`,
montant HT, conditions de paiement, articles, notes, lien PDF si `canAccess(user,'/api/bc/x/pdf','GET')`),
puis **toutes les lignes du BC** (`lignesBc` : n°, référence, désignation, quantité commandée, Conforme ?
Oui / Non, observation, PU HT si un prix existe, affaire, DA · lot · opération). Chaque ligne exige une
réponse ; **observation obligatoire sur « Non »** (1 000 caractères) ; bouton « Tout à Oui » (n'écrase
aucune réponse donnée) ; **observation générale** facultative (4 000) ; gravité Mineure / **Majeure** /
Critique / Bloquante. Au moins une ligne en « Non » **ou** le certificat exigé absent. BC sans lignes → une
ligne **reconstituée** depuis `articles` + `qte_commandee` (marquée `*`).

**Contrôleur** (décision 3) : liste des salariés **actifs** ayant l'écriture Expéditions, calculée comme au
login (`controleursEligibles` : rôles = `roles` sinon `[role]`, droits = `autorisations` sinon
`autorisationsUnion(roles)`, puis `peutEcrireService`), identifiés par `id` (matricules partagés). Liste
passée à la page (`extra.controleurs`, `id` + `nom` seulement) ; personne connectée pré-sélectionnée si elle
est éligible. Le serveur **relit les salariés** à chaque PV : contrôleur hors liste → 403 ; lecture en échec
→ 503. Le compte de secours peut enregistrer mais n'est pas choisissable (pas de fiche salarié). La personne
connectée est tracée à part (`saisi_par`). ⚠ `date_sortie` n'est pas prise en compte (comme au login).

**Déroulé serveur** (`POST /api/expeditions/bc/:id/pv`) : écriture Expéditions (403) → contrôleur fourni
(400) → BC strict (503 / 404) → BL de la réception visée, lus strictement (503 ; 409 « aucune réception »
hors sous-traitance) → PV existants stricts (503 ; **409 si le BL a déjà son PV**) → **409
`certificat_change`** si l'exigence du BC a changé depuis l'ouverture de la page (`certificat_requis_affiche`)
→ `validerSaisiePV` contre les lignes **relues** (le client n'envoie que `{idx, conforme, observation}` ; 400 +
`champ` + `idx`) → éligibilité du contrôleur (503 / 403) → écriture.

**Écriture `pv_controle`** : `operateur_id` = id du contrôleur (repli `null` sur 23503, clé étrangère cloud) ;
`statut` / `decision` / `anomalie` / `nc_ouverte` **aux valeurs historiques** (contraintes CHECK cloud) ;
`observations` = « Contrôleur : X — » + résumé (préfixe lu par `deriverOriginePV` ; un BC de sous-traitance
commence par « Retour sous-traitant ») ; colonnes 012 : `detail` (jsonb v1 : instantané du BC et du BL,
lignes avec réponse et observation, observation générale, gravité, certificat, contrôleur, saisi par),
`controleur_id`, `controleur_nom`, `saisi_par`, `certificat_matiere` (`non_requis` / `confirme` / `absent`).
Sans ces colonnes : nouvel essai sans elles, **détail complet en texte dans `observations`**, avertissement.
Index unique partiel `ux_pv_controle_reception_bl` : deux PV simultanés → 409.

**Non conforme → NC + quarantaine** (une par BL, `champsNcPV`) : `description` = observation générale +
« Ligne n · réf · désignation : observation » par ligne en « Non » + « Certificat matière absent ou non
conforme » + « Contrôleur : X » ; `ref_article` / `designation` si **une seule** ligne est en « Non » ;
`nb_pieces` = quantité du BL ; **`detecteur` = « Réception »** (valeur de la liste Qualité : l'édition de la
NC ne l'efface plus et le badge dit « Fournisseur »). Numéro renuméroté une fois sur 23505 ; colonnes absentes
→ NC sans description (le détail reste dans le motif de quarantaine) ; `nb_pieces` refusé (22P02 / 22003,
colonne entière) → NC sans ce nombre, quantité exacte sur la quarantaine. **Quarantaine toujours créée**
(motif = description, `qte` = quantité du BL). Tout échec partiel est rendu dans `avertissements`.
⚠ Non transactionnel : le PV est écrit avant la NC et la quarantaine.

**Conforme → stock** (`entrerStockReception`) — ⚠ **remplacé au lot F** : les quantités conformes partent dans la file Stock › Mise en stock ; `entrerStockReception` n'est plus appelée (repli sans la file : `crediterLignesRepli`, ligne par ligne) :

- BL **sans quantité** → rien n'est crédité, raison `MSG_QTE_INCONNUE` (« quantité reçue inconnue sur le BL :
  entrée en stock non faite ») ; le BC peut tout de même passer `controle`. Corriger le BC ensuite ne
  recrédite rien.
- **BC à plusieurs articles** (`bcMultiArticles` : références différentes, ou désignations / unités
  différentes) : **une entrée par ligne**, sur l'article de la ligne et pour sa quantité, motif
  « Réception BC … · BL … · ligne n ». Seulement si la quantité entrée couvre **toute** la commande
  (`repartitionStockMultiArticles`) ; sinon refus expliqué (« à régulariser article par article »), annoncé dès
  la réception. Une ancienne entrée « tout le BL » bloque tout double crédit. Avant : tout le BL était crédité
  à l'article de la 1ʳᵉ ligne. Même règle pour l'entrée partielle décidée par la Qualité.
- Statut du BC (`recalculerStatutBc`) et porte matière inchangés.

### Données de la page (`GET /expeditions/service`)

- `bcsView` gagne, calculés par les fonctions de la route : `qte_commandee_num`, `qte_source`,
  `qte_recue_num`, `reste_a_recevoir`, `lignes` (normalisées), `multi_articles`, `stock_multi_ok`, `affaires`,
  `certificat_matiere_requis`, `montant_ht`, `notes`, `conditions_paiement`.
- `BC_JSON` (`EXP_BC`) : `qte_commandee`, `qte_commandee_texte`, `qte_source`, `qte_recue`, `reste`,
  `multi_articles`, `stock_multi_ok`, `lignes`, `affaires`, `certificat_matiere_requis`, `date_bc`,
  `montant_ht`, `notes`, `conditions_paiement`, `categorie`. **Contenu commercial restreint** : sans écriture
  Expéditions, `lignes` vides et montant / notes / conditions vidés ; sans droit au PDF du BC, `prix_unitaire`
  à `null`.
- `EXP_PV = { controleurs, indisponibles, utilisateur, peutEcrire, pdfBc }` et
  `EXP_BLREC = { <bl_id>: { bc_id, qte, date_bl, 7 champs de réception, infos_col } }`.
- Délégation d'événements (aucune chaîne de la base dans un `onclick`) : `.exp-pv-open[data-bc][data-bl]`,
  `.exp-rec-edit[data-bl]`, radios `.pv-l-rep`. Bandeaux et tableau du PV construits en texte.

### Limites connues (lot D)

- ~~Livraison partielle, reliquat et entrée partielle d'un **BC à plusieurs articles** : rien n'entre en stock
  automatiquement, et l'ERP n'a pas d'entrée de stock manuelle.~~ **Levée au lot F** : quantités reçues par ligne au
  PV, répartition par ligne de la part acceptée, entrée manuelle dans le Stock.
- Quantité = reste à recevoir : le KPI « taux de service fournisseur » (Σ reçu / Σ commandé) tend vers 100 % ;
  un écart ne se voit plus qu'au PV.
- Retour de sous-traitance **sans BL** : toujours pas d'anti-doublon de PV.
- Aucune trace de qui corrige les informations de réception ; pas d'export des réceptions hors France sur une
  période (déclaration douane).
- Le bouton « Traiter » du Calendrier porte encore un `onclick` avec l'id du BC (défaut antérieur au lot).

## Réception → PV de contrôle → stock (11/09/2026)

> ⚠ Contrat du PV et de la réception **remplacé le 14/09/2026** (section « Lot D » ci-dessus) : quantité du BL,
> contrôleur, PV ligne par ligne. Le principe ci-dessous (stock au PV conforme) reste valable.

> « On reçoit, ensuite on doit faire le PV de contrôle, et il faut qu'il soit fait et conforme
> pour que le contenu rentre en stock. »

**Le stock n'est plus crédité à la réception.** `POST /api/expeditions/bc/:id/receptionner` crée le
BL de réception et met à jour le BC (`recu_partiel` / `recu_total`, `qte_recue`, date réelle), puis
répond `pv_requis: true` — sans toucher au stock ni à la porte matière. Seul l'OPEX d'un achat
machine reste greffé à la réception.

**Le crédit se fait au PV conforme** (`POST /api/expeditions/bc/:id/pv`, helper `entrerStockReception`) :

- un PV porte sur **une réception, donc un BL** : l'écran envoie le `bl_id` de la ligne cliquée
  (repli sur le dernier BL du BC). Avant, le PV visait toujours le dernier BL ;
- **un seul PV par réception** : un second renvoie 409. Sans ce contrôle, chaque soumission créait
  un PV, une NC et une quarantaine de plus — et créditerait désormais le stock deux fois ;
- **conforme** → le contenu du BL entre en stock, **quantité du BL** (décimales acceptées). Idempotent
  par le motif `Réception BC <id> · BL <bl>`, vérifié par une **requête ciblée**
  (`mouvementEntreeExiste`) : la liste des 200 derniers mouvements ne voyait pas les anciens. Si
  cette vérification échoue, **rien n'est crédité** — un crédit manqué se voit, un double non ;
- **non conforme** → NC et quarantaine rattachées au BL, **rien en stock** ;
- BC machine exclu (OPEX) ; sous-traitance exclue (pas un achat de stock). Un retour de
  sous-traitance, qui n'a pas de BL, peut recevoir un PV, sans entrée en stock.

**Statut du BC.** Il n'est plus écrasé par `recu` au PV — ce `recu` sortait le BC de la liste des
« totaux » et bloquait l'ouverture de la porte matière pour les autres BC de l'affaire. Il passe
**`controle`** quand il est reçu en totalité **et** que chacune de ses réceptions a un PV conforme.

**Porte matière** (`ouvrirPorteMatiere`) : `matiere_ok` des BDT d'une affaire s'ouvre **au PV
conforme**, quand tous les BC matière de l'affaire sont `controle` ou `cloture`. Elle s'ouvrait à la
réception : une matière en quarantaine était déclarée disponible.

**Écran.** L'onglet Réceptions affiche l'état de chaque BL : **« PV à faire »** (bouton),
**« Conforme · PV-x »**, **« Non conforme · PV-x »**. Le message de réception ne promet plus
d'« entrée stock ».

Vérifié sur Docker, jeu `-TEST-` supprimé ensuite : réception → stock inchangé ; PV conforme → +10,
BC `controle`, `matiere_ok` ouvert ; PV en double → 409 ; PV sans réception → 409 ; non conforme →
NC + quarantaine, stock inchangé ; réception partielle 4 puis 6,5 → +4 puis +6,5, BC `controle` au
second PV seulement.

## Le lot refusé au contrôle a maintenant une issue (12/09/2026)

> « Pour la quarantaine quand c'est une NC fournisseur, une libération de lot : on doit choisir si on
> renvoie au fournisseur, si on fait une dérogation avec le fournisseur, ou si on rentre en stock
> partiellement. »

Le point laissé ouvert ci-dessus est tranché. La **décision appartient à la Qualité**
(`POST /api/qualite/quarantaine/:id/decision-fournisseur`, voir [Qualité](qualite.md)) ; les
Expéditions en portent les conséquences matérielles.

- **Une réception refusée part toujours en quarantaine.** Le PV non conforme crée la NC *et* la
  quarantaine dès qu'il y a un BL : la case « Mettre en quarantaine » ne peut plus laisser un lot
  sans issue — un BC dont un lot restait en suspens ne pouvait plus jamais devenir `controle`. La
  quarantaine porte désormais le contexte de l'achat : `bc_id`, `bl_id`, `qte`, `fournisseur_nom`
  (écriture *fail-soft* : sans la migration 008, la quarantaine naît quand même).
- **Le statut du BC se recalcule** au même endroit pour tout le monde (`recalculerStatutBc`) : il
  passe `controle` quand **toutes** ses réceptions sont *tranchées* — PV conforme **ou** décision de
  la Qualité sur le lot non conforme. Un **remplacement** attendu fait l'inverse : `qte_recue` est
  décrémentée de la quantité non acceptée et le BC repasse `recu_partiel`, en attente de relivraison.
- **Onglet Envois, carte « Retours fournisseurs »** : les lots que la Qualité a décidé de renvoyer,
  avec le bouton « Expédié » → `POST /api/expeditions/retour-fournisseur/:qid/expedie` (date, auteur,
  référence du bon de retour ; un second appel est refusé en 409).
- **Onglet Réceptions** : sous un PV non conforme, la ligne dit ce qu'il est advenu du lot
  (« renvoyé au fournisseur · à expédier », « dérogation fournisseur · entré en stock »,
  « entrée partielle 6/10 ») au lieu de rester figée sur « Non conforme ».
- `entrerStockReception(bc, bl, qteAcceptee?)` accepte une **quantité forcée** : l'entrée partielle
  crédite la part acceptée avec le **même motif** que l'entrée normale — donc toujours idempotente.

⚠ **Matière manquante** : un lot renvoyé sans remplacement laisse l'affaire sans matière. La porte
matière n'est alors **pas** ouverte par la décision, et la réponse le dit — il faut repasser commande.

## La porte d'envoi d'un BST (10/09/2026)

> « Pour envoyer le BST au sous-traitant, il faut que le BDT juste avant soit soldé. »

C'est la **seule porte physique** du circuit de production : on n'expédie pas une pièce
dont l'opération précédente n'est pas finie, il n'y aurait rien à mettre dans le carton.
Elle ne s'applique **qu'à l'envoi**, jamais à la programmation (voir
[Production](production.md#le-planning-ne-cache-plus-rien-10092026)).

**La gamme d'un lot** est la **fusion des BDT et des BDS**, triée par `seq` — la colonne
existe sur `bons_de_travail` **et** `bons_sous_traitance`, écrite par la cascade.
Le module `src/gamme.ts` porte toute la logique, sans dépendance à Hono ni à Supabase :

| Fonction | Rôle |
|---|---|
| `cleLot(op)` | rattachement au lot : `lot_id` sinon `lot_ref` (les deux coexistent selon l'origine) |
| `opSoldee(op)` | un BDT est soldé par l'atelier (`statut: 'solde'`) ; un BDS est fini quand les pièces sont **revenues** (`date_retour_effective` fait foi, le statut peut traîner) |
| `gammeDuLot(ops)` | tri par `seq`, l'`id` départage les ex æquo |
| `etapePrecedente(cible, ops)` | l'opération juste avant, **les annulées enjambées** |
| `bdsEnvoiBlocage(bds, ops)` | `null` si le BST peut partir, sinon la raison, rédigée pour l'écran |
| `blocagesEnvoiBds(bds, bdts)` | la raison de **chaque** BST, indexée par id — regroupe d'abord par lot |

**Un BST en tête de gamme part librement** (rien avant lui) : c'est le cas d'un traitement
de surface sur matière brute. Un BDS sans lot n'a pas de gamme à respecter.

**Le refus est SERVEUR** — l'écran ne fait qu'éviter le clic :

- `POST /api/expeditions/bds/:id/envoyer` → **409** avec la raison ;
- `PATCH /api/production/bds/:id` avec `statut: 'envoye'` → **409** aussi, sinon la porte
  se contournerait d'un simple appel direct.

⚠ **Double câblage RBAC, volontaire.** `serviceFor()` déduit le service du 1ᵉʳ segment
après `/api/`. Le bouton d'envoi vivait aux Expéditions mais appelait
`/api/production/bds/…` : il était évalué sur le service **production**, où le rôle
`logistique` n'a que la **lecture** (`ROLE_MATRIX`, `src/auth.ts`). L'envoi **et** le
retour de sous-traitance étaient donc **morts pour ceux dont c'est le métier**, refusés
en silence. Les deux familles de routes existent désormais :
`/api/expeditions/bds/:id/{envoyer,retour}` et `/api/production/bds/:id/{envoyer,retour}`.

**À l'écran** : dans le **Calendrier** (départ du jour), le bouton « Traiter » cède la
place à une pastille verrou portant la raison ; dans **Envois › Sous-traitance**, la
colonne Statut affiche « attend `<n° de l'opération>` ».

## Mission
<!-- auto:mission -->
Bons de commande, bons de livraison, commandes en cours, OTD.
<!-- /auto -->
## Onglets
- `bc` — Bons de Commande
- `planning` — **Planning des arrivées** (timeline/Gantt des BC fournisseurs **et** sous-traitants, positionnés à leur date d'arrivée prévue)
- `bl` — Bons de Livraison
- `commandes` — Commandes en cours
- `dashboard` — Dashboard

### Planning des arrivées (`panelPlanningArrivees`)
- **Timeline SSR** groupée par fournisseur/ST, une barre par BC à sa `date_livraison` (arrivée prévue), fenêtre bornée (−21 j → +120 j, snap lundi/dimanche). Ligne « aujourd'hui », semaines en repères.
- **Statuts colorés** : en attente / accusé / **en retard** (date dépassée & non reçu) / reçu partiel / réceptionné. Filtres client (Tous / Fournisseurs / ST / À recevoir / En retard).
- **Clic marqueur → modale** : détail BC + bouton **BC PDF** ; le **BL n'apparaît que si le BC est reçu** (`bl_id`) → *BC seul en attente, BC + BL à la réception*. Changement de la **date d'arrivée prévue** en ligne.
- **OTD figé** : changer la date via `POST /api/expeditions/bc/:id/date-arrivee` **gèle la 1ʳᵉ date** dans `date_livraison_initiale` (au 1ᵉʳ changement) ; l'OTD se calcule toujours sur cette 1ʳᵉ promesse (jamais la date repoussée). Marqueur « ⟲ » + date fantôme quand la date a glissé.

## API (familles de routes)
`bl` · `bst` · `expeditions` (lot F : `POST /api/expeditions/bc/:id/pv` alimente la file `/api/stock/mise-en-stock`, les validations d'excédent et le BC de reliquat ; dont `POST /api/expeditions/bc/:id/date-arrivee` — change la date prévue en gardant l'initiale ; `POST /api/expeditions/bc/:id/receptionner`, `POST /api/expeditions/bl/:id/reception-infos` et `POST /api/expeditions/bc/:id/pv`, réservés à l'écriture Expéditions depuis le lot D)

## Tables principales
`bons_de_commande` (`+ date_livraison_initiale`, `+ date_reception_reelle`, `+ certificat_matiere_requis` — 012, `+ bc_parent_id`, `+ date_a_valider` — 013) · `quarantaines` (`+ ligne_idx` — 013) · `mises_en_stock` (alimentée par le PV — 013) · `validations` (type `excedent_reception`) · `bons_de_livraison` (`+ num_commande_fournisseur`, `num_bl_fournisseur`, `hors_france`, `poids_matiere_kg`, `num_nomenclature`, `code_ewx`, `mode_arrivee` — 012) · `pv_controle` (`+ detail`, `controleur_id`, `controleur_nom`, `saisi_par`, `certificat_matiere` — 012) · `factures_client`

## Points d'attention
- BL partiels → factures_client + écriture VTE. BL bloqué si porte qualité active.
- **OTD fournisseur/ST recalé sur `date_livraison_initiale`** (`kpi.ts` `fournisseurs()`, `queries.ts` `computeOtd`/`getFournisseurScorecard`) → une date repoussée ne « rachète » plus l'OTD. Tout est **fail-soft** : sans la migration `bc_arrivees_planning.sql`, l'OTD retombe sur `date_livraison` et la date se change quand même (l'initiale n'est simplement pas gelée). **Migration à appliquer au cloud** pour activer le gel en production.
- La date d'arrivée réelle est posée à la réception (`date_reception_reelle`, 1ʳᵉ réception) — sinon repli sur la date du BL de réception le plus tardif.

- **Réorganisation 2026-08-18 — 3 onglets** : `receptions` (arrivées : BC fournisseurs/ST, retours de sous-traitance, **retours clients**, arrivées enregistrées) · `envois` (départs : sous-traitance, BL clients, commandes prêtes) · `calendrier` (frise **arrivées + départs** + bloc « Aujourd'hui ») · `dashboard`. Socle commun : `collecterMouvements()` — les 3 vues sont des projections des mêmes tables.
- ⚠ **Bugs de câblage corrigés** : la route ne chargeait que `getBLClients()` → les BL `type_bl='reception'` et `'retour_client'` n'étaient **jamais** chargés (bloc « Réceptions effectuées » structurellement vide) ; les vrais BDS (`bons_sous_traitance`) n'étaient pas chargés du tout ; `TODAY` figé au chargement du module → date du jour passée **par requête** (`extra.today`).
- **Retour client** : annoncé en Qualité sur la NC (`retour_attendu`, `n_commande`, `qte_retour_attendue`, `date_retour_prevue`), réceptionné ici via `POST /api/expeditions/retour-client/:ncId/receptionner` → BL `type_bl='retour_client'` rattaché à la commande + NC marquée « reçu » (`bl_retour_id` ↔ `nc_id`). Migration `scripts_import/nc_retour_client_attendu.sql` — **fail-soft** via `ncHasRetourCols()` tant qu'elle n'est pas jouée en cloud.

### Onglet « Fournisseurs » (2026-08-24)
- 5ᵉ onglet, **à droite du Calendrier** : référentiel fournisseurs (liste filtrable, ajout, suppression) + par fournisseur ses **BC envoyés** et ses **BL reçus** (n°, date, **transporteur** — à défaut, depuis le lot D, le **N° de BL fournisseur** —, BC lié, affaire). Clic sur une ligne → `/commercial/affaire/:num`.
- Rendu par `panelFournisseurs(FOURNS, BCS, allBLs)` (`src/expeditions.tsx`). Réutilise `POST /api/achats/fournisseur` (création) et `DELETE /api/fournisseurs/:id` (suppression) — **aucun nouvel endpoint**.
- Route : `getFournisseurs()` ajouté au `Promise.all` ; `fournisseurs` passé via `extra`. `bcsView` porte désormais `fournisseur_id` et `num_affaire` (ils manquaient — sans eux ni le rattachement ni le lien affaire n'étaient possibles).
- **Rattachement BC → fournisseur** : par `fournisseur_id` si présent, sinon repli sur le **nom normalisé** (`fournisseur_nom`), car beaucoup de BC anciens ne portent pas l'id. BL joints par `bons_de_livraison.bc_id`, avec repli sur `bons_de_commande.bl_id`.
- 🐞 **BC annulés désormais exclus de TOUT le service** (`statut === 'annule'`), comme les BL l'étaient déjà : ils apparaissaient encore dans le Dashboard.
- ⚠ `bons_de_commande` : **DELETE anon bloqué par RLS** (retourne 200/204 sans effet), comme `bons_de_livraison` et `ordres_maintenance`. Une donnée de test doit être neutralisée (`statut='annule'`) puis supprimée en SQL depuis Supabase.
- ⚠ **Deux chevauchements de files corrigés (09/09/2026)** — le même objet apparaissait dans deux cartes à la fois :
  1. *Réceptions › Retours de sous-traitance attendus* retenait aussi les BDS **pas encore partis** (`a_envoyer`, `a_planifier`, `planifie`), déjà listés dans *Envois › À envoyer en sous-traitance*.
  2. *Envois › Commandes prêtes à expédier* gardait les commandes **dont le BL est déjà préparé**, elles-mêmes listées dans *Bons de livraison à envoyer* — ce qui invitait à créer un **second** BL pour la même expédition.
  Les deux files étaient invisibles en production (tables vides), mais le défaut était réel.
- ⚠ **Ce ne sont PAS les doublons observés en base.** Le doublon visible (deux lignes `BC-TESTARB` identiques dans *En attente de validation fournisseur*) vient de **5 lignes de test** partageant le même `num_bc` — donnée, pas code. Les deux files de réception s'excluent correctement (`accuse_fournisseur_le` présent d'un côté, absent de l'autre), et *réceptions* / *retours client* se partagent proprement les BL par `nc_id`.
- ⚠ **Manifeste de captures corrigé** : il visait encore `#exp-tab-bl`, `#exp-tab-planning`, `#exp-tab-commandes`, supprimés lors de la réorganisation du 18/08 → 5 PNG périmés retirés, entrées réelles ajoutées (`envois`, `calendrier`, `fournisseurs`). Le **manuel HTML Expéditions a été entièrement réécrit** : il décrivait encore les 5 anciens onglets.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/expeditions.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
