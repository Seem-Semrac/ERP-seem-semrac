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

## Lot C : présences, 4 créneaux, réglage / réalisation, découpe, recollage, chemin critique (14/09/2026)

**Demande** : « quand on a découpé notre BDT on puisse revenir en arrière · un clic sur les présences
opérateur ne s'enregistre pas pour le responsable prod · voir sur le BDT les temps de réglage et de
réalisation · un 4ᵉ créneau matin, journée, après-midi, soirée · seul le temps variable est découpable,
le réglage est fixe et se fait une seule fois · le process d'après ne peut se mettre qu'après le temps de
réglage du process précédent ». Contrats des routes : `07-api-reference.md`. Colonnes et index :
`03-base-de-donnees.md`. Scripts cloud : `02-exploitation-runbook.md`.

### C1 · Présences (onglet Présence)
- **Cause Docker/VM** : `upsertPresence` fait `onConflict:'operateur_id,date_presence'` sans index unique
  en base → 42P10 → case revenue vide. Même défaut pour `affectation_poste`, `competences_operateur`,
  `produits_fournisseurs`, `kpi_objectifs`. **Migration 010** / `cloud-8` : `create unique index` dans un
  `do $$` par table, seulement sans doublons (sinon `raise warning` avec la requête pour les lister).
  Une erreur 42P10 résiduelle répond **500** avec le renvoi vers 010 / cloud-8 (`messageEchecUpsert`).
- **Module pur `src/presences.ts`** : `CRENEAUX`, `VALEURS_PRESENCE`, `validerCorpsPresence` (créneau
  inconnu ou vide → 400, plus de repli `journee`), `validerFenetre` (≤ 62 jours),
  `fenetreChargementPresences` (lundi → +20 j lus), `joursChargesPage` (14 j déclarés chargés),
  `paletteCreneaux` / `couleurTexteCreneau` (texte foncé AA : matin `#1d4ed8`, journée `#047857`,
  après-midi `#6d28d9`, soirée `#0f172a`), dates en UTC.
- **Écran** : un clic ouvre un menu (Matin · Journée · Après-midi · Soirée · Absent · Effacer) → **un seul**
  appel ; écritures **en file par case** (`PRES_FILE`), affichage optimiste, retour à la dernière valeur
  confirmée (`PRES_CONFIRME`) ; Effacer = `DELETE`. Semaine jamais lue = cases verrouillées
  (`PRES_JOURS_CHARGES`, `PRES_CHARGEMENT`) ; ‹ › relit la semaine (`GET ?from=&to=`). « Programmer la
  semaine » lit chaque réponse et compte les échecs. Clavier : Échap/Tab ferment et rendent le focus à la
  case (`PRES_MENU_ORIGINE`, `presFocusCase`, `presRafraichir` qui conserve le focus), flèches/Début/Fin.
- **Fusion d'une lecture** (`presFusionner`) : une case garde sa valeur locale si une écriture y est en
  cours, a **démarré** après le départ de la lecture (`PRES_TOUCHE`) ou s'est **terminée** après ce départ
  (`PRES_FIN`, revue) — sinon une lecture faite avant la validation d'un upsert remettait l'ancienne valeur.
- **Congés d'opérateur** : `POST /api/production/conge/:id/valider` (famille production ; l'ancien bouton
  appelait `/api/rh/…` → 403). Seulement `est_operateur`, décision **conditionnelle** (`majCongeSiStatut`,
  statut `demande`), **auto-validation refusée** (403 si `auteurDe(c).id === conge.salarie_id`, revue).
  Les effets (`effetsDecisionConge`, partagés avec `/api/rh/conge/:id/valider`, elle aussi conditionnelle
  depuis la revue) lisent de façon **ciblée et stricte** le salarié (`getSalarieCompletCible`) et ses BDT
  de la période (`lireBDTOperateurPeriode`) et disent chaque effet raté dans `warning` (solde non décompté,
  BDT non renvoyés, absences manquantes) : la décision étant déjà écrite, un effet perdu ne serait jamais
  rejoué. Boutons Approuver/Refuser désactivés pendant l'appel.

### C2 · 4 créneaux partout
`SHIFTS` (`src/shared.ts`) seule source : `matin` 6–14, `journee` 7–17, `apmidi` 14–22, `soir` libellé
**« Soirée »** (horaires 22–6 **conservés**, à faire trancher). Grille de présence, planning (4 sous-cases,
5 colonnes, `opShiftCol` range la journée en « Journée »), fiche RH et formulaire `/rh/conge`
(`CRENEAUX.map(libelleCreneau)`). Code mort supprimé : `buildDayPresence`, `buildProcessBoard`.
⚠ `src/affectation.tsx` garde sa propre copie « Soirée/Nuit » (page redirigée, non touchée).
⚠ **Lot G (16/09/2026)** : les horaires ne viennent plus de `SHIFTS` mais de la **cadence usine** du site et du jour
(`src/cadence.ts`) ; `libelleCreneau` rend le libellé seul. Voir la section « Lot G » ci-dessous.

### C3 · Réglage stocké sur le BDT
- **Migration 011** / `cloud-9` : `bons_de_travail.temps_reglage` (h, `null` = inconnu, réalisation =
  `duree − temps_reglage`), `duree_avant_decoupe`, `temps_machine_avant_decoupe`, contrainte
  `temps_reglage ≥ 0`. Tolérance « colonne absente » partout (`creerBDTAvecReglage`, `AVERT_CLOUD9`).
- `etapeTempsMin` déplacée dans `shared.ts` et alignée sur `etapeDecomp` (ROP + RGM, `est_fixe`) ;
  créateurs : cascade et `generer-bdt` écrivent `reglageBdtHeures`, commandes P `0`, création manuelle
  « dont réglage (h) » (≤ durée).
- `PATCH /api/production/bdts/:id` : `temps_reglage` hors liste ; **ni `duree` ni `temps_alloue`** sous
  le réglage stocké (409 ; `temps_alloue` ajouté à la revue).
