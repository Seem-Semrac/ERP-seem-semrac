# Référence API & routes

> **Fichier généré** par `node scripts_doc/gen_api_ref.mjs` — ne pas éditer à la main.
> Source : `src/index.tsx` (356 routes). Les numéros de ligne sont indicatifs (au moment de la génération).

## Routes API (221)

| Famille | Routes |
|---|---|
| `api/production` | 29 |
| `api/qualite` | 27 |
| `api/audit` | 16 |
| `api/rh` | 11 |
| `api/offre` | 9 |
| `api/demandes-prix` | 8 |
| `api/achats` | 7 |
| `api/maintenance` | 7 |
| `api/nomenclature` | 6 |
| `api/plans` | 6 |
| `api/dt` | 5 |
| `api/be` | 5 |
| `api/expeditions` | 5 |
| `api/produits-fournisseurs` | 5 |
| `api/oas` | 5 |
| `api/clients` | 4 |
| `api/locks` | 4 |
| `api/ged` | 4 |
| `api/interlocuteurs` | 4 |
| `api/securite` | 4 |
| `api/references-clients` | 3 |
| `api/credits` | 3 |
| `api/bc` | 3 |
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
| PATCH | `/api/production/bds/:id` | L4611 |
| POST | `/api/production/bdt/:id/affecter` | L4936 |
| POST | `/api/production/bdt/:id/deprogrammer` | L4957 |
| POST | `/api/production/bdt/:id/recu` | L5003 |
| POST | `/api/production/bdt/:id/separer` | L4967 |
| POST | `/api/production/bdt/:id/solder` | L5044 |
| POST | `/api/production/bdts` | L4593 |
| PATCH | `/api/production/bdts/:id` | L4583 |
| POST | `/api/production/bst/:id/affecter-st` | L5272 |
| POST | `/api/production/bst/affecter` | L5218 |
| POST | `/api/production/demande-achat-operateur` | L1724 |
| POST | `/api/production/machine` | L5317 |
| DELETE | `/api/production/machine/:id` | L5412 |
| PATCH | `/api/production/machine/:id` | L5380 |
| POST | `/api/production/machine/:id/panne` | L7013 |
| POST | `/api/production/machine/:id/reparer` | L7020 |
| POST | `/api/production/machine/reorder` | L4884 |
| POST | `/api/production/non-conformites` | L4624 |
| POST | `/api/production/operateur-contexte` | L1705 |
| POST | `/api/production/poste` | L4894 |
| DELETE | `/api/production/poste/:id` | L4915 |
| PATCH | `/api/production/poste/:id` | L4906 |
| POST | `/api/production/poste/reorder` | L4927 |
| POST | `/api/production/presence` | L5429 |
| POST | `/api/production/process` | L4841 |
| DELETE | `/api/production/process/:id` | L4869 |
| PATCH | `/api/production/process/:id` | L4857 |
| POST | `/api/production/process/reorder` | L4877 |
| POST | `/api/production/sortie-matiere` | L5716 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L6732 |
| DELETE | `/api/qualite/capabilite/:id` | L6761 |
| POST | `/api/qualite/derogation` | L6229 |
| PATCH | `/api/qualite/derogation/:id` | L6243 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L7852 |
| POST | `/api/qualite/ecme` | L6569 |
| DELETE | `/api/qualite/ecme/:id` | L6608 |
| PATCH | `/api/qualite/ecme/:id` | L6581 |
| POST | `/api/qualite/ecme/:id/etalonner` | L6595 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L6657 |
| POST | `/api/qualite/ecme/:id/verification` | L6614 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L6651 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L6643 |
| POST | `/api/qualite/lot/:id/liberer` | L4699 |
| POST | `/api/qualite/nc/:id/quarantaine` | L7908 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L7792 |
| PATCH | `/api/qualite/non-conformites/:id` | L7769 |
| POST | `/api/qualite/perissable` | L6084 |
| DELETE | `/api/qualite/perissable/:id` | L6098 |
| PATCH | `/api/qualite/perissable/:id` | L6092 |
| POST | `/api/qualite/perissable/:id/sortie` | L6104 |
| POST | `/api/qualite/plan-controle` | L6123 |
| DELETE | `/api/qualite/plan-controle/:id` | L6141 |
| PATCH | `/api/qualite/plan-controle/:id` | L6132 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L7927 |
| POST | `/api/qualite/rapports-8d` | L7725 |
| PATCH | `/api/qualite/rapports-8d/:id` | L7750 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L6198 |
| POST | `/api/audit/fai` | L6194 |
| DELETE | `/api/audit/fai/:id` | L6196 |
| PATCH | `/api/audit/fai/:id` | L6195 |
| POST | `/api/audit/grille` | L6186 |
| DELETE | `/api/audit/grille/:id` | L6188 |
| PATCH | `/api/audit/grille/:id` | L6187 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L2739 |
| POST | `/api/audit/programme` | L6159 |
| DELETE | `/api/audit/programme/:id` | L6171 |
| PATCH | `/api/audit/programme/:id` | L6165 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L2709 |
| POST | `/api/audit/programme/reconduire` | L6177 |
| POST | `/api/audit/question` | L6190 |
| DELETE | `/api/audit/question/:id` | L6192 |
| PATCH | `/api/audit/question/:id` | L6191 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L7438 |
| DELETE | `/api/rh/certification/:id` | L7468 |
| PATCH | `/api/rh/certification/:id` | L7458 |
| POST | `/api/rh/competence` | L7232 |
| POST | `/api/rh/conge` | L7476 |
| POST | `/api/rh/conge/:id/valider` | L7523 |
| GET | `/api/rh/export-silae` | L7362 |
| POST | `/api/rh/pointage` | L7595 |
| POST | `/api/rh/salarie` | L7307 |
| DELETE | `/api/rh/salarie/:id` | L7422 |
| PATCH | `/api/rh/salarie/:id` | L7395 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1097 |
| PATCH | `/api/offre/:id` | L1020 |
| POST | `/api/offre/:id/accepter` | L955 |
| GET | `/api/offre/:id/devis` | L750 |
| POST | `/api/offre/:id/envoyer` | L722 |
| POST | `/api/offre/:id/negocier` | L797 |
| POST | `/api/offre/:id/pricing` | L1046 |
| POST | `/api/offre/:id/refuser` | L788 |
| POST | `/api/offre/:id/valider` | L740 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L2572 |
| DELETE | `/api/demandes-prix/:id` | L2835 |
| GET | `/api/demandes-prix/:id` | L2771 |
| POST | `/api/demandes-prix/:id/envoyer` | L2779 |
| GET | `/api/demandes-prix/:id/pdf` | L2664 |
| POST | `/api/demandes-prix/:id/reponses` | L2786 |
| POST | `/api/demandes-prix/:id/valider` | L2806 |
| POST | `/api/demandes-prix/grouped` | L2602 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/bc` | L1811 |
| POST | `/api/achats/da` | L1677 |
| PATCH | `/api/achats/da/:id` | L1762 |
| POST | `/api/achats/da/:id/soumettre` | L1848 |
| POST | `/api/achats/da/regrouper` | L1779 |
| POST | `/api/achats/fournisseur` | L1612 |
| POST | `/api/achats/sous-traitant` | L1634 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L7026 |
| PATCH | `/api/maintenance/om/:id` | L7092 |
| POST | `/api/maintenance/om/:id/cloturer` | L7104 |
| POST | `/api/maintenance/piece` | L7121 |
| DELETE | `/api/maintenance/piece/:id` | L7150 |
| PATCH | `/api/maintenance/piece/:id` | L7138 |
| POST | `/api/maintenance/preventif/generer` | L7088 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L3342 |
| DELETE | `/api/nomenclature/:id` | L3500 |
| PUT | `/api/nomenclature/:id` | L3404 |
| GET | `/api/nomenclature/:id/fournitures` | L2866 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L3466 |
| POST | `/api/nomenclature/:id/programmes` | L3439 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L3246 |
| PATCH | `/api/plans/:id` | L3254 |
| GET | `/api/plans/:id/marqueurs` | L3262 |
| POST | `/api/plans/:id/marqueurs` | L3265 |
| POST | `/api/plans/entity` | L3291 |
| DELETE | `/api/plans/marqueur/:id` | L3283 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L611 |
| GET | `/api/dt/:id` | L588 |
| PUT | `/api/dt/:id` | L653 |
| POST | `/api/dt/:id/analyse` | L1204 |
| POST | `/api/dt/:id/valider` | L1180 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L2885 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L3059 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L3095 |
| GET | `/api/be/noms-signature` | L1959 |
| GET | `/api/be/refs` | L2860 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L2110 |
| POST | `/api/expeditions/bc/:id/pv` | L2130 |
| POST | `/api/expeditions/bc/:id/receptionner` | L1966 |
| POST | `/api/expeditions/bl-partiel` | L2195 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L2071 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L2511 |
| DELETE | `/api/produits-fournisseurs/:id` | L2565 |
| PUT | `/api/produits-fournisseurs/:id` | L2536 |
| POST | `/api/produits-fournisseurs/purge` | L2848 |
| GET | `/api/produits-fournisseurs/sans-prix` | L2842 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L5538 |
| PATCH | `/api/oas/balancelle/:id` | L5704 |
| POST | `/api/oas/balancelle/:id/cloturer` | L5145 |
| POST | `/api/oas/releve-bain` | L5640 |
| POST | `/api/oas/releve-eau` | L5591 |

### api/clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/clients` | L555 |
| DELETE | `/api/clients/:id` | L573 |
| PATCH | `/api/clients/:id` | L563 |
| GET | `/api/clients/search` | L533 |

