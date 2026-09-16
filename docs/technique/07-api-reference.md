# Référence API & routes

> **Fichier généré** par `node scripts_doc/gen_api_ref.mjs` — ne pas éditer à la main, **sauf** le bloc
> « Contrats détaillés » (entre les marqueurs `manuel:contrats`), conservé d'une génération à l'autre.
> Source : `src/index.tsx` (399 routes). Les numéros de ligne sont indicatifs (au moment de la génération).

## Routes API (266)

| Famille | Routes |
|---|---|
| `api/production` | 41 |
| `api/qualite` | 28 |
| `api/achats` | 16 |
| `api/audit` | 16 |
| `api/stock` | 15 |
| `api/rh` | 11 |
| `api/offre` | 9 |
| `api/expeditions` | 9 |
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
| `api/commande` | 1 |
| `api/compta` | 1 |
| `api/pointage` | 1 |
| `api/commandes-p` | 1 |
| `api/prepa-technique` | 1 |

### api/production

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/production/bds/:id` | L7122 |
| POST | `/api/production/bds/:id/envoyer` | L7185 |
| POST | `/api/production/bds/:id/retour` | L7187 |
| POST | `/api/production/bdt/:id/affecter` | L7689 |
| POST | `/api/production/bdt/:id/deprogrammer` | L7808 |
| POST | `/api/production/bdt/:id/recoller` | L8084 |
| POST | `/api/production/bdt/:id/recu` | L8247 |
| POST | `/api/production/bdt/:id/separer` | L7832 |
| POST | `/api/production/bdt/:id/solder` | L8319 |
| GET | `/api/production/bdt/:id/temps` | L8020 |
| POST | `/api/production/bdt/reglage/reconstituer` | L8190 |
| POST | `/api/production/bdts` | L7053 |
| PATCH | `/api/production/bdts/:id` | L6969 |
| POST | `/api/production/bst/:id/affecter-st` | L8561 |
| POST | `/api/production/bst/affecter` | L8504 |
| GET | `/api/production/cadence` | L8775 |
| GET | `/api/production/cadence/calendrier` | L8791 |
| POST | `/api/production/cadence/modeles` | L8832 |
| POST | `/api/production/cadence/site` | L8811 |
| POST | `/api/production/conge/:id/valider` | L11734 |
| POST | `/api/production/demande-achat-operateur` | L2304 |
| POST | `/api/production/machine` | L8635 |
| DELETE | `/api/production/machine/:id` | L8742 |
| PATCH | `/api/production/machine/:id` | L8710 |
| POST | `/api/production/machine/:id/panne` | L11109 |
| POST | `/api/production/machine/:id/reparer` | L11116 |
| POST | `/api/production/machine/reorder` | L7488 |
| POST | `/api/production/nc` | L2342 |
| POST | `/api/production/non-conformites` | L7189 |
| POST | `/api/production/poste` | L7499 |
| DELETE | `/api/production/poste/:id` | L7520 |
| PATCH | `/api/production/poste/:id` | L7511 |
| POST | `/api/production/poste/reorder` | L7532 |
| DELETE | `/api/production/presence` | L8915 |
| GET | `/api/production/presence` | L8870 |
| POST | `/api/production/presence` | L8881 |
| POST | `/api/production/process` | L7428 |
| DELETE | `/api/production/process/:id` | L7473 |
| PATCH | `/api/production/process/:id` | L7452 |
| POST | `/api/production/process/reorder` | L7481 |
| POST | `/api/production/sortie-matiere` | L9196 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L10244 |
| DELETE | `/api/qualite/capabilite/:id` | L10273 |
| POST | `/api/qualite/derogation` | L9740 |
| PATCH | `/api/qualite/derogation/:id` | L9754 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L12054 |
| POST | `/api/qualite/ecme` | L10081 |
| DELETE | `/api/qualite/ecme/:id` | L10120 |
| PATCH | `/api/qualite/ecme/:id` | L10093 |
| POST | `/api/qualite/ecme/:id/etalonner` | L10107 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L10169 |
| POST | `/api/qualite/ecme/:id/verification` | L10126 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L10163 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L10155 |
| POST | `/api/qualite/lot/:id/liberer` | L7270 |
| POST | `/api/qualite/nc/:id/quarantaine` | L12110 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L11994 |
| PATCH | `/api/qualite/non-conformites/:id` | L11971 |
| POST | `/api/qualite/perissable` | L9595 |
| DELETE | `/api/qualite/perissable/:id` | L9609 |
| PATCH | `/api/qualite/perissable/:id` | L9603 |
| POST | `/api/qualite/perissable/:id/sortie` | L9615 |
| POST | `/api/qualite/plan-controle` | L9634 |
| DELETE | `/api/qualite/plan-controle/:id` | L9652 |
| PATCH | `/api/qualite/plan-controle/:id` | L9643 |
| POST | `/api/qualite/quarantaine/:id/decision-fournisseur` | L12218 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L12129 |
| POST | `/api/qualite/rapports-8d` | L11927 |
| PATCH | `/api/qualite/rapports-8d/:id` | L11952 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/avoirs-fournisseurs` | L1864 |
| POST | `/api/achats/avoirs-fournisseurs/:id/annuler` | L1964 |
| POST | `/api/achats/avoirs-fournisseurs/:id/imputer` | L1924 |
| POST | `/api/achats/avoirs-fournisseurs/:id/recu` | L1899 |
| POST | `/api/achats/bc` | L2662 |
| POST | `/api/achats/bc/:id/certificat-matiere` | L4550 |
| POST | `/api/achats/da` | L2226 |
| PATCH | `/api/achats/da/:id` | L2463 |
| POST | `/api/achats/da/:id/defusionner` | L2599 |
| POST | `/api/achats/da/:id/editer` | L2482 |
| POST | `/api/achats/da/:id/masquer` | L2513 |
| POST | `/api/achats/da/:id/soumettre` | L2708 |
| POST | `/api/achats/da/fusionner` | L2540 |
| POST | `/api/achats/da/regrouper` | L2630 |
| POST | `/api/achats/fournisseur` | L2097 |
| POST | `/api/achats/sous-traitant` | L2119 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L9709 |
| POST | `/api/audit/fai` | L9705 |
| DELETE | `/api/audit/fai/:id` | L9707 |
| PATCH | `/api/audit/fai/:id` | L9706 |
| POST | `/api/audit/grille` | L9697 |
| DELETE | `/api/audit/grille/:id` | L9699 |
| PATCH | `/api/audit/grille/:id` | L9698 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L4514 |
| POST | `/api/audit/programme` | L9670 |
| DELETE | `/api/audit/programme/:id` | L9682 |
| PATCH | `/api/audit/programme/:id` | L9676 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L4484 |
| POST | `/api/audit/programme/reconduire` | L9688 |
| POST | `/api/audit/question` | L9701 |
| DELETE | `/api/audit/question/:id` | L9703 |
| PATCH | `/api/audit/question/:id` | L9702 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/emplacement` | L10911 |
| GET | `/api/stock/:id/emplacement/historique` | L10942 |
| PATCH | `/api/stock/:id/seuils` | L10461 |
| POST | `/api/stock/ajustement` | L10763 |
| POST | `/api/stock/entree` | L10687 |
| GET | `/api/stock/mise-en-stock` | L10489 |
| POST | `/api/stock/mise-en-stock/:id/accepter` | L10499 |
| POST | `/api/stock/mise-en-stock/:id/annuler` | L10665 |
| POST | `/api/stock/sortie` | L10703 |
| GET | `/api/stock/types-objet` | L10798 |
| POST | `/api/stock/types-objet` | L10804 |
| PATCH | `/api/stock/types-objet/:code` | L10818 |
| GET | `/api/stock/zones` | L10845 |
| POST | `/api/stock/zones` | L10852 |
| PATCH | `/api/stock/zones/:id` | L10875 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L11569 |
| DELETE | `/api/rh/certification/:id` | L11599 |
| PATCH | `/api/rh/certification/:id` | L11589 |
| POST | `/api/rh/competence` | L11330 |
| POST | `/api/rh/conge` | L11607 |
| POST | `/api/rh/conge/:id/valider` | L11715 |
| GET | `/api/rh/export-silae` | L11469 |
| POST | `/api/rh/pointage` | L11785 |
| POST | `/api/rh/salarie` | L11414 |
| DELETE | `/api/rh/salarie/:id` | L11552 |
| PATCH | `/api/rh/salarie/:id` | L11502 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1361 |
| PATCH | `/api/offre/:id` | L1284 |
| POST | `/api/offre/:id/accepter` | L1199 |
| GET | `/api/offre/:id/devis` | L869 |
| POST | `/api/offre/:id/envoyer` | L841 |
| POST | `/api/offre/:id/negocier` | L916 |
| POST | `/api/offre/:id/pricing` | L1310 |
| POST | `/api/offre/:id/refuser` | L907 |
| POST | `/api/offre/:id/valider` | L859 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L3529 |
| POST | `/api/expeditions/bc/:id/pv` | L3559 |
| POST | `/api/expeditions/bc/:id/receptionner` | L3267 |
| POST | `/api/expeditions/bds/:id/envoyer` | L7184 |
| POST | `/api/expeditions/bds/:id/retour` | L7186 |
| POST | `/api/expeditions/bl-partiel` | L3902 |
| POST | `/api/expeditions/bl/:id/reception-infos` | L3384 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L3414 |
| POST | `/api/expeditions/retour-fournisseur/:qid/expedie` | L3883 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L4342 |
| DELETE | `/api/demandes-prix/:id` | L4643 |
| GET | `/api/demandes-prix/:id` | L4579 |
| POST | `/api/demandes-prix/:id/envoyer` | L4587 |
| GET | `/api/demandes-prix/:id/pdf` | L4434 |
| POST | `/api/demandes-prix/:id/reponses` | L4594 |
| POST | `/api/demandes-prix/:id/valider` | L4614 |
| POST | `/api/demandes-prix/grouped` | L4372 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L5321 |
| DELETE | `/api/nomenclature/:id` | L5560 |
| PUT | `/api/nomenclature/:id` | L5404 |
| GET | `/api/nomenclature/:id/fournitures` | L4692 |
| GET | `/api/nomenclature/:id/journal` | L4676 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L5516 |
| POST | `/api/nomenclature/:id/prepa-validee` | L13158 |
| POST | `/api/nomenclature/:id/programmes` | L5485 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L11122 |
| PATCH | `/api/maintenance/om/:id` | L11188 |
| POST | `/api/maintenance/om/:id/cloturer` | L11200 |
| POST | `/api/maintenance/piece` | L11217 |
| DELETE | `/api/maintenance/piece/:id` | L11246 |
| PATCH | `/api/maintenance/piece/:id` | L11234 |
| POST | `/api/maintenance/preventif/generer` | L11184 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L5129 |
| PATCH | `/api/plans/:id` | L5137 |
| GET | `/api/plans/:id/marqueurs` | L5145 |
| POST | `/api/plans/:id/marqueurs` | L5148 |
| POST | `/api/plans/entity` | L5174 |
| DELETE | `/api/plans/marqueur/:id` | L5166 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L725 |
| GET | `/api/dt/:id` | L697 |
| PUT | `/api/dt/:id` | L767 |
| POST | `/api/dt/:id/analyse` | L1469 |
| POST | `/api/dt/:id/valider` | L1444 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L4702 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L4888 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L4931 |
| GET | `/api/be/noms-signature` | L2858 |
| GET | `/api/be/refs` | L4668 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L4281 |
| DELETE | `/api/produits-fournisseurs/:id` | L4335 |
| PUT | `/api/produits-fournisseurs/:id` | L4306 |
| POST | `/api/produits-fournisseurs/purge` | L4656 |
| GET | `/api/produits-fournisseurs/sans-prix` | L4650 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L5082 |
| GET | `/api/ged/file/:id` | L5063 |
| GET | `/api/ged/nomenclature/:id` | L5049 |
| GET | `/api/ged/ref/:ref` | L5053 |
| POST | `/api/ged/upload` | L5006 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L9018 |
| PATCH | `/api/oas/balancelle/:id` | L9184 |
| POST | `/api/oas/balancelle/:id/cloturer` | L8431 |
| POST | `/api/oas/releve-bain` | L9120 |
| POST | `/api/oas/releve-eau` | L9071 |

### api/clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/clients` | L664 |
| DELETE | `/api/clients/:id` | L682 |
| PATCH | `/api/clients/:id` | L672 |
| GET | `/api/clients/search` | L642 |

