# Référence API & routes

> **Fichier généré** par `node scripts_doc/gen_api_ref.mjs` — ne pas éditer à la main, **sauf** le bloc
> « Contrats détaillés » (entre les marqueurs `manuel:contrats`), conservé d'une génération à l'autre.
> Source : `src/index.tsx` (373 routes). Les numéros de ligne sont indicatifs (au moment de la génération).

## Routes API (240)

| Famille | Routes |
|---|---|
| `api/production` | 31 |
| `api/qualite` | 28 |
| `api/audit` | 16 |
| `api/achats` | 15 |
| `api/rh` | 11 |
| `api/offre` | 9 |
| `api/expeditions` | 8 |
| `api/demandes-prix` | 8 |
| `api/nomenclature` | 8 |
| `api/maintenance` | 7 |
| `api/plans` | 6 |
| `api/dt` | 5 |
| `api/be` | 5 |
| `api/produits-fournisseurs` | 5 |
| `api/ged` | 5 |
| `api/oas` | 5 |
| `api/clients` | 4 |
| `api/locks` | 4 |
| `api/bc` | 4 |
| `api/interlocuteurs` | 4 |
| `api/securite` | 4 |
| `api/references-clients` | 3 |
| `api/credits` | 3 |
| `api/export` | 3 |
| `api/environnement` | 3 |
| `api/direction` | 3 |
| `api/quarantaine` | 2 |
| `api/fournisseurs` | 2 |
| `api/sous-traitants` | 2 |
| `api/factures` | 2 |
| `api/factures-fournisseur` | 2 |
| `api/planning` | 2 |
| `api/controles` | 2 |
| `api/validations` | 2 |
| `api/kpi-objectifs` | 2 |
| `api/login` | 1 |
| `api/version` | 1 |
| `api/me` | 1 |
| `api/contact` | 1 |
| `api/catalogue-fournisseurs` | 1 |
| `api/commandes` | 1 |
| `api/produit-prix` | 1 |
| `api/ref-prix` | 1 |
| `api/atex` | 1 |
| `api/stock` | 1 |
| `api/commande` | 1 |
| `api/compta` | 1 |
| `api/pointage` | 1 |
| `api/commandes-p` | 1 |
| `api/prepa-technique` | 1 |

