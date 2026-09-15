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
NC « client » → bouton « Retour » → avoir / commande P. Porte qualité : BL bloqués (409) si quarantaine/NC bloquante. Capabilité via écart réduit → Cp/Cpk. QUARANTAINE : un lot issu d’une réception fournisseur (PV de contrôle non conforme) se tranche par « Décider » (POST /api/qualite/quarantaine/:id/decision-fournisseur) — renvoi au fournisseur, dérogation fournisseur ou entrée partielle en stock, compensé par un avoir (registre des Achats) ou un remplacement (le BC rouvre sa réception de la quantité non acceptée) ; la décision est réservée atomiquement (pas de double clic) et son motif est obligatoire. « Statuer » reste réservé aux quarantaines INTERNES et refuse un lot de réception (409).
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
| Dérogation fournisseur | tout le lot entre | `statut=libere_derogation`, `issue=derogation_fournisseur` | réfaction facultative → avoir |
| Entrée partielle | la part acceptée entre | `statut=libere`, `issue=entree_partielle` | le reste repart ou part au rebut (registre des déchets) |

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
- **Décision fournisseur** (`/api/qualite/quarantaine/:id/decision-fournisseur`) : pour un **BC à plusieurs
  articles**, l'entrée en stock se fait ligne par ligne et **seulement si toute la commande est acceptée** ; une
  entrée partielle n'est pas répartissable par article → avertissement « Stock non crédité » ou « Entrée en stock
  incomplète ». Le montant de l'avoir reste à 0 avec avertissement quand la quantité commandée du BC est vide.
- Valeurs `statut` / `decision` de `pv_controle` **inchangées** (contraintes CHECK du cloud) : `valide` / `libere`
  (conforme), `nc_ouverte` / `bloque` (non conforme).

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/qualite.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