### api/locks

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/locks/acquire` | L2807 |
| POST | `/api/locks/heartbeat` | L2827 |
| POST | `/api/locks/release` | L2839 |
| GET | `/api/locks/status` | L2848 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L4530 |
| POST | `/api/bc/:id/date-arrivee` | L3530 |
| GET | `/api/bc/:id/pdf` | L4457 |
| POST | `/api/bc/:id/relance` | L4538 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L8969 |
| POST | `/api/interlocuteurs` | L8977 |
| DELETE | `/api/interlocuteurs/:id` | L9009 |
| PATCH | `/api/interlocuteurs/:id` | L8997 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L9898 |
| PATCH | `/api/securite/` | L9891 |
| POST | `/api/securite/` | L9884 |
| POST | `/api/securite/duer/cloner-annee` | L9916 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L806 |
| POST | `/api/references-clients` | L815 |
| DELETE | `/api/references-clients/:id` | L829 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1370 |
| DELETE | `/api/credits/:id` | L1434 |
| PATCH | `/api/credits/:id` | L1413 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L7345 |
| GET | `/api/export/fournisseurs.xlsx` | L7314 |
| GET | `/api/export/seirich.xlsx` | L7367 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L10038 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L10052 |
| POST | `/api/environnement/perissables-expires/declarer` | L9943 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L12959 |
| POST | `/api/direction/scan-alertes` | L12762 |
| GET | `/api/direction/source` | L12992 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1262 |
| POST | `/api/quarantaine/:id/rejeter` | L1272 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L2047 |
| PATCH | `/api/fournisseurs/:id` | L2011 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L2052 |
| PATCH | `/api/sous-traitants/:id` | L2028 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L4006 |
| POST | `/api/factures/:id/valider-paiement` | L4055 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L4070 |
| PATCH | `/api/factures-fournisseur/:id` | L4110 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L8953 |
| POST | `/api/planning/affectation-poste` | L8929 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L10280 |
| DELETE | `/api/controles/cote/:id` | L10305 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L12910 |
| POST | `/api/validations/:id/decision` | L12925 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L13117 |
| DELETE | `/api/kpi-objectifs/:id` | L13129 |

### api/login

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/login` | L264 |

### api/version

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/version` | L302 |

### api/me

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/me` | L315 |

### api/contact

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/contact` | L573 |

### api/catalogue-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/catalogue-fournisseurs` | L2060 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L4156 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L4259 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L4269 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L9973 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L11042 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L11486 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L11630 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L12428 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L13203 |

<!-- manuel:contrats -->
## Contrats détaillés (écrits à la main)

Bloc conservé par `gen_api_ref.mjs` : les tableaux ci-dessus sont régénérés, ce bloc ne l'est pas.

### Lot G (16/09/2026) — cadence usine, planning en heures ouvrées, chevauchement, remise en goulotte, process OAS

Famille **`production`** (+ pages `/production/service`, `/oas/service`, `/rh/temps`) — **aucune nouvelle famille**.
Migration **014** / `cloud-12`. Règles : `06-modules/production.md` (section « Lot G »), `oas.md`, `rh.md` ; règles pures
`src/cadence.ts`, `src/planning_cadence.ts`, `src/poste_oas.ts`, `src/gamme.ts`. **Trois états** de la cadence, partout :
lisible → heures ouvrées ; **tables absentes** (cloud sans `cloud-12`) → horaires par défaut / grille 5 h–23 h, aucun refus
lié à la cadence, lectures en **200** ; **panne** de lecture → **503** pour toute écriture qui dépend des horaires (jamais
« tout ouvert » ni « tout fermé » en silence).

#### Cadence usine (`/api/production/cadence…`)
Lecture = lecture Production. Écriture = **écriture Production**, contrôlée par le middleware puis revérifiée dans le handler
(**403** « Modifier la cadence usine ou ses modèles d'horaires est réservé à l'écriture Production. »). `MSG_CLOUD12` =
« Cadence usine indisponible : la base n'a pas les tables horaires_modeles / cadence_site. Docker/VM : erp-docker.sh maj
(migration 014) ; cloud : jouez docker/db/cloud/cloud-12-cadence-usine.sql. … ».

