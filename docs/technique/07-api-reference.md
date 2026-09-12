# Référence API & routes

> **Fichier généré** par `node scripts_doc/gen_api_ref.mjs` — ne pas éditer à la main.
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
| PATCH | `/api/production/bds/:id` | L6028 |
| POST | `/api/production/bds/:id/envoyer` | L6091 |
| POST | `/api/production/bds/:id/retour` | L6093 |
| POST | `/api/production/bdt/:id/affecter` | L6407 |
| POST | `/api/production/bdt/:id/deprogrammer` | L6441 |
| POST | `/api/production/bdt/:id/recu` | L6521 |
| POST | `/api/production/bdt/:id/separer` | L6456 |
| POST | `/api/production/bdt/:id/solder` | L6572 |
| POST | `/api/production/bdts` | L6009 |
| PATCH | `/api/production/bdts/:id` | L5999 |
| POST | `/api/production/bst/:id/affecter-st` | L6803 |
| POST | `/api/production/bst/affecter` | L6746 |
| POST | `/api/production/demande-achat-operateur` | L2193 |
| POST | `/api/production/machine` | L6848 |
| DELETE | `/api/production/machine/:id` | L6943 |
| PATCH | `/api/production/machine/:id` | L6911 |
| POST | `/api/production/machine/:id/panne` | L8583 |
| POST | `/api/production/machine/:id/reparer` | L8590 |
| POST | `/api/production/machine/reorder` | L6355 |
| POST | `/api/production/non-conformites` | L6095 |
| POST | `/api/production/operateur-contexte` | L2174 |
| POST | `/api/production/poste` | L6365 |
| DELETE | `/api/production/poste/:id` | L6386 |
| PATCH | `/api/production/poste/:id` | L6377 |
| POST | `/api/production/poste/reorder` | L6398 |
| POST | `/api/production/presence` | L6960 |
| POST | `/api/production/process` | L6312 |
| DELETE | `/api/production/process/:id` | L6340 |
| PATCH | `/api/production/process/:id` | L6328 |
| POST | `/api/production/process/reorder` | L6348 |
| POST | `/api/production/sortie-matiere` | L7247 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L8283 |
| DELETE | `/api/qualite/capabilite/:id` | L8312 |
| POST | `/api/qualite/derogation` | L7779 |
| PATCH | `/api/qualite/derogation/:id` | L7793 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L9462 |
| POST | `/api/qualite/ecme` | L8120 |
| DELETE | `/api/qualite/ecme/:id` | L8159 |
| PATCH | `/api/qualite/ecme/:id` | L8132 |
| POST | `/api/qualite/ecme/:id/etalonner` | L8146 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L8208 |
| POST | `/api/qualite/ecme/:id/verification` | L8165 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L8202 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L8194 |
| POST | `/api/qualite/lot/:id/liberer` | L6170 |
| POST | `/api/qualite/nc/:id/quarantaine` | L9518 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L9402 |
| PATCH | `/api/qualite/non-conformites/:id` | L9379 |
| POST | `/api/qualite/perissable` | L7634 |
| DELETE | `/api/qualite/perissable/:id` | L7648 |
| PATCH | `/api/qualite/perissable/:id` | L7642 |
| POST | `/api/qualite/perissable/:id/sortie` | L7654 |
| POST | `/api/qualite/plan-controle` | L7673 |
| DELETE | `/api/qualite/plan-controle/:id` | L7691 |
| PATCH | `/api/qualite/plan-controle/:id` | L7682 |
| POST | `/api/qualite/quarantaine/:id/decision-fournisseur` | L9620 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L9537 |
| POST | `/api/qualite/rapports-8d` | L9335 |
| PATCH | `/api/qualite/rapports-8d/:id` | L9360 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L7748 |
| POST | `/api/audit/fai` | L7744 |
| DELETE | `/api/audit/fai/:id` | L7746 |
| PATCH | `/api/audit/fai/:id` | L7745 |
| POST | `/api/audit/grille` | L7736 |
| DELETE | `/api/audit/grille/:id` | L7738 |
| PATCH | `/api/audit/grille/:id` | L7737 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L3707 |
| POST | `/api/audit/programme` | L7709 |
| DELETE | `/api/audit/programme/:id` | L7721 |
| PATCH | `/api/audit/programme/:id` | L7715 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L3677 |
| POST | `/api/audit/programme/reconduire` | L7727 |
| POST | `/api/audit/question` | L7740 |
| DELETE | `/api/audit/question/:id` | L7742 |
| PATCH | `/api/audit/question/:id` | L7741 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/avoirs-fournisseurs` | L1790 |
| POST | `/api/achats/avoirs-fournisseurs/:id/annuler` | L1884 |
| POST | `/api/achats/avoirs-fournisseurs/:id/imputer` | L1850 |
| POST | `/api/achats/avoirs-fournisseurs/:id/recu` | L1825 |
| POST | `/api/achats/bc` | L2476 |
| POST | `/api/achats/da` | L2146 |
| PATCH | `/api/achats/da/:id` | L2277 |
| POST | `/api/achats/da/:id/defusionner` | L2413 |
| POST | `/api/achats/da/:id/editer` | L2296 |
| POST | `/api/achats/da/:id/masquer` | L2327 |
| POST | `/api/achats/da/:id/soumettre` | L2513 |
| POST | `/api/achats/da/fusionner` | L2354 |
| POST | `/api/achats/da/regrouper` | L2444 |
| POST | `/api/achats/fournisseur` | L2017 |
| POST | `/api/achats/sous-traitant` | L2039 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L9036 |
| DELETE | `/api/rh/certification/:id` | L9066 |
| PATCH | `/api/rh/certification/:id` | L9056 |
| POST | `/api/rh/competence` | L8804 |
| POST | `/api/rh/conge` | L9074 |
| POST | `/api/rh/conge/:id/valider` | L9121 |
| GET | `/api/rh/export-silae` | L8943 |
| POST | `/api/rh/pointage` | L9193 |
| POST | `/api/rh/salarie` | L8888 |
| DELETE | `/api/rh/salarie/:id` | L9019 |
| PATCH | `/api/rh/salarie/:id` | L8976 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1299 |
| PATCH | `/api/offre/:id` | L1222 |
| POST | `/api/offre/:id/accepter` | L1140 |
| GET | `/api/offre/:id/devis` | L837 |
| POST | `/api/offre/:id/envoyer` | L809 |
| POST | `/api/offre/:id/negocier` | L884 |
| POST | `/api/offre/:id/pricing` | L1248 |
| POST | `/api/offre/:id/refuser` | L875 |
| POST | `/api/offre/:id/valider` | L827 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L2968 |
| POST | `/api/expeditions/bc/:id/pv` | L2972 |
| POST | `/api/expeditions/bc/:id/receptionner` | L2801 |
| POST | `/api/expeditions/bds/:id/envoyer` | L6090 |
| POST | `/api/expeditions/bds/:id/retour` | L6092 |
| POST | `/api/expeditions/bl-partiel` | L3105 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L2869 |
| POST | `/api/expeditions/retour-fournisseur/:qid/expedie` | L3086 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L3540 |
| DELETE | `/api/demandes-prix/:id` | L3803 |
| GET | `/api/demandes-prix/:id` | L3739 |
| POST | `/api/demandes-prix/:id/envoyer` | L3747 |
| GET | `/api/demandes-prix/:id/pdf` | L3632 |
| POST | `/api/demandes-prix/:id/reponses` | L3754 |
| POST | `/api/demandes-prix/:id/valider` | L3774 |
| POST | `/api/demandes-prix/grouped` | L3570 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L4483 |
| DELETE | `/api/nomenclature/:id` | L4722 |
| PUT | `/api/nomenclature/:id` | L4566 |
| GET | `/api/nomenclature/:id/fournitures` | L3852 |
| GET | `/api/nomenclature/:id/journal` | L3836 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L4678 |
| POST | `/api/nomenclature/:id/prepa-validee` | L10398 |
| POST | `/api/nomenclature/:id/programmes` | L4647 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L8596 |
| PATCH | `/api/maintenance/om/:id` | L8662 |
| POST | `/api/maintenance/om/:id/cloturer` | L8674 |
| POST | `/api/maintenance/piece` | L8691 |
| DELETE | `/api/maintenance/piece/:id` | L8720 |
| PATCH | `/api/maintenance/piece/:id` | L8708 |
| POST | `/api/maintenance/preventif/generer` | L8658 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L4291 |
| PATCH | `/api/plans/:id` | L4299 |
| GET | `/api/plans/:id/marqueurs` | L4307 |
| POST | `/api/plans/:id/marqueurs` | L4310 |
| POST | `/api/plans/entity` | L4336 |
| DELETE | `/api/plans/marqueur/:id` | L4328 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L693 |
| GET | `/api/dt/:id` | L665 |
| PUT | `/api/dt/:id` | L735 |
| POST | `/api/dt/:id/analyse` | L1407 |
| POST | `/api/dt/:id/valider` | L1382 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L3881 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L4055 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L4091 |
| GET | `/api/be/noms-signature` | L2654 |
| GET | `/api/be/refs` | L3828 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L3479 |
| DELETE | `/api/produits-fournisseurs/:id` | L3533 |
| PUT | `/api/produits-fournisseurs/:id` | L3504 |
| POST | `/api/produits-fournisseurs/purge` | L3816 |
| GET | `/api/produits-fournisseurs/sans-prix` | L3810 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L4240 |
| GET | `/api/ged/file/:id` | L4221 |
| GET | `/api/ged/nomenclature/:id` | L4207 |
| GET | `/api/ged/ref/:ref` | L4211 |
| POST | `/api/ged/upload` | L4164 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L7069 |
| PATCH | `/api/oas/balancelle/:id` | L7235 |
| POST | `/api/oas/balancelle/:id/cloturer` | L6673 |
| POST | `/api/oas/releve-bain` | L7171 |
| POST | `/api/oas/releve-eau` | L7122 |

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
| POST | `/api/locks/acquire` | L2603 |
| POST | `/api/locks/heartbeat` | L2623 |
| POST | `/api/locks/release` | L2635 |
| GET | `/api/locks/status` | L2644 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L3723 |
| POST | `/api/bc/:id/date-arrivee` | L2969 |
| GET | `/api/bc/:id/pdf` | L3655 |
| POST | `/api/bc/:id/relance` | L3731 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L7020 |
| POST | `/api/interlocuteurs` | L7028 |
| DELETE | `/api/interlocuteurs/:id` | L7060 |
| PATCH | `/api/interlocuteurs/:id` | L7048 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L7937 |
| PATCH | `/api/securite/` | L7930 |
| POST | `/api/securite/` | L7923 |
| POST | `/api/securite/duer/cloner-annee` | L7955 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L774 |
| POST | `/api/references-clients` | L783 |
| DELETE | `/api/references-clients/:id` | L797 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1308 |
| DELETE | `/api/credits/:id` | L1372 |
| PATCH | `/api/credits/:id` | L1351 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L6245 |
| GET | `/api/export/fournisseurs.xlsx` | L6214 |
| GET | `/api/export/seirich.xlsx` | L6267 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L8077 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L8091 |
| POST | `/api/environnement/perissables-expires/declarer` | L7982 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L10199 |
| POST | `/api/direction/scan-alertes` | L10108 |
| GET | `/api/direction/source` | L10232 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1200 |
| POST | `/api/quarantaine/:id/rejeter` | L1210 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L1967 |
| PATCH | `/api/fournisseurs/:id` | L1931 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L1972 |
| PATCH | `/api/sous-traitants/:id` | L1948 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L3209 |
| POST | `/api/factures/:id/valider-paiement` | L3258 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L3273 |
| PATCH | `/api/factures-fournisseur/:id` | L3313 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L7004 |
| POST | `/api/planning/affectation-poste` | L6980 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L8319 |
| DELETE | `/api/controles/cote/:id` | L8344 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L10157 |
| POST | `/api/validations/:id/decision` | L10169 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L10357 |
| DELETE | `/api/kpi-objectifs/:id` | L10369 |

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
| GET | `/api/catalogue-fournisseurs` | L1980 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L3359 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L3457 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L3467 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L8012 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/seuils` | L8464 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L8512 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L8960 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L9097 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L9779 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L10443 |

