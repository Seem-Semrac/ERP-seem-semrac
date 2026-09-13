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
