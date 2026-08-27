# Module Expéditions

<!-- auto:entete -->
- **Route** : `/expeditions/service` · **Fichier source** : `src/expeditions.tsx`
- **Accès (RBAC)** : écriture — expéditions, stock (logistique) · lecture — commercial, achats, production
<!-- /auto -->

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
`bl` · `bst` · `expeditions` (dont `POST /api/expeditions/bc/:id/date-arrivee` — change la date prévue en gardant l'initiale)

## Tables principales
`bons_de_commande` (`+ date_livraison_initiale`, `+ date_reception_reelle`) · `bons_de_livraison` · `factures_client`

## Points d'attention
- BL partiels → factures_client + écriture VTE. BL bloqué si porte qualité active.
- **OTD fournisseur/ST recalé sur `date_livraison_initiale`** (`kpi.ts` `fournisseurs()`, `queries.ts` `computeOtd`/`getFournisseurScorecard`) → une date repoussée ne « rachète » plus l'OTD. Tout est **fail-soft** : sans la migration `bc_arrivees_planning.sql`, l'OTD retombe sur `date_livraison` et la date se change quand même (l'initiale n'est simplement pas gelée). **Migration à appliquer au cloud** pour activer le gel en production.
- La date d'arrivée réelle est posée à la réception (`date_reception_reelle`, 1ʳᵉ réception) — sinon repli sur la date du BL de réception le plus tardif.

- **Réorganisation 2026-08-18 — 3 onglets** : `receptions` (arrivées : BC fournisseurs/ST, retours de sous-traitance, **retours clients**, arrivées enregistrées) · `envois` (départs : sous-traitance, BL clients, commandes prêtes) · `calendrier` (frise **arrivées + départs** + bloc « Aujourd'hui ») · `dashboard`. Socle commun : `collecterMouvements()` — les 3 vues sont des projections des mêmes tables.
- ⚠ **Bugs de câblage corrigés** : la route ne chargeait que `getBLClients()` → les BL `type_bl='reception'` et `'retour_client'` n'étaient **jamais** chargés (bloc « Réceptions effectuées » structurellement vide) ; les vrais BDS (`bons_sous_traitance`) n'étaient pas chargés du tout ; `TODAY` figé au chargement du module → date du jour passée **par requête** (`extra.today`).
- **Retour client** : annoncé en Qualité sur la NC (`retour_attendu`, `n_commande`, `qte_retour_attendue`, `date_retour_prevue`), réceptionné ici via `POST /api/expeditions/retour-client/:ncId/receptionner` → BL `type_bl='retour_client'` rattaché à la commande + NC marquée « reçu » (`bl_retour_id` ↔ `nc_id`). Migration `scripts_import/nc_retour_client_attendu.sql` — **fail-soft** via `ncHasRetourCols()` tant qu'elle n'est pas jouée en cloud.

### Onglet « Fournisseurs » (2026-08-24)
- 5ᵉ onglet, **à droite du Calendrier** : référentiel fournisseurs (liste filtrable, ajout, suppression) + par fournisseur ses **BC envoyés** et ses **BL reçus** (n°, date, **transporteur**, BC lié, affaire). Clic sur une ligne → `/commercial/affaire/:num`.
- Rendu par `panelFournisseurs(FOURNS, BCS, allBLs)` (`src/expeditions.tsx`). Réutilise `POST /api/achats/fournisseur` (création) et `DELETE /api/fournisseurs/:id` (suppression) — **aucun nouvel endpoint**.
- Route : `getFournisseurs()` ajouté au `Promise.all` ; `fournisseurs` passé via `extra`. `bcsView` porte désormais `fournisseur_id` et `num_affaire` (ils manquaient — sans eux ni le rattachement ni le lien affaire n'étaient possibles).
- **Rattachement BC → fournisseur** : par `fournisseur_id` si présent, sinon repli sur le **nom normalisé** (`fournisseur_nom`), car beaucoup de BC anciens ne portent pas l'id. BL joints par `bons_de_livraison.bc_id`, avec repli sur `bons_de_commande.bl_id`.
- 🐞 **BC annulés désormais exclus de TOUT le service** (`statut === 'annule'`), comme les BL l'étaient déjà : ils apparaissaient encore dans le Dashboard.
- ⚠ `bons_de_commande` : **DELETE anon bloqué par RLS** (retourne 200/204 sans effet), comme `bons_de_livraison` et `ordres_maintenance`. Une donnée de test doit être neutralisée (`statut='annule'`) puis supprimée en SQL depuis Supabase.
- ⚠ **Manifeste de captures corrigé** : il visait encore `#exp-tab-bl`, `#exp-tab-planning`, `#exp-tab-commandes`, supprimés lors de la réorganisation du 18/08 → 5 PNG périmés retirés, entrées réelles ajoutées (`envois`, `calendrier`, `fournisseurs`). Le **manuel HTML Expéditions a été entièrement réécrit** : il décrivait encore les 5 anciens onglets.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/expeditions.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