### api/production

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/production/bds/:id` | L6077 |
| POST | `/api/production/bds/:id/envoyer` | L6140 |
| POST | `/api/production/bds/:id/retour` | L6142 |
| POST | `/api/production/bdt/:id/affecter` | L6456 |
| POST | `/api/production/bdt/:id/deprogrammer` | L6490 |
| POST | `/api/production/bdt/:id/recu` | L6588 |
| POST | `/api/production/bdt/:id/separer` | L6508 |
| POST | `/api/production/bdt/:id/solder` | L6639 |
| POST | `/api/production/bdts` | L6058 |
| PATCH | `/api/production/bdts/:id` | L6048 |
| POST | `/api/production/bst/:id/affecter-st` | L6870 |
| POST | `/api/production/bst/affecter` | L6813 |
| POST | `/api/production/demande-achat-operateur` | L2202 |
| POST | `/api/production/machine` | L6915 |
| DELETE | `/api/production/machine/:id` | L7010 |
| PATCH | `/api/production/machine/:id` | L6978 |
| POST | `/api/production/machine/:id/panne` | L8652 |
| POST | `/api/production/machine/:id/reparer` | L8659 |
| POST | `/api/production/machine/reorder` | L6404 |
| POST | `/api/production/non-conformites` | L6144 |
| POST | `/api/production/operateur-contexte` | L2183 |
| POST | `/api/production/poste` | L6414 |
| DELETE | `/api/production/poste/:id` | L6435 |
| PATCH | `/api/production/poste/:id` | L6426 |
| POST | `/api/production/poste/reorder` | L6447 |
| POST | `/api/production/presence` | L7027 |
| POST | `/api/production/process` | L6361 |
| DELETE | `/api/production/process/:id` | L6389 |
| PATCH | `/api/production/process/:id` | L6377 |
| POST | `/api/production/process/reorder` | L6397 |
| POST | `/api/production/sortie-matiere` | L7314 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L8352 |
| DELETE | `/api/qualite/capabilite/:id` | L8381 |
| POST | `/api/qualite/derogation` | L7848 |
| PATCH | `/api/qualite/derogation/:id` | L7862 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L9531 |
| POST | `/api/qualite/ecme` | L8189 |
| DELETE | `/api/qualite/ecme/:id` | L8228 |
| PATCH | `/api/qualite/ecme/:id` | L8201 |
| POST | `/api/qualite/ecme/:id/etalonner` | L8215 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L8277 |
| POST | `/api/qualite/ecme/:id/verification` | L8234 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L8271 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L8263 |
| POST | `/api/qualite/lot/:id/liberer` | L6219 |
| POST | `/api/qualite/nc/:id/quarantaine` | L9587 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L9471 |
| PATCH | `/api/qualite/non-conformites/:id` | L9448 |
| POST | `/api/qualite/perissable` | L7703 |
| DELETE | `/api/qualite/perissable/:id` | L7717 |
| PATCH | `/api/qualite/perissable/:id` | L7711 |
| POST | `/api/qualite/perissable/:id/sortie` | L7723 |
| POST | `/api/qualite/plan-controle` | L7742 |
| DELETE | `/api/qualite/plan-controle/:id` | L7760 |
| PATCH | `/api/qualite/plan-controle/:id` | L7751 |
| POST | `/api/qualite/quarantaine/:id/decision-fournisseur` | L9690 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L9606 |
| POST | `/api/qualite/rapports-8d` | L9404 |
| PATCH | `/api/qualite/rapports-8d/:id` | L9429 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L7817 |
| POST | `/api/audit/fai` | L7813 |
| DELETE | `/api/audit/fai/:id` | L7815 |
| PATCH | `/api/audit/fai/:id` | L7814 |
| POST | `/api/audit/grille` | L7805 |
| DELETE | `/api/audit/grille/:id` | L7807 |
| PATCH | `/api/audit/grille/:id` | L7806 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L3756 |
| POST | `/api/audit/programme` | L7778 |
| DELETE | `/api/audit/programme/:id` | L7790 |
| PATCH | `/api/audit/programme/:id` | L7784 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L3726 |
| POST | `/api/audit/programme/reconduire` | L7796 |
| POST | `/api/audit/question` | L7809 |
| DELETE | `/api/audit/question/:id` | L7811 |
| PATCH | `/api/audit/question/:id` | L7810 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/avoirs-fournisseurs` | L1793 |
| POST | `/api/achats/avoirs-fournisseurs/:id/annuler` | L1893 |
| POST | `/api/achats/avoirs-fournisseurs/:id/imputer` | L1853 |
| POST | `/api/achats/avoirs-fournisseurs/:id/recu` | L1828 |
| POST | `/api/achats/bc` | L2485 |
| POST | `/api/achats/da` | L2155 |
| PATCH | `/api/achats/da/:id` | L2286 |
| POST | `/api/achats/da/:id/defusionner` | L2422 |
| POST | `/api/achats/da/:id/editer` | L2305 |
| POST | `/api/achats/da/:id/masquer` | L2336 |
| POST | `/api/achats/da/:id/soumettre` | L2522 |
| POST | `/api/achats/da/fusionner` | L2363 |
| POST | `/api/achats/da/regrouper` | L2453 |
| POST | `/api/achats/fournisseur` | L2026 |
| POST | `/api/achats/sous-traitant` | L2048 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L9105 |
| DELETE | `/api/rh/certification/:id` | L9135 |
| PATCH | `/api/rh/certification/:id` | L9125 |
| POST | `/api/rh/competence` | L8873 |
| POST | `/api/rh/conge` | L9143 |
| POST | `/api/rh/conge/:id/valider` | L9190 |
| GET | `/api/rh/export-silae` | L9012 |
| POST | `/api/rh/pointage` | L9262 |
| POST | `/api/rh/salarie` | L8957 |
| DELETE | `/api/rh/salarie/:id` | L9088 |
| PATCH | `/api/rh/salarie/:id` | L9045 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1302 |
| PATCH | `/api/offre/:id` | L1225 |
| POST | `/api/offre/:id/accepter` | L1140 |
| GET | `/api/offre/:id/devis` | L837 |
| POST | `/api/offre/:id/envoyer` | L809 |
| POST | `/api/offre/:id/negocier` | L884 |
| POST | `/api/offre/:id/pricing` | L1251 |
| POST | `/api/offre/:id/refuser` | L875 |
| POST | `/api/offre/:id/valider` | L827 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L3013 |
| POST | `/api/expeditions/bc/:id/pv` | L3017 |
| POST | `/api/expeditions/bc/:id/receptionner` | L2846 |
| POST | `/api/expeditions/bds/:id/envoyer` | L6139 |
| POST | `/api/expeditions/bds/:id/retour` | L6141 |
| POST | `/api/expeditions/bl-partiel` | L3154 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L2914 |
| POST | `/api/expeditions/retour-fournisseur/:qid/expedie` | L3135 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L3589 |
| DELETE | `/api/demandes-prix/:id` | L3852 |
| GET | `/api/demandes-prix/:id` | L3788 |
| POST | `/api/demandes-prix/:id/envoyer` | L3796 |
| GET | `/api/demandes-prix/:id/pdf` | L3681 |
| POST | `/api/demandes-prix/:id/reponses` | L3803 |
| POST | `/api/demandes-prix/:id/valider` | L3823 |
| POST | `/api/demandes-prix/grouped` | L3619 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L4532 |
| DELETE | `/api/nomenclature/:id` | L4771 |
| PUT | `/api/nomenclature/:id` | L4615 |
| GET | `/api/nomenclature/:id/fournitures` | L3901 |
| GET | `/api/nomenclature/:id/journal` | L3885 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L4727 |
| POST | `/api/nomenclature/:id/prepa-validee` | L10471 |
| POST | `/api/nomenclature/:id/programmes` | L4696 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L8665 |
| PATCH | `/api/maintenance/om/:id` | L8731 |
| POST | `/api/maintenance/om/:id/cloturer` | L8743 |
| POST | `/api/maintenance/piece` | L8760 |
| DELETE | `/api/maintenance/piece/:id` | L8789 |
| PATCH | `/api/maintenance/piece/:id` | L8777 |
| POST | `/api/maintenance/preventif/generer` | L8727 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L4340 |
| PATCH | `/api/plans/:id` | L4348 |
| GET | `/api/plans/:id/marqueurs` | L4356 |
| POST | `/api/plans/:id/marqueurs` | L4359 |
| POST | `/api/plans/entity` | L4385 |
| DELETE | `/api/plans/marqueur/:id` | L4377 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L693 |
| GET | `/api/dt/:id` | L665 |
| PUT | `/api/dt/:id` | L735 |
| POST | `/api/dt/:id/analyse` | L1410 |
| POST | `/api/dt/:id/valider` | L1385 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L3930 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L4104 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L4140 |
| GET | `/api/be/noms-signature` | L2663 |
| GET | `/api/be/refs` | L3877 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L3528 |
| DELETE | `/api/produits-fournisseurs/:id` | L3582 |
| PUT | `/api/produits-fournisseurs/:id` | L3553 |
| POST | `/api/produits-fournisseurs/purge` | L3865 |
| GET | `/api/produits-fournisseurs/sans-prix` | L3859 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L4289 |
| GET | `/api/ged/file/:id` | L4270 |
| GET | `/api/ged/nomenclature/:id` | L4256 |
| GET | `/api/ged/ref/:ref` | L4260 |
| POST | `/api/ged/upload` | L4213 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L7136 |
| PATCH | `/api/oas/balancelle/:id` | L7302 |
| POST | `/api/oas/balancelle/:id/cloturer` | L6740 |
| POST | `/api/oas/releve-bain` | L7238 |
| POST | `/api/oas/releve-eau` | L7189 |

