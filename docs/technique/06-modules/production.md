# Module Production

<!-- auto:entete -->
- **Route** : `/production/service` · **Fichier source** : `src/prod.tsx`
- **Accès (RBAC)** : écriture — production · lecture — be, achats, oas, qualité, sécurité, expéditions, stock, maintenance
<!-- /auto -->

## Le planning ne cache plus rien (10/09/2026)

**Programmer n'est pas produire.** Tous les BDT et BDS d'un lot sont disponibles à la
programmation **dès que la commande existe** — c'est même l'intérêt d'un planning : on
pose la charge **avant** que la matière arrive, sinon on ne la voit jamais venir.

⚠ **Changement de comportement — la goulotte du 09/09/2026 est levée.** Un BDT dont la
matière n'était pas réceptionnée (`matiere_ok`) ou dont la préparation technique n'était
pas terminée **disparaissait purement et simplement du planning**. L'atelier voyait une
page vide et en concluait que l'ERP avait perdu ses ordres de travail. Plus rien n'est
retiré : `filtrerBdtsPrets()` a été **supprimée**, ses deux consommateurs
(`/production/service`, `/production/gantt-bdt`) reçoivent la liste entière.

**Ce qui manque reste écrit, à côté de l'ordre.** `bdtVigilance(bdt, prepRows)`
(`src/index.tsx`, ex-`bdtBlocage`) fait le même calcul, mais ce qu'elle rend est
désormais un **avertissement** et non un motif d'exclusion. La page de production
affiche, au-dessus des Gantt, la carte **« Ordres de travail programmables, mais pas
encore lançables »** : un ordre par ligne, avec ce qu'il attend (*matière non
réceptionnée*, *préparation technique en attente*).

**Le lot, pas l'affaire** (inchangé depuis le 09/09/2026) : l'avertissement est identifié
par le couple `(cmd_ref, piece)`. `lots.piece`, `preparations_techniques.piece` et
`bons_de_travail.piece` sont écrits depuis la **même expression source** dans la cascade
d'acceptation d'offre (`p.ref_interne || ref`). Repli conservateur : une préparation sans
`cmd_ref` ni `piece` avertit encore sur **toute son affaire**.

**Lecture métier** : la fiche affaire (`/commercial/affaire/:num`, tableau « Production —
lots ») garde sa colonne **Fabricable** — elle répond à « peut-on *lancer* ce lot ? », qui
reste une question distincte de « peut-on le *programmer* ? ».

**La seule porte physique restante est ailleurs** : l'envoi d'un BST chez le sous-traitant
exige que l'opération précédente de la gamme soit soldée. Voir
[Expéditions](expeditions.md#la-porte-denvoi-dun-bst-10092026) et `src/gamme.ts`.

## Goulotte, programmation, réception (11/09/2026)

**Un BDT n'est sur le planning que s'il est POSÉ.** `enGoulotte(b)` (script de `pageServiceProd`) :
statut `a_programmer`, pas de process, ou **pas de jour prévu** ⇒ goulotte. Avant, l'appartenance
se lisait sur le process : `posteOfBdt` retrouvait un poste par le libellé de l'opération et
`bdtOnDay` rattachait un BDT sans date au jour courant. Un BDT « à programmer » s'affichait donc **à
la fois** dans la goulotte et sur le Gantt, à 6 h. Gantt, goulotte, statistiques et réception
utilisent désormais ce seul critère.

- Les créateurs de BDT — cascade d'acceptation, `generer-bdt`, commandes prioritaires, défaut de
  `POST /api/production/bdts` — écrivent **`a_programmer`**. Le process de la gamme reste une suggestion.
- **Programmer** (`/affecter`) = process + **jour** (toujours écrit) + heure. 409 sur un BDT reçu ou
  soldé. `machine_id` suit le process, et revient à vide si le process n'a pas de machine.
- **`debut` passe en décimal** (migration **005** ; `cloud-4` pour le cloud). La colonne était un
  **entier** : tout dépôt à h15, h30 ou h45 échouait avec « Affectation échouée ». Tant que
  `cloud-4` n'est pas joué, le serveur arrondit à l'heure pleine au lieu d'échouer.
- **Déprogrammer** (`/deprogrammer`) = retour complet : process, machine, jour, heure et opérateur à
  vide. 409 sur un BDT reçu ou soldé.
- **Double-clic sur une barre** : programmée → **réception** (matricule + PIN) ; reçue → **sortie
  matière**. `/recu` refuse (409) un BDT non programmé, déjà reçu ou soldé, et note l'heure de
  **Paris** — le serveur tourne en UTC, et le temps réel était majoré de 2 h en été.
- **Séparer** : `/separer` crée les morceaux **d'abord** (retour arrière `supprimerBDTRow` au moindre
  échec) et ne réduit l'original **qu'ensuite**. Le suffixe se calcule depuis la racine : `-M2`,
  `-M3`… sans collision de clé, et un morceau re-séparé ne donne plus `-M2-M2`. Avant, l'original
  était réduit en premier et les échecs d'insertion avalés. ⚠ **Revu le 13/09/2026** (goulotte
  seule, temps libre) : voir la section suivante.