### api/locks

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/locks/acquire` | L1908 |
| POST | `/api/locks/heartbeat` | L1928 |
| POST | `/api/locks/release` | L1940 |
| GET | `/api/locks/status` | L1949 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L3206 |
| GET | `/api/ged/file/:id` | L3199 |
| GET | `/api/ged/nomenclature/:id` | L3196 |
| POST | `/api/ged/upload` | L3168 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L5489 |
| POST | `/api/interlocuteurs` | L5497 |
| DELETE | `/api/interlocuteurs/:id` | L5529 |
| PATCH | `/api/interlocuteurs/:id` | L5517 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L6386 |
| PATCH | `/api/securite/` | L6379 |
| POST | `/api/securite/` | L6372 |
| POST | `/api/securite/duer/cloner-annee` | L6404 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L692 |
| POST | `/api/references-clients` | L701 |
| DELETE | `/api/references-clients/:id` | L715 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1106 |
| DELETE | `/api/credits/:id` | L1170 |
| PATCH | `/api/credits/:id` | L1149 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L2755 |
| GET | `/api/bc/:id/pdf` | L2687 |
| POST | `/api/bc/:id/relance` | L2763 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L4774 |
| GET | `/api/export/fournisseurs.xlsx` | L4743 |
| GET | `/api/export/seirich.xlsx` | L4796 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L6526 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L6540 |
| POST | `/api/environnement/perissables-expires/declarer` | L6431 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L8404 |
| POST | `/api/direction/scan-alertes` | L8317 |
| GET | `/api/direction/source` | L8437 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1002 |
| POST | `/api/quarantaine/:id/rejeter` | L1010 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L1562 |
| PATCH | `/api/fournisseurs/:id` | L1526 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L1567 |
| PATCH | `/api/sous-traitants/:id` | L1543 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L2299 |
| POST | `/api/factures/:id/valider-paiement` | L2322 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L2337 |
| PATCH | `/api/factures-fournisseur/:id` | L2375 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L5473 |
| POST | `/api/planning/affectation-poste` | L5449 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L6768 |
| DELETE | `/api/controles/cote/:id` | L6793 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L8366 |
| POST | `/api/validations/:id/decision` | L8378 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L8562 |
| DELETE | `/api/kpi-objectifs/:id` | L8574 |

### api/login

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/login` | L179 |