### api/clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/clients` | L632 |
| DELETE | `/api/clients/:id` | L650 |
| PATCH | `/api/clients/:id` | L640 |
| GET | `/api/clients/search` | L610 |

### api/locks

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/locks/acquire` | L2612 |
| POST | `/api/locks/heartbeat` | L2632 |
| POST | `/api/locks/release` | L2644 |
| GET | `/api/locks/status` | L2653 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L3772 |
| POST | `/api/bc/:id/date-arrivee` | L3014 |
| GET | `/api/bc/:id/pdf` | L3704 |
| POST | `/api/bc/:id/relance` | L3780 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L7087 |
| POST | `/api/interlocuteurs` | L7095 |
| DELETE | `/api/interlocuteurs/:id` | L7127 |
| PATCH | `/api/interlocuteurs/:id` | L7115 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L8006 |
| PATCH | `/api/securite/` | L7999 |
| POST | `/api/securite/` | L7992 |
| POST | `/api/securite/duer/cloner-annee` | L8024 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L774 |
| POST | `/api/references-clients` | L783 |
| DELETE | `/api/references-clients/:id` | L797 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1311 |
| DELETE | `/api/credits/:id` | L1375 |
| PATCH | `/api/credits/:id` | L1354 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L6294 |
| GET | `/api/export/fournisseurs.xlsx` | L6263 |
| GET | `/api/export/seirich.xlsx` | L6316 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L8146 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L8160 |
| POST | `/api/environnement/perissables-expires/declarer` | L8051 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L10272 |
| POST | `/api/direction/scan-alertes` | L10181 |
| GET | `/api/direction/source` | L10305 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1203 |
| POST | `/api/quarantaine/:id/rejeter` | L1213 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L1976 |
| PATCH | `/api/fournisseurs/:id` | L1940 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L1981 |
| PATCH | `/api/sous-traitants/:id` | L1957 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L3258 |
| POST | `/api/factures/:id/valider-paiement` | L3307 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L3322 |
| PATCH | `/api/factures-fournisseur/:id` | L3362 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L7071 |
| POST | `/api/planning/affectation-poste` | L7047 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L8388 |
| DELETE | `/api/controles/cote/:id` | L8413 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L10230 |
| POST | `/api/validations/:id/decision` | L10242 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L10430 |
| DELETE | `/api/kpi-objectifs/:id` | L10442 |

### api/login

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/login` | L233 |