- **Porte des BST** (`src/gamme.ts`) : un BDT « reçu » (commencé) **n'est pas soldé** ; seul un BDS
  « reçu » (revenu) l'est. L'étape précédente n'est soldée que si **tous ses morceaux** (même
  `seq`) le sont.
- `/production/gantt-bdt`, l'ancien planning aux règles différentes, **redirige** vers
  `/production/service?focusBdt=…`, qui se place sur le BDT.

Vérifié sur Docker, jeu `-TEST-` supprimé ensuite : programmation à 7 h 15 enregistrée 7,25 ;
réception refusée hors planning, acceptée au PIN à l'heure locale ; replanification et
déprogrammation d'un BDT reçu refusées ; trois séparations successives → -M2, -M3, -M4, total des
heures conservé. Au navigateur, les 4 BDT de l'affaire 0001 ont quitté le Gantt pour la goulotte.
`gamme.ts` : 9 cas vérifiés.

## Découpe d'un BDT : goulotte seule, temps libre (13/09/2026)

**Demande atelier** : découper un BDT **uniquement dans la goulotte**, jamais depuis le planning, en
allouant **librement** le temps de chaque morceau.

- **Un seul point d'entrée** : le bouton ciseaux d'une carte de goulotte (`buildPending` →
  `splitBdt(id)`). L'entrée « Séparer en morceaux » du clic droit des barres du Gantt
  (`openStatutMenu`) est **supprimée**. `splitBdt` refuse aussi, côté écran, un BDT hors goulotte
  (`enGoulotte`).
- **`#splitModal` déplacée dans `#ppanel-gantt-bdt`** (à côté de `recuModal`/`sortieModal`). Elle
  était rangée depuis sa création dans `#ppanel-dash-prod` : ouverte depuis le planning, elle
  passait en `display:flex` sous un parent `display:none` et **ne s'affichait pas** (même famille
  de piège que « div non fermé → onglets invisibles » ; ni le build ni le harnais ne le voient).
- **Fenêtre** : rappel du BDT (id, opération, pièce, durée actuelle) ; une ligne d'heures par
  morceau (`step 0.25`, `min 0`) avec corbeille (inactive à 2 lignes) ; « + Ajouter un morceau »
  (12 max). Les saisies vivent dans `_splitBdt.vals` : ajouter/retirer une ligne **ne réinitialise
  rien** (avant, toute saisie du nombre de morceaux remettait les durées à parts égales).
  Événements par **délégation** sur `#splitParts` (`splitWire`, posé une fois). Pied : « Temps
  alloué total » + écart **informatif** avec la durée d'origine. « Découper » grisé tant qu'une
  valeur est vide ou ≤ 0. Plus de champ « Nombre de morceaux », plus de « Répartir également »,
  plus de mention « ajustée au prorata ». Durée d'origine lue comme le serveur (`duree`, sinon
  temps alloué) ; un BDT à 0 h s'ouvre avec des lignes vides.