### api/me

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/me` | L212 |

### api/contact

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/contact` | L464 |

### api/catalogue-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/catalogue-fournisseurs` | L1575 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L2392 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L2489 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L2499 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L6461 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/seuils` | L6898 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L6946 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L7379 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L7499 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L7988 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L8602 |

## Routes pages (135)

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/production/affectation` | L4502 |
| GET | `/production/bdt` | L5844 |
| GET | `/production/bdt-liste` | L8591 |
| GET | `/production/bdts-a-programmer` | L8609 |
| GET | `/production/commande/:id` | L5782 |
| GET | `/production/commandes` | L5773 |
| GET | `/production/competences` | L4503 |
| GET | `/production/dashboard-production` | L5832 |
| GET | `/production/dashboard-programmation` | L5831 |
| GET | `/production/fiches-suivi` | L5838 |
| GET | `/production/gantt-bdt` | L5759 |
| GET | `/production/gantt-bst` | L5769 |
| GET | `/production/habilitations` | L9168 |
| GET | `/production/horaires` | L4504 |
| GET | `/production/lot-liste` | L8592 |
| GET | `/production/lot/:id` | L5798 |
| GET | `/production/lots` | L5777 |
| GET | `/production/matricule` | L5836 |
| GET | `/production/non-faits` | L5837 |
| GET | `/production/operateur` | L4505 |
| GET | `/production/ordonnancement` | L4464 |
| GET | `/production/pilotage` | L5937 |
| GET | `/production/planning` | L4577 |
| GET | `/production/pointage` | L5835 |
| GET | `/production/service` | L4508 |
| GET | `/production/soustraitance` | L5910 |
| GET | `/production/st-liste` | L5839 |
| GET | `/production/suivi-st` | L5840 |
| GET | `/commercial/affaire/:num` | L447 |
| GET | `/commercial/avoirs` | L530 |
| GET | `/commercial/avoirs-liste` | L8595 |
| GET | `/commercial/client/:id` | L435 |
| GET | `/commercial/cmd-liste` | L8587 |
| GET | `/commercial/commande` | L1449 |
| GET | `/commercial/commande-old` | L1446 |
| GET | `/commercial/commandes-validees` | L522 |
| GET | `/commercial/dt` | L1339 |
| GET | `/commercial/dt-liste` | L526 |
| GET | `/commercial/dt-liste` | L8585 |
| GET | `/commercial/offre` | L501 |
| GET | `/commercial/offre-old` | L1421 |
| GET | `/commercial/offre/edit` | L511 |
| GET | `/commercial/offres-liste` | L505 |
| GET | `/commercial/offres-liste` | L8586 |
| GET | `/commercial/preparations-tech` | L8598 |
| GET | `/commercial/references-pieces` | L8597 |
| GET | `/commercial/rentree` | L500 |
| GET | `/commercial/service` | L424 |
| GET | `/dashboard` | L8491 |
| GET | `/dashboard/achats` | L8494 |
| GET | `/dashboard/be` | L8493 |
| GET | `/dashboard/commercial` | L8492 |
| GET | `/dashboard/direction` | L8502 |
| GET | `/dashboard/environnement` | L8504 |
| GET | `/dashboard/expedition` | L8498 |
| GET | `/dashboard/finance` | L8505 |
| GET | `/dashboard/fournisseurs` | L8507 |
| GET | `/dashboard/maintenance` | L8499 |
| GET | `/dashboard/oas` | L8503 |
| GET | `/dashboard/production` | L8496 |
| GET | `/dashboard/programmation` | L8495 |
| GET | `/dashboard/qualite` | L8497 |
| GET | `/dashboard/rh` | L8501 |
| GET | `/dashboard/stock` | L8506 |
| GET | `/qualite/8d` | L7665 |
| GET | `/qualite/anomalie` | L7639 |
| GET | `/qualite/audit-9001` | L8871 |
| GET | `/qualite/audit-en9100` | L8930 |
| GET | `/qualite/ecme` | L8090 |
| GET | `/qualite/liberation` | L8066 |
| GET | `/qualite/nc-liste` | L8589 |
| GET | `/qualite/perishables` | L8983 |
| GET | `/qualite/pv` | L8040 |
| GET | `/qualite/service` | L6043 |
| GET | `/rh/competences` | L7215 |
| GET | `/rh/conge` | L8171 |
| GET | `/rh/conge-liste` | L8594 |
| GET | `/rh/employes` | L7191 |
| GET | `/rh/habilitations` | L7207 |
| GET | `/rh/organigramme` | L7203 |
| GET | `/rh/pointage` | L7588 |
| GET | `/rh/pointage` | L8200 |
| GET | `/rh/service` | L7186 |
| GET | `/rh/temps` | L7575 |
| GET | `/achats/da-auto` | L5842 |
| GET | `/achats/da-liste` | L8588 |
| GET | `/achats/demande` | L4385 |
| GET | `/achats/fournisseur` | L4436 |
| GET | `/achats/fournisseur/:id` | L1504 |
| GET | `/achats/fournisseurs-st` | L8596 |
| GET | `/achats/reception` | L4412 |
| GET | `/achats/service` | L1476 |
| GET | `/achats/sous-traitant/:id` | L1514 |
| GET | `/be/analyse` | L3507 |
| GET | `/be/ged` | L4359 |
| GET | `/be/preparation` | L4272 |
| GET | `/be/preparations-tech` | L8600 |
| GET | `/be/references-pieces` | L8599 |
| GET | `/be/service` | L2464 |
| GET | `/stock` | L9052 |
| GET | `/stock/alertes` | L9055 |
| GET | `/stock/entrees` | L9053 |
| GET | `/stock/service` | L6912 |
| GET | `/stock/sorties` | L9054 |
| GET | `/oas/balancelles` | L8658 |
| GET | `/oas/rejets-eau` | L8746 |
| GET | `/oas/service` | L6000 |
| GET | `/oas/session` | L6012 |
| GET | `/maintenance/intervention` | L8143 |
| GET | `/maintenance/liste` | L8593 |
| GET | `/maintenance/mtbf` | L8500 |
| GET | `/maintenance/service` | L6953 |
| GET | `/finances/couts` | L9061 |
| GET | `/finances/imputations` | L9064 |
| GET | `/finances/machines` | L9063 |
| GET | `/finances/taux` | L9062 |
| GET | `/expedition/bl` | L8116 |
| GET | `/expedition/bl-liste` | L8590 |
| GET | `/expedition/envoi-client` | L8614 |
| GET | `/manuels` | L226 |
| GET | `/manuels/:slug` | L230 |
| GET | `/securite/chimique/:id` | L6359 |
| GET | `/securite/service` | L6257 |
| GET | `/direction/service` | L8235 |
| GET | `/direction/validation` | L8447 |
| GET | `/comptabilite/dashboard` | L9356 |
| GET | `/comptabilite/factures` | L9357 |
| GET | `/login` | L168 |
| GET | `/logout` | L211 |
| GET | `/` | L268 |
| GET | `/plans/service` | L3215 |
| GET | `/environnement/service` | L6333 |
| GET | `/expeditions/service` | L6802 |
| GET | `/compta/service` | L7634 |
| GET | `/reglages/objectifs` | L8510 |
