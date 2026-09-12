# Module Expéditions

<!-- auto:entete -->
- **Route** : `/expeditions/service` · **Fichier source** : `src/expeditions.tsx`
- **Accès (RBAC)** : écriture — expéditions, stock (logistique) · lecture — commercial, achats, production
<!-- /auto -->

## Réception → PV de contrôle → stock (11/09/2026)

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
- ⚠ **Deux chevauchements de files corrigés (09/09/2026)** — le même objet apparaissait dans deux cartes à la fois :
  1. *Réceptions › Retours de sous-traitance attendus* retenait aussi les BDS **pas encore partis** (`a_envoyer`, `a_planifier`, `planifie`), déjà listés dans *Envois › À envoyer en sous-traitance*.
  2. *Envois › Commandes prêtes à expédier* gardait les commandes **dont le BL est déjà préparé**, elles-mêmes listées dans *Bons de livraison à envoyer* — ce qui invitait à créer un **second** BL pour la même expédition.
  Les deux files étaient invisibles en production (tables vides), mais le défaut était réel.
- ⚠ **Ce ne sont PAS les doublons observés en base.** Le doublon visible (deux lignes `BC-TESTARB` identiques dans *En attente de validation fournisseur*) vient de **5 lignes de test** partageant le même `num_bc` — donnée, pas code. Les deux files de réception s'excluent correctement (`accuse_fournisseur_le` présent d'un côté, absent de l'autre), et *réceptions* / *retours client* se partagent proprement les BL par `nc_id`.
- ⚠ **Manifeste de captures corrigé** : il visait encore `#exp-tab-bl`, `#exp-tab-planning`, `#exp-tab-commandes`, supprimés lors de la réorganisation du 18/08 → 5 PNG périmés retirés, entrées réelles ajoutées (`envois`, `calendrier`, `fournisseurs`). Le **manuel HTML Expéditions a été entièrement réécrit** : il décrivait encore les 5 anciens onglets.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/expeditions.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
