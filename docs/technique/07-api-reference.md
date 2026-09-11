# Référence API & routes

> **Fichier généré** par `node scripts_doc/gen_api_ref.mjs` — ne pas éditer à la main.
> Source : `src/index.tsx` (367 routes). Les numéros de ligne sont indicatifs (au moment de la génération).

## Routes API (234)

| Famille | Routes |
|---|---|
| `api/production` | 31 |
| `api/qualite` | 27 |
| `api/audit` | 16 |
| `api/achats` | 11 |
| `api/rh` | 11 |
| `api/offre` | 9 |
| `api/demandes-prix` | 8 |
| `api/nomenclature` | 8 |
| `api/expeditions` | 7 |
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
| PATCH | `/api/production/bds/:id` | L5754 |
| POST | `/api/production/bds/:id/envoyer` | L5817 |
| POST | `/api/production/bds/:id/retour` | L5819 |
| POST | `/api/production/bdt/:id/affecter` | L6133 |
| POST | `/api/production/bdt/:id/deprogrammer` | L6167 |
| POST | `/api/production/bdt/:id/recu` | L6247 |
| POST | `/api/production/bdt/:id/separer` | L6182 |
| POST | `/api/production/bdt/:id/solder` | L6298 |
| POST | `/api/production/bdts` | L5735 |
| PATCH | `/api/production/bdts/:id` | L5725 |
| POST | `/api/production/bst/:id/affecter-st` | L6529 |
| POST | `/api/production/bst/affecter` | L6472 |
| POST | `/api/production/demande-achat-operateur` | L2041 |
| POST | `/api/production/machine` | L6574 |
| DELETE | `/api/production/machine/:id` | L6669 |
| PATCH | `/api/production/machine/:id` | L6637 |
| POST | `/api/production/machine/:id/panne` | L8288 |
| POST | `/api/production/machine/:id/reparer` | L8295 |
| POST | `/api/production/machine/reorder` | L6081 |
| POST | `/api/production/non-conformites` | L5821 |
| POST | `/api/production/operateur-contexte` | L2022 |
| POST | `/api/production/poste` | L6091 |
| DELETE | `/api/production/poste/:id` | L6112 |
| PATCH | `/api/production/poste/:id` | L6103 |
| POST | `/api/production/poste/reorder` | L6124 |
| POST | `/api/production/presence` | L6686 |
| POST | `/api/production/process` | L6038 |
| DELETE | `/api/production/process/:id` | L6066 |
| PATCH | `/api/production/process/:id` | L6054 |
| POST | `/api/production/process/reorder` | L6074 |
| POST | `/api/production/sortie-matiere` | L6973 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L7988 |
| DELETE | `/api/qualite/capabilite/:id` | L8017 |
| POST | `/api/qualite/derogation` | L7484 |
| PATCH | `/api/qualite/derogation/:id` | L7498 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L9167 |
| POST | `/api/qualite/ecme` | L7825 |
| DELETE | `/api/qualite/ecme/:id` | L7864 |
| PATCH | `/api/qualite/ecme/:id` | L7837 |
| POST | `/api/qualite/ecme/:id/etalonner` | L7851 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L7913 |
| POST | `/api/qualite/ecme/:id/verification` | L7870 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L7907 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L7899 |
| POST | `/api/qualite/lot/:id/liberer` | L5896 |
| POST | `/api/qualite/nc/:id/quarantaine` | L9223 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L9107 |
| PATCH | `/api/qualite/non-conformites/:id` | L9084 |
| POST | `/api/qualite/perissable` | L7339 |
| DELETE | `/api/qualite/perissable/:id` | L7353 |
| PATCH | `/api/qualite/perissable/:id` | L7347 |
| POST | `/api/qualite/perissable/:id/sortie` | L7359 |
| POST | `/api/qualite/plan-controle` | L7378 |
| DELETE | `/api/qualite/plan-controle/:id` | L7396 |
| PATCH | `/api/qualite/plan-controle/:id` | L7387 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L9242 |
| POST | `/api/qualite/rapports-8d` | L9040 |
| PATCH | `/api/qualite/rapports-8d/:id` | L9065 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L7453 |
| POST | `/api/audit/fai` | L7449 |
| DELETE | `/api/audit/fai/:id` | L7451 |
| PATCH | `/api/audit/fai/:id` | L7450 |
| POST | `/api/audit/grille` | L7441 |
| DELETE | `/api/audit/grille/:id` | L7443 |
| PATCH | `/api/audit/grille/:id` | L7442 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L3443 |
| POST | `/api/audit/programme` | L7414 |
| DELETE | `/api/audit/programme/:id` | L7426 |
| PATCH | `/api/audit/programme/:id` | L7420 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L3413 |
| POST | `/api/audit/programme/reconduire` | L7432 |
| POST | `/api/audit/question` | L7445 |
| DELETE | `/api/audit/question/:id` | L7447 |
| PATCH | `/api/audit/question/:id` | L7446 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/bc` | L2324 |
| POST | `/api/achats/da` | L1994 |
| PATCH | `/api/achats/da/:id` | L2125 |
| POST | `/api/achats/da/:id/defusionner` | L2261 |
| POST | `/api/achats/da/:id/editer` | L2144 |
| POST | `/api/achats/da/:id/masquer` | L2175 |
| POST | `/api/achats/da/:id/soumettre` | L2361 |
| POST | `/api/achats/da/fusionner` | L2202 |
| POST | `/api/achats/da/regrouper` | L2292 |
| POST | `/api/achats/fournisseur` | L1865 |
| POST | `/api/achats/sous-traitant` | L1887 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L8741 |
| DELETE | `/api/rh/certification/:id` | L8771 |
| PATCH | `/api/rh/certification/:id` | L8761 |
| POST | `/api/rh/competence` | L8509 |
| POST | `/api/rh/conge` | L8779 |
| POST | `/api/rh/conge/:id/valider` | L8826 |
| GET | `/api/rh/export-silae` | L8648 |
| POST | `/api/rh/pointage` | L8898 |
| POST | `/api/rh/salarie` | L8593 |
| DELETE | `/api/rh/salarie/:id` | L8724 |
| PATCH | `/api/rh/salarie/:id` | L8681 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1280 |
| PATCH | `/api/offre/:id` | L1203 |
| POST | `/api/offre/:id/accepter` | L1138 |
| GET | `/api/offre/:id/devis` | L835 |
| POST | `/api/offre/:id/envoyer` | L807 |
| POST | `/api/offre/:id/negocier` | L882 |
| POST | `/api/offre/:id/pricing` | L1229 |
| POST | `/api/offre/:id/refuser` | L873 |
| POST | `/api/offre/:id/valider` | L825 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L3276 |
| DELETE | `/api/demandes-prix/:id` | L3539 |
| GET | `/api/demandes-prix/:id` | L3475 |
| POST | `/api/demandes-prix/:id/envoyer` | L3483 |
| GET | `/api/demandes-prix/:id/pdf` | L3368 |
| POST | `/api/demandes-prix/:id/reponses` | L3490 |
| POST | `/api/demandes-prix/:id/valider` | L3510 |
| POST | `/api/demandes-prix/grouped` | L3306 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L4219 |
| DELETE | `/api/nomenclature/:id` | L4458 |
| PUT | `/api/nomenclature/:id` | L4302 |
| GET | `/api/nomenclature/:id/fournitures` | L3588 |
| GET | `/api/nomenclature/:id/journal` | L3572 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L4414 |
| POST | `/api/nomenclature/:id/prepa-validee` | L9918 |
| POST | `/api/nomenclature/:id/programmes` | L4383 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L2735 |
| POST | `/api/expeditions/bc/:id/pv` | L2739 |
| POST | `/api/expeditions/bc/:id/receptionner` | L2568 |
| POST | `/api/expeditions/bds/:id/envoyer` | L5816 |
| POST | `/api/expeditions/bds/:id/retour` | L5818 |
| POST | `/api/expeditions/bl-partiel` | L2841 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L2636 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L8301 |
| PATCH | `/api/maintenance/om/:id` | L8367 |
| POST | `/api/maintenance/om/:id/cloturer` | L8379 |
| POST | `/api/maintenance/piece` | L8396 |
| DELETE | `/api/maintenance/piece/:id` | L8425 |
| PATCH | `/api/maintenance/piece/:id` | L8413 |
| POST | `/api/maintenance/preventif/generer` | L8363 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L4027 |
| PATCH | `/api/plans/:id` | L4035 |
| GET | `/api/plans/:id/marqueurs` | L4043 |
| POST | `/api/plans/:id/marqueurs` | L4046 |
| POST | `/api/plans/entity` | L4072 |
| DELETE | `/api/plans/marqueur/:id` | L4064 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L691 |
| GET | `/api/dt/:id` | L663 |
| PUT | `/api/dt/:id` | L733 |
| POST | `/api/dt/:id/analyse` | L1388 |
| POST | `/api/dt/:id/valider` | L1363 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L3617 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L3791 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L3827 |
| GET | `/api/be/noms-signature` | L2502 |
| GET | `/api/be/refs` | L3564 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L3215 |
| DELETE | `/api/produits-fournisseurs/:id` | L3269 |
| PUT | `/api/produits-fournisseurs/:id` | L3240 |
| POST | `/api/produits-fournisseurs/purge` | L3552 |
| GET | `/api/produits-fournisseurs/sans-prix` | L3546 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L3976 |
| GET | `/api/ged/file/:id` | L3957 |
| GET | `/api/ged/nomenclature/:id` | L3943 |
| GET | `/api/ged/ref/:ref` | L3947 |
| POST | `/api/ged/upload` | L3900 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L6795 |
| PATCH | `/api/oas/balancelle/:id` | L6961 |
| POST | `/api/oas/balancelle/:id/cloturer` | L6399 |
| POST | `/api/oas/releve-bain` | L6897 |
| POST | `/api/oas/releve-eau` | L6848 |

### api/clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/clients` | L630 |
| DELETE | `/api/clients/:id` | L648 |
| PATCH | `/api/clients/:id` | L638 |
| GET | `/api/clients/search` | L608 |

