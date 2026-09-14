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
- **À faire trancher** : horaires réels de la Soirée (`SHIFTS`, table `shifts`, `SHIFT_HMS`, 73 lignes `soir`
  en base cloud) ; week-ends exclus ou non du chemin critique ; chevauchement de deux étapes sur un même
  poste ; bouton « Recaler la suite ».
- **Hors lot, connus** : `src/affectation.tsx` garde « Soirée/Nuit » (page redirigée) ; `retirerAffectation`
  avale ses erreurs ; affectations chargées sur 14 jours ; la capacité compte 8 h par présent quel que soit le
  créneau ; carte et badges calculés sur `getBonsDeTravail` (non paginé) — les décisions serveur, elles,
  lisent de façon ciblée ; un BDT calé tard peut déborder après 23 h (Gantt d'un jour) ;
  `bons_sous_traitance.predecesseur_fin` reste une colonne morte (tout est calculé à la volée).

**Tests** (scratchpad du lot, hors dépôt) : `test_chemin.ts` (moteur, parité serveur/client sur 4 420
comparaisons, écran en VM, routes Docker), `test_presences.mjs`, `test_reglage.ts`, `e2e_lotc.mts`
(phases B, G, RV, A sans colonnes, PANNE), `verif_api_docker.mjs` (app Docker, AUTH_ENFORCE=on).

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
**Planning UNIQUE** : `/production/service`. L'ancienne page d'affectation par opérateur (`/production/planning`, `pageUnifiedPlanning`) et la sous-nav « Programmation | Affectation » ont été **supprimées** (2026-08-18, choix utilisateur : rester lean) ; la route redirige. Tout l'utile y était déjà : affectation opérateur→process par créneau (`affecterPoste`, sous-cases Matin/Journée/Après-midi/Soirée depuis le 14/09/2026), file d'attente, déprogrammation par retour dans la file.
- **Files d'attente AU-DESSUS de chaque planning** : « BDT à classer » (`#pendingList`) et « BST à planifier » (`#bstPendingList`, remonté au-dessus du Gantt).
- **Focus étape (clic sur un BDT/BDS)** : n'affiche plus tout le lot mais **l'étape cliquée + la précédente + la suivante** (3 lignes max). `etapesDuLot()`/`etapePostesSet()`/`etapeFocusLabel()` côté BDT, `bstEtapesDuLot()`/`bstLotFournSet()`/`bstEtapeLabel()` côté BST ; `focusLot`/`focusLotBst` contiennent désormais l'**ID du BDT/BDS** (et non la clé du lot). Les deux gammes sont **fusionnées** (BDT + BDS du même lot) pour que l'étape voisine sous-traitée soit nommée (« ST … » / « atelier … ») — sans ajouter de ligne au planning correspondant.
- ⚠ `bstLotKey()` accepte maintenant `lot_id` (avant `lot_ref` seul) pour rejoindre la clé BDT `lotId = lot_id ?? lot_ref`.
- BDT/BDS prioritaires (id BDTP/BDSP) encadrés rouge.
- **Découpe d'un BDT** (revue 13/09/2026) : **uniquement** depuis les ciseaux d'une carte de la goulotte → modale `splitModal` (rangée dans `#ppanel-gantt-bdt`, 2 à 12 morceaux, temps **libre** par morceau) → `POST /api/production/bdt/:id/separer` ; le BDT d'origine garde le 1ᵉʳ morceau, les suivants sont créés en `-M2`/`-M3`… dans la goulotte. Plus de clic droit sur le planning, plus de prorata ; un BDT posé sur le planning est refusé (409). ⚠ **Revu le 14/09/2026 (lot C)** : seul le temps de réalisation se découpe, le réglage reste sur le morceau 1, et une découpe s'annule (voir la section Lot C).
- ℹ Cette fiche est **fusionnée, pas écrasée** par `scripts_doc/gen_module_fiches.mjs` : seuls les blocs `<!-- auto:… -->` sont régénérés depuis le manifeste ; ces points d'attention, écrits à la main, sont conservés.

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/production.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