### api/version

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/version` | L271 |

### api/me

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/me` | L283 |

### api/contact

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/contact` | L541 |

### api/catalogue-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/catalogue-fournisseurs` | L1989 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L3408 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L3506 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L3516 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L8081 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/seuils` | L8533 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L8581 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L9029 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L9166 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L9852 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L10516 |

<!-- manuel:contrats -->
## Contrats détaillés (écrits à la main)

Bloc conservé par `gen_api_ref.mjs` : les tableaux ci-dessus sont régénérés, ce bloc ne l'est pas.

### `POST /api/production/bdt/:id/separer` — découper un BDT de la goulotte (13/09/2026)

Découpe un BDT en 2 à 12 morceaux, **dans la goulotte uniquement**, avec un temps **libre** par
morceau. Appelée par la fenêtre `splitModal` (ciseaux d'une carte de goulotte, `src/prod.tsx`).
RBAC : famille `production` (écriture).

**Corps** : `{ "parts": [h1, h2, …] }` — **obligatoire**. Une valeur en heures par morceau ; la
1ʳᵉ est celle du BDT d'origine. Nombres, ou chaînes décimales simples (`"1,5"`, pas d'hexadécimal
ni d'exposant), > 0 après arrondi au **1/100 d'heure** — la précision de `bons_de_travail.duree`
en cloud. Le champ `n` n'est plus lu. Un corps `null` est traité comme vide (400, plus de 500).

**Refus** (rien n'est écrit) :

| Code | Cas |
|---|---|
| 503 | lecture du BDT ou des morceaux existants en échec (lecture stricte par id, jamais confondue avec « introuvable ») |
| 404 | BDT introuvable |
| 400 | BDT `recu` ou `solde`, ou `temps_reel` renseigné — « déjà démarré ou soldé » |
| 400 | BDT annulé (`statut` commençant par `annul`) |
| 400 | BDT en sous-traitance (`statut = 'st'` ou `operateur_id = 'ST'`) |
| 409 | BDT **posé sur le planning** : `statut` renseigné et ≠ `a_programmer`, **et** `process_id`, **et** `date_prevue` (négation exacte de `enGoulotte`) — « remettez-le dans la goulotte avant de le découper » |
| 400 | `parts` absent ou pas un tableau |
| 400 | moins de 2 ou plus de 12 valeurs (plus de troncature silencieuse) |
| 400 | une valeur vide, non numérique, ≤ 0 ou qui s'arrondit à 0 — le message nomme le morceau |

Un BDT **sans durée** (0 h) est découpable : c'est l'utilisateur qui alloue le temps.

**Effet** :
- Morceaux 2..N créés **d'abord**, id `<racine>-M<k>` (racine = id sans suffixe `-M\d+`, `k` = plus
  grand suffixe existant + 1, lu par une requête ciblée `like '<racine>-M%'`, sans limite de page).
  Statut `a_programmer`, `date_prevue`/`debut`/`operateur_id` à null, **`machine_id` non recopié**
  (reposé par `/affecter` au placement). Copient (si non null) `process_id`, `poste_id`, `affaire_id`, `num_affaire`,
  `cmd_id`, `cmd_ref`, `lot_id`, `lot_ref`, `client_nom`, `activite`, `piece`, `operation`,
  `priorite`, `prioritaire`, `matiere_ok`, `pv_requis`, `oas_avant`, `oas_apres`, `seq`,
  `date_echeance`. Au moindre échec d'insertion : suppression des morceaux déjà créés **vérifiée par
  relecture** (`retirerBDTRows`) ; si un morceau subsiste, le message 400 le nomme.
- Puis l'original est réduit au 1ᵉʳ morceau (même id, statut, process, jour). Échec : morceaux
  retirés, 400.
- Temps de chaque morceau (original compris) : `duree = temps_alloue = part` ;
  `temps_machine_alloue`, seulement s'il est renseigné sur l'original,
  `= tMach × part / total` (`total = duree ?? temps_alloue ?? 0`), ou `× part / Σ parts` si
  `total = 0` (arrondi au 1/10 000). `duree` et `temps_alloue` au 1/100. **Pas de normalisation** :
  Σ parts peut différer de `total`.

**Réponse 200** :
```json
{ "ok": true, "count": 3, "created": ["R-M2", "R-M3"], "total_avant": 12, "total_apres": 13.5 }
```
`count` = nombre de morceaux (original compris) ; `total_avant` = durée d'origine ;
`total_apres` = somme des heures allouées.
<!-- /manuel:contrats -->

## Routes pages (133)

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/production/affectation` | L5959 |
| GET | `/production/bdt` | L7440 |
| GET | `/production/bdt-liste` | L10459 |
| GET | `/production/bdts-a-programmer` | L10527 |
| GET | `/production/commande/:id` | L7378 |
| GET | `/production/commandes` | L7369 |
| GET | `/production/competences` | L5960 |
| GET | `/production/dashboard-production` | L7428 |
| GET | `/production/dashboard-programmation` | L7427 |
| GET | `/production/fiches-suivi` | L7434 |
| GET | `/production/gantt-bdt` | L7357 |
| GET | `/production/gantt-bst` | L7365 |
| GET | `/production/habilitations` | L11086 |
| GET | `/production/horaires` | L5961 |
| GET | `/production/lot-liste` | L10460 |
| GET | `/production/lot/:id` | L7394 |
| GET | `/production/lots` | L7373 |
| GET | `/production/matricule` | L7432 |
| GET | `/production/non-faits` | L7433 |
| GET | `/production/operateur` | L5962 |
| GET | `/production/ordonnancement` | L5921 |
| GET | `/production/pilotage` | L7533 |
| GET | `/production/planning` | L6042 |
| GET | `/production/pointage` | L7431 |
| GET | `/production/service` | L5965 |
| GET | `/production/soustraitance` | L7506 |
| GET | `/production/st-liste` | L7435 |
| GET | `/production/suivi-st` | L7436 |
| GET | `/commercial/affaire/:num` | L524 |
| GET | `/commercial/avoirs` | L607 |
| GET | `/commercial/avoirs-liste` | L10463 |
| GET | `/commercial/client/:id` | L512 |
| GET | `/commercial/cmd-liste` | L10455 |
| GET | `/commercial/commande` | L1655 |
| GET | `/commercial/commande-old` | L1652 |
| GET | `/commercial/commandes-validees` | L599 |
| GET | `/commercial/dt` | L1545 |
| GET | `/commercial/dt-liste` | L603 |
| GET | `/commercial/dt-liste` | L10453 |
| GET | `/commercial/offre` | L578 |
| GET | `/commercial/offre-old` | L1627 |
| GET | `/commercial/offre/edit` | L588 |
| GET | `/commercial/offres-liste` | L582 |
| GET | `/commercial/offres-liste` | L10454 |
| GET | `/commercial/references-pieces` | L10465 |
| GET | `/commercial/rentree` | L577 |
| GET | `/commercial/service` | L501 |
| GET | `/dashboard` | L10359 |
| GET | `/dashboard/achats` | L10362 |
| GET | `/dashboard/be` | L10361 |
| GET | `/dashboard/commercial` | L10360 |
| GET | `/dashboard/direction` | L10370 |
| GET | `/dashboard/environnement` | L10372 |
| GET | `/dashboard/expedition` | L10366 |
| GET | `/dashboard/finance` | L10373 |
| GET | `/dashboard/fournisseurs` | L10375 |
| GET | `/dashboard/maintenance` | L10367 |
| GET | `/dashboard/oas` | L10371 |
| GET | `/dashboard/production` | L10364 |
| GET | `/dashboard/programmation` | L10363 |
| GET | `/dashboard/qualite` | L10365 |
| GET | `/dashboard/rh` | L10369 |
| GET | `/dashboard/stock` | L10374 |
| GET | `/qualite/8d` | L9344 |
| GET | `/qualite/anomalie` | L9318 |
| GET | `/qualite/audit-9001` | L10789 |
| GET | `/qualite/audit-en9100` | L10848 |
| GET | `/qualite/ecme` | L9954 |
| GET | `/qualite/liberation` | L9930 |
| GET | `/qualite/nc-liste` | L10457 |
| GET | `/qualite/perishables` | L10901 |
| GET | `/qualite/pv` | L9904 |
| GET | `/qualite/service` | L7639 |
| GET | `/rh/competences` | L8856 |
| GET | `/rh/conge` | L10035 |
| GET | `/rh/conge-liste` | L10462 |
| GET | `/rh/employes` | L8832 |
| GET | `/rh/habilitations` | L8848 |
| GET | `/rh/organigramme` | L8844 |
| GET | `/rh/pointage` | L9255 |
| GET | `/rh/pointage` | L10064 |
| GET | `/rh/service` | L8827 |
| GET | `/rh/temps` | L9242 |
| GET | `/achats/da-auto` | L7438 |
| GET | `/achats/da-liste` | L10456 |
| GET | `/achats/demande` | L5842 |
| GET | `/achats/fournisseur` | L5893 |
| GET | `/achats/fournisseur/:id` | L1918 |
| GET | `/achats/fournisseurs-st` | L10464 |
| GET | `/achats/reception` | L5869 |
| GET | `/achats/service` | L1723 |
| GET | `/achats/sous-traitant/:id` | L1928 |
| GET | `/be/analyse` | L4817 |
| GET | `/be/ged` | L5816 |
| GET | `/be/preparation` | L5582 |
| GET | `/be/references-pieces` | L10466 |
| GET | `/be/service` | L3480 |
| GET | `/stock` | L10970 |
| GET | `/stock/alertes` | L10973 |
| GET | `/stock/entrees` | L10971 |
| GET | `/stock/service` | L8547 |
| GET | `/stock/sorties` | L10972 |
| GET | `/oas/balancelles` | L10576 |
| GET | `/oas/rejets-eau` | L10664 |
| GET | `/oas/service` | L7596 |
| GET | `/oas/session` | L7608 |
| GET | `/maintenance/intervention` | L10007 |
| GET | `/maintenance/liste` | L10461 |
| GET | `/maintenance/mtbf` | L10368 |
| GET | `/maintenance/service` | L8588 |
| GET | `/finances/couts` | L10979 |
| GET | `/finances/imputations` | L10982 |
| GET | `/finances/machines` | L10981 |
| GET | `/finances/taux` | L10980 |
| GET | `/expedition/bl` | L9980 |
| GET | `/expedition/bl-liste` | L10458 |
| GET | `/expedition/envoi-client` | L10532 |
| GET | `/manuels` | L303 |
| GET | `/manuels/:slug` | L307 |
| GET | `/securite/chimique/:id` | L7979 |
| GET | `/securite/service` | L7876 |
| GET | `/direction/service` | L10099 |
| GET | `/direction/validation` | L10315 |
| GET | `/comptabilite/dashboard` | L11274 |
| GET | `/comptabilite/factures` | L11275 |
| GET | `/login` | L222 |
| GET | `/logout` | L265 |
| GET | `/` | L345 |
| GET | `/plans/service` | L4308 |
| GET | `/environnement/service` | L7953 |
| GET | `/expeditions/service` | L8422 |
| GET | `/compta/service` | L9301 |
| GET | `/reglages/objectifs` | L10378 |