## Routes pages (133)

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/production/affectation` | L5910 |
| GET | `/production/bdt` | L7373 |
| GET | `/production/bdt-liste` | L10386 |
| GET | `/production/bdts-a-programmer` | L10454 |
| GET | `/production/commande/:id` | L7311 |
| GET | `/production/commandes` | L7302 |
| GET | `/production/competences` | L5911 |
| GET | `/production/dashboard-production` | L7361 |
| GET | `/production/dashboard-programmation` | L7360 |
| GET | `/production/fiches-suivi` | L7367 |
| GET | `/production/gantt-bdt` | L7290 |
| GET | `/production/gantt-bst` | L7298 |
| GET | `/production/habilitations` | L11013 |
| GET | `/production/horaires` | L5912 |
| GET | `/production/lot-liste` | L10387 |
| GET | `/production/lot/:id` | L7327 |
| GET | `/production/lots` | L7306 |
| GET | `/production/matricule` | L7365 |
| GET | `/production/non-faits` | L7366 |
| GET | `/production/operateur` | L5913 |
| GET | `/production/ordonnancement` | L5872 |
| GET | `/production/pilotage` | L7466 |
| GET | `/production/planning` | L5993 |
| GET | `/production/pointage` | L7364 |
| GET | `/production/service` | L5916 |
| GET | `/production/soustraitance` | L7439 |
| GET | `/production/st-liste` | L7368 |
| GET | `/production/suivi-st` | L7369 |
| GET | `/commercial/affaire/:num` | L524 |
| GET | `/commercial/avoirs` | L607 |
| GET | `/commercial/avoirs-liste` | L10390 |
| GET | `/commercial/client/:id` | L512 |
| GET | `/commercial/cmd-liste` | L10382 |
| GET | `/commercial/commande` | L1652 |
| GET | `/commercial/commande-old` | L1649 |
| GET | `/commercial/commandes-validees` | L599 |
| GET | `/commercial/dt` | L1542 |
| GET | `/commercial/dt-liste` | L603 |
| GET | `/commercial/dt-liste` | L10380 |
| GET | `/commercial/offre` | L578 |
| GET | `/commercial/offre-old` | L1624 |
| GET | `/commercial/offre/edit` | L588 |
| GET | `/commercial/offres-liste` | L582 |
| GET | `/commercial/offres-liste` | L10381 |
| GET | `/commercial/references-pieces` | L10392 |
| GET | `/commercial/rentree` | L577 |
| GET | `/commercial/service` | L501 |
| GET | `/dashboard` | L10286 |
| GET | `/dashboard/achats` | L10289 |
| GET | `/dashboard/be` | L10288 |
| GET | `/dashboard/commercial` | L10287 |
| GET | `/dashboard/direction` | L10297 |
| GET | `/dashboard/environnement` | L10299 |
| GET | `/dashboard/expedition` | L10293 |
| GET | `/dashboard/finance` | L10300 |
| GET | `/dashboard/fournisseurs` | L10302 |
| GET | `/dashboard/maintenance` | L10294 |
| GET | `/dashboard/oas` | L10298 |
| GET | `/dashboard/production` | L10291 |
| GET | `/dashboard/programmation` | L10290 |
| GET | `/dashboard/qualite` | L10292 |
| GET | `/dashboard/rh` | L10296 |
| GET | `/dashboard/stock` | L10301 |
| GET | `/qualite/8d` | L9275 |
| GET | `/qualite/anomalie` | L9249 |
| GET | `/qualite/audit-9001` | L10716 |
| GET | `/qualite/audit-en9100` | L10775 |
| GET | `/qualite/ecme` | L9881 |
| GET | `/qualite/liberation` | L9857 |
| GET | `/qualite/nc-liste` | L10384 |
| GET | `/qualite/perishables` | L10828 |
| GET | `/qualite/pv` | L9831 |
| GET | `/qualite/service` | L7572 |
| GET | `/rh/competences` | L8787 |
| GET | `/rh/conge` | L9962 |
| GET | `/rh/conge-liste` | L10389 |
| GET | `/rh/employes` | L8763 |
| GET | `/rh/habilitations` | L8779 |
| GET | `/rh/organigramme` | L8775 |
| GET | `/rh/pointage` | L9186 |
| GET | `/rh/pointage` | L9991 |
| GET | `/rh/service` | L8758 |
| GET | `/rh/temps` | L9173 |
| GET | `/achats/da-auto` | L7371 |
| GET | `/achats/da-liste` | L10383 |
| GET | `/achats/demande` | L5793 |
| GET | `/achats/fournisseur` | L5844 |
| GET | `/achats/fournisseur/:id` | L1909 |
| GET | `/achats/fournisseurs-st` | L10391 |
| GET | `/achats/reception` | L5820 |
| GET | `/achats/service` | L1720 |
| GET | `/achats/sous-traitant/:id` | L1919 |
| GET | `/be/analyse` | L4768 |
| GET | `/be/ged` | L5767 |
| GET | `/be/preparation` | L5533 |
| GET | `/be/references-pieces` | L10393 |
| GET | `/be/service` | L3431 |
| GET | `/stock` | L10897 |
| GET | `/stock/alertes` | L10900 |
| GET | `/stock/entrees` | L10898 |
| GET | `/stock/service` | L8478 |
| GET | `/stock/sorties` | L10899 |
| GET | `/oas/balancelles` | L10503 |
| GET | `/oas/rejets-eau` | L10591 |
| GET | `/oas/service` | L7529 |
| GET | `/oas/session` | L7541 |
| GET | `/maintenance/intervention` | L9934 |
| GET | `/maintenance/liste` | L10388 |
| GET | `/maintenance/mtbf` | L10295 |
| GET | `/maintenance/service` | L8519 |
| GET | `/finances/couts` | L10906 |
| GET | `/finances/imputations` | L10909 |
| GET | `/finances/machines` | L10908 |
| GET | `/finances/taux` | L10907 |
| GET | `/expedition/bl` | L9907 |
| GET | `/expedition/bl-liste` | L10385 |
| GET | `/expedition/envoi-client` | L10459 |
| GET | `/manuels` | L303 |
| GET | `/manuels/:slug` | L307 |
| GET | `/securite/chimique/:id` | L7910 |
| GET | `/securite/service` | L7807 |
| GET | `/direction/service` | L10026 |
| GET | `/direction/validation` | L10242 |
| GET | `/comptabilite/dashboard` | L11201 |
| GET | `/comptabilite/factures` | L11202 |
| GET | `/login` | L222 |
| GET | `/logout` | L265 |
| GET | `/` | L345 |
| GET | `/plans/service` | L4259 |
| GET | `/environnement/service` | L7884 |
| GET | `/expeditions/service` | L8353 |
| GET | `/compta/service` | L9232 |
| GET | `/reglages/objectifs` | L10305 |