- **Serveur** (`POST /api/production/bdt/:id/separer`, contrat dans `07-api-reference.md`) :
  - **409** si le BDT est **posé** — négation exacte de `enGoulotte` : statut renseigné autre que
    `a_programmer`, **et** `process_id`, **et** `date_prevue`. Refus 400 conservés (reçu, soldé,
    `temps_reel` renseigné, annulé) + **sous-traitance** (`statut 'st'` ou `operateur_id 'ST'`).
  - `parts` **obligatoire**, 2 à 12 valeurs, chacune un nombre > 0 **au 1/100 d'heure** (la colonne
    `duree` du cloud ne garde que 2 décimales : 1.23456 relu 1.23 — arrondir plus fin cassait
    `duree = temps_alloue`) — sinon **400 explicite**. Chaînes acceptées : décimales simples seulement. Fini le filtrage silencieux, la troncature à 12, le repli
    « parts égales » et la **normalisation au prorata**. Le refus « BDT sans durée » est supprimé.
  - **Temps** : `duree = temps_alloue = part` (original = morceau 1 compris) ;
    `temps_machine_alloue` (seulement s'il est renseigné sur l'original) =
    `tMach × part / durée d'origine`, ou `/ Σ parts` si la durée d'origine vaut 0. La somme peut
    différer de la durée d'origine : **c'est voulu**. L'écran pré-remplit la moitié au 1/100, le
    2ᵉ morceau prenant le reste (11,93 h → 5,97 + 5,96).
  - **Les morceaux gardent `process_id` et `poste_id`** de l'original (lien à la gamme) et copient
    `affaire_id` (NC au soldage, carte oxydation) ; ils naissent `a_programmer`, sans jour, heure ni
    opérateur. Sans risque : goulotte et `/recu` se fondent sur statut + jour. **`machine_id` n'est
    PAS recopié** : les heures machine de Maintenance comptent tout BDT portant une machine (l'étape
    entière si `temps_machine_alloue` est vide) — chaque morceau les aurait multipliées avant même
    d'être programmé ; `/affecter` repose la machine au placement.
  - **Lecture stricte** du BDT par id (`getBDTStrict`, 503 si panne) et des suffixes existants par
    requête ciblée (`idsMorceauxBDT`) : `getBonsDeTravail` avalait les erreurs et s'arrêtait à la
    page de 1000 lignes (faux 404, collision de clé sur un ancien `-Mk` hors page). Retour arrière
    **vérifié par relecture** (`retirerBDTRows`) : un morceau resté en base est nommé dans l'erreur.
    Corps JSON `null` → 400 (c'était un 500).
  - Réponse enrichie : `total_avant` (durée d'origine) et `total_apres` (Σ parts).
- **Tri de la goulotte** (`pendSort`) : dernier critère `localeCompare(…, {numeric:true})`, donc
  `-M10` passe après `-M2`. ⚠ `src/gamme.ts` (tri par `localeCompare` sans option numérique) n'a
  **pas** été modifié.
- **Effets aval d'une somme ≠ durée d'origine** (cartographie du 13/09) : la charge (Σ `duree`),
  le coût tant que le BDT n'est pas soldé (`temps_reel ?? duree`) et l'écart alloué/réel (Σ
  `temps_alloue`) suivent **le temps saisi** — c'est le sens de la demande. Aucun contrôle de
  capacité ni de chevauchement sur le Gantt. Un morceau de plus de 18 h déposé sur le planning se
  recale avant 5 h (borne min appliquée avant `DAY_END - dur`, défaut antérieur).
- Capture `form-production-separer.png` : `scripts_doc/capture_forms.mjs` passe par l'onglet
  planning (`#ptab-gantt-bdt`) et clique les ciseaux d'une carte de goulotte (carte d'exemple
  injectée dans le navigateur seulement si la goulotte est vide).

## Coût horaire porté par le process (14/09/2026)

**Demande** : « seuls les process ont un coût horaire […] le process machine porte le taux horaire
machine uniquement, et le taux horaire homme c'est son coût chargé dans RH ». Le moteur est dans
`src/shared.ts` (règle **unique**, partagée par BE, analyse DT, Finances, Maintenance, fiches 360) ;
cette section décrit ce que Production en expose.

**Modèle** : `process_atelier.taux_horaire_machine` (€/h HT, `null` = « taux à saisir », migration
**009** / `cloud-7`). Ni la machine (`cout_h`), ni le poste (`taux_horaire_manuel`), ni l'OPEX ne
portent plus de taux. Le **type** d'un process vient de `typeProcess(p)` : `est_oas` → `oas` ;
`requiert_machine === true` → `machine` ; `=== false` → `manuel` ; non renseigné → `machine` s'il a
une `machine_id`. Un process machine **sans** machine rattachée reste `machine`.

**Classement des temps d'une étape** (`etapeDecomp(e, tx, site)`) :

| Temps | Champ minutes (BE) | Champ millièmes (import) | Homme | Machine | Nature |
|---|---|---|---|---|---|
| ROP — réglage homme | `temps_reglage_min` | `temps_reglage_op_mille` | ✔ | — | fixe / lot |
| RGM — réglage machine | `temps_reglage_machine_min` | `temps_reglage_machine_mille` | ✔ | ✔ (process machine) | fixe / lot |
| THV — homme variable | `temps_mo_min` | `temps_variable_mille` si process non machine | ✔ | — | par pièce (lot si `est_fixe`) |
| TMV — machine variable | `temps_machine_min` | `temps_variable_mille` si process machine | — | ✔ (process machine) | par pièce (lot si `est_fixe`) |

Réglage historique `temps_reglage_mille` sans découpe = RGM sur un process machine, ROP sinon.
Repli ancien format `temps_unitaire_min` = TMV sur une étape machine, THV sinon. Sur un process manuel,
un TMV ne compte pas (signalé `sans_process` s'il n'y a aucun process). Process ou étape **OAS** et
sous-traitance : un prix (`max(forfait ; q × unitaire)`), jamais un temps. Coût = heures homme ×
`tx.tauxHomme(site)` + heures machine × `tx.tauxMachine(process_id, machine_id).taux`.

**Résolveur `construireTauxAtelier(process, salaries, machines)`** — à nourrir avec les lignes
**brutes** de `process_atelier` (`select *`) :
- `tauxMachine(pid, machineIdRepli)` → `{ taux, source }`, source `process` | `manquant` (taux vide) |
  `transition_machine` (propriété absente = cloud avant cloud-7 : `cout_h` de la machine) |
  `sans_process` | `manuel` | `oas`. Étape sans process : process machine **unique** de sa machine (si
  plusieurs, le seul non `inactif`), sinon `sans_process`.
- `tauxHomme(site)` : moyenne des `taux_horaire_charge > 0` des salariés `actif` et `est_operateur` du
  site (`entite`, casse ignorée), repli tous opérateurs, sinon 0 et `hommeManquant`. `hommeParSite`
  (moyennes seules) est ce qui part au navigateur.
- Côté serveur, `getTauxAtelier()` (`src/queries.ts`) lit process, salariés et machines et **remonte
  l'erreur** (`{ tx, salById, error }`) : une panne n'est jamais confondue avec un taux absent.

**Coût réel d'un BDT** (`coutReelBdt`) : `t = temps_reel ?? duree` ; homme = t × taux de l'opérateur
(repli moyenne du site = `activite`) — toujours ; machine = t × taux du process du BDT s'il est de type
machine. Consommé par `recomputeCmdCout`, `getCommandeDetail`, `getLotDetail`, `getAffaireDetail` et
les imputations Finances. Taux illisibles ⇒ `kpi.tauxErreur` et coûts `null` (« — », bandeau rouge
`alerteCoutReel`) ; donnée manquante ⇒ `kpi.manquants` (bandeau orange) et `recomputeCmdCout` écrit
`cout_reel = marge_reelle = null`.

**Écran « Process Ateliers »** (`pageServiceProd`, 19ᵉ paramètre `dbSalaries` pour les moyennes) :
- `procModal` : champ `p_taux` visible pour le type machine ; note RH (`_noteProcessManuel`, moyenne du
  site) pour un manuel, note OAS sinon. `createProcess` n'envoie `taux_horaire_machine` que s'il est
  saisi (vide ⇒ `null` en base).
- `procEditModal` : **sélecteur de type** `pe_type` (ajouté : le type ne se déduit plus de la
  machine), machine, taux `pe_taux` (actif en machine, grisé en manuel, masqué en OAS ; la saisie est
  restituée si l'on repasse en machine), poste. `saveProcEdit` fait **un seul** `PATCH
  /api/production/process/:id` (plus aucun `PATCH` machine `cout_h`). En transition, le taux venu de la
  machine est pré-rempli pour information et n'est renvoyé que s'il a été modifié.
- `machineModal` : champ « Coût machine (€/h) » (`mc_couth`) **supprimé** ; avec « Créer aussi un nouveau
  process », champ `mc_proc_taux` (création seulement). Suppression d'une machine : la confirmation
  annonce le nombre de process détachés, qui **restent** machine avec leur taux.
- Lignes dépliées des postes : pastille `procTauxBadge` — « X €/h », « X €/h · transition », « taux à
  saisir » ou « coût RH ». En-tête : « N process machine : taux à saisir » (process non inactifs).
- Retirés : colonnes Taux/h, OPEX théorique/an et Taux/h effectif, bouton `posteSetTaux`, tuile « OPEX
  annuel estimé » (remplacée par « OPEX réel conso. (YTD) »), badge « Coût total parc », colonne Taux/h
  du tableau de bord Production et son OPEX estimé. Code mort retiré : `procMgmtRows`, `proc_filter`,
  `toggleProcMachine`, `editProcMachineLink`, `peMachineChange`, branche `proc` de `persistRowOrder`.
- `PROCESS` et `MACHINES_PROC` passent désormais par `sjX` (un nom contenant `</script>` cassait la page).
- Avertissement `cloud-7` renvoyé par le serveur : notification longue **et** conservée en
  `sessionStorage.__erpAvertTaux`, réaffichée après le rechargement (une fois, 60 s max).

**Génération des BDT** (`etapeTempsMin`, `src/index.tsx`) : au format minutes, le réglage = ROP **+
RGM** et une opération `est_fixe` passe dans le réglage. Le RGM était oublié : la durée des BDT générés
à partir d'une étape convertie en minutes perdait le réglage machine.

⚠ **Données** : 5 process de la machine MACH-2026-020 (Surtec 650, Désoxydation, Oxydation noire,
Oxydation incolore, Lavage) ont `est_oas = false` : `typeProcess` les classe `machine` (taux 90 €/h
recopiés). Le formulaire BE, lui, les reconnaît OAS par leur nom (`nomEstProcessOAS`). À corriger en
base (`est_oas = true`, `taux_horaire_machine = null`) si ce sont bien des process OAS.
⚠ Le texte de légende des postes dit encore « ce calcul est repris à l'identique en Maintenance » : ce
n'est plus exact (Production additionne l'OPEX **réel** des consommables, Maintenance l'OPEX **saisi**
dans `machines_opex`). ⚠ Le graphique « Évolution OPEX mensuel » du volet Machines affiche des valeurs
codées en dur.

## Mission
<!-- auto:mission -->
Planning Gantt BDT/BST, présence opérateurs, commandes & lots, process ateliers.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `gantt-bdt` — Planning Gantt BDT
- `gantt-bst` — Planning Gantt BST
- `presence` — Présence opérateurs
- `commandes` — Commandes & Lots
- `machines` — Process Ateliers
- `dash-prog` — Dashboard Programmation
- `dash-prod` — Dashboard Production
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`production` · `bdt` · `bds` · `planning` · `process` · `machine(s)` · `presence` · `sortie-matiere`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`commandes` · `lots` · `bons_de_travail` · `bons_sous_traitance` · `machines` · `postes` · `shifts` · `absences` · `operateur_presence` · `affectation_poste` · `process_atelier`
<!-- /auto -->
## Points d'attention
**Planning UNIQUE** : `/production/service`. L'ancienne page d'affectation par opérateur (`/production/planning`, `pageUnifiedPlanning`) et la sous-nav « Programmation | Affectation » ont été **supprimées** (2026-08-18, choix utilisateur : rester lean) ; la route redirige. Tout l'utile y était déjà : affectation opérateur→process par créneau (`affecterPoste`, sous-cases Matin/Ap-m/Soir), file d'attente, déprogrammation par retour dans la file.
- **Files d'attente AU-DESSUS de chaque planning** : « BDT à classer » (`#pendingList`) et « BST à planifier » (`#bstPendingList`, remonté au-dessus du Gantt).
- **Focus étape (clic sur un BDT/BDS)** : n'affiche plus tout le lot mais **l'étape cliquée + la précédente + la suivante** (3 lignes max). `etapesDuLot()`/`etapePostesSet()`/`etapeFocusLabel()` côté BDT, `bstEtapesDuLot()`/`bstLotFournSet()`/`bstEtapeLabel()` côté BST ; `focusLot`/`focusLotBst` contiennent désormais l'**ID du BDT/BDS** (et non la clé du lot). Les deux gammes sont **fusionnées** (BDT + BDS du même lot) pour que l'étape voisine sous-traitée soit nommée (« ST … » / « atelier … ») — sans ajouter de ligne au planning correspondant.
- ⚠ `bstLotKey()` accepte maintenant `lot_id` (avant `lot_ref` seul) pour rejoindre la clé BDT `lotId = lot_id ?? lot_ref`.
- BDT/BDS prioritaires (id BDTP/BDSP) encadrés rouge.
- **Découpe d'un BDT** (revue 13/09/2026) : **uniquement** depuis les ciseaux d'une carte de la goulotte → modale `splitModal` (rangée dans `#ppanel-gantt-bdt`, 2 à 12 morceaux, temps **libre** par morceau) → `POST /api/production/bdt/:id/separer` ; le BDT d'origine garde le 1ᵉʳ morceau, les suivants sont créés en `-M2`/`-M3`… dans la goulotte. Plus de clic droit sur le planning, plus de prorata ; un BDT posé sur le planning est refusé (409).
- ℹ Cette fiche est **fusionnée, pas écrasée** par `scripts_doc/gen_module_fiches.mjs` : seuls les blocs `<!-- auto:… -->` sont régénérés depuis le manifeste ; ces points d'attention, écrits à la main, sont conservés.

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/production.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
