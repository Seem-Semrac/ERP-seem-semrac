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
- **Séparer** : bouton ciseaux sur chaque carte de goulotte, en plus du clic droit. `/separer` crée
  les morceaux **d'abord** (retour arrière `supprimerBDTRow` au moindre échec) et ne réduit
  l'original **qu'ensuite**. Les morceaux vont en goulotte, sans process ni jour. Le suffixe se
  calcule depuis la racine : `-M2`, `-M3`… sans collision de clé, et un morceau re-séparé ne donne
  plus `-M2-M2`. Avant, l'original était réduit en premier et les échecs d'insertion avalés.
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
- **Fractionnement d'un BDT CONSERVÉ** : menu contextuel « Séparer en morceaux » → modale `splitModal` (2 à 12 morceaux, contrôle de somme en direct) → `POST /api/production/bdt/:id/separer` ; le BDT d'origine garde le 1ᵉʳ morceau, les suivants sont créés en `-M2`/`-M3`… et retombent dans la file « BDT à classer ». Écart de somme → répartition **au prorata**.
- ℹ Cette fiche est **fusionnée, pas écrasée** par `scripts_doc/gen_module_fiches.mjs` : seuls les blocs `<!-- auto:… -->` sont régénérés depuis le manifeste ; ces points d'attention, écrits à la main, sont conservés.

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/production.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