- **Existant** : `reglageBdtDepuisGamme` (formules historiques v1, v2 et actuelle, « certain » seulement si
  tous les calculs concordants donnent le même réglage) + `POST /api/production/bdt/reglage/reconstituer`
  (`{appliquer:false}` rapport, `{appliquer:true}` n'écrit que les certains, relit).
- **Algorithme de reconstitution** (`reglageBdtDepuisGamme(famille, ctx)`, `src/shared.ts`, pur ; une famille =
  racine + ses `-Mk`, annulés ignorés) :
  1. réglage **déjà renseigné** sur toute la famille → `certain`, source `bdt` ; renseigné sur une partie →
     `incertain` ;
  2. `BDT-P…` (création manuelle) → `inconnu` ; `BDTP-…` : refabrication sans gamme → `inconnu`, sinon
     `certain` à **0** (la durée d'une commande prioritaire ne contient jamais de réglage) ;
  3. quantité : `lots.qte_initiale ?? qte` (clé `lot_id || lot_ref`), sinon `quantite` de
     `demandes_travaux.pieces_detail` (même affaire, `ref_interne = piece`) — introuvable → `inconnu` ;
  4. nomenclatures `code_ref_produit = piece` (sans casse ni espaces), validées d'abord puis indice
     décroissant — aucune → `inconnu` ;
  5. étape `ordre == seq` (sinon rang), ni sous-traitée ni OAS, libellé confirmé (`nom` / `process_nom` /
     `operation_st` = `operation` du BDT) — introuvable → `incertain` (« gamme modifiée depuis la création ») ;
  6. recalcul de la durée avec **les trois formules** qui ont créé des BDT (`etapeTempsMinHistorique` v1 et v2,
     `etapeTempsMin` actuelle) ; vérification : bon unique `|temps_alloue − D| ≤ 0,0011` (sinon
     `|duree − D| ≤ 0,0051`), famille `|Σ temps_alloue − D| ≤ 0,0051 × n` et la racine doit pouvoir contenir R.
     **`certain` seulement si tous les calculs qui tombent juste donnent le même réglage** ; sinon `incertain`
     avec `propose` (plusieurs gammes compatibles, durée retouchée, réglage supérieur à la durée de la racine).
  Affectations d'un `certain` : R sur la racine, 0 sur les morceaux encore vides. La route n'écrit que les
  `certain` (`ecrireReglageSiVide` : jamais par-dessus une valeur), puis relit tout ; `ok:false` + `echecs[]`
  si une écriture ou une relecture ne tombe pas juste. Les `incertain` restent vides et se complètent à la
  découpe (saisie sur la racine, bouton « Utiliser … h »). Mode opératoire : `02-exploitation-runbook.md`.

### C4 · Réglage et réalisation à l'écran
Projection `bdtsForGantt` : `reglage`, `racine`, `rangMorceau`, `posMorceau`, `nbMorceaux`, `oasAvant`,
`oasApres`, `cleLot`, `sansHeure`. Carte de goulotte (mini-barre, pastille « M2 · 2/3 », « au plus tôt »,
bouton « Annuler la découpe »), barre (`makeBdtBar`), info-bulle, réception, soldage, OF imprimé (repli sans
gamme = `temps_reglage`).
- **Barre (revue)** : le segment `.bdt-rgl` est calculé dans le **repère du temps** —
  `rglW = round(R × PX_H) − (2 + 5)` (décalage de 2 px de la barre + liseré de lot de 5 px), borné à
  l'intérieur de la barre moins 3 px de réalisation visibles. Hachures sombres seulement + `text-shadow`
  sur les libellés (contraste). 3ᵉ ligne : « heure · R + V h · client ».

### C5 · Découpe : seule la réalisation se découpe
`POST /api/production/bdt/:id/separer` `{ realisation[], reglage?, duree_lue?, nb_membres? }` ;
`planDecoupeBdt` : morceau 1 = `R + v1` avec `temps_reglage = R`, morceaux k ≥ 2 = `vk`, réglage 0. Ancien
corps `parts` accepté seulement si R vaut 0 ou est inconnu. Règles ajoutées à la revue :
- **Un seul porteur par famille** : si un autre bon (non annulé) porte déjà un réglage > 0, R est forcé
  à 0 (source `famille`) et une saisie > 0 est refusée (409). Une saisie n'est acceptée que sur la **racine**
  (409 sur un `-Mk` tant que la racine existe) ; réglage retrouvé par la gamme ou saisi : **toute la
  famille** est complétée (le porteur R, les autres 0, `ecrireReglageSiVide`) — sinon elle restait
  « renseignée en partie », donc incertaine pour toujours, et la saisie se rouvrait ailleurs.
- Réglage saisi > durée → 400.
- **Page périmée** : `duree_lue` (± 0,005) et `nb_membres` envoyés par la fenêtre ; réduction de l'original
  **conditionnelle** (`majBDTConditionnelle` : statut, durée lue, `temps_reel` vide) avec retour arrière des
  morceaux créés → 409. Deux découpes du même BDT depuis deux onglets ne s'appliquent plus toutes les deux.
- 1ʳᵉ découpe de la racine (aucun morceau) : `duree_avant_decoupe` / `temps_machine_avant_decoupe`
  **réécrits** (plus « si vides »).
- `GET /api/production/bdt/:id/temps` expose la même règle (`source:'famille'`, `saisie_possible`).
- **Fenêtre** : réglage incertain **jamais pré-saisi** (bouton « Utiliser … h » → `splitUtiliserPropose`) ;
  lecture en échec → « Découper » grisé tant que rien n'est saisi, bouton « Relire le réglage »
  (`splitLireTemps`/`splitRelire`) ; pré-remplissage refait tant que l'utilisateur n'a rien tapé
  (`valsTouchees`) ; réglage > durée bloqué.

### C6 · Annuler une découpe
`POST /api/production/bdt/:id/recoller` (id = n'importe quel membre). Blocages : `blocagesRecollage` +
traces (`lireTracesBDT` : historiques opérateur/machine, NC, mouvements de stock, cotes ; 503 si panne).
Durée = `duree_avant_decoupe`, sinon Σ ; réglage = Σ des renseignés ; temps machine =
`temps_machine_avant_decoupe`, sinon Σ.
- **Rejouable (revue)** — colonnes présentes : 1) racine mise à jour sous condition de l'état lu (statut,
  pas démarrée, **même durée, même durée d'origine**), la durée d'origine étant **posée à la valeur
  recollée** tant qu'un morceau existe ; 2) morceaux retirés sous garde-fous puis relus ; morceau resté →
  racine réduite d'autant (conditionnel) ; 3) plus aucun morceau → durée d'origine remise à vide. Un essai
  relancé après une panne, ou deux annulations simultanées, retombent sur la même durée (avant : 10 h →
  15 h sans message). Base **sans** ces colonnes (cloud avant cloud-9) : morceaux retirés **d'abord**, puis
  racine = ses heures + celles des morceaux réellement retirés (relecture de la racine si la mise à jour
  conditionnelle échoue : une autre annulation a pu faire le travail).
- Client : `CC_RECOLLAGE[racine]` bloque un second appel (double clic, cartes M1 et M2) ; bouton grisé.

### C7 · Chemin critique (`src/gamme.ts`, repris ligne à ligne côté client entre `==CC-MOTEUR-DEBUT==` et `==CC-MOTEUR-FIN==`)
Règle : pour deux étapes consécutives d'un lot (groupes de `seq`, annulées enjambées),
`début(E(n+1)) ≥ début(porteur du réglage de E(n)) + réglage(E(n))`. `auPlusTot`, `controleEnchainement`
(libre / calé le même jour / refus 409 un jour antérieur), `violationsEnchainement`,
`successeursEnViolation`, `ajouterHeuresPlanning` (grille 5 h–23 h, report au lendemain),
`heureEntiereChemin`. Temps = `date_prevue` + `debut` (heures décimales) en **heures de grille**
`PLAN_DEBUT_JOUR` (5) → `PLAN_FIN_JOUR` (23), jours calendaires ; un début calculé à 23 h passe au lendemain 5 h.
⚠ **Lot G (16/09/2026)** : quand la cadence usine est lisible, ces calculs se font en **heures ouvrées** du site
(horloge `tempsPlanning`, section « Lot G · G5 ») ; la grille ci-dessous ne vaut plus que pour une cadence illisible.

| Étape précédente E(n) (groupe de `seq`) | Étape suivante E(n+1) | Au plus tôt (`regle`, `raison`) |
|---|---|---|
| aucune (tête de gamme), sans lot ou sans `seq` | — | pas de contrainte (`aucune`) |
| BDT entièrement soldés | BDT ou BDS | `aucune` (« étape précédente soldée ») |
| BDT avec porteur(s) `temps_reglage > 0` posé(s) | BDT sans `oas_avant` | début du porteur + R (`reglage`, « après le réglage de X (R h) ») ; plusieurs porteurs : le plus tardif ; porteur soldé : « réglage déjà fait » |
| BDT dont le porteur est en goulotte mais d'autres morceaux posés | BDT | début du plus tôt des morceaux posés non soldés (`reglage`, « réglage de P non programmé ») |
| BDT sans réglage positif (0 ou `null`) | BDT | plus tôt début connu (`reglage`, « (sans réglage) » ou « (réglage non renseigné, compté 0) ») |
| BDT posé sans heure | — | compté à `PLAN_HEURE_DEFAUT` = 6 h |
| BDT reçu | — | `debut_reel` (HH:MM) sur `date_prevue`, sinon `debut` |
| BDT non soldés | BDT **`oas_avant`** ou **BDS** | **fin complète** = max(début + `duree`) (`fin_complete`) ; BDS : contrôle au jour seulement |
| BDS | BDT ou BDS | jour de retour à 5 h (`retour_st`) : `date_retour_effective`, sinon (`date_debut` ‖ `date_envoi`) + `duree_days` (≥ 1, au jour supérieur ; sinon écart envoi → retour prévu ; sinon 5 j) |
| étape précédente en goulotte / non planifiée | — | `inconnu` + information « étape précédente non programmée » : pose libre |
| morceaux d'une même étape | BDT sans réglage | ≥ début du frère porteur + R (« même étape ») |

Combinaison : la contrainte la plus tardive l'emporte (égalité départagée par l'id), les informations sont
jointes par « · ». `controleEnchainement` : `aucune`/`inconnu` → **libre** ; BDT jour antérieur → **refus**
(409) ; même jour sans heure ou avant l'au plus tôt → **calé** (centième supérieur, `messageCalage`) ; BDS :
refus si le jour de début est antérieur. `violationsEnchainement` : BDT posés (ni reçus ni soldés) et BDS
planifiés non partis qui démarrent avant leur au plus tôt → carte « Enchaînements à revoir » ;
`successeursEnViolation` : les mêmes, limitées aux étapes de `seq` ≥ la cible (réponse de `/affecter` et
`/affecter-st`, jamais de décalage). ⚠ Non contrôlés : `PATCH /api/production/bds/:id` (dates libres, utilisé
pour créer / déplanifier un BST) et `POST /api/production/bst/affecter`.
Corrections de la revue :
- **`PLAN_HEURE_DEFAUT = 6`** : un BDT posé **sans heure** (pose au clic) compte à 6 h, l'heure où il est
  affiché (avant : « non programmé », donc aucune contrainte ni violation). `/affecter` et `POST /bdts`
  posé **écrivent toujours** une heure (celle demandée, sinon l'heure actuelle du BDT, sinon 6).
- **Porteur du réglage en goulotte mais morceaux posés** : contrainte = début du plus tôt des morceaux
  posés non soldés (« après le début de X (réglage de P non programmé) ») au lieu d'« inconnu ».
- **Colonne `debut` entière** (cloud sans `cloud-4`) : `heureEntiereChemin` recontrôle l'heure arrondie et
  prend l'heure pleine au-dessus si elle tombe avant l'au plus tôt ; `cale_a` rend l'heure réellement
  écrite, et l'écran reprend `data.debut`.
- PATCH générique : `debut` / `date_prevue` refusés (400) ; `/affecter-st` contrôle le jour avant de créer
  le BC. Écran : zone rouge au glisser, calage local identique, carte « Enchaînements à revoir » (en-tête :
  réglage, fin complète ou retour de sous-traitance), badge rouge, « Dispo le … » des BST, motif de
  violation dans l'info-bulle BST (plus d'attribut `title` concurrent), refus BST échappé (`ccEsc`).

### Autres corrections de la revue
- `pushNotif` (`shared.ts`) : identifiant `n<horodatage>-<aléa>` — plusieurs notifications dans la même
  milliseconde recevaient le même id et la croix fermait la mauvaise.
- ⚠ **Constaté, non corrigé (hors lot)** : les droits vivants (`droitsAJour`, cache 8 s) voient un salarié
  **créé après** la dernière lecture comme « Compte désactivé » (401) jusqu'à expiration du cache.

### Décisions et points à trancher
- **Actées** : Soirée = libellé seulement (horaires 22h-6h conservés, le planning 5 h–23 h n'en montre que le
  début) ; calage automatique le même jour et **409** un jour antérieur, sans décalage en cascade ;
  recollage à la **durée d'origine** (sinon somme) ; morceau 1 « réglage seul » autorisé ; réglage inconnu
  à la découpe → saisie sur la racine, sinon tout en réalisation (avertissement) ; durée des nouveaux BDT
  alignée sur `etapeDecomp`.
- **À faire trancher** : ~~horaires réels de la Soirée~~, ~~week-ends exclus ou non du chemin critique~~,
  ~~chevauchement de deux étapes sur un même poste~~ — **tranchés par le lot G (16/09/2026)** : cadence usine par site,
  heures ouvrées, même process refusé ; reste le bouton « Recaler la suite » (le lot G remet les étapes incohérentes
  en goulotte au lieu de les recaler).
- **Hors lot, connus** : `src/affectation.tsx` garde « Soirée/Nuit » (page redirigée) ; `retirerAffectation`
  avale ses erreurs ; affectations chargées sur 14 jours ; la capacité compte 8 h par présent quel que soit le
  créneau ; carte et badges calculés sur `getBonsDeTravail` (non paginé) — les décisions serveur, elles,
  lisent de façon ciblée ; un BDT calé tard peut déborder après 23 h (Gantt d'un jour) ;
  `bons_sous_traitance.predecesseur_fin` reste une colonne morte (tout est calculé à la volée).

**Tests** (scratchpad du lot, hors dépôt) : `test_chemin.ts` (moteur, parité serveur/client sur 4 420
comparaisons, écran en VM, routes Docker), `test_presences.mjs`, `test_reglage.ts`, `e2e_lotc.mts`
(phases B, G, RV, A sans colonnes, PANNE), `verif_api_docker.mjs` (app Docker, AUTH_ENFORCE=on).

## Soldage des BDT, demande d'achat et PV de non-conformité depuis la Production (15/09/2026)

**Demande** : « les soldages de BDT ne fonctionnent pas. Seules les personnes habilitées à écrire dans la
production ou l'opérateur ayant reçu le BDT peuvent le solder. […] il annonce un problème dans la matrice des
compétences. Il faut dans la production que les personnes habilitées à écrire puissent instruire des
non-conformités librement en la rattachant à une affaire ou pas pour que ça aille ensuite dans la liste des NC
en qualité. […] l'ouverture d'un PV [est] un bouton juste à côté de la demande d'achat ; pour la demande d'achat
seules les personnes ayant l'autorisation d'écriture sur la production peuvent en faire une depuis ici. […] il
faut aussi afficher le formulaire de demande d'achat dès qu'on appuie sur le bouton ». Contrats des routes :
`07-api-reference.md` (section « Production (15/09/2026) »). Aucune migration.

| Fichier | Rôle |
|---|---|
| `src/soldage_bdt.ts` (nouveau) | règles **pures** du soldage : `droitSoldageBDT`, `autorisationsFonctionnelles`, `avertissementCompetence`, `heureFinValide`, `nomSalarie`, `MSG_SOLDAGE_RESERVE` |
| `src/prod_da_nc.ts` (nouveau) | règles **pures** de la DA et du PV de NC (identification, droit, validation, rattachement, numérotation, charge utile, quarantaine, `dateAtelier`, `colonneAbsente`) **et** les deux formulaires (HTML + JS client) : `blocDaNcProduction`, `refFormulairesProd` |
| `src/index.tsx` | route `/solder` réécrite ; `/recu` élargie à l'écriture Production ; `signataireProduction`, `insererNumeroteAvecRepli` ; `demande-achat-operateur` réécrite ; `POST /api/production/nc` ; `operateur-contexte` **supprimée** ; `non-conformites` revérifie l'écriture Qualité ; PATCH RH ; cockpit Direction ; `nextSeqId(prefix, ids, year?)` |
| `src/queries.ts` | `verifySalariePinStricte`, `lireLignesStricte`, `lireToutesLignesStricte` (pagination) ; `ncEstClose` reconnaît « Soldé » |
| `src/auth.ts` | `SELF_SERVICE_RE` : + `demande-achat-operateur`, + `nc`, − `non-conformites` ; `serviceFor('/api/production/non-conformites') = 'qualite'` |
| `src/prod.tsx` | fenêtre de soldage (aide, « Reçu par », anti double clic) ; ancien bouton / fenêtre / JS de la DA remplacés par `blocDaNcProduction(...)` |

### Soldage d'un BDT : pourquoi personne ne pouvait solder

Reproduit sur la base Docker (jeu `-TEST-SOLD-`, supprimé et relu) :
1. **Matrice de compétences** — RH › Compétences enregistre `competences_operateur.operation` = l'**identifiant du
   process** (`proc-man-s1`, `PROC-2026-018`… ; `rh_service.tsx`, `buildOpsForMatrix` : `code = p.id`). L'ancien
   contrôle de `/solder` comparait cette valeur au **libellé** d'opération du BDT (« Ebavurage / Finition SEEM ») :
   égalité impossible. Le refus « n'est pas habilité(e) à solder … (matrice de compétences) » tombait dès qu'un
   opérateur avait **au moins une ligne** dans la matrice — 20 opérateurs actifs sur 22.
2. **Signataire** — cherché par `verifyOperateurPin`, qui filtre `est_operateur = true` : un chef de production
   (fiche `production` ou `direction`, `est_operateur = false`) obtenait « Matricule ou code PIN incorrect ».

### Règle de soldage (`droitSoldageBDT`, `POST /api/production/bdt/:id/solder`)

- **Signataire** : matricule + PIN de **tout salarié actif** (`verifySalariePin`). La route reste self-service (borne
  partagée) : la personne connectée n'intervient pas, c'est le salarié du PIN qui est jugé.
- **Voie `ecriture_production`** : le signataire a l'**écriture Production**, calculée comme au login
  (`sessionDeSalarie` : rôles = `roles` sinon `[role]` ; droits = `autorisations` non vides sinon
  `autorisationsUnion(rôles)` ; puis `peutEcrireService(…, 'production')` — `all`, rôle `production`, jeton
  `ecrire:production`). Il solde n'importe quel BDT reçu, y compris celui reçu par un autre.
- **Voie `operateur_recu`** : le signataire est l'opérateur qui a **reçu** le bon (`bons_de_travail.operateur_id`,
  posé par `/recu`) **et** sa fiche porte l'autorisation fonctionnelle `soldage` (ou `all`). `autorisationsFonctionnelles`
  ignore les jetons `lire:`/`ecrire:` ; une fiche qui n'a qu'eux (ou rien) vit sur les autorisations de ses rôles.
  **Garde OAS** conservée sur cette voie seulement : un opérateur OAS pur (sans `soldage`, `autorisationsPourRole`
  « oas : PAS de soldage BDT ») reçoit un 403 qui cite l'OAS ; la voie écriture Production reste ouverte.
- Sinon **403** `MSG_SOLDAGE_RESERVE` : « Seuls l'opérateur qui a reçu ce BDT ou une personne habilitée à écrire en
  Production peuvent le solder. »
- **La matrice ne bloque plus** : `avertissementCompetence` compare les lignes de l'opérateur **qui a reçu** le bon
  au `process_id` **et** à l'ancien libellé ; niveau ≥ 1 requis ; aucune ligne pour lui = rien à signaler. Le résultat
  part dans `avertissement` (notification orange), le soldage est enregistré. `bypass_competence` n'existe plus.
- **Ordre des contrôles** : 400 matricule/PIN → 400 heure de fin `HH:MM` (`heureFinValide`) → 401 PIN → 503 lecture
  stricte (`getBDTStrict`) → 404 → 409 déjà soldé → 409 pas « Reçu » (le serveur ne le vérifiait pas) → 403 droit →
  500 écriture → **409** si le bon a changé entre la lecture et l'écriture (`majBDTConditionnelle(id, patch,
  { statut: 'recu' })` : deux soldages simultanés ne passent pas tous les deux).
- **Traçabilité** : `bons_de_travail.operateur_id` (celui qui a reçu, base du coût réel `coutReelBdt`) **n'est jamais
  réécrit**. Le **soldeur** est porté par l'historique opérateur (et machine), le PV d'autocontrôle et la NC éventuelle
  (`detecteur`). La table d'historique n'ayant pas de colonne « opérateur d'origine », quand soldeur ≠ réceptionnaire
  le PV ajoute « BDT reçu par X, soldé par Y (écriture Production) » à ses observations.
- **Réponse 200** enrichie : `operateur` (soldeur), `operateur_id`, `voie`, `recu_par {id, nom}`, `avertissement`.
- **Écran** (`pageServiceProd`, `#soldageModal`) : aide `#s_qui` « qui peut solder », ligne « Reçu par », textes de la
  base échappés (`ccEsc`), message du serveur affiché tel quel (réponse non JSON comprise), PIN effacé sur refus,
  bouton `#s_solder_btn` **désactivé pendant l'envoi** (`aria-busy`, anti double clic), « (reçu par X) » dans la
  notification de succès.
