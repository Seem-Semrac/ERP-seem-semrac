# Module Production

<!-- auto:entete -->
- **Route** : `/production/service` · **Fichier source** : `src/prod.tsx`
- **Accès (RBAC)** : écriture — production · lecture — be, achats, oas, qualité, sécurité, expéditions, stock, maintenance
<!-- /auto -->

## Goulotte du planning : matière + préparation technique — AU LOT (09/09/2026)

Un BDT n'apparaît au planning que si **sa matière est réceptionnée** (`matiere_ok`) **et** que **la préparation technique de SON LOT est terminée**.

⚠ **Changement de comportement.** Jusqu'au 09/09/2026 le blocage portait sur **l'affaire entière** : une seule préparation en attente gelait *tous* les lots de l'affaire, y compris ceux dont le plan et le programme CN étaient prêts. Il porte désormais sur le **lot**. Une affaire de trois pièces dont une seule attend son plan voit donc les deux autres partir en fabrication.

**Identification du lot sans migration** : le couple `(cmd_ref, piece)`. `lots.piece`, `preparations_techniques.piece` et `bons_de_travail.piece` sont écrits depuis la **même expression source** dans la cascade d'acceptation d'offre (`p.ref_interne || ref`) — la correspondance est exacte, à la casse près (comparaison en minuscules).

**Point d'entrée unique** : `bdtBlocage(bdt, prepRows)` dans `src/index.tsx` renvoie `null` (le BDT passe) ou le motif du blocage. `filtrerBdtsPrets()` l'applique aux deux consommateurs — `/production/service` et `/production/gantt-bdt` — qui dupliquaient auparavant la même expression de filtrage.

**Repli conservateur** : une préparation sans `cmd_ref` ni `piece` (ligne antérieure au 09/09/2026) bloque encore **toute son affaire**. Aucune régression possible sur l'existant.

**Lecture métier** : la fiche affaire (`/commercial/affaire/:num`, tableau « Production — lots ») affiche une colonne **Fabricable** par lot, avec le motif quand il est bloqué (*préparation technique*, *matière non réceptionnée*), et un compteur « N lot(s) prêt(s) · M en attente ».

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