### api/locks

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/locks/acquire` | L2451 |
| POST | `/api/locks/heartbeat` | L2471 |
| POST | `/api/locks/release` | L2483 |
| GET | `/api/locks/status` | L2492 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L3459 |
| POST | `/api/bc/:id/date-arrivee` | L2736 |
| GET | `/api/bc/:id/pdf` | L3391 |
| POST | `/api/bc/:id/relance` | L3467 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L6746 |
| POST | `/api/interlocuteurs` | L6754 |
| DELETE | `/api/interlocuteurs/:id` | L6786 |
| PATCH | `/api/interlocuteurs/:id` | L6774 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L7642 |
| PATCH | `/api/securite/` | L7635 |
| POST | `/api/securite/` | L7628 |
| POST | `/api/securite/duer/cloner-annee` | L7660 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L772 |
| POST | `/api/references-clients` | L781 |
| DELETE | `/api/references-clients/:id` | L795 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1289 |
| DELETE | `/api/credits/:id` | L1353 |
| PATCH | `/api/credits/:id` | L1332 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L5971 |
| GET | `/api/export/fournisseurs.xlsx` | L5940 |
| GET | `/api/export/seirich.xlsx` | L5993 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L7782 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L7796 |
| POST | `/api/environnement/perissables-expires/declarer` | L7687 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L9719 |
| POST | `/api/direction/scan-alertes` | L9632 |
| GET | `/api/direction/source` | L9752 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1185 |
| POST | `/api/quarantaine/:id/rejeter` | L1193 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L1815 |
| PATCH | `/api/fournisseurs/:id` | L1779 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L1820 |
| PATCH | `/api/sous-traitants/:id` | L1796 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L2945 |
| POST | `/api/factures/:id/valider-paiement` | L2994 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L3009 |
| PATCH | `/api/factures-fournisseur/:id` | L3049 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L6730 |
| POST | `/api/planning/affectation-poste` | L6706 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L8024 |
| DELETE | `/api/controles/cote/:id` | L8049 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L9681 |
| POST | `/api/validations/:id/decision` | L9693 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L9877 |
| DELETE | `/api/kpi-objectifs/:id` | L9889 |

### api/login

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/login` | L231 |