- **Cause voisine corrigée côté RH** : `PATCH /api/rh/salarie/:id` avec `acces_services` sur une fiche aux
  autorisations **vides** partait d'une base vide → la fiche ne gardait que des jetons et perdait `pointage`,
  `soldage`… au login. La base est désormais `autorisationsUnion(rôles de la fiche)`.

### Réception d'un BDT par une personne qui écrit en Production (`POST /api/production/bdt/:id/recu`)

Conséquence directe de la règle de soldage, tranchée dans le même lot (option 1 de la revue) : `/solder` exige un bon
« Reçu », or `/recu` ne reconnaissait que les fiches `est_operateur` — un chef d'atelier ne pouvait donc jamais solder un
bon qu'**aucun opérateur** n'avait reçu.
- **Signataire** : `verifyOperateurPin` d'abord (inchangé pour les opérateurs) ; à défaut `verifySalariePinStricte` et
  `ecritEnProduction` — un salarié actif qui écrit en Production (chef d'atelier, direction) reçoit aussi le bon. PIN juste
  mais ni opérateur ni écriture Production → **403** « Seuls un opérateur ou une personne habilitée à écrire en Production
  peuvent recevoir un BDT. » ; lecture des salariés en échec → **503** (seulement sur cette 2ᵉ voie).
- **`operateur_id` = le signataire**, comme pour un opérateur : le chef qui reçoit **devient le réalisateur** du bon.
  Conséquences : le temps réel est valorisé à **son** coût chargé RH (`coutReelBdt`), la ligne « Reçu par » de la fenêtre
  de soldage le nomme, et l'avertissement de la matrice porte sur lui (aucune ligne de matrice ⇒ aucun avertissement). Il
  n'existe pas de « recevoir pour le compte d'un opérateur » : pour tracer l'opérateur, c'est l'opérateur qui reçoit.
- Inchangé : mauvais PIN → **200** `{ok:false}` (sans code d'erreur HTTP, historique), 409 hors planning / déjà reçu /
  déjà soldé, porte OAS, heure de Paris. ⚠ L'écran n'a pas changé : la fenêtre de réception s'intitule toujours
  « Identification opérateur ».

### Demande d'achat depuis la Production

**Pourquoi le formulaire ne s'affichait pas** (reproduit au navigateur sur Docker) — trois verrous en série :
1. la fenêtre ne montrait que « Matricule / PIN / Identifier » ; le formulaire (`#oda-context`) restait masqué jusqu'à
   une identification réussie ;
2. l'identification (`POST /api/production/operateur-contexte`, **supprimée**) exigeait une affectation à un poste
   **le jour même** (`affectation_poste`, vide depuis le 10/07) → 403 « Vous n'êtes affecté à aucun poste
   aujourd'hui » pour tous, et passait par `verifyOperateurPin` → 401 pour un chef d'atelier non opérateur ;
3. ces routes n'étaient pas self-service : un compte d'atelier en lecture seule sur la Production était refusé par le
   middleware avant la vérification du PIN.

**Maintenant** : `#oda-hdr-btn` → `odaOpen()` ouvre **le formulaire complet**, focus sur le matricule ; l'identification
est vérifiée **à l'envoi**. `POST /api/production/demande-achat-operateur` (même URL, contrat changé) :
- `signataireProduction(b, MSG_DA_RESERVE)` (commun avec la NC) : `lireIdentification` (400 `champ`) →
  `verifySalariePinStricte` (salarié actif ; **panne = 503**, jamais « PIN incorrect » ; joker `%` `_` refusé) → 401 →
  `ecritEnProduction` (403 « Seules les personnes habilitées à écrire en Production peuvent faire une demande d'achat
  depuis la Production. »). Un non-habilité n'apprend donc rien du formulaire.
- `validerSaisieDaProd` (400 `champ`) : nature `matiere|accessoire|machine`, article ≤ 200, référence ≤ 80, quantité
  > 0 (virgule acceptée), unité de la liste `UNITES_DA`, machine obligatoire pour « Machine », priorité, livraison
  souhaitée pas dans le passé (**jour de l'atelier**, `dateAtelier()` = Europe/Paris), fournisseur ≤ 120.
- Machine, poste et affaire **relus en base** (`lireLignesStricte`, 503 si panne ; 400 si inconnus). Le poste d'une
  machine prime sur le poste choisi.
- Ligne `demandes_achat` (`payloadDaProd`) : `demandeur` « Prénom Nom (Production) », `type_da` Matière | Accessoire |
  Machine, `article` « désignation (réf. X) », `qte` « 12,5 kg », `statut a_traiter`, `visible`, `genere_par_adt false`,
  `type_bc fournisseur`, `livraison`, `fournisseur`, `categorie`, `machine_id` (seulement pour « Machine » : c'est lui
  qui envoie le prix sur l'OPEX à la réception), `poste_id`, `operateur_id` = salarié authentifié, `num_affaire`,
  `affaire_id` (commande, sinon `resolveAffaireId`). `demandes_achat` n'a **ni colonne référence ni unité** : elles
  voyagent dans `article` et `qte` (aucune colonne inventée).
- Numéro `DA-AAAA-NNN` : `nextSeqId('DA', ids, annee)` (nouveau paramètre `year`, année de l'atelier) sur une lecture
  **paginée** (`lireToutesLignesStricte`) — PostgREST plafonne chaque réponse à `PGRST_DB_MAX_ROWS` (1000) sans le dire.

### PV de non-conformité depuis la Production

- **Bouton** `#pvnc-hdr-btn` (rouge, triangle) **juste à côté** de « Demande d'achat », dans `#prod-hdr-actions`
  déplacé dans `#svc-hdr-bar`. Fenêtres `#odaModal` / `#pvncModal` rangées **hors des panneaux** : ouvrables depuis
  n'importe quel onglet ; Échap et Annuler ferment et effacent le PIN ; champ fautif surligné et focalisé à partir du
  `champ` renvoyé (`pfErreur`, ids `<prefixe>_<champ>`) ; envoi unique (`pfEnvoyer` désactive le bouton) ; toutes les
  notifications passent par `pfEsc`.
- **Données injectées** : `PRODFORM_REF = refFormulairesProd({commandes, lots, bdts, machines, postes})` en `sjX` —
  affaires = commandes non annulées ayant un `num_affaire` ; lots rattachés à une de ces commandes ; BDT non annulés
  rattachés à une affaire ; machines groupées par poste ; postes non inactifs. Les listes Lot et BDT se filtrent par
  affaire ; choisir un BDT complète le lot et le code pièce.
- **Champs** (`validerSaisieNcProd`) : entité* (Seem | Semrac), description* (≤ 4 000), date du constat (≤ aujourd'hui
  **atelier**, défaut aujourd'hui), type (Interne | Client | Fournisseur, défaut Interne), gravité (défaut Majeure),
  affaire / lot / BDT (facultatifs), code article ≤ 80, désignation ≤ 200, pièces (entier > 0), lieu de détection,
  imputation, nature, nature de la cause, action immédiate — **mêmes listes que le formulaire Qualité** (`qref.ts`),
  sans casse, ramenées à la valeur canonique, jamais de valeur nouvelle —, cause présumée et traitement proposé
  (≤ 1 000), case quarantaine (exige lot, BDT, code article ou désignation).
- **Rattachement vérifié** (`rattacherNcProd`, revue du 15/09/2026) : affaire, lot et BDT relus ; si seul le BDT est
  saisi, **son lot est relu** ; la commande du lot et celle du BDT (`cmd_id`) aussi. Dès qu'une affaire est établie
  (saisie, ou déduite du lot / du BDT), chaque lot et BDT doit lui appartenir **de façon vérifiable** — par le
  `num_affaire` de sa commande, sinon par l'`affaire_id` de la commande. Invérifiable ou étranger → **400** (« Le lot X
  appartient à l'affaire A, pas à l'affaire B. », « Impossible de vérifier que le BDT Y appartient à l'affaire A (BDT
  sans affaire ni commande connues). »…). Raison : une NC Critique/Bloquante bloque les BL de son affaire et, par la
  sous-chaîne de `lot_ref`, ceux de l'affaire du lot — on ne recopie jamais un lot étranger. `affaire_id` ne vient que
  des commandes (sinon `resolveAffaireId`).
- **Ligne `non_conformites`** (`payloadNcProd`) : `statut 'Ouvert'` (1ʳᵉ valeur de `NC_STATUTS_LISTE`, comme la
  Qualité), `categorie 'prod'`, `entite`, `date_nc`, `type_nc`, `gravite`, `lot_ref`, `num_affaire`, `affaire_id`,
  `bdt_id`, `operation`, `client_nom`, `ref_article` (sinon pièce du BDT / du lot), `designation`, `nb_pieces`, les
  cinq listes, `description` = défaut + « Cause présumée : » + « Traitement proposé : » + « PV de non-conformité émis
  en Production par X (constat du JJ/MM/AAAA). », **`detecteur` = nom du salarié authentifié**.
- **Numéro** `NC-AAAA-NNN`, **compteur continu toutes années** (`prochainNumeroNc`, même règle que le formulaire
  Qualité) sur lecture paginée ; renuméroté **une fois** sur 23505. `insererNumeroteAvecRepli` retire une à une les
  colonnes **facultatives** absentes de la base (PGRST204 / 42703, avertissement « migration à jouer »), jamais les
  obligatoires (`COLONNES_NC_OBLIGATOIRES`, `COLONNES_DA_OBLIGATOIRES`).
- **Case quarantaine** : `createQuarantaine({nc_id, lot_id, piece, client_nom, date_mise_quarantaine, motif, statut:
  'en_cours'})` puis NC `statut 'quarantaine'` — même effet que `POST /api/qualite/nc/:id/quarantaine`. Échec →
  avertissement (« mettez le lot en quarantaine depuis Qualité › Non-conformités »), la NC reste créée.
- **Action immédiate « Rebut »** : `ensureHseDechet('nc_rebut', …)` (idempotent via `source_ref`), comme la création
  Qualité ; son erreur est **lue** (supabase-js ne lève pas) → avertissement « Rebut non inscrit au registre des déchets ».
- Réponse `{ ok, id, data, quarantaine_id, avertissements[] }` ; la NC apparaît dans **Qualité › Non-Conformités**
  (filtre Catégorie « Production »).

### Changements voisins
- **`POST /api/production/non-conformites`** (formulaire « Nouvelle NC » de la **Qualité**, URL historique) : **sorti du
  self-service** — PIN facultatif et aucun contrôle de droit, tout compte connecté (borne en lecture seule) créait une NC,
  même Bloquante. `serviceFor` la classe `qualite` et le handler revérifie `peutEcrireService(user, 'qualite')` (403
  explicite renvoyant au « PV de non-conformité » de la Production).
- **`ncEstClose`** reconnaît « Soldé » (`sold[ée](?!r)`, pas « à solder ») : c'est le statut de clôture de la liste
  Qualité, présent en base. Le cockpit Direction (`/direction/service`, `POST /api/direction/scan-alertes`) utilise
  désormais `ncEstClose` au lieu de deux regex divergentes : une NC Critique « Soldé » n'y est plus listée.
- **`dateAtelier()`** : « aujourd'hui » dans le fuseau de l'atelier (Europe/Paris, repli UTC) pour la date de constat, la
  date de quarantaine, `date_da`, la borne de livraison et l'année des numéros — le serveur est en UTC et le créneau
  Soirée passe minuit (entre 0 h et 2 h l'été, la date UTC est encore la veille).
- **`erp-docker.sh maj`** suffixe le commit gravé de `-dirty` quand `src`, `public`, `package*.json`, `tsconfig.json` ou
  `docker/app.Dockerfile` ont des modifications non commitées (l'image copie le dossier de travail) ; `/api/version`
  garde `-dirty` dans `commit_court`.

### Points ouverts
- **Tranché (réception par le chef)** : `/recu` accepte une personne qui écrit en Production, `operateur_id` = elle
  (voir ci-dessus). Variante écartée : passer directement `programme` → `solde` sur la voie écriture Production.
  ⚠ `/recu` écrit encore sans transition conditionnelle (`updateBDT` après une lecture de tous les BDT) : deux réceptions
  simultanées passent toutes les deux, la dernière fixe `operateur_id` et `debut_reel`.
- **À confirmer** : garde OAS (un OAS pur qui a reçu un BDT ne le solde pas) ; compte de secours BOOTSTRAP refusé (401)
  comme signataire du soldage, faute de fiche salarié.
- `verifySalariePin` (partagée, utilisée par `/solder`) n'est pas stricte : Supabase en panne ⇒ 401 au lieu de 503.
- `temps_reel` négatif si l'heure de fin précède `debut_reel` (poste de nuit, saisie erronée) : fausse le coût réel.
- Numérotation des NC : le formulaire Qualité (`/api/production/non-conformites`) lit encore `getNonConformites()`
  (plafonné à 1 000 lignes) ; d'autres créations (NC de soldage, de relevé…) utilisent `nextSeqId('NC')`, qui repart à 1
  chaque année — deux conventions cohabitent.
- `ncEstClose` compte aussi `trait` comme clos (« à traiter », « en traitement » passeraient pour clos ; absents
  aujourd'hui de `NC_STATUTS_LISTE`).
- Réédition d'une NC en Qualité : le select « Détecteur » (Opérateur, Contrôleur…) efface le nom de l'émetteur et le
  statut « quarantaine » — c'est pourquoi l'émetteur est aussi écrit dans la description.
- Pas de limitation des essais de PIN sur `/solder`, `/recu`, la DA et la NC (réutiliser `_loginBlocked` partagerait le
  compteur du login d'une borne en IP « local »).
- `PRODFORM_REF` embarque tous les BDT non annulés rattachés à une affaire : à surveiller si la table grossit.
- Docker : `salaries.est_operateur` n'est ni générée ni alimentée par un trigger ; un opérateur créé par l'API RH a
  `est_operateur = NULL` et ne peut pas recevoir de BDT. À vérifier en cloud.
- Anciennes fenêtres de soldage locales (`pageGanttBDT` de `prod.tsx`, `affectation.tsx`, pages redirigées) non touchées ;
  la matrice garde des lignes de niveau 0 (cellule remise à « — ») qui déclenchent l'avertissement.

**Tests** (scratchpads des agents, hors dépôt) : règles pures 22 (soldage) + 99 (DA/NC) + 61 (correctifs) ; API sur
la base Docker `AUTH_ENFORCE=on` 13 cas de soldage, 52 DA/NC, 33 correctifs (rattachement, rebut, quarantaine,
`non-conformites`, OAS, PATCH RH), 5 de pagination, base injoignable 2/2 en 503, cockpit Direction 4 ; Playwright 30 + 10
(boutons côte à côte, formulaire visible dès le clic, erreurs 401/403 dans la fenêtre, un seul envoi sur trois clics,
fenêtre contenue à 390 px, aucune balise injectée) ; `tsc` 0 ; harnais 60 PASS / 0 FAIL / 1 SKIP. Jeux `-TEST-`
supprimés et relus (compteurs revenus à l'état initial).

## Lot G : cadence usine par site, planning en heures ouvrées, chevauchement, remise en goulotte, process OAS (16/09/2026)

**Demande** : « modèles d'horaires de l'usine par cadence (Bas / Moyen / Haut) […] cadence par site (Seem, Semrac),
modifiable à tout moment · le dimanche est sauté, le samedi selon la cadence · le planning s'adapte à la cadence · les
5 process de la machine OAS : les marquer OAS · chevauchement sur un même poste : autorisé si les process sont
différents, refusé si c'est le même process · l'étape suivante devenue incohérente est remise en première position dans
la goulotte, avec un message préventif ». Réponses de l'utilisateur, modèles fournis et scripts à jouer :
`docs/CHANGELOG.md` (16/09/2026). Tables et colonnes : `03-base-de-donnees.md`. Contrats des routes :
`07-api-reference.md` (section « Lot G »). Mise en ligne : `02-exploitation-runbook.md` (`cloud-12`).

| Fichier | Rôle |
|---|---|
| `src/cadence.ts` | règles **pures** de la cadence (créneaux d'un jour, calendrier, heures ouvrées, validations serveur) + copie navigateur `CADENCE_CLIENT_JS` (objet global `CAD`) |
| `src/cadence_db.ts` | lectures / écritures strictes de `horaires_modeles` et `cadence_site` |
| `src/cadence_ui.ts` | volet « Cadence usine » + script commun de la page Production (`CADENCE_PAGE`, `cadCalendrier`, `cadHorairesCreneau`, `cadNotifierChangement`) |
| `src/planning_cadence.ts` | planning adapté à la cadence : heure fermée, intervalle en heures ouvrées, fin prévue, fenêtre d'un jour (copie client `==PLAN-CADENCE-DEBUT/FIN==`) |
| `src/poste_oas.ts` | G2 process OAS suivant et « Lots à venir », G3 chevauchement, G4 remise en goulotte (copie client `==POSTE-OAS-DEBUT/FIN==`) |
| `src/gamme.ts` | chemin critique avec une **horloge** (`tempsPlanning`) : grille 5 h–23 h ou heures ouvrées (copie client `ccHorloge` dans `==CC-MOTEUR==`) |
| `docker/db/migrations/014-cadence-usine.sql` · `docker/db/cloud/cloud-12-cadence-usine.sql` | tables, colonnes, amorce, données OAS |

### G1 · Cadence usine : données et règles (`src/cadence.ts`)
- **Tables** (014 / `cloud-12`) : `horaires_modeles` (niveau × jour 1–7 × créneau × partie, `debut`/`fin` « HH:MM »,
  `actif`) amorcée avec les **65 lignes** fournies ; `cadence_site` (site, niveau, `depuis` = moment de la décision,
  `effet` = jour d'application, `par`, `motif`), historique en **ajout seul**, amorce **Moyen** pour chaque site.
  Un créneau fermé un jour = aucune ligne **active** : une ligne ne s'efface jamais, elle se ferme (`actif = false`).
- **Conventions** (contrat pour la présence, la RH et le planning) : date `AAAA-MM-JJ`, calculs en UTC (ni fuseau ni
  heure d'été) ; heure = **heures décimales** (5.5 = 05:30) ; un segment qui passe minuit a `fin > 24` (Soirée
  21:00-05:30 → 21 → 29.5) et appartient au **jour où il commence** ; intervalles demi-ouverts `[debut, fin)` (à 13:15
  pile, le Matin 05:30-13:15 est fermé) ; **dimanche toujours fermé** quels que soient les modèles ; un segment du
  **samedi** qui passerait minuit est **coupé à 24:00** (la saisie le refuse, contrainte `NOT VALID` en base).
- **Cadence d'un site à une date D** (`ligneCadenceDuSite`, `niveauDuSite`) : la ligne de plus grand (jour d'effet,
  `depuis`) dont le jour d'effet ≤ D — jour d'effet = `effet`, sinon jour de Paris de `depuis` (lignes d'amorce) ;
  avant la toute première ligne : la première. **Cadence courante** = celle d'aujourd'hui à Paris : un changement dont
  l'effet est futur est « prévu » (`changementsPrevusCadence`), pas courant. Site sans ligne : `NIVEAU_DEFAUT` = Moyen.
  Index par site mémorisé (signature du tableau) et recherche par dichotomie : 1 300 horaires sur 800 lignes
  d'historique en moins de 300 ms, serveur comme navigateur.
- **Un niveau, un jour** : `creneauxDuJour` (segments ouverts triés), `plageOuverteDuJour`, `horairesCreneau` →
  `{ texte '05:30-13:15' ou '07:30-12:00 / 12:45-16:00', debut, fin, heures (pauses exclues), pauseMin }`,
  `horairesCreneauSite`, `libelleCreneauDuJour`.
- **Calendrier** (planning) : `calendrierCadence(donnees, activité ou sites)` — `Seem`/`Semrac` = un site, toute autre
  valeur (`both`, `OAS`, vide) = **union** des deux sites (ouvert si l'un travaille) ; `segmentsDuJour`,
  `intervallesDuJour`, `plageOuverteCalendrier` ; `estOuvert` (tient compte de la Soirée de la veille) ;
  `prochainInstantOuvert` ; `ajouterHeuresOuvrees(date, heure, h, cal)` (ne consomme que du temps ouvert, saute pauses,
  nuits et jours fermés ; départ sur du fermé = décompte au prochain instant ouvert ; fin pile en fin d'intervalle =
  cette fin, pas le jour ouvert suivant ; `null` si rien n'est ouvert sur 400 jours) ; `heuresOuvreesEntre`.
- **Copie navigateur** : `CADENCE_CLIENT_JS` (ES5, entre `==CAD-MOTEUR-DEBUT==` et `==CAD-MOTEUR-FIN==`) définit `var CAD`
  avec les mêmes noms et résultats (parité vérifiée sur 65 142 cas). Les validations serveur n'y sont pas.
  ⚠ Toute modification de `cadence.ts` se reporte dans la copie.
- **Base** (`src/cadence_db.ts`) : `lireDonneesCadence()` → `{ data, error, absente }`, lecture **paginée** par pages de
  1 000 (50 pages au plus, sinon erreur). `absente` = tables manquantes (cloud sans `cloud-12`) : repli toléré ;
  `error` sans `absente` = **panne**, jamais traitée comme « tout ouvert » ni « tout fermé ». `insererCadenceSite`,
  `insererModeleHoraire` (23505 = créée entre-temps), `majModeleHoraireSi(id, maj_le lu, patch)`.

### G1 · Écran « Cadence usine » (Production › Process Ateliers, 3ᵉ volet)
Bouton **« Cadence usine »** à côté de « Postes & Process » et « Machines » (`volShow('cad')`, lien direct
`/production/service?tab=machines&vol=cad`). Rendu par `src/cadence_ui.ts` (`voletCadenceBouton`, `voletCadenceHTML`,
`scriptVoletCadence`), données injectées par `scriptCadencePage(lecture)` juste après l'en-tête de la page.
- **Une carte par site** : cadence courante, « En vigueur depuis le … (décidé le … par …) », motif, **semaine type**
  (plage ouverte de chaque jour, « +1j » quand elle finit le lendemain), encadré **« Changement prévu »** pour un effet
  futur, bouton **« Changer la cadence »**.
- **Fenêtre de changement** (`cadOuvrirChangement`) : champ **« À partir du »** (demain par défaut, 62 jours de recul et
  400 d'avance au plus), niveau **en vigueur à cette date** désactivé, aperçu de la semaine type du niveau choisi, motif
  facultatif. Effet **aujourd'hui ou passé** : avertissement dans la fenêtre puis confirmation (`appConfirm`) — toute la
  journée passe dans la nouvelle cadence, heures déjà travaillées comprises. Écriture puis relecture (`GET`) et
  `cadNotifierChangement()` (présence, affectation, Gantt et volet redessinés).
- **Modèles d'horaires** : pastilles Bas / Moyen / Haut (sites dans ce niveau indiqués), tableau 6 jours × 5 colonnes
  (Matin, Après-midi, Soirée, Journée partie 1, Journée partie 2 après la pause), dimanche « Fermé (toujours) ». Deux
  champs heure par case, **croix** = fermer le créneau, « +1j » quand la fin précède le début. Les cases modifiées sont
  surlignées ; **seules elles** partent, avec le `maj_le` lu. Les saisies non enregistrées sont **conservées** quand le
  volet se redessine (retour sur le volet, changement de cadence) ; une case modifiée entre-temps par quelqu'un d'autre
  est signalée, pas écrasée. « Annuler les modifications » et le changement de niveau les abandonnent.
- **Historique** : À partir du · Décidé le · Site · Cadence · Par · Motif (changements prévus marqués « prévu »).
- **Tables absentes** : bandeau « jouez cloud-12 », pas de tableau, aucune écriture. **Panne** : bandeau d'erreur.
- **Validations serveur** : `validerModelesNiveau` (HH:MM, début ≠ fin, 16 h au plus par segment, partie 2 réservée à la
  Journée, une partie de Journée ne passe pas minuit, dimanche jamais ouvert, samedi sans nuit, 35 cellules au plus)
  puis `planModeles` refuse aussi une Journée dont la partie 2 est ouverte sans la partie 1, ou commence avant la fin
  de la partie 1 (400), et prépare les écritures (insert ou mise à jour
  **conditionnelle** sur `maj_le` ; un conflit en cours d'écriture → 409 `partiel` avec ce qui est passé) ;
  `validerChangementCadence` + `decisionChangementCadence` (effet absent = lendemain ; effet ≤ aujourd'hui sans
  `confirme_retroactif` → 409 `confirmation_requise` ; `niveau_lu` comparé au niveau **à la date d'effet**, sinon 409
  « modifiée entre-temps » ; même niveau → 409).
- **Droits** : lecture = lecture Production (`GET /api/production/cadence`, `…/calendrier`) ; écriture = **écriture
  Production**, contrôlée par le middleware puis revérifiée dans le handler (`droitEcritureProduction` → 403
  « Modifier la cadence usine ou ses modèles d'horaires est réservé à l'écriture Production. »).

### G1 · Créneaux : les horaires viennent de la cadence du site et du jour
- `SHIFTS` (`src/shared.ts`) garde **identifiants, libellés et couleurs** (Matin, Journée, Après-midi, Soirée). Ses
  horaires ne sont plus qu'un **repli** quand la cadence est illisible. `libelleCreneau()` (`src/presences.ts`) rend le
  **libellé seul** (« Soirée », plus « Soirée 22h-6h ») ; `paletteCreneaux()` ne porte plus d'horaires.
- **Présence** (onglet Présence opérateurs) : `cadHorairesCreneau(activite, date, creneau)` → `{ ouvert, texte, niveau,
  secours, parSite }` (un opérateur « both » : « Seem 05:30-13:15 · Semrac fermé »). Menu d'une case : horaires du site
  de l'opérateur ce jour-là ; créneau fermé **grisé** « fermé · cadence Moyen » et refusé côté client **sans requête**.
  Une case déjà enregistrée sur un créneau fermé depuis s'affiche en **pointillés rouges** (jamais effacée) ; un jour
  sans aucun créneau ouvert affiche « fermé ». « Programmer la semaine » **saute** les cases fermées et compte ce qu'elle
  n'a pas programmé.
- **Serveur** `POST /api/production/presence` : site = `salaries.entite` de l'opérateur (sinon `activite` du corps) ;
  `controlePresenceCadence` → **409** `{ creneau_ferme: true, niveau, error: « Créneau « Matin » fermé en cadence Moyen
  ce jour (samedi 19/09/2026, site Seem) : choisissez un créneau ouvert ou changez la cadence (Production › Process
  Ateliers › Cadence usine). » }`. « absent » et un opérateur sans site de cadence ne sont jamais refusés ; tables
  absentes : accepté avec `avertissement` ; panne de lecture : **503**, rien d'enregistré.
- **Planning d'affectation** : `planCreneaux(activite)` rend les horaires du jour affiché, un indicateur fermé et le
  niveau ; les sous-cases d'un poste fermées ce jour-là sont **grisées** (infobulle), les colonnes d'opérateurs portent
  les horaires. ⚠ `POST /api/planning/affectation-poste` ne refuse **pas** un créneau fermé (non demandé).
- **RH › Gestion des temps** (`pageRHTemps(…, dbCadence)`, route `/rh/temps`) : arrivée, départ, pause et heures d'une
  présence = horaires du créneau dans la cadence du site **ce jour-là** ; `heuresPresence` = amplitude − pause (pause de
  la Journée, sinon **30 min au-delà de 6 h**, la règle d'avant le lot G) : Matin 05:30-13:15 = 7,25 h, Journée
  07:30-12:00 / 12:45-16:00 = 7,75 h. « Validé par » dit la source (« Planning présence · cadence Moyen ») ; créneau
  fermé depuis ou cadence illisible : horaires par défaut, signalés.
- **RH › Employés** : colonne et champ « Shift » sans horaires, infobulle qui renvoie à la cadence.

### G2 · Process OAS : données, badge « → OAS », « Lots à venir »
- **Données** (partie 4 de 014 / `cloud-12`) : les process rattachés à une **machine d'activité OAS** deviennent
  `est_oas = true`, `activite = 'OAS'`, poste = poste de la machine, `taux_horaire_machine = null` (un NOTICE par
  ligne, avant → après). **Garde-fou** : si l'un d'eux ne porte pas un nom de traitement de surface (Surtec,
  désoxydation, oxydation, lavage, OAS), **rien** n'est modifié (WARNING avec la liste ; marquage à la main : Process
  Ateliers › crayon › type OAS). Les process nommés comme un traitement de surface mais hors machine OAS sont listés,
  pas modifiés. Docker : Desoxydation, Lavage, Oxydation Noire, Oxydation Incolore, Surtec 650 (machine
  MACH-2026-020 « Palan OAS », poste OAS) — `activite` both/Seem → OAS, taux 90 → null.
- **Conséquences écran** : la gamme du BE propose les process d'activité « OAS » sur les **deux** sites
  (`src/be.tsx`) ; RH › Compétences les garde visibles avec les filtres Seem et Semrac (`rhFilterMatrice`).
- **Badge « → OAS : <process> »** : `GET /production/service` calcule `oasSuivantParBdt` — nomenclature **validée**
  d'indice le plus élevé dont `code_ref_produit` = pièce du BDT, étapes **consécutives** `est_oas` (sur l'étape ou sur
  le process) juste après le rang `seq` du BDT — et pose `oas_suivant: string[]` sur chaque BDT `oas_apres`. Client :
  `ppBadgeOas` (carte de goulotte) et `ppBadgeOasBarre` (barre), libellé « → OAS : Desoxydation › Oxydation Incolore »,
  **repli « → OAS »** si la gamme ne le dit pas.
- **Service OAS › Lots & Balancelles › « Lots à venir »** (`lotsAVenirOas`, section `#oasLotsAVenir` de
  `pageServiceOAS(…, dbLotsAVenir)`) : une ligne par étape `oas_apres` (lot + `seq`, morceaux compris) **posée ou
  reçue** et pas entièrement soldée. Colonnes : Lot / affaire, Client, Pièce, Quantité (`lots.qte`), Process OAS
  suivant, BDT précédent (+ opération), **Fin prévue** (date + heure ; « aujourd'hui »), Statut du BDT (Programmé /
  Reçu). Fin prévue = la plus tardive des morceaux posés : début (reçu : début réel, jour de `recu_le`) + durée en
  **heures ouvrées** de la cadence du site (`ajouterPourOp`) ; les morceaux restés en goulotte sont comptés à part
  (« n morceaux encore en goulotte (non comptés) »). Tri par fin prévue. Cadence illisible : grille 5 h–23 h ; la page
  OAS n'est **jamais** bloquée.

### G3 · Même process, même poste : pas de chevauchement
- **Règle** (`chevauchementsMemeProcess`) : un BDT **occupe** son poste (`bdtOccupePoste`) s'il est posé (négation
  d'`enGoulotte`) ou reçu — ni soldé, ni annulé, ni sous-traité. Deux BDT du **même `process_id`** (un process n'a qu'un
  poste) ne se chevauchent pas ; des process différents sur le même poste, si. Intervalle = [début, fin[ en **heures
  ouvrées** du site (`intervallePosteOuvre` : début reporté au prochain instant ouvert, fin = début + durée ou
  `temps_alloue` ouvrées ; 6 h si le BDT n'a pas d'heure) ; grille : heures brutes (jour × 24 + heure + durée).
- **409** : « Le poste Usinage Stama porte déjà un BDT du même process (BDT-…) de 08:00 à 11:00 : décalez la pose ou
  choisissez un autre process du poste. » + `chevauchement: [{ id, date, debut, fin }]` (positions absolues, jour × 24 +
  heure).
- **Où** : `POST /api/production/bdt/:id/affecter` (sur la position finale, calage compris, avant toute écriture) ;
  `PATCH /api/production/bdts/:id` seulement si `process_id`, `duree` ou `temps_alloue` changent, ou si le BDT se met à
  occuper le poste (une réception ou un soldage ne bute jamais sur un chevauchement hérité) ; `POST
  /api/production/bdts` créé posé. Client : `affectBDT` refuse **sans appel** (`ppChevauchements`) et montre la barre en
  conflit (`ppMontrerConflit`).
- **Course entre deux écrans** : après l'écriture, `chevauchementApresEcriture` relit les BDT du process ; s'il en trouve
  un **écrit avant** (`updated_at` plus ancien, à égalité identifiant plus petit) qui chevauche, l'écriture est annulée
  par une mise à jour **conditionnelle** (sur le `updated_at` écrit) → 409 `{ chevauchement, course: true, annule }`.
  `POST /bdts` : le BDT reste créé mais dans la goulotte → 409 `{ …, cree_en_goulotte }` (géré par l'écran).
- Lecture `lireBDTsDuProcess` stricte (`statut not in (a_programmer, solde, st)`, 5 000 lignes) : panne → **503**.

### G4 · Déplacer une étape : les étapes suivantes devenues incohérentes retournent en goulotte
- **Plan** (`planRemiseGoulotte`, copie client `ppPlanRemiseGoulotte`) : étapes du lot de `seq` ≥ la cible, **posées**
  (ni goulotte, ni reçues, ni soldées), en violation du chemin critique **après** le déplacement et **pas avant**
  (une violation déjà présente reste seulement signalée). Propagation : chaque étape retirée est placée
  **virtuellement à son au plus tôt** pour juger la suivante, en cascade jusqu'à stabilité. Les BDT **reçus** rendus
  incohérents vont dans `signaler` (jamais retirés, jamais bloquants à eux seuls) ; un BDS ne se retire jamais.
- **Serveur** : sans `deprogrammer_successeurs` (`true`, ou la liste des id confirmés qui couvre le plan) → **409**
  `{ error: message préventif, successeurs_a_deprogrammer: [{id, message}], successeurs_recus_signales }`. Avec l'accord :
  le BDT est déplacé **puis** chaque successeur est déprogrammé par `deprogrammerBDTSiInchange` (conditionnel sur
  `statut`, `date_prevue`, `process_id`, `debut` et `updated_at` lus ; écrit `remis_goulotte_le = maintenant` si la
  colonne existe, réessai sans elle sinon). Réponse : `successeurs_deprogrammes`, `remis_goulotte_le`,
  `successeurs_recus_signales`, `avertissement` (« Remis en goulotte : BDT-… », « Non remis en goulotte (toujours
  signalés) : … », « Colonne remis_goulotte_le absente (migration 014 / cloud-12 à jouer) … »).
- **Routes** : `/affecter`, `PATCH /bdts/:id` (si `process_id`, `duree`, `temps_alloue`, `statut`, `operateur_id`, `seq`,
  `lot_id` ou `lot_ref` changent réellement), `POST /bst/:id/affecter-st` (409 **avant** la création du BC). ⚠ Pas
  appliqué : `POST /bdts` créé posé (G3 seulement), `PATCH /api/production/bds/:id`, `POST /api/production/bst/affecter`.
- **Écran** : `affectBDT` et `bstAssignDay` calculent le plan **avant** d'envoyer → `ppConfirmerRemise` (`appConfirm`
  « Remettre en goulotte », bouton **« Déplacer et remettre en goulotte »** ; seulement des reçus : « Étape déjà
  reçue » / « Déplacer quand même ») ; annuler = rien ne bouge. Si le serveur voit d'autres successeurs (planning
  périmé), même message puis renvoi, les accords s'**accumulent** (`ppUnionIds`). `ppAppliquerRemise` remet les
  successeurs en tête ; `pendSort` trie la goulotte par `remis_goulotte_le` décroissant **avant** l'échéance ; badge
  rouge **« Remis en goulotte »** (infobulle « Déprogrammé automatiquement le … : une étape précédente du lot a été
  déplacée. À reprogrammer. »). Un BDT reposé repart avec `remis_goulotte_le = null`.
- La carte « Enchaînements à revoir » garde la règle du lot C (BDT reçus ignorés) : les reçus ne sont signalés qu'au
  moment d'un déplacement.

### G5 · Planning en heures ouvrées de la cadence
- **Horloge** (`src/gamme.ts`) : `tempsPlanning(source)` → `TempsPlanning { cadence, ajouter, versDebut, position,
  retourSt, jourPlanning, debutFenetre, calendrier }`. `DonneesCadence` → heures **ouvrées** ; `null` → **grille** 5 h–23 h
  du lot C (`ajouterHeuresPlanning`) ; une horloge déjà construite est rendue telle quelle (calendriers mémorisés par
  site, une horloge par requête). Dernier argument facultatif `cadence` sur `auPlusTot`, `controleEnchainement`,
  `heureEntiereChemin`, `violationsEnchainement`, `successeursEnViolation` : absent = grille (comportement du lot C).
  Site d'une opération : `cleSiteCadence(op)` = `Seem`, `Semrac`, sinon `both` (union).
- **Règles en heures ouvrées** (ce qui change par rapport au tableau C7) : le réglage ou la durée d'une étape consomme
  les heures **ouvertes de son site** ; l'au plus tôt qui tombe sur du fermé est reporté au **prochain instant ouvert du
  site de l'étape suivante** ; dimanche toujours sauté, samedi selon la cadence ; après un retour de sous-traitance, un
  BDT reprend à la **première ouverture** du jour de retour (un BST se contrôle au jour calendaire) ; si rien n'est
  ouvert sur l'horizon, c'est **dit** (« aucun créneau ouvert après … »), jamais ignoré.
- **Jour de planning** : la vue d'un jour D couvre `[D + debutFenetre(D), D+1 + debutFenetre(D+1)[`, où
  `debutFenetre` = heure pleine de la première ouverture du jour, deux sites confondus (5 h si le jour est fermé). La
  nuit de D appartient à D. Le serveur **cale** sur le même jour de planning — éventuellement après minuit, d'où
  **`cale_date`** (lendemain calendaire) — et **refuse** (409) un jour de planning antérieur.
- **Début réel d'un BDT reçu** (`debutBdt`, copie `ccDebutBdt`) : jour de Paris de **`bons_de_travail.recu_le`** (écrit
  par `POST /bdt/:id/recu`, réessai sans la colonne si la base ne l'a pas) + `debut_reel` ; BDT reçu avant la colonne :
  jour prévu, et en heures ouvrées le **jour voisin** si l'heure réelle est à plus de 12 h de l'heure prévue.
  `POST /bdt/:id/solder` ajoute 24 h quand l'heure de fin précède `debut_reel` (reçu 22:00, soldé 03:00 → 5 h).
- **Pose** (`src/planning_cadence.ts`, route `/affecter`) : `lireCadencePlanning()` → `{ temps, panne }` (tables absentes =
  grille sans refus ; **panne = 503** « Lecture de la cadence usine impossible (heures ouvrées non vérifiables) … ») ;
  `normaliserPose` ramène une heure d'axe ≥ 24 au lendemain calendaire (26 h le 15 → 2 h le 16) ; ordre des contrôles :
  chemin critique (refus ou calage) → **heure fermée** (`refusHeureFermee`, 409 `{ heure_fermee: true, error,
  prochain_ouvert }` : « Le poste Usinage Stama est fermé à cette heure (samedi 19/09 à 10h) en cadence Moyen (Seem) :
  posez le BDT sur un créneau ouvert — prochain : lundi 21/09 à 5h30. ») → G3 → G4. Repli « colonne `debut` entière »
  (cloud sans `cloud-4`) : l'heure arrondie est **recontrôlée** (heure fermée, G3) avant la réécriture. Succès :
  `horaires: 'cadence' | 'grille'`, `cale_date` à côté de `cale_a`. Même régime pour `POST /bdts` créé posé, `PATCH
  /bdts/:id` (champs G4) et `/bst/:id/affecter-st` (BST dans un lot). Site contrôlé = activité du process posé
  s'il est d'un seul site (elle est écrite sur le BDT), sinon celle du BDT.
- **Affichage** (script de `pageServiceProd`) : `PLAN_AXE` / `planMajAxe()` — l'axe du jour affiché va de la première
  ouverture du jour à la première ouverture du lendemain (Haut : 5 h → 5 h ; en-tête « 0h … 5h », repère de minuit) ;
  il s'**étend** si un BDT posé tombe hors de la plage ouverte (aucun BDT ne disparaît) ; un jour fermé garde une
  grille 5 h–23 h entièrement hachurée (« Fermé ce jour (cadence usine) » sur une ligne vide). **Hachures** par ligne
  selon le site du poste (`planFermesAxe` ; poste `both` = union), l'en-tête seulement là où **aucun** site ne travaille.
  `bdtOnDay` : un BDT est sur la vue qui contient son début ; `planJourVue` ouvre la bonne vue pour « Voir sur le
  planning » et `?focusBdt=`. **Dépôt** borné à la plage ouverte de la ligne (`planBornesDepot`) ; heure fermée à
  l'intérieur (pause, trou) refusée côté client sans appel, trait de visée rouge « · fermé » ; pose au clic à l'heure
  cliquée, y compris la nuit. **Bandeau** `#planCadenceInfo` : « Cadence usine du jeudi 17/09 : Moyen (Seem) · Bas
  (Semrac) · plage ouverte 04:30 → 05:30 (+1j) » + légende ; repli : « Horaires par défaut du planning (5h → 23h) : … ».
- **Barre qui traverse une fermeture — choix V1** : largeur = durée (heures de travail), jamais allongée ni coupée en
  morceaux. `planFinOuvree(b)` → `data-deborde` : **lune** = posée sur une heure fermée (données anciennes), **pause** =
  sa fin en heures ouvrées tombe après début + durée (fermeture traversée), **flèche** = la barre se poursuit après la
  vue du jour ; fin prévue en heures ouvrées dans l'info-bulle.
- **Cadence illisible** : tables absentes → grille 5 h–23 h, BDT au jour de leur date prévue, aucune heure refusée,
  bandeau « jouez cloud-12 » ; panne → même affichage, mais toute pose répond 503 ; page OAS jamais bloquée.
- **Enchaînements à revoir** (carte serveur `VIOL_CC`) et copie client calculés dans le même régime (heures ouvrées quand la
  cadence est lisible).

### Décisions et points ouverts
- **Actées** (réponses de l'utilisateur, 16/09/2026) : cadence **par site**, modifiable à tout moment, dimanche fermé,
  samedi selon la cadence ; planning, chemin critique et reports en heures ouvrées ; chevauchement refusé pour le
  **même process** seulement ; successeurs incohérents **remis en tête de goulotte** après un message préventif ; process
  de la machine OAS marqués OAS, badge « → OAS » et « Lots à venir » (aucune goulotte OAS). Haut jeudi/vendredi : Après-midi
  et Soirée amorcées avec les horaires du lundi (confirmé). Reliquat en PV Conforme : voir `expeditions.md` (tranché).
- **Choix faits, à confirmer** : date d'effet par défaut = **lendemain**, confirmation pour aujourd'hui ou le passé ;
  **samedi sans nuit** (saisie refusée, moteur coupé à 24:00) ; pause RH = pause de la Journée sinon **30 min au-delà de
  6 h** (`heuresPresence`) ; barre **V1** (largeur = durée, débordement signalé) ; une pose ou un calage de nuit écrit
  `date_prevue` = **lendemain calendaire** (les écrans hors planning voient le jour calendaire) ; les morceaux `-Mk` d'un
  BDT découpé (même process) ne peuvent plus se chevaucher sur le poste.
- **Limites connues** : modèles d'horaires **non historisés** (les modifier change aussi les calculs du passé : RH ›
  Temps, chemin critique, fin prévue OAS) ; deux changements de cadence simultanés passent tous les deux (la dernière
  ligne l'emporte) ; G3 après écriture repose sur `updated_at` (horloges de deux isolats Cloudflare) — pas de contrainte en
  base ; une présence enregistrée avant un changement de cadence sur un créneau devenu fermé est signalée, jamais effacée ;
  `POST /api/planning/affectation-poste` ne refuse pas un créneau fermé ; `PATCH /bdts/:id` qui change `process_id` ou
  `activite` d'un BDT posé ne contrôle pas l'heure fermée ; recoller une découpe ne passe pas par G3 ; poste `both`
  hachuré sur l'union des sites alors que le refus d'heure fermée suit le site du BDT (un BDT Semrac peut être refusé sur
  une heure non hachurée) ; BDT reçus avant `recu_le` : heuristique du jour voisin, travail de plus de 24 h sous-estimé au
  soldage ; `computeLotsOAS` (lots arrivés à l'OAS) regroupe encore par `lot_id` seulement ; `src/affectation.tsx` (page
  redirigée) garde sa copie de SHIFTS.

**Tests** (scratchpad du lot, hors dépôt) : `lotg/test_cadence.ts` 150 (créneaux par niveau et jour, nuit, heures ouvrées,
date d'effet, amorce identique 014 / cloud-12 / schema.sql, parité TS ↔ `CAD`), `lotg/test_oas_poste.ts` 141 (parité 3 946),
`lotg/test_planning_cadence.ts` 187 (cas du lot C rejoués en Haut, pause, Bas jeudi → lundi, nuit, samedi, sites
différents ; parité 9 452), `lotc/test_chemin.ts` 215 (régime grille), `lotg/e2e_cadence.mjs` 51 (routes réelles, tables
absentes puis vraies tables), `lotg/ui_cadence.mjs` 35 et `lotg/ui_planning_cadence.mjs` 33 (Playwright),
`revue_g/e2e_revue.mjs` 14 (Docker : `recu_le`, conditions de déprogrammation, propagation G4, reçus signalés, course G3 sur
4 essais simultanés, 1 007 lignes d'historique), `revue_g/http_docker.mjs` 9 (image reconstruite, `AUTH_ENFORCE=on`).
Jeux `-TEST-` supprimés et relus à 0.

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
`production` · `bdt` · `bds` · `planning` · `process` · `machine(s)` · `presence` · `cadence` · `sortie-matiere`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`commandes` · `lots` · `bons_de_travail` · `bons_sous_traitance` · `machines` · `postes` · `shifts` · `absences` · `operateur_presence` · `affectation_poste` · `process_atelier` · `horaires_modeles` · `cadence_site`
<!-- /auto -->
## Points d'attention
**Planning UNIQUE** : `/production/service`. L'ancienne page d'affectation par opérateur (`/production/planning`, `pageUnifiedPlanning`) et la sous-nav « Programmation | Affectation » ont été **supprimées** (2026-08-18, choix utilisateur : rester lean) ; la route redirige. Tout l'utile y était déjà : affectation opérateur→process par créneau (`affecterPoste`, sous-cases Matin/Journée/Après-midi/Soirée depuis le 14/09/2026), file d'attente, déprogrammation par retour dans la file.
- **Files d'attente AU-DESSUS de chaque planning** : « BDT à classer » (`#pendingList`) et « BST à planifier » (`#bstPendingList`, remonté au-dessus du Gantt).
- **Focus étape (clic sur un BDT/BDS)** : n'affiche plus tout le lot mais **l'étape cliquée + la précédente + la suivante** (3 lignes max). `etapesDuLot()`/`etapePostesSet()`/`etapeFocusLabel()` côté BDT, `bstEtapesDuLot()`/`bstLotFournSet()`/`bstEtapeLabel()` côté BST ; `focusLot`/`focusLotBst` contiennent désormais l'**ID du BDT/BDS** (et non la clé du lot). Les deux gammes sont **fusionnées** (BDT + BDS du même lot) pour que l'étape voisine sous-traitée soit nommée (« ST … » / « atelier … ») — sans ajouter de ligne au planning correspondant.
- ⚠ `bstLotKey()` accepte maintenant `lot_id` (avant `lot_ref` seul) pour rejoindre la clé BDT `lotId = lot_id ?? lot_ref`.
- BDT/BDS prioritaires (id BDTP/BDSP) encadrés rouge.
- **Découpe d'un BDT** (revue 13/09/2026) : **uniquement** depuis les ciseaux d'une carte de la goulotte → modale `splitModal` (rangée dans `#ppanel-gantt-bdt`, 2 à 12 morceaux, temps **libre** par morceau) → `POST /api/production/bdt/:id/separer` ; le BDT d'origine garde le 1ᵉʳ morceau, les suivants sont créés en `-M2`/`-M3`… dans la goulotte. Plus de clic droit sur le planning, plus de prorata ; un BDT posé sur le planning est refusé (409). ⚠ **Revu le 14/09/2026 (lot C)** : seul le temps de réalisation se découpe, le réglage reste sur le morceau 1, et une découpe s'annule (voir la section Lot C). ⚠ **Interface revue le 15/09/2026** : **jauge** du temps de réalisation V à répartir (un segment coloré par morceau, gris = reste à répartir, rayures orange = dépassement, réglage à part en bloc hachuré fixe) + **un curseur par morceau** (`input range` 0…V, pas 0,01 arrondi au quart d'heure par le JS avec aimant sur la valeur qui complète V ; champ en heures synchronisé ; clavier flèches ±0,25 h, Page ±1 h) ; aides « Répartir également » (centièmes entiers, le dernier prend le reste) et « Mettre le reste sur le dernier morceau » ; une somme ≠ V demande une **confirmation** (`appConfirm`) avant l'envoi. Contrat serveur inchangé (`{ realisation, reglage? }`). Fonctions : `splitJauge`, `splitRender`, `splitAimant`, `splitRepartirEgal`, `splitResteDernier`, `splitPretAEnvoyer`, `splitEnvoyer`.
- **Bandeau du service** (15/09/2026) : « Demande d'achat » et « PV de non-conformité » côte à côte (`#prod-hdr-actions`, `src/prod_da_nc.ts`), réservés à l'**écriture Production** du salarié qui signe par matricule + PIN. **Soldage** : l'opérateur qui a reçu le BDT **ou** une personne qui écrit en Production ; la matrice de compétences n'avertit plus que. **Réception** : un opérateur ou une personne qui écrit en Production (elle devient alors le réalisateur, `operateur_id`). Voir la section du 15/09/2026.
- **Lot G (16/09/2026)** : Process Ateliers a un 3ᵉ volet **« Cadence usine »** (cadence par site, modèles d'horaires, historique) ; les horaires de la présence, de l'affectation et de RH › Temps viennent de la cadence ; le planning BDT suit les **heures ouvrées** du site (axe du jour, heures fermées hachurées, dépôt refusé sur une heure fermée, chemin critique et fin prévue en heures ouvrées) ; deux BDT du **même process** ne se chevauchent pas sur un poste (409) ; déplacer une étape **remet en goulotte** les étapes suivantes devenues incohérentes après un message préventif (badge « Remis en goulotte », en tête) ; badge **« → OAS »** sur le BDT qui précède l'OAS. Voir la section « Lot G ».
- ℹ Cette fiche est **fusionnée, pas écrasée** par `scripts_doc/gen_module_fiches.mjs` : seuls les blocs `<!-- auto:… -->` sont régénérés depuis le manifeste ; ces points d'attention, écrits à la main, sont conservés.

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/production.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