| Route | Corps / paramètres | Réponse 200 | Erreurs propres |
|---|---|---|---|
| `GET /api/production/cadence` | — | `{ok, disponible:true, courantes: {Seem: {niveau, effet, depuis, par, motif, defaut?}, Semrac: …}, prevus: {Seem: [{niveau, effet, depuis, par, motif}], Semrac: […]}, donnees: {modeles, cadences}}` — courante = cadence d'**aujourd'hui** (Paris) ; `prevus` = effets futurs ; site sans ligne : `{niveau:'moyen', defaut:true}` | tables absentes : **200** `{ok:true, disponible:false, table_absente:true, avertissement: MSG_CLOUD12}` · **503** panne |
| `GET /api/production/cadence/calendrier` | `?activite=` (`Seem`, `Semrac` ; autre valeur = union des deux sites) `&from=AAAA-MM-JJ&to=AAAA-MM-JJ` (62 jours au plus) | `{ok, disponible:true, sites, jours: [{date, plage: {debut, fin}\|null, segments: [{site, niveau, creneau, partie, debut, fin}], niveaux: {Seem:'moyen'…}}]}` — heures décimales, `fin > 24` = lendemain ; segments = ceux qui **commencent** ce jour | **400** dates absentes, invalides, `to < from`, « fenêtre trop large (62 jours au plus) » · tables absentes : 200 `{disponible:false, table_absente:true, avertissement, jours:[]}` · **503** |
| `POST /api/production/cadence/site` | `{site: 'Seem'\|'Semrac', niveau: 'bas'\|'moyen'\|'haut', niveau_lu (obligatoire, niveau affiché ; null accepté), effet?: 'AAAA-MM-JJ', confirme_retroactif?: boolean, motif?: string (500 max)}` | `{ok, avant: niveau en vigueur à la date d'effet, effet: 'AAAA-MM-JJ', cadence: ligne insérée}` — **ajout** d'une ligne `cadence_site` (`par` = nom de la session) | **400** site, niveau, `niveau_lu` absent/invalide, date invalide, motif trop long, effet à plus de **62 jours** de recul ou **400 jours** d'avance, insertion refusée · **409** `niveau_lu` ≠ niveau relu **à la date d'effet** (« La cadence de Seem au jeudi 17/09/2026 a été modifiée entre-temps (maintenant : Moyen) : rechargez la page. ») · **409** déjà dans ce niveau à cette date · **409** `{confirmation_requise:true}` effet **aujourd'hui ou passé** sans `confirme_retroactif` (« Une cadence qui prend effet aujourd'hui s'applique à toute la journée, heures déjà travaillées comprises (présences, RH › Temps, planning) : confirmez, ou choisissez une date d'effet future. ») · **409** `table_absente` · **409** colonne `effet` absente · **503** lecture |
| `POST /api/production/cadence/modeles` | `{niveau, cellules: [{jour_semaine 1–7, creneau: 'matin'\|'journee'\|'apmidi'\|'soir', partie: 1\|2, ferme: boolean, debut: 'HH:MM', fin: 'HH:MM', maj_le_lu: string\|null}]}` — seulement les cellules modifiées (35 au plus) ; `ferme: true` = `actif:false`, heures ignorées ; `maj_le_lu` = `maj_le` lu (`null` si la ligne n'existait pas) | `{ok, modifiees: n, inchangees: n}` — insertion ou mise à jour **conditionnelle** sur `maj_le` (jamais de suppression), `maj_le` / `maj_par` écrits | **400** niveau, cellule illisible ou en double, créneau inconnu, partie 2 hors Journée, dimanche ouvert, HH:MM, début = fin, partie de Journée qui passe minuit, **samedi qui finit le lendemain** (« Samedi · Soirée : un créneau du samedi ne peut pas finir le lendemain (21:00 → 05:30) : le dimanche est toujours fermé. Terminez-le au plus tard à 23:55. »), segment de plus de 16 h, Journée partie 2 sans partie 1 ou commençant avant la fin de la partie 1, écriture refusée · **409** cellule modifiée entre-temps (avant toute écriture) · **409** `{partiel, enregistrees: [noms]}` conflit en cours d'écriture · **409** `table_absente` · **503** |

#### `POST /api/production/presence` (changée)
- Corps inchangé. Pour un créneau (pas `absent`) : site = `salaries.entite` de l'opérateur (salarié inconnu : `activite` du
  corps) ; cadence de ce site **ce jour-là**.
- **409** `{ok:false, creneau_ferme:true, niveau, error}` — « Créneau « Matin » fermé en cadence Moyen ce jour (samedi
  19/09/2026, site Seem) : choisissez un créneau ouvert ou changez la cadence (Production › Process Ateliers › Cadence
  usine). » ; **503** lecture de la cadence impossible (« présence non enregistrée ») ; tables absentes : enregistré,
  **200** `{ok, presence, avertissement: MSG_CLOUD12}`. Opérateur sans site Seem / Semrac : jamais refusé.

#### `POST /api/production/bdt/:id/affecter` (changée)
- **Corps** : + `deprogrammer_successeurs?: true | string[]` (accord G4) ; `debut` peut être une **heure d'axe ≥ 24**
  (nuit : ramenée au lendemain calendaire quand la cadence est lisible). Un process d'un seul site écrit `activite` sur
  le BDT (inchangé) : c'est le site contrôlé.
- **Ordre des contrôles** : cadence en panne → **503** ; chemin critique en heures ouvrées (refus 409 / calage, avec
  `cale_date`) ; **heure fermée** → **409** `{ok:false, heure_fermee:true, error, prochain_ouvert: {date, heure}|null}` (« Le
  poste Usinage Stama est fermé à cette heure (samedi 19/09 à 10h) en cadence Moyen (Seem) : posez le BDT sur un créneau
  ouvert — prochain : lundi 21/09 à 5h30. ») ; **G3** même process sur le poste → **409** `{ok:false, error, chevauchement:
  [{id, date, debut, fin}]}` (« Le poste Usinage Stama porte déjà un BDT du même process (BDT-…) de 08:00 à 11:00 :
  décalez la pose ou choisissez un autre process du poste. », « (et n autres BDT du même process : …) » ; `debut`/`fin`
  = heures absolues jour × 24 + heure) ; lecture des BDT du process impossible → **503** ; **G4** sans accord →
  **409** `{ok:false, error: message préventif multi-lignes, successeurs_a_deprogrammer: [{id, message}],
  successeurs_recus_signales: [{id, message}]}` (l'accord doit couvrir tous les `successeurs_a_deprogrammer`). Repli
  colonne `debut` entière : heure fermée et G3 recontrôlés sur l'heure pleine avant la réécriture.
- **Course** : après l'écriture, chevauchement avec un BDT du même process **écrit avant** → écriture annulée
  (conditionnelle sur l'`updated_at` écrit) → **409** `{ok:false, error: « … — posé en même temps depuis un autre écran :
  pose annulée. », chevauchement, course:true, annule: boolean}` (successeurs pas encore touchés).
- **200** : champs existants + `cale_date` (avec `cale_a`, jour réellement écrit), `horaires: 'cadence'|'grille'`,
  `successeurs_deprogrammes: string[]` et `remis_goulotte_le: ISO|null` (s'il y avait un plan G4),
  `successeurs_recus_signales` (s'il y en a), `successeurs_en_violation` (hors étapes remises en goulotte, + reçues
  signalées), `avertissement` enrichi : « Remis en goulotte : BDT-…. », « Non remis en goulotte (toujours signalés) : BDT-…
  (modifié entre-temps). », « Colonne remis_goulotte_le absente (migration 014 / cloud-12 à jouer) : ces BDT ne sont pas
  placés en tête de la goulotte. », « Étape déjà reçue rendue incohérente (jamais déprogrammée) : …. ». Une pose remet
  `remis_goulotte_le` à `null` (si la ligne porte la colonne).
- **Déprogrammation d'un successeur** (`deprogrammerBDTSiInchange`) : `{statut:'a_programmer', process_id, machine_id,
  date_prevue, debut, operateur_id: null, remis_goulotte_le}` **conditionnel** sur `statut`, `date_prevue`, `process_id`,
  `debut` et `updated_at` lus ; réessai sans `remis_goulotte_le` si la base la refuse.

#### `PATCH /api/production/bdts/:id` (changée)
- Si l'un de `process_id`, `duree`, `temps_alloue`, `statut`, `operateur_id`, `seq`, `lot_id`, `lot_ref` est dans le corps :
  BDT et cadence lus (**503** / **404**) ; **G3** seulement si `process_id`, `duree` ou `temps_alloue` changent, ou si le BDT
  se met à occuper le poste ; **G4** si l'un de ces champs change réellement (lot + `seq` connus) : mêmes **409** que
  `/affecter`, même paramètre `deprogrammer_successeurs`, mêmes champs de succès et même annulation en cas de course
  (« modification annulée »). `debut` / `date_prevue` restent refusés (lot C). ⚠ Pas de contrôle d'heure fermée.

#### `POST /api/production/bdts` (changée)
- Créé **posé** : cadence en panne → **503** « Rien n'a été créé. » ; heure ≥ 24 normalisée ; calage avec `cale_date` ;
  **409** `heure_fermee` ; **409** G3. Course après création : **409** `{…, course:true, annule, cree_en_goulotte:
  boolean, data}` — le BDT existe mais est laissé dans la goulotte (`statut 'a_programmer'`, sans process ni jour). Pas de G4.

#### `POST /api/production/bst/:id/affecter-st` (changée)
- BST dans un lot : cadence en panne → **503** ; chemin critique en heures ouvrées ; **G4** → **409**
  `successeurs_a_deprogrammer` **avant** la création du BC ; corps + `deprogrammer_successeurs?` ; **200** + 
  `successeurs_deprogrammes`, `remis_goulotte_le`, `avertissement`.

#### `POST /api/production/bdt/:id/recu` et `/solder` (changées)
- `/recu` écrit **`recu_le`** (instant ISO) avec `statut`, `debut_reel`, `operateur_id` ; base sans la colonne : réessai
  sans elle. `data.recu_le` rendu.
- `/solder` : `temps_reel` + 24 h quand l'heure de fin précède `debut_reel` (équipe de nuit).

#### Pages concernées (rendu serveur)
- `GET /production/service` : lit la cadence en parallèle (`lireDonneesCadence`, 20ᵉ paramètre de `pageServiceProd`) et
  la gamme des nomenclatures ; chaque BDT `oas_apres` porte `oas_suivant: string[]` (process OAS suivant, vide =
  introuvable) ; carte « Enchaînements à revoir » en heures ouvrées. Globales client : `CADENCE_PAGE {disponible, absente,
  erreur, avertissement, donnees}`, `CAD`, `cadCalendrier`, `cadHorairesCreneau`, `cadNotifierChangement`, `PLAN_AXE`.
  `?tab=machines&vol=cad` ouvre le volet Cadence usine.
- `GET /oas/service` : + cadence ; `lotsAVenirOas` → 10ᵉ paramètre de `pageServiceOAS` (section « Lots à venir ») ;
  cadence illisible (absente ou panne) = grille, jamais d'erreur.
- `GET /rh/temps` : + `lireDonneesCadence()` → 5ᵉ paramètre de `pageRHTemps` (horaires des présences selon la cadence).
- ⚠ Non changées : `POST /api/planning/affectation-poste` (créneau fermé seulement grisé à l'écran), `PATCH
  /api/production/bds/:id`, `POST /api/production/bst/affecter`, `POST /api/production/bdt/:id/deprogrammer` (n'écrit pas
  `remis_goulotte_le`).

### Lot F (15/09/2026) — PV quantitatif / qualitatif, reliquat, Mise en stock, types d'objet et zones

Familles **`expeditions`**, **`stock`**, **`qualite`**, **`validations`**, **`bc`** — **aucune nouvelle famille**. Migration
**013** / `cloud-11`. Sur une base sans 013, les routes de la file et des référentiels répondent **409**
`{ok:false, table_absente:true, error}` (« Mise en stock indisponible : … jouez la migration 013 … ou le script
cloud-11 … ») ; le PV et la décision Qualité retombent sur l'entrée directe en stock avec un avertissement. Toutes les
écritures `/api/stock/…` du lot exigent l'**écriture Stock**, revérifiée dans le handler (**403** « Réservé aux personnes
qui ont l'écriture sur le Stock. ») ; toute lecture qui décide est **stricte** (**503**, jamais « introuvable »). Règles :
`06-modules/stock.md`, `expeditions.md`, `achats.md`, `qualite.md`, `direction.md`, sections « Lot F » ; règles pures
`src/mise_en_stock.ts`, `src/pv_reception.ts`.

#### `POST /api/expeditions/bc/:id/pv` (contrat changé)
- **Corps** : inchangé (`resultat`, `controleur_id`, `bl_id?`, `certificat_requis_affiche?`, `certificat_confirme?`,
  non conforme : `observation_generale?`, `gravite?`) **+ `lignes` obligatoire en Conforme comme en Non conforme** :
  `[{ idx, qte_recue, reliquat?, observation?, qte_prevue_affichee? }]` — chaque ligne de `lignesBc(bc)` exactement une
  fois ; `qte_recue` nombre ≥ 0 (« 12,5 » accepté, ≤ 10 000 000) ; `reliquat` lu seulement si reçue < prévue ;
  `observation` facultative (1 000 max, une observation rend la ligne qualitative) ; `qte_prevue_affichee` = quantité
  prévue montrée par la page. `conforme` envoyé par le client est **ignoré** (déduit).
- **400** `{ok:false, error, champ:'lignes', idx?}` : `lignes` absent ; ligne illisible, inconnue ou envoyée deux fois ;
  quantité reçue manquante, invalide ou invraisemblable ; **quantité prévue changée depuis l'ouverture** (« rechargez la
  page, puis refaites le PV. Rien n'a été enregistré. ») ; observation trop longue ; **Conforme** avec une ligne en écart
  (« … — le PV ne peut pas être conforme : passez en « Non conforme » ») ; **Non conforme** sans ligne en écart ni
  certificat absent. Un reliquat annoncé n'est **pas** un écart (Conforme accepté). Autres réponses d'erreur inchangées.
- **Effets** (chaque échec en avertissement, le PV reste écrit) : une NC par ligne en écart (+ certificat) ; une
  quarantaine par ligne qualitative (+ certificat) avec `ligne_idx` ; une `validations` `excedent_reception` par excédent ;
  un BC de reliquat `<num_bc>-R<n>` (idempotent par BL) ; `bons_de_livraison.qte` = somme reçue ; lignes `pv` dans
  `mises_en_stock` (repli sans 013 : crédit direct ligne par ligne) ; `detail` v2 complété ; `recalculerStatutBc`. **Plus
  de porte matière** (sauf repli, crédit complet).
- **200** `{ ok, pv_id, resultat, anomalie, certificat_matiere, controleur: {id, nom}, nc_id, nc_ids: string[],
  quarantaine_id, quarantaine_ids: string[], validation_ids: string[], bc_reliquat_id: string|null, mise_en_stock:
  {lignes, qte, ids, deja}|null, stock (repli seulement), lignes: [{idx, qte_prevue, qte_recue, nature, qte_a_ranger,
  qte_quarantaine, qte_reliquat, excedent_a_valider}], bc_statut, bdt_debloques, manque_matiere, avertissements }` —
  `nc_id` / `quarantaine_id` = premier élément de la liste ; `bdt_debloques` et `manque_matiere` non nuls seulement en
  repli.

#### `POST /api/expeditions/bc/:id/receptionner` (changé)
- `livraison_partielle` est **ignoré** (toujours faux) : la ligne « connue, `livraison_partielle` » du tableau Lot D
  ci-dessous ne s'applique plus, ni le 400 « livraison partielle sur un BC à plusieurs articles ». La réponse garde
  `livraison_partielle: false`. Le reliquat se déclare au PV.

#### `POST /api/bc/:id/date-arrivee` et `POST /api/expeditions/bc/:id/date-arrivee` (changées)
- BC **`date_a_valider`** (reliquat) : écriture **conditionnelle** `{date_livraison, date_livraison_initiale?,
  date_a_valider:false}` sur `date_a_valider = true` → **200** `{ok, date_livraison, date_livraison_initiale,
  date_validee: true}` ; déjà validée ailleurs → mise à jour de la date seule (`date_validee: false`).
- Un BC de reliquat `date_a_valider` **sans date** n'est pas figé par `accuse_fournisseur_le` (le 409 « validée par le
  fournisseur » ne s'applique pas). Autres cas inchangés.

#### `POST /api/qualite/quarantaine/:id/decision-fournisseur` (changée)
- **Corps** : + `repartition?: [{ idx, qte }]` — exigée quand le lot couvre plusieurs articles et que la part acceptée
  n'est ni « tout le lot » ni portée par un seul article ; somme = part acceptée, chaque ligne ≤ sa quantité en quarantaine.
- **400** `{ok:false, champ:'repartition', repartition_requise: boolean, lignes: [{idx, reference, designation, unite,
  num_affaire, qte}], error}` — **avant** la réservation (la décision n'est pas consommée) ; **503** lecture du PV
  (`getPVReceptionParNumStricte`) impossible. Autres réponses inchangées.
- **Effets** : la part acceptée devient des lignes `decision_qualite` de `mises_en_stock` (une par ligne couverte) au lieu
  d'`entrerStockReception` ; porte matière **évaluée** quand le BC devient `controle` sans manque.
- **200** : + `mise_en_stock: {lignes, qte, ids, deja}|null` ; `stock` et `bdt_debloques` seulement en repli sans la file ;
  `resume` « … accepté(s), inscrit(s) dans Stock › Mise en stock (à ranger) ».

#### `POST /api/validations` et `POST /api/validations/:id/decision` (changées)
- `POST /api/validations` avec `type: 'excedent_reception'` → **403** « Une demande d'excédent de réception est créée par
  le PV de contrôle, pas ici. »
- `/decision` : la demande est d'abord **relue strictement pour tous les types** (**503** si la lecture échoue).
  Type `excedent_reception` :
  - **409** déjà décidée ; refus sans `commentaire` → **400** « Indiquez le motif du refus. » ; payload illisible ou
    sans quantité → **409** ;
  - accepter un excédent `qualite_requise` : quarantaine absente, en cours ou non trouvée → **409**, renvoyée au
    fournisseur → **409** « refusez-le », lecture impossible → **503** ;
  - transition **conditionnelle** depuis `en_attente` (**409** si décidée entre-temps) ;
  - accepter, file refusée : demande remise `en_attente` ; **409** `{table_absente:true}` (base sans 013) ou **400** ;
  - **200** accepter `{ ok, validation, excedent: {decision:'accepte', mise_en_stock_ids, deja}, message }` ;
  - **200** refuser `{ ok, validation, excedent: {decision:'refuse', retour_id: 'QEXC-<id>'|null}, avertissements,
    message }` — `payload` + `decision`, `suite: 'retour_a_organiser'`, `retour_quarantaine_id` ; `refus_mode` n'est pas
    écrit.

#### Stock — file « À ranger » (`/api/stock/mise-en-stock`)
| Route | Corps / paramètres | Réponse 200 | Erreurs propres |
|---|---|---|---|
| `GET /api/stock/mise-en-stock` | `?statut=a_ranger` (défaut) \| `range` \| `annule` \| `tous` \| liste séparée par des virgules | `{ok, table_absente:false, lignes}` (500 au plus, plus récentes d'abord) | 409 `table_absente` · 503 |
| `POST /api/stock/mise-en-stock/:id/accepter` | `{type_objet?, emplacement?, nouvelle_zone?, reference?}` (`reference` lue seulement si la ligne n'en porte pas) | `{ok, ligne_id, stock_id, reference, type_objet, emplacement, emplacement_fixe, zone_creee, quantite, unite, mouvement_id, stock_avant, stock_apres, bdt_debloques, manque_matiere, avertissements}` | 400 `{error, champ}` (`type_objet` \| `emplacement` \| `nouvelle_zone` \| `reference`) ; 404 ; 409 ligne plus à ranger, emplacement fixe différent, zone désactivée, références en double, conflit de réservation, stock modifié en continu, déjà créditée ; 503 lectures ; 400 écritures (la ligne est rendue `a_ranger`, `avertissements` joints) |
| `POST /api/stock/mise-en-stock/:id/annuler` | `{motif}` (≥ 3) | `{ok, ligne, bdt_debloques, manque_matiere, avertissements}` | 400 `champ:'motif'` ; 404 ; 409 ligne plus à ranger / conflit ; 503 |

#### Stock — mouvements manuels
| Route | Corps | Réponse 200 | Erreurs propres |
|---|---|---|---|
| `POST /api/stock/entree` | `{reference, designation?, quantite, unite?, type_objet?, num_affaire?, motif}` | `{ok, id}` — ligne `entree_manuelle` à ranger, **rien n'est crédité** | 400 `{champ}` (`reference` \| `quantite` \| `motif` \| `type_objet`) ; 503 types |
| `POST /api/stock/sortie` | `{stock_id, quantite, motif, bdt_id?, lot_id?, num_affaire?}` | `{ok, mouvement, stock_avant, stock_apres, lot_id, num_affaire, avertissements}` | 400 `{champ}` (`stock_id` \| `quantite` \| `motif` \| `bdt_id` : BDT inconnu, d'un autre lot ou d'une autre affaire \| `num_affaire` : affaire inconnue) ; 404 article ; **409 stock insuffisant** ; 409 stock modifié en continu ; 503 lectures ; 400 mouvement refusé (stock rétabli) |
| `POST /api/stock/ajustement` | `{stock_id, nouvelle_quantite, motif}` | `{ok, mouvement, ecart, stock_avant, stock_apres}` — mouvement `ajustement`, `quantite` = écart signé | 400 `{champ}` (`nouvelle_quantite` : < 0 ou écart nul \| `motif` \| `stock_id`) ; 404 ; 409 ; 503 |

#### Stock — référentiels et emplacement fixe
| Route | Corps / paramètres | Réponse 200 | Erreurs propres |
|---|---|---|---|
| `GET /api/stock/types-objet` | — | `{ok, types}` | 409 `table_absente` · 503 |
| `POST /api/stock/types-objet` | `{libelle, code?, ordre?}` (libellé 2 à 60 ; code dérivé du libellé) | `{ok, type}` | 400 `{champ}` ; 409 code ou libellé déjà pris / créé simultanément |
| `PATCH /api/stock/types-objet/:code` | `{libelle?, ordre?, actif?}` | `{ok, type}` | 400 libellé, ordre, « Rien à modifier » ; 404 ; 409 libellé d'un autre type |
| `GET /api/stock/zones` | `?type_objet=` | `{ok, zones}` | 409 `table_absente` · 503 |
| `POST /api/stock/zones` | `{type_objet, zone, ordre?}` (zone ≤ 80) | `{ok, zone, existante}` (zone déjà là → rendue, `existante: true`) | 400 `{champ}` (type non actif, zone vide ou trop longue) ; 409 zone existante désactivée |
| `PATCH /api/stock/zones/:id` | `{zone?, ordre?, actif?}` | `{ok, zone}` | 400 ; 404 ; 409 nom déjà pris pour ce type, **renommage d'une zone qui est l'emplacement de références** ; 503 |
| `PATCH /api/stock/:id/emplacement` | `{type_objet?, emplacement?, motif?}` (`emplacement: ''` = retirer) | `{ok, stock, type_objet, emplacement, historique_id, avertissements}` — changement d'emplacement historisé | 400 `{champ}` (type inconnu ou vidé, zone hors liste du type, « Rien à modifier ») ; 404 ; 409 modifié par ailleurs, `table_absente` ; 503 |
| `GET /api/stock/:id/emplacement/historique` | — | `{ok, historique}` (200 lignes, plus récentes d'abord) | 409 `table_absente` · 503 |

#### Autres routes touchées
- `POST /api/commandes/:id/generer-da` : le stock disponible compte la quantité à ranger (« stock suffisant (N dispo dont
  M à ranger ≥ besoin) ») ; lecture de la file en panne → **503**, aucune DA générée.
- `POST /api/direction/scan-alertes` : pas d'alerte de rupture pour une référence en attente de rangement ; file en
  panne → ruptures non évaluées, réponse `+ ruptures_non_evaluees: true, avertissement`.
- `POST /api/qualite/quarantaine/:id/decision-fournisseur`, `POST /api/expeditions/bc/:id/pv` : voir ci-dessus.

#### Pages concernées (rendu serveur)
- `GET /stock/service` : charge la file (`a_ranger`, toutes pages), les 40 dernières lignes rangées ou annulées, types,
  zones, 300 lignes d'historique, `type_objet` des références ; type proposé par ligne (`deduireTypeObjet`) ; `autoReappro`
  compte la quantité à ranger et **ne tourne pas** si la file est illisible ; `pageServiceStock(arts, mvts, fournisseurs,
  {file, rangees, types, zones, historique, tableAbsente, erreur, erreurFile, erreurTypes, peutEcrire})`.
- `GET /expeditions/service` : `bcsView` + `bc_parent_id`, `date_a_valider` ; quarantaines par BL en liste.
- `GET /achats/service` : projection des BC + `reliquat_de` (n° du BC d'origine), `date_a_valider`.
- `GET /qualite/service` : `QUAR_DATA[].reception` + `source_lignes`, `lignes` (`lignesDeQuarantaine`).
- `GET /direction/service` : stocks critiques = stock rangé + à ranger.

### Production (15/09/2026) — soldage et réception d'un BDT, demande d'achat et PV de non-conformité signés à l'atelier

Famille **`production`**, aucune nouvelle famille, **aucune migration**. Les quatre routes `bdt/:id/recu`,
`bdt/:id/solder`, `demande-achat-operateur` et `nc` sont **self-service** (`SELF_SERVICE_RE`, borne partagée) : le
middleware laisse passer tout compte connecté, et c'est le **handler** qui juge le salarié du matricule + PIN — jamais la
personne connectée, jamais un nom envoyé par le navigateur. « Écriture Production » d'un salarié = droits recalculés comme
au login : `sessionDeSalarie` (rôles = `roles` sinon `[role]` ; droits = `autorisations` non vides sinon
`autorisationsUnion(rôles)`) puis `peutEcrireService(…, 'production')` (`all`, rôle `production`, jeton
`ecrire:production`). Règles et causes : `06-modules/production.md`, section du 15/09/2026 ; règles pures
`src/soldage_bdt.ts` et `src/prod_da_nc.ts`.

#### `POST /api/production/bdt/:id/solder` (réécrite)
- **Corps** : `{ matricule, pin, fin: 'HH:MM', resultat?: 'ok'|'reprise'|'nc' (défaut ok), obs?, gravite_nc?:
  'Mineure'|'Majeure'|'Critique'|'Bloquante' }`. **`bypass_competence` n'existe plus.**
- **Réponses, dans l'ordre** (toujours `{ok:false, error}` en cas d'échec) :
  - **400** « Matricule et code PIN requis pour solder. » · **400** « Heure de fin réelle requise (HH:MM). »
    (`heureFinValide` : `HH` ≤ 23, `MM` ≤ 59) ;
  - **401** « Matricule ou code PIN incorrect. » — `verifySalariePin` : **tout salarié actif**, `est_operateur`
    indifférent. ⚠ Non stricte : Supabase en panne répond aussi 401. Le compte de secours (sans fiche salarié) : 401 ;
  - **503** « Lecture du BDT impossible : … » (`getBDTStrict`) · **404** « BDT introuvable. » ;
  - **409** « BDT déjà soldé. » · **409** « Ce BDT n'est pas « Reçu » : il doit d'abord être reçu (double-clic sur le
    planning, matricule + PIN) avant d'être soldé. » (le serveur ne le vérifiait pas) ;
  - **403** `MSG_SOLDAGE_RESERVE` « Seuls l'opérateur qui a reçu ce BDT ou une personne habilitée à écrire en Production
    peuvent le solder. » · **403** « X a reçu ce BDT, mais sa fiche ne comporte pas le soldage (opérateur OAS :
    autocontrôle et passage de lots uniquement | autorisations de la fiche salarié, RH). Faites solder par une personne
    habilitée à écrire en Production. » ;
  - **500** « Soldage non enregistré : … » · **409** « Ce BDT vient de changer (déjà soldé ou plus « Reçu ») :
    rechargez le planning. » (`majBDTConditionnelle(id, patch, { statut: 'recu' })`).
  - **200** `{ ok, data (ligne BDT soldée), operateur (nom du soldeur), operateur_id (soldeur), voie:
    'ecriture_production'|'operateur_recu', recu_par: {id, nom} | null, avertissement: string | null }`.
- **Droit** (`droitSoldageBDT`) : voie `ecriture_production` (solde tout BDT reçu) ; sinon voie `operateur_recu` si
  `bons_de_travail.operateur_id` = id du signataire **et** autorisations **fonctionnelles** de sa fiche (jetons
  `lire:`/`ecrire:` exclus ; vide ⇒ celles des rôles, `autorisationsFonctionnelles`) contenant `soldage` ou `all`.
- **Avertissement non bloquant** (`avertissementCompetence`) : « Matrice de compétences : X n'a pas de niveau renseigné
  pour ce process. Soldage enregistré ; pensez à mettre la matrice à jour (RH › Compétences). » — lignes de
  `competences_operateur` de l'opérateur **qui a reçu** le bon, comparées au `process_id` du BDT (clé réelle de la
  matrice) **et** à son libellé `operation` ; niveau ≥ 1 ; aucune ligne pour lui ⇒ `null`.
- **Écritures** : BDT `{statut:'solde', fin_reel, resultat, temps_reel}` — `operateur_id` **inchangé** (réceptionnaire,
  base du coût réel) ; recalcul avancement + coût de la commande ; historique opérateur (et machine) avec
  `operateur_id` / `operateur_nom` / `matricule` du **soldeur** ; NC si `resultat = nc` (`detecteur` = soldeur) ; PV
  `autocontrole` (`operateur_id` = soldeur ; observations « BDT reçu par X, soldé par Y (écriture Production) » quand ce
  sont deux personnes).

#### `POST /api/production/bdt/:id/recu` (élargie)
- **Corps** `{ matricule, pin }`. Signataire : `verifyOperateurPin` (fiche `est_operateur`, comme avant) ; à défaut
  `verifySalariePinStricte` — un salarié actif ayant l'**écriture Production** (chef d'atelier, direction) reçoit aussi.
- **Réponses** : **503** « Vérification du matricule impossible (lecture des salariés), rien n'a été enregistré : … »
  (2ᵉ voie seulement) · **403** « Seuls un opérateur ou une personne habilitée à écrire en Production peuvent recevoir un
  BDT. » (PIN juste, ni opérateur ni écriture Production) · **200 `{ok:false, error:'Matricule ou code PIN incorrect.'}`**
  (code HTTP inchangé, historique) · **404** · **409** « BDT déjà reçu. » / « BDT déjà soldé. » / « Programmez d'abord ce
  BDT … » · porte OAS (200 `ok:false`) · **200** `{ ok, data, operateur, operateur_id }`.
- **Effet** : `statut recu`, `debut_reel` (heure de Paris), **`operateur_id` = le signataire** — un chef qui reçoit
  devient le réalisateur du bon : c'est son coût chargé RH qui valorise le temps réel (`coutReelBdt`), et lui seul (ou une
  personne qui écrit en Production) peut le solder.

#### Signature commune de la DA et du PV de non-conformité (`signataireProduction`)
- **400** `{champ:'matricule'}` « Saisissez votre matricule. » · **400** `{champ:'pin'}` « Saisissez votre code PIN. »
  (matricule ou PIN > 60 caractères : 400 `{champ:'pin'}` « Matricule ou PIN incorrect. ») ;
- **503** « Vérification du matricule impossible (lecture des salariés), rien n'a été enregistré : … »
  (`verifySalariePinStricte` : une panne n'est jamais « PIN incorrect ») ;
- **401** `{champ:'pin', error:'Matricule ou PIN incorrect.'}` — mauvais couple, salarié inactif, ou matricule contenant
  `% _ , * ( ) \` (jokers PostgREST refusés, comme `verifyOperateurPin`) ;
- **403** `{champ:'matricule'}` — `MSG_DA_RESERVE` « Seules les personnes habilitées à écrire en Production peuvent faire
  une demande d'achat depuis la Production. » ou `MSG_NC_RESERVE` « … peuvent émettre un PV de non-conformité depuis la
  Production. ».
- La saisie n'est validée **qu'après** : un non-habilité n'apprend rien du formulaire.

#### `POST /api/production/demande-achat-operateur` (même URL, contrat changé)
- **Corps** : `matricule*`, `pin*`, `categorie*` (`matiere`|`accessoire`|`machine`), `article*` (≤ 200), `reference`
  (≤ 80), `qte*` (> 0, ≤ 1 000 000, virgule acceptée), `unite` (`u` `kg` `g` `t` `m` `mm` `m²` `m³` `l` `lot` `boîte`
  `rouleau` `paire` `jeu`), `machine_id` (obligatoire et retenu **seulement** pour `machine`), `poste_id`, `num_affaire`,
  `priorite` (`normal`|`urgent`|`critique`, défaut normal), `livraison` (`AAAA-MM-JJ`, pas avant le jour de l'atelier),
  `fournisseur` (≤ 120). **Ignoré** : tout nom de demandeur.
- **Réponses** : signature (ci-dessus) → **400** `{champ}` ∈ `categorie` | `article` | `reference` | `qte` | `unite` |
  `machine_id` | `poste_id` | `num_affaire` | `priorite` | `livraison` | `fournisseur` → **503** « Vérification de la
  demande impossible (lecture de la base) … » → **400** `{champ}` machine / poste inconnus (« rechargez la page »),
  « Affaire X inconnue : choisissez-la dans la liste. » (doit exister dans `commandes`) → **503** « Numérotation
  impossible … » → **500** « Demande d'achat non enregistrée : … » → **200** `{ ok, id, da, avertissements: string[] }`.
- **Ligne `demandes_achat`** (`payloadDaProd`) : `id` `DA-AAAA-NNN` (`nextSeqId('DA', ids, année de l'atelier)` sur une
  lecture **paginée** `lireToutesLignesStricte`), `demandeur` « Prénom Nom (Production) », `type_da` Matière | Accessoire
  | Machine, `article` « désignation (réf. X) », `qte` « 12,5 kg », `priorite`, `statut 'a_traiter'`, `date_da` (jour de
  l'atelier, `dateAtelier()` = Europe/Paris), `livraison`, `visible true`, `genere_par_adt false`, `type_bc
  'fournisseur'`, `fournisseur`, `categorie`, `machine_id`, `poste_id` (le poste de la machine prime), `operateur_id` = id
  du salarié authentifié, `num_affaire`, `affaire_id` (commande, sinon `resolveAffaireId`).
- Colonne **facultative** absente de la base (PGRST204 / 42703) : retirée une à une, avertissement « Information « k »
  non enregistrée : colonne absente de la base (migration à jouer). » ; jamais les obligatoires
  (`COLONNES_DA_OBLIGATOIRES` : id, demandeur, type_da, article, qte, priorite, statut, date_da, visible). Renumérotation
  **une fois** sur 23505.

#### `POST /api/production/nc` (nouvelle)
- **Corps** : `matricule*`, `pin*`, `entite*` (Seem | Semrac), `description*` (≤ 4 000), `date_nc` (≤ jour de l'atelier,
  défaut ce jour), `type_nc` (Interne | Client | Fournisseur, défaut Interne), `gravite` (Mineure | Majeure | Critique |
  Bloquante, défaut Majeure), `num_affaire`, `lot_ref`, `bdt_id`, `ref_article` (≤ 80), `designation` (≤ 200),
  `nb_pieces` (entier > 0), `lieu_detection` (`NC_POSTES_LISTE`), `lieu_imputation` (`NC_IMPUTATIONS`), `type_defaut`
  (`NC_NATURES`), `type_cause` (`NC_CAUSE_OPTS`), `action_corrective` (`NC_ACTIONS_IMMEDIATES`), `cause_detail` (≤ 1 000),
  `traitement` (≤ 1 000), `quarantaine` (booléen : `true` `1` `oui` `on`). Listes de `src/qref.ts`, **sans casse**,
  ramenées à la valeur canonique ; une valeur hors liste → 400.
- **Réponses** : signature → **400** `{champ}` (saisie ; `quarantaine` sans lot, BDT, code article ni désignation) →
  **503** « Vérification du rattachement impossible (lecture de la base) … » → **400** rattachement (`rattacherNcProd`,
  `champ` `num_affaire` | `lot_ref` | `bdt_id`) : « Affaire X inconnue … », « Lot X inconnu. », « BDT Y inconnu. », « Le
  BDT Y appartient au lot X, pas au lot Z. », « Le lot X du BDT Y est introuvable : rattachement impossible à vérifier. »,
  « Le lot X appartient à l'affaire A, pas à l'affaire B. », « Le BDT Y appartient à l'affaire A, pas à l'affaire B. »,
  « Le BDT Y (affaire A) et le lot X (affaire B) ne désignent pas la même affaire. », « Impossible de vérifier que le lot
  X appartient à l'affaire A (lot sans commande connue). », « Impossible de vérifier que le BDT Y appartient à l'affaire A
  (BDT sans affaire ni commande connues). », « Le BDT Y et le lot X ne désignent pas la même affaire. » (sans affaire,
  `affaire_id` divergents) → **503** numérotation → **500** « Non-conformité non enregistrée : … » → **200** `{ ok, id,
  data, quarantaine_id, avertissements: string[] }`.
- **Lectures** (strictes, `lireLignesStricte`) : commande de l'affaire saisie, lot saisi, BDT saisi ; si seul le BDT est
  saisi, **son lot** (`lot_ref`, sinon `lot_id`) ; la commande du lot et celle du BDT (`cmd_id`). Affaire d'un lot = celle
  de sa commande ; d'un BDT = son `num_affaire`, sinon celle de sa commande, sinon celle de son lot vérifié.
- **Ligne `non_conformites`** (`payloadNcProd`) : `id` `NC-AAAA-NNN` (**compteur continu toutes années**,
  `prochainNumeroNc`, même règle que le formulaire Qualité, lecture paginée), `date_nc`, `type_nc`, `gravite`, `statut
  'Ouvert'`, `categorie 'prod'`, `entite`, `lot_ref`, `num_affaire`, `affaire_id` (commandes uniquement, sinon
  `resolveAffaireId` ; sans affaire, celui du lot ou du BDT), `bdt_id`, `operation` (du BDT), `client_nom`, `ref_article`
  (saisi, sinon pièce du BDT / du lot), `designation`, `nb_pieces`, `lieu_detection`, `lieu_imputation`, `type_defaut`,
  `type_cause`, `action_corrective`, `description` = défaut + « Cause présumée : … » + « Traitement proposé : … » + « PV de
  non-conformité émis en Production par X (constat du JJ/MM/AAAA). », **`detecteur` = nom du salarié authentifié**.
  Colonnes obligatoires jamais retirées : id, date_nc, type_nc, gravite, statut, description, detecteur.
- **Quarantaine** (case cochée) : `createQuarantaine({ nc_id, lot_id, piece, client_nom, date_mise_quarantaine, motif:
  'NC … : 1ʳᵉ ligne (N pièces)', statut: 'en_cours' })` puis NC `statut 'quarantaine'` (comme `POST
  /api/qualite/nc/:id/quarantaine`). Échec → avertissement « Quarantaine NON créée (…) : mettez le lot en quarantaine
  depuis Qualité › Non-conformités (NC …). » ou « Quarantaine créée, mais le statut de la NC … n'a pas été mis à jour … ».
- **Action immédiate contenant « Rebut »** : `ensureHseDechet('nc_rebut', id, …)` (idempotent) ; erreur lue →
  avertissement « Rebut non inscrit au registre des déchets (…) : saisissez-le dans Sécurité › Déchets (NC …). ».

#### `POST /api/production/operateur-contexte` — **supprimée**
- Identification préalable de l'ancienne DA « restreinte au poste de l'affectation du jour » : elle refusait tout le monde
  (403) dès que `affectation_poste` n'avait rien pour le jour, et tout non-opérateur (401).

#### `POST /api/production/non-conformites` (formulaire « Nouvelle NC » de la Qualité) — droit changé
- **N'est plus self-service** ; `serviceFor` la classe `qualite` (règle explicite avant la famille `production`).
- **403** middleware « Accès refusé », ou (si `AUTH_ENFORCE` ≠ `off`) handler « La création d'une non-conformité depuis
  la Qualité est réservée aux personnes ayant l'écriture Qualité. En Production, utilisez « PV de non-conformité »
  (matricule + PIN). ». Corps, numérotation (`getNonConformites()`) et effets inchangés.

#### Autres contrats touchés le même jour
- `PATCH /api/rh/salarie/:id` avec `acces_services` : si la fiche n'a **aucune** autorisation fonctionnelle (hors jetons),
  la base devient `autorisationsUnion(rôles de la fiche)` avant d'y ajouter les jetons — sinon la fiche perdait
  `pointage`, `soldage`… au login.
- `GET /api/version` : `commit` = « <sha>-dirty » quand `erp-docker.sh maj` a construit l'image depuis un dossier de
  travail non commité ; `commit_court` garde le suffixe (« 8451cb3b80-dirty »).
- `GET /direction/service` et `POST /api/direction/scan-alertes` : une NC est ouverte si `!ncEstClose(statut)` ;
  `ncEstClose` (`src/queries.ts`) reconnaît « Soldé » (`sold[ée](?!r)`, pas « à solder »).
- `src/queries.ts` : `verifySalariePinStricte(matricule, pin)` → `{data | null, error | null}` (sans le hash du PIN) ;
  `lireLignesStricte(table, select, {colonne, valeur, op:'eq'|'like'}?, limite)` ; `lireToutesLignesStricte(table, select,
  filtre?, {ordre='id', taillePage ≤ 1000, maxLignes = 500 000})` — pages `.range()` triées jusqu'à une page **vide**
  (PostgREST plafonne chaque réponse à `PGRST_DB_MAX_ROWS` sans le dire ; une page courte ne prouve pas la fin).

#### Page `GET /production/service` (rendu serveur)
- `blocDaNcProduction(refFormulairesProd({ commandes, lots, bdts, machines, postes }))` : `#prod-hdr-actions` (déplacé
  dans `#svc-hdr-bar`) avec `#oda-hdr-btn` → `odaOpen()` et `#pvnc-hdr-btn` → `pvncOpen()` ; fenêtres `#odaModal` /
  `#oda_form` et `#pvncModal` / `#pvnc_form` hors des panneaux ; champs `<prefixe>_<champ>` (le `champ` renvoyé surligne
  et focalise), `#oda_err` / `#pvnc_err`, `#oda_envoyer` / `#pvnc_envoyer` désactivés pendant l'envoi.
- `PRODFORM_REF` (`sjX`) : `affaires [{num, client}]` (commandes non annulées avec `num_affaire`), `lots [{id, aff,
  piece}]`, `bdts [{id, lot, aff, piece, op}]` (non annulés, rattachés à une affaire), `machines [{id, nom, poste_id,
  poste, cnc}]`, `postes [{id, nom}]` (non inactifs). Bornes des dates = jour de l'atelier.
- Fenêtre de soldage : `#s_qui` (qui peut solder), ligne « Reçu par » (`OPERATEURS`), `#s_solder_btn` désactivé pendant
  l'envoi, PIN effacé sur refus, message du serveur échappé (`ccEsc`), notification orange si `avertissement`.

### Lot D (14/09/2026) — réception fournisseur, PV de contrôle détaillé, certificat matière

Familles **`expeditions`** (écriture Expéditions) et **`achats`** (écriture Achats) — aucune nouvelle famille.
`receptionner` et `pv` **ne sont plus self-service** : le middleware exige l'écriture Expéditions et chaque handler
la revérifie (`peutEcrireService`, seul contrôle quand `AUTH_ENFORCE=off`). Toute lecture qui décide est
**stricte** : une panne répond **503**, jamais « introuvable ». Règles : `06-modules/expeditions.md` et
`06-modules/achats.md`, sections « Lot D » ; règles pures `src/reception.ts`, `src/pv_reception.ts`,
`src/certificat_matiere.ts`.

#### `POST /api/expeditions/bc/:id/receptionner`
- **Corps** :
  - `num_bl?` — N° BL interne (`^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,59}$`), sinon attribué par `nextBlPourBc` ; `affaire_id?` ;
  - `num_commande_fournisseur`, `num_bl_fournisseur` — **obligatoires**, 100 caractères max ;
  - `hors_france` — **obligatoire** : `true`/`false`, `"oui"`/`"non"`, `"true"`/`"false"`, `1`/`0` ;
  - si `hors_france` : `poids_matiere_kg` (> 0, ≤ 1 000 000, `"125,5"` et `"1 250,5"` acceptés), `num_nomenclature`
    (≤ 100), `code_ewx` (1 | 2, `"1"` accepté), `mode_arrivee` (Routier · Maritime · Aérien · Ferroviaire ·
    Messagerie / express, casse indifférente) ; sinon ces quatre champs sont forcés à `null` ;
  - ~~`livraison_partielle?`~~ (**ignoré depuis le lot F**, 15/09/2026) ; `qte_livree?` (> 0, ≤ 10 000 000).
  - **Ignorés** : `transporteur`, `transporteur_ref`, `qte`.
- **Quantité du BL** (`planReception`) :

  | Cas | Effet |
  |---|---|
  | quantité commandée connue, sans case | BL = reste à recevoir, BC `recu_total` ; `qte_livree` ignorée |
  | connue, `livraison_partielle` | `qte_livree` obligatoire et < reste ; BL = `qte_livree`, BC `recu_partiel` |
  | inconnue, BC à un article | `qte_livree` obligatoire ; `recu_total` (ou `recu_partiel` si la case est cochée) |
  | inconnue, BC à plusieurs articles | `qte_livree` facultative ; sans elle BL `qte: null` + avertissement |
  | `livraison_partielle` sur un BC à plusieurs articles | **400** |

- **Réponses, dans l'ordre** :
  - **403** `{ok:false, error}` — middleware « Accès refusé », ou handler « La réception est réservée aux personnes
    ayant l'écriture sur les Expéditions. » ;
  - **400** `{ok:false, error, champ}` — `champ` ∈ `num_bl` | `num_commande_fournisseur` | `num_bl_fournisseur` |
    `hors_france` | `poids_matiere_kg` | `num_nomenclature` | `code_ewx` | `mode_arrivee` | `livraison_partielle` |
    `qte_livree` ;
  - **503** lecture du BC impossible · **404** `BC introuvable` ;
  - **409** `{ok:false, error, code}` — `code` ∈ `annule` | `deja_recu` (statut `recu_total`, `recu`, `receptionne`,
    `controle`, `cloture`, ou reste ≤ 0). Un BC **figé** (`recu_total`, `bl_id` pointant un BL inexistant, aucune
    réception, pas de `date_reception_reelle`) est **repris** au lieu d'être refusé ;
  - **500** mise à jour conditionnelle du BC en erreur · **409** conflit (BC modifié entre-temps) ;
  - **503** `{ok:false, incertain:true, error}` — BL non confirmé par la base et illisible : rien n'est défait ;
  - **409** / **400** `{ok:false, error, bc_remis}` — création du BL impossible (23505 → 409), BC remis dans l'état lu
    si possible ; 23502 avec quantité inconnue → message « indiquez la quantité livrée ».
  - **200** `{ ok, bl_id, opex_greffe, pv_requis: true, qte, qte_commandee, qte_source: 'bc'|'lignes'|null, qte_recue,
    qte_origine: 'reste'|'saisie'|null, livraison_partielle, reste_apres, multi_articles, bc_statut:
    'recu_total'|'recu_partiel', quantite_inconnue, avertissements: string[] }`.
- **Écritures** : BC d'abord, **conditionnellement** sur le statut lu : `{statut, bl_id, qte_recue?}` (plus de
  `transporteur` / `transporteur_ref`) ; puis BL `{id, type_bl:'reception', bc_id, affaire_id, cmd_id:null,
  client_nom, date_bl, qte, statut:'recu', piece, operation, num_commande_fournisseur, num_bl_fournisseur,
  hors_france, poids_matiere_kg, num_nomenclature, code_ewx, mode_arrivee}` (colonnes absentes → nouvel essai sans
  elles + avertissement 012) ; greffe OPEX machine ; `date_reception_reelle` à la 1ʳᵉ réception (échec dit).
- **Avertissements possibles** : colonnes 012 absentes ; BC à plusieurs articles sans quantité exploitable ; « Réception
  reprise : … » ; « La base n'avait pas confirmé la création du BL …, réception conservée » ; « … Au PV conforme, rien
  n'entrera en stock automatiquement. » ; date d'arrivée réelle non enregistrée.

#### `POST /api/expeditions/bl/:id/reception-infos` (nouvelle)
- Corrige les informations de réception d'un BL. **Corps** : `num_commande_fournisseur`, `num_bl_fournisseur`,
  `hors_france` et, si hors France, les quatre champs d'import — mêmes règles que la réception. `num_bl`,
  `qte_livree`, `livraison_partielle` et tout autre champ sont ignorés.
- **403** (écriture Expéditions) · **400** `{champ}` · **503** lecture du BL · **404** · **409** BL qui n'est pas une
  réception fournisseur (`type_bl` ≠ `reception`, `nc_id` renseigné, ou pas de `bc_id`) · **409**
  `{needsMigration:true}` colonnes 012 absentes · **400** écriture refusée.
- **200** `{ ok, bl_id, infos }` — n'écrit que les 7 colonnes 012 : ni quantité, ni statut, ni stock.

#### `POST /api/expeditions/bc/:id/pv`
- **Corps** :
  - `resultat` : `conforme` | `non_conforme` (alias `ok`, `anomalie`, `nc`, « Non conforme ») ; à défaut, l'ancien
    `anomalie: boolean` ;
  - `controleur_id` — **obligatoire**, 100 caractères max ;
  - `bl_id?` — la réception contrôlée (à défaut `bc.bl_id`) ;
  - `certificat_requis_affiche?` — ce que la page a montré (booléen) ;
  - `certificat_confirme?` — lu seulement si le BC exige le certificat ;
  - ⚠ **Remplacé au lot F** (voir « Lot F » ci-dessus : `lignes` avec quantités dans les deux cas). Contrat du 14/09 : non conforme : `lignes: [{ idx, conforme, observation? }]` — **chaque** ligne de `lignesBc(bc)` exactement une fois,
    `observation` obligatoire (1 000 max) si `conforme` est faux ; `observation_generale?` (4 000 max) ; `gravite?`
    (Mineure | Majeure | Critique | Bloquante, défaut Majeure).
  - **Ignorés** : `operateur`, `observations`, `quarantaine`, et tout champ de ligne autre que `idx` / `conforme` /
    `observation` (le serveur relit les lignes du BC).
- **Réponses, dans l'ordre** :
  - **403** `MSG_PV_RESERVE` (« Le PV de contrôle est réservé aux personnes ayant l'écriture sur les Expéditions. ») ;
  - **400** `{champ:'controleur_id'}` « Choisissez le contrôleur. » ;
  - **503** / **404** BC ; **503** lecture des BL ; **409** aucune réception (hors sous-traitance) ;
  - **503** lecture des PV ; **409** `{pv_id}` PV déjà établi pour ce BL ;
  - **409** `{code:'certificat_change'}` — `certificat_requis_affiche` ≠ exigence actuelle du BC (rien n'est écrit) ;
  - **400** `{champ, idx?}` — `champ` ∈ `resultat` | `controleur_id` | `certificat_confirme` (conforme sans certificat
    exigé) | `lignes` | `observation_generale` | `gravite` ;
  - **503** lecture des salariés ; **403** `{champ:'controleur_id'}` `MSG_CONTROLEUR_NON_ELIGIBLE` (inactif, sans écriture
    Expéditions, inconnu, ou compte de secours) ;
  - **409** 23505 sur `ux_pv_controle_reception_bl` (« vient d'être établi par ailleurs ») ou n° de PV pris ; **400**
    autre erreur d'écriture.
  - **200** `{ ok, pv_id, resultat, anomalie, certificat_matiere, controleur: {id, nom}, nc_id, quarantaine_id, stock,
    bc_statut, bdt_debloques, manque_matiere, avertissements: string[] }`.
- **Écriture `pv_controle`** : `num_pv`, `date_pv`, `operateur_id` = id du contrôleur (null sur 23503),
  `type_controle 'reception'`, `type_lien 'livraison'`, `bl_id`, `bc_id`, `piece`, `client_nom`, `fournisseur`, `statut`
  `valide`|`nc_ouverte`, `decision` `libere`|`bloque`, `anomalie`, `nc_ouverte`, `observations` = « Contrôleur : <nom> — »
  + résumé ; colonnes 012 `detail` (jsonb v1), `controleur_id`, `controleur_nom`, `saisi_par`, `certificat_matiere`
  (`non_requis`|`confirme`|`absent`). Colonnes absentes → nouvel essai sans elles, détail complet en texte dans
  `observations`, avertissement.
- **Non conforme** : NC `NC-AAAA-NNN` (renumérotée une fois sur 23505), `type_nc 'reception fournisseur'`, `statut
  'ouverte'`, `gravite`, `lot_ref` = BL, `operation 'Contrôle réception'`, `detecteur 'Réception'`, `affaire_id`,
  `fournisseur_nom` si la colonne existe, `description` (lignes en « Non », certificat absent, contrôleur),
  `ref_article` / `designation` si une seule ligne en « Non », `nb_pieces` = quantité du BL (repli sans les colonnes
  descriptives, puis sans `nb_pieces` sur 22P02 / 22003). **Quarantaine toujours** (`motif` = description, `qte`, `pv_id`,
  `nc_id`, `bc_id`, `bl_id`, `fournisseur_nom` ; repli sans colonnes 008). `bons_de_commande.pv_id`. Chaque échec partiel
  → `avertissements`.
- **Conforme** : `entrerStockReception(bc, bl)` → `stock = {entre, qte, article, raison, lignes?}`. BL sans quantité →
  `{entre:false, raison: 'quantité reçue inconnue sur le BL : entrée en stock non faite (BL … reçu sans quantité)'}`.
  BC à plusieurs articles → une entrée par ligne (motif « Réception BC … · BL … · ligne n »), seulement si la quantité
  couvre toute la commande ; entrée partielle → avertissement « Entrée en stock incomplète : … ». Puis
  `recalculerStatutBc` et porte matière, inchangés.

#### `POST /api/achats/bc/:id/certificat-matiere` (nouvelle, famille `achats`)
- **Corps** `{ requis: boolean }` (`parseBooleen` : true/false, 1/0, oui/non, on/off, yes/no).
- **400** `requis` absent ou illisible · **503** lecture du BC ou des PV · **404** · **409** `{needsMigration:true,
  error: AVERT_CLOUD10}` colonne absente · **409** BC annulé · **409** `{pv_id}` un PV de réception conforme existe (dans
  les deux sens) · **500** écriture refusée ou valeur relue différente.
- **200** `{ ok, inchange, bc_id, num_bc, certificat_matiere_requis }` (`inchange: true` si la valeur était déjà en place ;
  sinon écrite puis **relue**).

#### `POST /api/achats/bc` et `POST /api/achats/da/:id/soumettre`
- Corps : champs existants + `certificat_matiere_requis?` (booléen ; absent = non requis).
- Réponse : champs existants + `certificat_matiere_requis` (valeur relue dans le BC créé ; `false` si la colonne manque)
  + `avertissement` (`AVERT_CLOUD10`) **seulement** si la case était cochée et la colonne absente — le BC est créé dans
  tous les cas.

#### `GET /api/bc/:id/pdf`
- Si `certificatRequis(bc)` : encadré « Certificat matière exigé : il doit accompagner la livraison. Sans certificat, la
  réception sera déclarée non conforme. », entre le destinataire et le tableau des lignes.

#### Pages concernées (rendu serveur)
- `GET /expeditions/service` : `bcsView` + `qte_commandee_num`, `qte_source`, `qte_recue_num`, `reste_a_recevoir`,
  `lignes`, `multi_articles`, `stock_multi_ok`, `affaires`, `certificat_matiere_requis`, `montant_ht`, `notes`,
  `conditions_paiement` ; `extra` + `controleurs [{id, nom}]`, `controleursIndisponibles`, `peutEcrireExpeditions`,
  `utilisateurId`, `pdfBcAutorise` (droits à `true` si `AUTH_ENFORCE=off`). Côté client : `EXP_BC` (contenu commercial
  vidé sans écriture Expéditions, `prix_unitaire` null sans droit au PDF), `EXP_PV`, `EXP_BLREC`.
- `GET /achats/service` : chaque BC + `certificat_requis`, `certificat_col`, `pv_conforme` ; `ACH_BCS` +
  `certificat_requis`, `pv_conforme`.
- `GET /expedition/bl-liste` : colonne Transport = transporteur, à défaut « BL fourn. … » ; commande fournisseur et bloc
  hors France dessous ; quantité `null` affichée « — ».

### Lot C (14/09/2026) — présences, réglage / réalisation, découpe, recollage, chemin critique

Toutes ces routes sont dans la famille **`production`** (écriture production pour les écritures), sauf
`/api/rh/conge/:id/valider` (famille `rh`). supabase-js ne lève jamais : toute lecture qui décide est
**stricte**, une panne répond **503** et n'est jamais confondue avec « absent ». Règles métier :
`06-modules/production.md`, section « Lot C ».

#### `GET /api/production/presence?from=AAAA-MM-JJ&to=AAAA-MM-JJ`
- Dates valides, `from ≤ to`, 62 jours maximum, sinon **400**.
- **200** `{ ok, from, to, presences: [{ operateur_id, date, shift }] }` ; **503** si la lecture échoue
  ou est tronquée (compte exact comparé aux lignes reçues).

#### `POST /api/production/presence`
- Corps `{ operateur_id, date_presence, shift, operateur_nom?, activite?, source? }`, `shift ∈ matin |
  journee | apmidi | soir | absent` — tout autre créneau, vide compris → **400** (plus de repli `journee`).
- Salarié lu de façon ciblée (**503** si panne ; inconnu → nom et activité du corps).
- **200** `{ ok, presence }` ; 42P10 (index unique absent) → **500** avec le renvoi vers la migration 010 /
  `cloud-8` ; autre erreur base → 400.

#### `DELETE /api/production/presence`
- Corps JSON (ou query) `{ operateur_id, date_presence }` ; **400** si invalide.
- Suppression **relue** : **409** si la ligne existe encore (refus silencieux des droits) ; **200** sinon
  (vider une case déjà vide n'est pas une erreur).

#### `POST /api/production/conge/:id/valider`
- Corps `{ decision: 'valide' | 'refuse' }` obligatoire (**400**).
- Congé lu (**503** / **404**, id mal formé = 404) ; salarié lu (**503**) ; absent ou `est_operateur` ≠ true →
  **403** ; **auto-validation** (utilisateur de session = salarié du congé) → **403** « Un congé ne se
  valide pas soi-même » ; statut ≠ `demande` → **409**.
- Décision **conditionnelle** (`eq statut 'demande'`) : aucune ligne mise à jour → **409**.
  `valide_par = 'Production · <nom de session>'`.
- **200** `{ ok, conge, absences_creees, absences_attendues, bdt_rerouted, warning? }`.

#### `POST /api/rh/conge/:id/valider` (RH, Direction)
- Corps `{ decision?: 'refuse' (sinon valide), valide_par? }`.
- Depuis la revue du lot C : lecture ciblée du congé (503 / 404), **409** si statut ≠ `demande`,
  décision conditionnelle (409 si traité entre-temps) — un double clic ne décompte plus deux fois.

**Effets d'une validation** (communs aux deux routes, `effetsDecisionConge`) : une absence par jour
ouvré ; BDT de l'opérateur sur la période lus de façon ciblée (`operateur_id` + `date_prevue` entre les
bornes) et renvoyés au pool ; solde (`solde_conges` ou `solde_rtt`, en heures) lu de façon ciblée puis
décompté. **Chaque effet raté est écrit dans `warning`** (« solde non décompté (…) — à corriger dans
RH », « N BDT non renvoyé(s) au pool : … », « x/y jours d'absence réellement posés »).

#### `PATCH /api/production/bdts/:id`
- `debut` ou `date_prevue` dans le corps → **400** (le jour et l'heure se posent par `/affecter`).
- `temps_reglage` ignoré (hors liste).
- `duree` ou `temps_alloue` : **400** si invalide ; lecture du BDT (**503** / **404**) ; **409** si la valeur
  est inférieure au `temps_reglage` stocké.

#### `POST /api/production/bdts`
- `temps_reglage` facultatif (nombre ou `"0,5"`), ≥ 0, ≤ `duree`, au centième, sinon **400** ; absent → `null`.
- BDT créé **posé** (statut ∉ `''`/`a_programmer`, `process_id`, `date_prevue`) : `debut` vide → **6**
  (`PLAN_HEURE_DEFAUT`) ; dans un lot avec `seq` : même contrôle que `/affecter` (409 / calage, 503 si la
  lecture du lot échoue).
- **200** `{ ok, data, cale_a?, avertissement? }` (avertissement `cloud-9` si les colonnes manquent).

#### `POST /api/production/bdt/:id/affecter`
- Corps `{ process_id, date_prevue?, debut? }`. Lecture stricte du BDT (**503** / **404**) ; reçu ou soldé →
  **409**.
- **Toute pose écrit une heure** : `debut` demandé (au centième), sinon l'heure actuelle du BDT, sinon **6**.
- Chemin critique (si lot + `seq`, opérations du lot lues par `lireOperationsDuLot`, **503** si panne) :
  jour antérieur à l'au plus tôt → **409** `{ ok:false, error, au_plus_tot }` ; même jour trop tôt → heure
  **calée**.
- Colonne `debut` entière (cloud sans `cloud-4`) : heure pleine la plus proche, ou au-dessus si elle
  tomberait avant l'au plus tôt (`heureEntiereChemin`).
- **200** `{ ok, data, au_plus_tot, successeurs_en_violation: [{ id, message }], cale_a?, avertissement? }` —
  `cale_a` = heure **réellement écrite** quand elle diffère de la demande (calage ou arrondi). Aucun
  décalage en cascade.

#### `POST /api/production/bst/:id/affecter-st`
- Lecture stricte du BST (**503** / **404**). Contrôle **au jour** avant toute création de BC : **409**
  `{ ok:false, error, au_plus_tot }`.
- **200** `{ ok, data, bc_id, fournisseur, au_plus_tot, successeurs_en_violation }`.

#### `GET /api/production/bdt/:id/temps`
- **200** `{ ok, id, racine, duree, temps_alloue, colonne_absente, duree_avant_decoupe, nb_morceaux,
  famille: [{ id, rang, duree, temps_reglage, statut }], reglage, realisation, source, confiance, raison,
  propose, porteur, saisie_possible }`.
- `source` : `bdt` (stocké) · `gamme` (retrouvé, ou proposé si incertain) · `famille` (réglage déjà porté
  par un autre bon : `reglage: 0`, `confiance: 'certain'`, `porteur`) · `inconnu`.
- `saisie_possible` : `true` seulement si le réglage est inconnu **et** que ce bon est la racine (ou que la
  racine a disparu). `propose` : réglage incertain de la gamme, **jamais** à pré-saisir.
- **404** ; **503** (BDT, famille ou gamme illisible).

#### `POST /api/production/bdt/:id/separer`
Découpe un BDT **de la goulotte** en 2 à 12 morceaux : seul le temps de **réalisation** se découpe.
- **Corps** `{ realisation: (number | "1,5")[], reglage?, duree_lue?, nb_membres? }`. Ancien corps
  `{ parts }` accepté seulement si R vaut 0 ou est inconnu (sinon **409** « Page périmée »).
- **Réglage R** : `temps_reglage` du bon ; sinon **réglage porté par un autre bon de la famille** → R = 0
  (`reglage_source: 'famille'`, saisie > 0 → **409** « déjà porté par … ») ; sinon gamme certaine ; sinon
  `reglage` saisi — **racine seulement** (**409** sur un `-Mk` dont la racine existe), ≤ durée (**400**) ;
  sinon 0 + avertissement, `temps_reglage` du morceau 1 laissé vide. Saisie contredisant un réglage connu →
  **409**.
- **Page périmée** : `duree_lue` ≠ durée en base (± 0,005 h) ou `nb_membres` ≠ taille de la famille → **409**.
- **Refus** : 503 (lecture), 404, 400 (reçu, soldé, `temps_reel`, annulé, sous-traité, saisie invalide),
  409 (BDT posé sur le planning).
- **Effet** : morceaux k ≥ 2 créés d'abord (`-M<k>` depuis la racine, `a_programmer`, sans jour ni heure ni
  opérateur ni `machine_id`, `temps_reglage = 0`, `duree = temps_alloue = vk`) ; puis l'original réduit **sous
  condition** (statut, durée lue, `temps_reel` vide) à `R + v1` avec `temps_reglage = R` — échec → morceaux
  retirés (relus), **409** « a changé entre-temps ». 1ʳᵉ découpe de la racine : `duree_avant_decoupe` et
  `temps_machine_avant_decoupe` **réécrits**. Gamme certaine ou saisie : les autres bons vides de la famille
  reçoivent leur réglage (porteur R, autres 0). Temps machine : `null` sur l'original → morceaux k ≥ 2 à 0 ;
  sinon au prorata de la durée. Recalcul avancement / coût de la commande non bloquant.
- **200** `{ ok, count, created, total_avant, total_apres, reglage, reglage_source, realisation_avant,
  realisation_apres, avertissement? }`.

#### `POST /api/production/bdt/:id/recoller`
- Corps `{}` ; `id` = n'importe quel membre de la famille.
- **404** racine introuvable ; **400** pas découpé ; **409** `{ error, bloquants: [] }` (posé, reçu, soldé,
  annulé, sous-traité, opérateur, statut hors goulotte, ou trace dans l'historique opérateur / machine, les
  NC, les mouvements de stock, les relevés de cotes) ; **503** lecture de la famille ou des traces.
- **Colonnes du lot C présentes** — rejouable : 1) racine mise à jour sous condition (statut, `temps_reel` /
  `debut_reel` / `operateur_id` vides, **même `duree`**, **même `duree_avant_decoupe`**) à la durée recollée,
  `duree_avant_decoupe` posée à cette valeur (409 si la racine a changé) ; 2) morceaux supprimés sous
  garde-fous puis **relus** (503 si la relecture échoue : relancer l'appel reprend sans double compte) ; morceau
  resté → racine = cible − restants (« recollage partiel ») ; 3) plus aucun morceau → `duree_avant_decoupe` /
  `temps_machine_avant_decoupe` remises à `null`.
- **Colonnes absentes** (cloud avant `cloud-9`) : morceaux supprimés et relus **d'abord** ; racine = ses heures
  + celles des morceaux réellement retirés (409 si aucun n'a pu l'être ; si la mise à jour conditionnelle
  échoue, la racine est relue : déjà à la bonne durée = succès).
- **200** `{ ok, racine, partiel, supprimes, restants, duree, temps_reglage, temps_machine_alloue,
  source_duree: 'avant_decoupe' | 'somme', somme_durees, traces_non_verifiees?, avertissement? }`.

#### `POST /api/production/bdt/reglage/reconstituer`
- Corps `{ appliquer?: boolean }` (défaut `false`). **409** si les colonnes manquent (`cloud-9`), **503** lecture.
- **200** `{ ok, appliquer, familles, deja_renseignees, a_traiter, certains, incertains, inconnus, ecrits,
  verifies, echecs, lignes: [{ racine, bons, confiance, reglage, porteur, raison, formule, nomenclature,
  duree_gamme, propose, affectations }] }` — n'écrit que les **certains**, là où le réglage est vide, puis relit.

#### Page `GET /production/service` (rendu serveur)
- Présences lues **strictement** sur 3 semaines (`fenetreChargementPresences` : lundi courant → +20 jours,
  `getPresencesFenetre`) ; en cas d'échec, `null` est passé à `pageServiceProd`, qui ne déclare alors **aucun**
  jour chargé (cases verrouillées, relecture par `GET /api/production/presence`). Sinon la page déclare
  14 jours chargés (`joursChargesPage`) — la marge couvre un passage de minuit entre lecture et affichage.
- Injectés dans le script : `PRES_PALETTE`, `PRES_ORDRE`, `PRES_JOURS_CHARGES` ; `DAY_START` / `DAY_END` depuis
  `PLAN_DEBUT_JOUR` / `PLAN_FIN_JOUR` ; projection `bdtsForGantt` enrichie (`reglage`, `racine`,
  `rangMorceau`, `posMorceau`, `nbMorceaux`, `oasAvant`, `oasApres`, `cleLot`, `sansHeure`) ; carte
  « Enchaînements à revoir » pré-rendue depuis `violationsEnchainement(BDT, BDS)` puis recalculée par le client.

> Contrat précédent de `/separer` (13/09/2026, corps { parts }, temps libre sans réglage) : remplacé par la section Lot C ci-dessus.

### Coût horaire porté par le process — routes concernées (14/09/2026)

Règle métier et moteur : `docs/technique/06-modules/production.md` (section « Coût horaire porté par le
process »). Aucune nouvelle famille d'API : RBAC inchangé (`production`, `be`, `dt`).

#### `POST /api/production/process` et `PATCH /api/production/process/:id`

Colonnes acceptées (`PROC_COLS`) : `nom`, `code`, `activite`, `categorie`, `requiert_machine`,
`est_oas`, `machine_id`, `operations`, `couleur`, `statut`, `ordre`, `poste_id`,
**`taux_horaire_machine`**.

**`taux_horaire_machine`** (€/h HT) — normalisé avant écriture (`normTauxHoraireMachine`) :
- `null`, `''` ou chaîne blanche → `null` (« taux à saisir ») ;
- nombre ou chaîne décimale, virgule acceptée (`"55,5"`) → nombre ;
- booléen, non numérique ou **négatif** → **400** `« Taux horaire machine invalide : un nombre positif ou
  nul (€/h) est attendu, ou vide pour « à saisir ». »` (rien n'est écrit). La base porte aussi la
  contrainte `process_atelier_taux_horaire_machine_positif`.

Le serveur ne vérifie pas que le process est de type machine : un taux posé sur un process manuel ou OAS
est simplement ignoré par le calcul (l'écran ne l'envoie que pour un process machine).

**Base sans la colonne** (cloud avant `cloud-7`) — erreur PostgREST `PGRST204` ou Postgres `42703`
citant `taux_horaire_machine` (⚠ une violation de la contrainte CHECK cite aussi la colonne mais ne
déclenche **pas** ce repli) :
- l'écriture est **refaite sans le taux** ; succès → `{ ok: true, data, avertissement }`, où
  `avertissement` renvoie à `docker/db/cloud/cloud-7-process-taux-horaire-machine.sql` à jouer dans le
  Studio Supabase en ligne ;
- `PATCH` qui ne portait **que** le taux → `{ ok: false, error: <même message>, cloud7: true }` (HTTP 200).

Autres réponses inchangées : `POST` sans `nom` → `{ ok: false, error: 'nom requis' }` ; `PATCH` vide →
`{ ok: false, error: 'no valid fields' }` ; `requiert_machine: false` remet `machine_id` à `null`.

#### `POST /api/production/machine`, `PATCH /api/production/machine/:id`

- **`cout_h` n'est plus écrit** (création) et **ignoré** (modification). Un `PATCH` qui ne portait que
  `cout_h` répond `400 { ok: false, error: 'Aucun champ' }`.
- `POST` accepte `taux_horaire_machine`, appliqué au process créé avec la machine (`create_process` ≠
  `false`). Il est **validé avant toute création** (400 si invalide). Base sans la colonne : process créé
  sans taux et `avertissement` dans la réponse. Réponse : `{ ok: true, machine, process_id, avertissement? }`
  (`process_id = null` si le process n'a pas pu être créé).

#### `DELETE /api/production/machine/:id`

Détache les process rattachés **avant** de supprimer la machine, et vérifie chaque étape :
- lecture des process rattachés en échec → **503** (machine **non** supprimée) ;
- chaque process reçoit `{ machine_id: null }`, plus `requiert_machine: true` s'il est de type machine
  (`typeProcess`) — il **reste** un process machine et garde son taux ; avant, il était basculé
  « manuel » en silence ;
- un détachement en échec → **400**, message nommant les process, machine non supprimée ;
- succès → `{ ok: true, process_detaches: <n> }`.

#### `POST /api/production/poste`, `PATCH /api/production/poste/:id`

`POSTE_COLS` = `nom`, `code`, `activite`, `couleur`, `ordre`, `statut`, `notes`.
**`taux_horaire_manuel` n'est plus accepté** (champ ignoré ; un `PATCH` qui ne portait que lui → 400
`Aucun champ`).

#### `GET /api/be/analyse-dt/:id` — chiffrage d'une DT

- Taux de l'atelier illisibles (`getTauxAtelier().error`) → **503**
  `{ ok: false, error: 'Taux de l'atelier illisibles, coût non calculé — …' }` : aucun coût à 0 n'est
  renvoyé. DT introuvable → 404.
- **200** : `{ ok, dt: { id, num_affaire, client, activite }, pieces[], totalSerie, missing, drafts,
  allValidated, count, taux_homme_moyennes: { moyen, seem, semrac, manquant } }` (moyennes du coût
  chargé RH, `null` si aucune — jamais un taux individuel).
- `pieces[]` : **supprimés** `taux_mo` et `taux_machine` (45 / 50). **Ajoutés** `site` (entité de la
  nomenclature, sinon activité de la DT), `taux_homme` (€/h du site), `homme_manquant` (booléen),
  `manquants[]` (codes `taux_homme`, `taux_machine`, `sans_process` — nomenclature et étapes ajoutées).
  Inchangés : `ref_interne`, `ref_client`, `nom_plan`, `quantite`, `quantites`, `results[]`, `exigences`,
  `piece_existante_a_jour`, `nom_statut`, `etapes_libres`, `libres_cost`, `plan_doc_id`, `plan_fichier`,
  `nomenclature`, `cost` (+ `hommeHSerie`, `machineHSerie`, `tauxHomme`, `manquants`), `etapes[]`,
  `fournitures_stock`, `prix_a_chiffrer`.
- `etapes[]` : ajoutés `process_id`, `type_process` (`machine` | `manuel` | `oas` | `null` pour une
  sous-traitance), `taux_homme`, `taux_machine`, `taux_source` (`process` | `transition_machine` |
  `manquant` | `sans_process` | `manuel` | `oas`), `manquants[]`, `homme_h_fixe`, `homme_h_pc`,
  `machine_h_fixe`, `machine_h_pc`. `reglage_min` = ROP + RGM ; une opération `est_fixe` bascule dans le
  réglage ; `machine_min` = 0 sur un process non machine. `cout_pc` / `cout_reglage` à précision pleine.
- `libres_cost` et `totalSerie` : étapes ajoutées chiffrées par `etapeDecomp(etapeLibreVersEtape(a))` —
  `reglage_min` = RGM, `mo_min` (repli `temps_min`) = THV, `machine_min` = TMV, `prix_forfait` 1× / lot ;
  étape libre `type: 'sous_traite'` → aucun temps valorisé.

#### `POST /api/be/analyse-dt/:id/etapes-libres`

Corps `{ ref_interne, etapes_libres: [...], vider?: boolean }`. **Nouveau refus 409** : liste vide
envoyée sur une pièce qui a déjà des étapes ajoutées, sans `vider: true` — protège contre un écran qui
n'a pas pu relire le chiffrage (panne) ou un vieil onglet. `/be/analyse` envoie `vider: true` quand
l'utilisateur a réellement tout supprimé. Pièce absente → 404.

#### `POST /api/dt/:id/analyse`

`pieces_analyse[].cout_mo_ajoute` (nombre, facultatif) est **conservé** dans `pieces_detail[]` : part des
étapes ajoutées dans `cout_mo`, à sa valeur d'enregistrement (`null` si absent ou invalide — la
réouverture retombe alors sur le taux du jour).

#### Pages concernées (rendu serveur)
- `/production/service` : passe `salaries` à `pageServiceProd` (moyennes du coût chargé RH seulement).
- `/be/analyse` : `__BE_REFS__.process_atelier[]` gagne `type`, `taux_machine`, `taux_source` ;
  `machines[]` = `{ id, nom }` ; nouveaux `taux_homme` (moyennes) et `taux_erreur` (lecture en échec ⇒
  enregistrement bloqué côté page).
- `/finances/couts`, `/finances/machines`, `/finances/imputations` : process bruts + erreur de lecture des
  taux ; `/plans/service` : postes sans `taux` ni `opexTheo` ; `/maintenance/service` : heures machine par
  `etapeDecomp`.
<!-- /manuel:contrats -->

## Routes pages (133)

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/production/affectation` | L6865 |
| GET | `/production/bdt` | L9322 |
| GET | `/production/bdt-liste` | L13146 |
| GET | `/production/bdts-a-programmer` | L13214 |
| GET | `/production/commande/:id` | L9260 |
| GET | `/production/commandes` | L9251 |
| GET | `/production/competences` | L6866 |
| GET | `/production/dashboard-production` | L9310 |
| GET | `/production/dashboard-programmation` | L9309 |
| GET | `/production/fiches-suivi` | L9316 |
| GET | `/production/gantt-bdt` | L9239 |
| GET | `/production/gantt-bst` | L9247 |
| GET | `/production/habilitations` | L13775 |
| GET | `/production/horaires` | L6867 |
| GET | `/production/lot-liste` | L13147 |
| GET | `/production/lot/:id` | L9276 |
| GET | `/production/lots` | L9255 |
| GET | `/production/matricule` | L9314 |
| GET | `/production/non-faits` | L9315 |
| GET | `/production/operateur` | L6868 |
| GET | `/production/ordonnancement` | L6827 |
| GET | `/production/pilotage` | L9415 |
| GET | `/production/planning` | L6956 |
| GET | `/production/pointage` | L9313 |
| GET | `/production/service` | L6871 |
| GET | `/production/soustraitance` | L9388 |
| GET | `/production/st-liste` | L9317 |
| GET | `/production/suivi-st` | L9318 |
| GET | `/commercial/affaire/:num` | L556 |
| GET | `/commercial/avoirs` | L639 |
| GET | `/commercial/avoirs-liste` | L13150 |
| GET | `/commercial/client/:id` | L544 |
| GET | `/commercial/cmd-liste` | L13142 |
| GET | `/commercial/commande` | L1717 |
| GET | `/commercial/commande-old` | L1714 |
| GET | `/commercial/commandes-validees` | L631 |
| GET | `/commercial/dt` | L1607 |
| GET | `/commercial/dt-liste` | L635 |
| GET | `/commercial/dt-liste` | L13140 |
| GET | `/commercial/offre` | L610 |
| GET | `/commercial/offre-old` | L1689 |
| GET | `/commercial/offre/edit` | L620 |
| GET | `/commercial/offres-liste` | L614 |
| GET | `/commercial/offres-liste` | L13141 |
| GET | `/commercial/references-pieces` | L13152 |
| GET | `/commercial/rentree` | L609 |
| GET | `/commercial/service` | L533 |
| GET | `/dashboard` | L13046 |
| GET | `/dashboard/achats` | L13049 |
| GET | `/dashboard/be` | L13048 |
| GET | `/dashboard/commercial` | L13047 |
| GET | `/dashboard/direction` | L13057 |
| GET | `/dashboard/environnement` | L13059 |
| GET | `/dashboard/expedition` | L13053 |
| GET | `/dashboard/finance` | L13060 |
| GET | `/dashboard/fournisseurs` | L13062 |
| GET | `/dashboard/maintenance` | L13054 |
| GET | `/dashboard/oas` | L13058 |
| GET | `/dashboard/production` | L13051 |
| GET | `/dashboard/programmation` | L13050 |
| GET | `/dashboard/qualite` | L13052 |
| GET | `/dashboard/rh` | L13056 |
| GET | `/dashboard/stock` | L13061 |
| GET | `/qualite/8d` | L11867 |
| GET | `/qualite/anomalie` | L11841 |
| GET | `/qualite/audit-9001` | L13476 |
| GET | `/qualite/audit-en9100` | L13535 |
| GET | `/qualite/ecme` | L12533 |
| GET | `/qualite/liberation` | L12509 |
| GET | `/qualite/nc-liste` | L13144 |
| GET | `/qualite/perishables` | L13588 |
| GET | `/qualite/pv` | L12483 |
| GET | `/qualite/service` | L9526 |
| GET | `/rh/competences` | L11313 |
| GET | `/rh/conge` | L12614 |
| GET | `/rh/conge-liste` | L13149 |
| GET | `/rh/employes` | L11289 |
| GET | `/rh/habilitations` | L11305 |
| GET | `/rh/organigramme` | L11301 |
| GET | `/rh/pointage` | L11778 |
| GET | `/rh/pointage` | L12643 |
| GET | `/rh/service` | L11284 |
| GET | `/rh/temps` | L11764 |
| GET | `/achats/da-auto` | L9320 |
| GET | `/achats/da-liste` | L13143 |
| GET | `/achats/demande` | L6748 |
| GET | `/achats/fournisseur` | L6799 |
| GET | `/achats/fournisseur/:id` | L1989 |
| GET | `/achats/fournisseurs-st` | L13151 |
| GET | `/achats/reception` | L6775 |
| GET | `/achats/service` | L1785 |
| GET | `/achats/sous-traitant/:id` | L1999 |
| GET | `/be/analyse` | L5606 |
| GET | `/be/ged` | L6722 |
| GET | `/be/preparation` | L6488 |
| GET | `/be/references-pieces` | L13153 |
| GET | `/be/service` | L4233 |
| GET | `/stock` | L13657 |
| GET | `/stock/alertes` | L13660 |
| GET | `/stock/entrees` | L13658 |
| GET | `/stock/service` | L10949 |
| GET | `/stock/sorties` | L13659 |
| GET | `/oas/balancelles` | L13263 |
| GET | `/oas/rejets-eau` | L13351 |
| GET | `/oas/service` | L9478 |
| GET | `/oas/session` | L9495 |
| GET | `/maintenance/intervention` | L12586 |
| GET | `/maintenance/liste` | L13148 |
| GET | `/maintenance/mtbf` | L13055 |
| GET | `/maintenance/service` | L11049 |
| GET | `/finances/couts` | L13668 |
| GET | `/finances/imputations` | L13671 |
| GET | `/finances/machines` | L13670 |
| GET | `/finances/taux` | L13669 |
| GET | `/expedition/bl` | L12559 |
| GET | `/expedition/bl-liste` | L13145 |
| GET | `/expedition/envoi-client` | L13219 |
| GET | `/manuels` | L335 |
| GET | `/manuels/:slug` | L339 |
| GET | `/securite/chimique/:id` | L9871 |
| GET | `/securite/service` | L9768 |
| GET | `/direction/service` | L12678 |
| GET | `/direction/validation` | L13002 |
| GET | `/comptabilite/dashboard` | L13963 |
| GET | `/comptabilite/factures` | L13964 |
| GET | `/login` | L253 |
| GET | `/logout` | L296 |
| GET | `/` | L377 |
| GET | `/plans/service` | L5101 |
| GET | `/environnement/service` | L9845 |
| GET | `/expeditions/service` | L10314 |
| GET | `/compta/service` | L11824 |
| GET | `/reglages/objectifs` | L13065 |