### api/version

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/version` | L269 |

### api/me

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/me` | L281 |

### api/contact

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/contact` | L539 |

### api/catalogue-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/catalogue-fournisseurs` | L1828 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L3095 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L3193 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L3203 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L7717 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/seuils` | L8169 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L8217 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L8665 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L8802 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L9303 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L9963 |

## Routes pages (133)

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/production/affectation` | L5636 |
| GET | `/production/bdt` | L7099 |
| GET | `/production/bdt-liste` | L9906 |
| GET | `/production/bdts-a-programmer` | L9974 |
| GET | `/production/commande/:id` | L7037 |
| GET | `/production/commandes` | L7028 |
| GET | `/production/competences` | L5637 |
| GET | `/production/dashboard-production` | L7087 |
| GET | `/production/dashboard-programmation` | L7086 |
| GET | `/production/fiches-suivi` | L7093 |
| GET | `/production/gantt-bdt` | L7016 |
| GET | `/production/gantt-bst` | L7024 |
| GET | `/production/habilitations` | L10533 |
| GET | `/production/horaires` | L5638 |
| GET | `/production/lot-liste` | L9907 |
| GET | `/production/lot/:id` | L7053 |
| GET | `/production/lots` | L7032 |
| GET | `/production/matricule` | L7091 |
| GET | `/production/non-faits` | L7092 |
| GET | `/production/operateur` | L5639 |
| GET | `/production/ordonnancement` | L5598 |
| GET | `/production/pilotage` | L7192 |
| GET | `/production/planning` | L5719 |
| GET | `/production/pointage` | L7090 |
| GET | `/production/service` | L5642 |
| GET | `/production/soustraitance` | L7165 |
| GET | `/production/st-liste` | L7094 |
| GET | `/production/suivi-st` | L7095 |
| GET | `/commercial/affaire/:num` | L522 |
| GET | `/commercial/avoirs` | L605 |
| GET | `/commercial/avoirs-liste` | L9910 |
| GET | `/commercial/client/:id` | L510 |
| GET | `/commercial/cmd-liste` | L9902 |
| GET | `/commercial/commande` | L1633 |
| GET | `/commercial/commande-old` | L1630 |
| GET | `/commercial/commandes-validees` | L597 |
| GET | `/commercial/dt` | L1523 |
| GET | `/commercial/dt-liste` | L601 |
| GET | `/commercial/dt-liste` | L9900 |
| GET | `/commercial/offre` | L576 |
| GET | `/commercial/offre-old` | L1605 |
| GET | `/commercial/offre/edit` | L586 |
| GET | `/commercial/offres-liste` | L580 |
| GET | `/commercial/offres-liste` | L9901 |
| GET | `/commercial/references-pieces` | L9912 |
| GET | `/commercial/rentree` | L575 |
| GET | `/commercial/service` | L499 |
| GET | `/dashboard` | L9806 |
| GET | `/dashboard/achats` | L9809 |
| GET | `/dashboard/be` | L9808 |
| GET | `/dashboard/commercial` | L9807 |
| GET | `/dashboard/direction` | L9817 |
| GET | `/dashboard/environnement` | L9819 |
| GET | `/dashboard/expedition` | L9813 |
| GET | `/dashboard/finance` | L9820 |
| GET | `/dashboard/fournisseurs` | L9822 |
| GET | `/dashboard/maintenance` | L9814 |
| GET | `/dashboard/oas` | L9818 |
| GET | `/dashboard/production` | L9811 |
| GET | `/dashboard/programmation` | L9810 |
| GET | `/dashboard/qualite` | L9812 |
| GET | `/dashboard/rh` | L9816 |
| GET | `/dashboard/stock` | L9821 |
| GET | `/qualite/8d` | L8980 |
| GET | `/qualite/anomalie` | L8954 |
| GET | `/qualite/audit-9001` | L10236 |
| GET | `/qualite/audit-en9100` | L10295 |
| GET | `/qualite/ecme` | L9405 |
| GET | `/qualite/liberation` | L9381 |
| GET | `/qualite/nc-liste` | L9904 |
| GET | `/qualite/perishables` | L10348 |
| GET | `/qualite/pv` | L9355 |
| GET | `/qualite/service` | L7298 |
| GET | `/rh/competences` | L8492 |
| GET | `/rh/conge` | L9486 |
| GET | `/rh/conge-liste` | L9909 |
| GET | `/rh/employes` | L8468 |
| GET | `/rh/habilitations` | L8484 |
| GET | `/rh/organigramme` | L8480 |
| GET | `/rh/pointage` | L8891 |
| GET | `/rh/pointage` | L9515 |
| GET | `/rh/service` | L8463 |
| GET | `/rh/temps` | L8878 |
| GET | `/achats/da-auto` | L7097 |
| GET | `/achats/da-liste` | L9903 |
| GET | `/achats/demande` | L5519 |
| GET | `/achats/fournisseur` | L5570 |
| GET | `/achats/fournisseur/:id` | L1757 |
| GET | `/achats/fournisseurs-st` | L9911 |
| GET | `/achats/reception` | L5546 |
| GET | `/achats/service` | L1701 |
| GET | `/achats/sous-traitant/:id` | L1767 |
| GET | `/be/analyse` | L4494 |
| GET | `/be/ged` | L5493 |
| GET | `/be/preparation` | L5259 |
| GET | `/be/references-pieces` | L9913 |
| GET | `/be/service` | L3167 |
| GET | `/stock` | L10417 |
| GET | `/stock/alertes` | L10420 |
| GET | `/stock/entrees` | L10418 |
| GET | `/stock/service` | L8183 |
| GET | `/stock/sorties` | L10419 |
| GET | `/oas/balancelles` | L10023 |
| GET | `/oas/rejets-eau` | L10111 |
| GET | `/oas/service` | L7255 |
| GET | `/oas/session` | L7267 |
| GET | `/maintenance/intervention` | L9458 |
| GET | `/maintenance/liste` | L9908 |
| GET | `/maintenance/mtbf` | L9815 |
| GET | `/maintenance/service` | L8224 |
| GET | `/finances/couts` | L10426 |
| GET | `/finances/imputations` | L10429 |
| GET | `/finances/machines` | L10428 |
| GET | `/finances/taux` | L10427 |
| GET | `/expedition/bl` | L9431 |
| GET | `/expedition/bl-liste` | L9905 |
| GET | `/expedition/envoi-client` | L9979 |
| GET | `/manuels` | L301 |
| GET | `/manuels/:slug` | L305 |
| GET | `/securite/chimique/:id` | L7615 |
| GET | `/securite/service` | L7512 |
| GET | `/direction/service` | L9550 |
| GET | `/direction/validation` | L9762 |
| GET | `/comptabilite/dashboard` | L10721 |
| GET | `/comptabilite/factures` | L10722 |
| GET | `/login` | L220 |
| GET | `/logout` | L263 |
| GET | `/` | L343 |
| GET | `/plans/service` | L3995 |
| GET | `/environnement/service` | L7589 |
| GET | `/expeditions/service` | L8058 |
| GET | `/compta/service` | L8937 |
| GET | `/reglages/objectifs` | L9825 |
