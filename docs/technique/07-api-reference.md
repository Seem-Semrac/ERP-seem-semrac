# Référence API & routes

> **Fichier généré** par `node scripts_doc/gen_api_ref.mjs` — ne pas éditer à la main, **sauf** le bloc
> « Contrats détaillés » (entre les marqueurs `manuel:contrats`), conservé d'une génération à l'autre.
> Source : `src/index.tsx` (401 routes). Les numéros de ligne sont indicatifs (au moment de la génération).

## Routes API (268)

| Famille | Routes |
|---|---|
| `api/production` | 42 |
| `api/qualite` | 28 |
| `api/achats` | 16 |
| `api/audit` | 16 |
| `api/stock` | 15 |
| `api/rh` | 11 |
| `api/offre` | 9 |
| `api/expeditions` | 9 |
| `api/nomenclature` | 9 |
| `api/demandes-prix` | 8 |
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
| PATCH | `/api/production/bds/:id` | L8056 |
| POST | `/api/production/bds/:id/envoyer` | L8125 |
| POST | `/api/production/bds/:id/retour` | L8127 |
| POST | `/api/production/bdt/:id/affecter` | L8649 |
| POST | `/api/production/bdt/:id/deprogrammer` | L8768 |
| POST | `/api/production/bdt/:id/recoller` | L9044 |
| POST | `/api/production/bdt/:id/recu` | L9207 |
| POST | `/api/production/bdt/:id/separer` | L8792 |
| POST | `/api/production/bdt/:id/solder` | L9279 |
| GET | `/api/production/bdt/:id/temps` | L8980 |
| POST | `/api/production/bdt/reglage/reconstituer` | L9150 |
| POST | `/api/production/bdts` | L7987 |
| PATCH | `/api/production/bdts/:id` | L7903 |
| POST | `/api/production/bst/:id/affecter-st` | L9521 |
| POST | `/api/production/bst/affecter` | L9464 |
| GET | `/api/production/cadence` | L9735 |
| GET | `/api/production/cadence/calendrier` | L9751 |
| POST | `/api/production/cadence/modeles` | L9792 |
| POST | `/api/production/cadence/site` | L9771 |
| POST | `/api/production/conge/:id/valider` | L12910 |
| POST | `/api/production/demande-achat-operateur` | L2534 |
| POST | `/api/production/lot/:id/sous-lots` | L10325 |
| POST | `/api/production/machine` | L9595 |
| DELETE | `/api/production/machine/:id` | L9702 |
| PATCH | `/api/production/machine/:id` | L9670 |
| POST | `/api/production/machine/:id/panne` | L12285 |
| POST | `/api/production/machine/:id/reparer` | L12292 |
| POST | `/api/production/machine/reorder` | L8448 |
| POST | `/api/production/nc` | L2572 |
| POST | `/api/production/non-conformites` | L8129 |
| POST | `/api/production/poste` | L8459 |
| DELETE | `/api/production/poste/:id` | L8480 |
| PATCH | `/api/production/poste/:id` | L8471 |
| POST | `/api/production/poste/reorder` | L8492 |
| DELETE | `/api/production/presence` | L9875 |
| GET | `/api/production/presence` | L9830 |
| POST | `/api/production/presence` | L9841 |
| POST | `/api/production/process` | L8388 |
| DELETE | `/api/production/process/:id` | L8433 |
| PATCH | `/api/production/process/:id` | L8412 |
| POST | `/api/production/process/reorder` | L8441 |
| POST | `/api/production/sortie-matiere` | L10156 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L11414 |
| DELETE | `/api/qualite/capabilite/:id` | L11443 |
| POST | `/api/qualite/derogation` | L10910 |
| PATCH | `/api/qualite/derogation/:id` | L10924 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L13230 |
| POST | `/api/qualite/ecme` | L11251 |
| DELETE | `/api/qualite/ecme/:id` | L11290 |
| PATCH | `/api/qualite/ecme/:id` | L11263 |
| POST | `/api/qualite/ecme/:id/etalonner` | L11277 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L11339 |
| POST | `/api/qualite/ecme/:id/verification` | L11296 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L11333 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L11325 |
| POST | `/api/qualite/lot/:id/liberer` | L8210 |
| POST | `/api/qualite/nc/:id/quarantaine` | L13286 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L13170 |
| PATCH | `/api/qualite/non-conformites/:id` | L13147 |
| POST | `/api/qualite/perissable` | L10765 |
| DELETE | `/api/qualite/perissable/:id` | L10779 |
| PATCH | `/api/qualite/perissable/:id` | L10773 |
| POST | `/api/qualite/perissable/:id/sortie` | L10785 |
| POST | `/api/qualite/plan-controle` | L10804 |
| DELETE | `/api/qualite/plan-controle/:id` | L10822 |
| PATCH | `/api/qualite/plan-controle/:id` | L10813 |
| POST | `/api/qualite/quarantaine/:id/decision-fournisseur` | L13394 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L13305 |
| POST | `/api/qualite/rapports-8d` | L13103 |
| PATCH | `/api/qualite/rapports-8d/:id` | L13128 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/avoirs-fournisseurs` | L2058 |
| POST | `/api/achats/avoirs-fournisseurs/:id/annuler` | L2158 |
| POST | `/api/achats/avoirs-fournisseurs/:id/imputer` | L2118 |
| POST | `/api/achats/avoirs-fournisseurs/:id/recu` | L2093 |
| POST | `/api/achats/bc` | L2892 |
| POST | `/api/achats/bc/:id/certificat-matiere` | L4993 |
| POST | `/api/achats/da` | L2456 |
| PATCH | `/api/achats/da/:id` | L2693 |
| POST | `/api/achats/da/:id/defusionner` | L2829 |
| POST | `/api/achats/da/:id/editer` | L2712 |
| POST | `/api/achats/da/:id/masquer` | L2743 |
| POST | `/api/achats/da/:id/soumettre` | L2938 |
| POST | `/api/achats/da/fusionner` | L2770 |
| POST | `/api/achats/da/regrouper` | L2860 |
| POST | `/api/achats/fournisseur` | L2327 |
| POST | `/api/achats/sous-traitant` | L2349 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L10879 |
| POST | `/api/audit/fai` | L10875 |
| DELETE | `/api/audit/fai/:id` | L10877 |
| PATCH | `/api/audit/fai/:id` | L10876 |
| POST | `/api/audit/grille` | L10867 |
| DELETE | `/api/audit/grille/:id` | L10869 |
| PATCH | `/api/audit/grille/:id` | L10868 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L4957 |
| POST | `/api/audit/programme` | L10840 |
| DELETE | `/api/audit/programme/:id` | L10852 |
| PATCH | `/api/audit/programme/:id` | L10846 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L4927 |
| POST | `/api/audit/programme/reconduire` | L10858 |
| POST | `/api/audit/question` | L10871 |
| DELETE | `/api/audit/question/:id` | L10873 |
| PATCH | `/api/audit/question/:id` | L10872 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/emplacement` | L12081 |
| GET | `/api/stock/:id/emplacement/historique` | L12112 |
| PATCH | `/api/stock/:id/seuils` | L11631 |
| POST | `/api/stock/ajustement` | L11933 |
| POST | `/api/stock/entree` | L11857 |
| GET | `/api/stock/mise-en-stock` | L11659 |
| POST | `/api/stock/mise-en-stock/:id/accepter` | L11669 |
| POST | `/api/stock/mise-en-stock/:id/annuler` | L11835 |
| POST | `/api/stock/sortie` | L11873 |
| GET | `/api/stock/types-objet` | L11968 |
| POST | `/api/stock/types-objet` | L11974 |
| PATCH | `/api/stock/types-objet/:code` | L11988 |
| GET | `/api/stock/zones` | L12015 |
| POST | `/api/stock/zones` | L12022 |
| PATCH | `/api/stock/zones/:id` | L12045 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L12745 |
| DELETE | `/api/rh/certification/:id` | L12775 |
| PATCH | `/api/rh/certification/:id` | L12765 |
| POST | `/api/rh/competence` | L12506 |
| POST | `/api/rh/conge` | L12783 |
| POST | `/api/rh/conge/:id/valider` | L12891 |
| GET | `/api/rh/export-silae` | L12645 |
| POST | `/api/rh/pointage` | L12961 |
| POST | `/api/rh/salarie` | L12590 |
| DELETE | `/api/rh/salarie/:id` | L12728 |
| PATCH | `/api/rh/salarie/:id` | L12678 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1555 |
| PATCH | `/api/offre/:id` | L1478 |
| POST | `/api/offre/:id/accepter` | L1393 |
| GET | `/api/offre/:id/devis` | L880 |
| POST | `/api/offre/:id/envoyer` | L852 |
| POST | `/api/offre/:id/negocier` | L927 |
| POST | `/api/offre/:id/pricing` | L1504 |
| POST | `/api/offre/:id/refuser` | L918 |
| POST | `/api/offre/:id/valider` | L870 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L3759 |
| POST | `/api/expeditions/bc/:id/pv` | L3789 |
| POST | `/api/expeditions/bc/:id/receptionner` | L3497 |
| POST | `/api/expeditions/bds/:id/envoyer` | L8124 |
| POST | `/api/expeditions/bds/:id/retour` | L8126 |
| POST | `/api/expeditions/bl-partiel` | L4132 |
| POST | `/api/expeditions/bl/:id/reception-infos` | L3614 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L3644 |
| POST | `/api/expeditions/retour-fournisseur/:qid/expedie` | L4113 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L6140 |
| DELETE | `/api/nomenclature/:id` | L6461 |
| GET | `/api/nomenclature/:id` | L5235 |
| PUT | `/api/nomenclature/:id` | L6237 |
| GET | `/api/nomenclature/:id/fournitures` | L5271 |
| GET | `/api/nomenclature/:id/journal` | L5246 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L6396 |
| POST | `/api/nomenclature/:id/prepa-validee` | L14334 |
| POST | `/api/nomenclature/:id/programmes` | L6365 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L4785 |
| DELETE | `/api/demandes-prix/:id` | L5199 |
| GET | `/api/demandes-prix/:id` | L5022 |
| POST | `/api/demandes-prix/:id/envoyer` | L5030 |
| GET | `/api/demandes-prix/:id/pdf` | L4877 |
| POST | `/api/demandes-prix/:id/reponses` | L5044 |
| POST | `/api/demandes-prix/:id/valider` | L5082 |
| POST | `/api/demandes-prix/grouped` | L4815 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L12298 |
| PATCH | `/api/maintenance/om/:id` | L12364 |
| POST | `/api/maintenance/om/:id/cloturer` | L12376 |
| POST | `/api/maintenance/piece` | L12393 |
| DELETE | `/api/maintenance/piece/:id` | L12422 |
| PATCH | `/api/maintenance/piece/:id` | L12410 |
| POST | `/api/maintenance/preventif/generer` | L12360 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L5875 |
| PATCH | `/api/plans/:id` | L5883 |
| GET | `/api/plans/:id/marqueurs` | L5891 |
| POST | `/api/plans/:id/marqueurs` | L5894 |
| POST | `/api/plans/entity` | L5920 |
| DELETE | `/api/plans/marqueur/:id` | L5912 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L736 |
| GET | `/api/dt/:id` | L708 |
| PUT | `/api/dt/:id` | L778 |
| POST | `/api/dt/:id/analyse` | L1663 |
| POST | `/api/dt/:id/valider` | L1638 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L5283 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L5532 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L5575 |
| GET | `/api/be/noms-signature` | L3088 |
| GET | `/api/be/refs` | L5224 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L4611 |
| DELETE | `/api/produits-fournisseurs/:id` | L4778 |
| PUT | `/api/produits-fournisseurs/:id` | L4712 |
| POST | `/api/produits-fournisseurs/purge` | L5212 |
| GET | `/api/produits-fournisseurs/sans-prix` | L5206 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L5828 |
| GET | `/api/ged/file/:id` | L5796 |
| GET | `/api/ged/nomenclature/:id` | L5766 |
| GET | `/api/ged/ref/:ref` | L5770 |
| POST | `/api/ged/upload` | L5723 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L9978 |
| PATCH | `/api/oas/balancelle/:id` | L10144 |
| POST | `/api/oas/balancelle/:id/cloturer` | L9391 |
| POST | `/api/oas/releve-bain` | L10080 |
| POST | `/api/oas/releve-eau` | L10031 |

### api/clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/clients` | L675 |
| DELETE | `/api/clients/:id` | L693 |
| PATCH | `/api/clients/:id` | L683 |
| GET | `/api/clients/search` | L653 |

### api/locks

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/locks/acquire` | L3037 |
| POST | `/api/locks/heartbeat` | L3057 |
| POST | `/api/locks/release` | L3069 |
| GET | `/api/locks/status` | L3078 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L4973 |
| POST | `/api/bc/:id/date-arrivee` | L3760 |
| GET | `/api/bc/:id/pdf` | L4900 |
| POST | `/api/bc/:id/relance` | L4981 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L9929 |
| POST | `/api/interlocuteurs` | L9937 |
| DELETE | `/api/interlocuteurs/:id` | L9969 |
| PATCH | `/api/interlocuteurs/:id` | L9957 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L11068 |
| PATCH | `/api/securite/` | L11061 |
| POST | `/api/securite/` | L11054 |
| POST | `/api/securite/duer/cloner-annee` | L11086 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L817 |
| POST | `/api/references-clients` | L826 |
| DELETE | `/api/references-clients/:id` | L840 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1564 |
| DELETE | `/api/credits/:id` | L1628 |
| PATCH | `/api/credits/:id` | L1607 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L8305 |
| GET | `/api/export/fournisseurs.xlsx` | L8274 |
| GET | `/api/export/seirich.xlsx` | L8327 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L11208 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L11222 |
| POST | `/api/environnement/perissables-expires/declarer` | L11113 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L14135 |
| POST | `/api/direction/scan-alertes` | L13938 |
| GET | `/api/direction/source` | L14168 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1456 |
| POST | `/api/quarantaine/:id/rejeter` | L1466 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L2241 |
| PATCH | `/api/fournisseurs/:id` | L2205 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L2246 |
| PATCH | `/api/sous-traitants/:id` | L2222 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L4248 |
| POST | `/api/factures/:id/valider-paiement` | L4311 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L4326 |
| PATCH | `/api/factures-fournisseur/:id` | L4366 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L9913 |
| POST | `/api/planning/affectation-poste` | L9889 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L11450 |
| DELETE | `/api/controles/cote/:id` | L11475 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L14086 |
| POST | `/api/validations/:id/decision` | L14101 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L14293 |
| DELETE | `/api/kpi-objectifs/:id` | L14305 |

### api/login

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/login` | L275 |

### api/version

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/version` | L313 |

### api/me

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/me` | L326 |

### api/contact

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/contact` | L584 |

### api/catalogue-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/catalogue-fournisseurs` | L2264 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L4412 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L4539 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L4582 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L11143 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L12218 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L12662 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L12806 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L13604 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L14379 |

<!-- manuel:contrats -->
## Contrats détaillés (écrits à la main)

Bloc conservé par `gen_api_ref.mjs` : les tableaux ci-dessus sont régénérés, ce bloc ne l'est pas.

### Lot H2 (18/09/2026) — mères ordonnées, cycle / profondeur, sous-lots en production

Familles **`nomenclature`**, **`offre`**, **`factures`**, **`be`**, **`production`**, **`qualite`**, **`expeditions`** — **aucune
nouvelle famille** : la seule route nouvelle, `POST /api/production/lot/:id/sous-lots`, appartient à `production` (déjà
mappée, écriture Production). Migration Docker **018** / script cloud **`cloud-14`** (à jouer à la main, **après `cloud-13`**).
Règles et écrans : `06-modules/be.md` et `06-modules/production.md`, sections « Lot H2 ». Calculs : module pur
`src/nomenclature_arbre.ts` (147 tests, `scripts_doc/test_nomenclature_arbre.mjs`).

> **Cloud sans `cloud-14`** : aucune route ne casse. Les lectures de `lots` restent en `select('*')` ; `lotsArbreDispo()` sonde
> les 5 colonnes (`42703` / `PGRST204` ⇒ absentes ; autre erreur ⇒ panne). Une mère est alors lancée **sans sous-lots** avec
> un avertissement ; la route « sous-lots » répond 409 `arbre_indisponible`. Nomenclatures : tout fonctionne (jsonb).

#### `POST /api/nomenclature` · `PUT /api/nomenclature/:id` · `POST /api/nomenclature/:id/nouvel-indice` — composants d'une mère

Corps : `composants[]` = `{ nom_id, code, num_nom, qte, rang, type_nom, indice, prix }`, **dans l'ordre de fabrication**
(haut → bas). Le serveur stocke `normaliserComposants(composants)` : `rang` réécrit 1..n, `qte` > 0 (invalide ⇒ 1),
`type_nom` ∈ `standard|mere`, clés `_…` retirées. Contrôle **avant toute écriture** (`refusComposants` →
`controlerComposants`) quand la fiche résultante est une mère — POST (création **et** écrasement d'un brouillon), PUT (mère
dont les composants, le type ou l'identité changent), nouvel indice :

| Code | HTTP | Corps de la réponse | Quand |
|---|---|---|---|
| `cycle_composants` | **409** | `{ ok:false, code, chemin:[…], error }` | la mère se contiendrait elle-même, directement ou non, en suivant la révision d'édition, la dernière en cours **et** la dernière validée de chaque composant |
| `profondeur_max` | **409** | `{ ok:false, code, profondeur, max:5, chemin, error }` | niveaux au-dessus de la fiche + hauteur de son sous-arbre > 5 (racine = 1) |
| `lecture_impossible` | **503** | `{ ok:false, code, error }` | nomenclatures illisibles : pas d'enregistrement sans contrôle |

Messages exacts : « Enregistrement refusé : une nomenclature mère ne peut pas se contenir elle-même. Chemin : A › B › A.
Retirez « B » des composants. » · « Enregistrement refusé : imbrication trop profonde (6 niveaux, 5 au plus). Chemin le plus
long : A › B › C › D › E › F. ». Un composant introuvable n'est pas un refus. `composants_vides` (H0) est jugé sur la liste
**normalisée**. Journal EN 9100 : `diffComposants` (entrées dans `06-modules/be.md`).

#### `GET /api/nomenclature/:id`
`nomenclature.composants` = `composantsOrdonnes(...)` : ordre de fabrication, rangs 1..n (ordre du tableau si les rangs
manquent ou se répètent).

#### `DELETE /api/nomenclature/:id`
**409 `composant_utilise`** `{ ok:false, code, meres:[n°…], error }` — **avant** tout motif et toute entrée de journal — si la
fiche est désignée par une mère (dernière révision de chaque groupe, dernière validée de chaque code) : par son `nom_id`, ou
par son code quand elle est la dernière révision validée de ce code.

#### `POST /api/offre/:id/accepter` (cascade)
Réponse `cascade` : `+ sous_lots` (nombre de sous-lots créés) et `+ avertissements: string[]` (arbre non développé, composant
sans révision validée, `revision_differente`, base sans `cloud-14`, table des lots illisible, échec d'une DA…) ;
`avertissement_bdt` **conservé**. Effets : un lot par pièce (racine **inchangée** `LOT-YYYY-AFF-ZZ`) + un sous-lot par composant
d'une mère (`…-ZZ.RR`, récursif, pré-ordre), chacun avec ses BDT / BDS (`bonIdDuLot`, `matiere_ok:false`, même `num_affaire`),
une prépa par **pièce** (`PREP-<aff>-<pièce>`, dédoublonnée) et des DA **agrégées par référence** sur tout l'arbre
(`DA-<aff>-<réf>-M|A` ; id déjà pris ⇒ suivant libre `-2`…). Colonnes présentes : **tous** les lots reçoivent `rang`, `niveau`,
`nomenclature_id` (+ `lot_parent`, `qte_par_parent` pour un sous-lot).

#### `PATCH /api/factures/:id` (proforma passée « payée »)
`proforma_debloque` : même plan que l'acceptation, reconstruit par des lectures **strictes** ; panne ⇒ `{ num_affaire, prepa:0,
da:0, avertissements:[« Paiement enregistré, mais la préparation technique et les demandes d'achat … n'ont PAS été lancées
(…) : rien n'a été engagé… »] }`. Seuls les sous-lots **existants** sont couverts.

#### `POST /api/production/lot/:id/sous-lots` (nouvelle)
Corps `{ simuler?: boolean, confirmer_termine?: boolean }`. Crée ce qui manque à l'arbre d'un lot de pièce mère (affaires
lancées avant H2, cloud après `cloud-14`). Idempotente.

| Réponse | Quand |
|---|---|
| **404** | lot introuvable |
| **409 `arbre_indisponible`** | base sans les colonnes (« … la base doit être mise à jour (script cloud-14…) ») |
| **409 `lot_clos`** | le lot **ou sa racine** est libéré, expédié, livré ou annulé (simulation comprise) |
| **409 `lot_termine`** | lot (ou racine) terminé, création demandée sans `confirmer_termine: true` |
| **409 `pas_une_mere`** | aucune nomenclature validée pour la pièce, ou nomenclature qui n'est pas une mère avec composants |
| **409** (sans code) | affaire du lot introuvable (lot sans commande et id non standard) |
| **503** | une lecture a échoué (lot, table des lots, nomenclatures, bons existants) : rien n'est créé |
| **200** `simuler:true` | `{ ok, simule:true, plan:[{ id, lot_parent, rang, niveau, piece, qte, existe }], avertissements, lot_termine }` — aucune écriture |
| **200** | `{ ok, simule:false, plan, crees:{ lots, bdt, bds, prepa, da }, existants, bons_existants:{ bdt, bds }, porte_matiere: 'ouverte'\|'fermee'\|'non_evaluee'\|null, avertissements }` |

`planCompletementLot` : développement depuis **ce** lot (niveau, `qte_initiale`) ; un sous-lot existant garde la révision de
son lancement (`lots.nomenclature_id`) ; annulé ou de révision inconnue, il est laissé tel quel. DA du sous-arbre créé :
`DA-<aff>-<réf>-M|A-SL<ZZ>` (pas de fusion avec une DA existante). `porte_matiere: 'ouverte'` = stock suffisant **et** tous les
autres BDT de l'affaire déjà « matière OK » ⇒ nouveaux BDT `matiere_ok = true`.

#### `POST /api/be/analyse-dt/:id/generer-bdt`
Lot existant cherché parmi les **racines** ; mère : plan comme la cascade ; lignes de sous-lots manquantes créées **si la
commande existe** ; ids `fmtBonId` (racine) / `bonIdDuLot` (sous-lot), clés `cleBon`. Réponse `+ sous_lots:{ crees, existants },
avertissements`. Rejouée : 0 création.

#### `GET /api/be/analyse-dt/:id`
Pièce mère : `pieces[].mere = { sous_ensembles:[{ chemin, piece, qte, niveau, statut:'valide'|'non_lance' }], cout_non_inclus:true,
avertissements }`. **Aucun changement de calcul** (le coût ne compte que les étapes propres de la mère).

#### `POST /api/qualite/lot/:id/liberer`
Décision « libéré » : **409 `sous_lot_non_liberable`** `{ lot_racine }` sur un sous-lot ; **409 `arbre_non_termine`**
`{ sous_lots:[…] }` sur une racine dont un sous-lot n'est pas fini ; **503** si l'arbre est illisible — aucun PV écrit. Mise en
quarantaine d'un sous-lot : inchangée.

#### `POST /api/expeditions/bl-partiel`
Ligne dont `lot_id` est un sous-lot ⇒ **409 `sous_lot_non_expediable`** `{ lot_id, lot_racine, error }`. Prorata de facturation
calculé sur les lots **racines** seulement (correctif).

#### `POST /api/production/bds/:id/retour` · `POST /api/expeditions/bds/:id/retour` · `PATCH /api/production/bds/:id`
Le retour d'un BDS (et un PATCH qui change son statut ou `date_retour_effective`) **recalcule l'avancement** de la commande
(`recalculerCommandeApres` → `recomputeCmdAvancement`) : un lot dont le dernier BDS revient passe « terminé » sans autre action.

#### Pages (rendu serveur)
- **`GET /be/service`** : `NOM_COMPOSABLES` (dernière révision **validée** de chaque produit, standards **et** mères :
  `id, num_nom, code_ref_produit, description, prix_revient_unitaire, type_nom, indice, version_groupe, cle, entite,
  nb_composants`) remplace `NOM_STANDARDS` ; `NOM_ANCETRES = carteAncetres(NOMS)` (`{ identité → mères qui la contiennent }`).
- **`GET /production/service`** : `dbBdtsVigilance[].raison` = raisons jointes par **« · »** (dont « sous-lots non terminés
  (n/m) : … ») ; chaque BDT porte `sousLot` (« Sous-lot 01.02 » ou `null`) et `echeanceArbre` ; `ORDRE_FAB`
  (`{ id de lot → position }`, post-ordre) et `VIGIL_PAR_ID` injectés.
- **`GET /production/lot/:id`** : `pageLotDetail(…, arbre?: ArbreLotVue)` (9ᵉ paramètre : `parent`, `racine`, `niveau`, `rang`,
  `enfants[]`, `avancement_arbre`, `vigilance`, `sous_lots_manquants`, `arbre_dispo`, `avertissement`, `action_creer`,
  `lot_clos`, `lot_termine`, `composants_bloques[]`) ; nomenclature lue d'abord sur `lot.nomenclature_id`.
- **`GET /production/commande/:id`** (`getCommandeDetail`) : les bons exposent `lot_ref` et `matiere_ok`, les lots
  `lot_parent`, `niveau`, `rang`. **`GET /commercial/affaire/:num`** (`getAffaireDetail`) : idem + bons rattachés au lot exact,
  blocage « sous-lots non terminés (n/m) : … ». **`GET /qualite/service`** : `aLiberer` = racines à l'arbre fini.

### Lot H1 (17/09/2026) — prix moyen multi-fournisseurs, quantité par paquet, doublons

Familles **`produits-fournisseurs`**, **`produit-prix`**, **`demandes-prix`**, **`nomenclature`**, **`be`**,
**`catalogue-fournisseurs`** — **aucune nouvelle famille**. Migration Docker **017** / script cloud **`cloud-13`** (à jouer à
la main). Règles et écrans : `06-modules/be.md` et `06-modules/achats.md`, sections « Lot H1 ». Calcul commun :
`src/prix_moyen.ts` (réexporté par `src/shared.ts`), **injecté tel quel dans les pages** par `prixMoyenClientJs()` — client et
serveur exécutent le **même** code, égalité vérifiée par `scripts_doc/test_prix_moyen.mjs` (220 assertions, bundle minifié
compris).

> **Droits** : l'**écriture** de `/api/produits-fournisseurs…` et `/api/demandes-prix…` est ouverte à « **be OU achats** »
> (`04-auth-rbac.md`, section « Lot H1 »). La lecture ne bouge pas (service `be`).
> **Cloud sans `cloud-13`** : toute lecture est en `select('*')` ; toute écriture de `qte_paquet` répond **200** avec
> `avertissement` (« quantité par paquet non enregistrée… ») — **jamais** 500, jamais de page cassée.

#### `GET /api/produit-prix` (enrichie)
Paramètres inchangés (`reference`, `designation`, `fournisseur_id`) + **`categorie`** et **`nb_par_tole`** (facultatifs).

| Champ de la réponse | Sens |
|---|---|
| `prix`, `date_prix`, `designation`, `reference`, `fournisseur_id`, `fournisseur_nom`, `lignes[]` | **inchangés** (lot H0) — `lignes[]` porte en plus `qte_paquet`, `source_prix`, `prix_converti`, `perime`, `id` |
| **`prix_moyen`** | sortie complète de `prixMoyenReference` : `prix_unitaire`, `prix_base`, `prix_tole`, `nb_fournisseurs`, `min`/`max`, `perime`, `incomplet`, `sans_conditionnement[]`, `date_plus_ancienne`/`_recente`, `detail[]` |
| `categorie`, `categorie_deduite` | la catégorie **déduite des lignes trouvées** quand l'appelant n'en donne pas (avant : « accessoire » supposé, donc division par un conditionnement sur une matière) |

Comparaison de référence **normalisée** : toutes les lignes de la référence sont rendues, tous fournisseurs confondus.
Lecture **stricte** : **503** `{ code:'catalogue_illisible' }` au lieu d'un faux « aucun prix ».

#### `POST /api/produits-fournisseurs` · `PUT /api/produits-fournisseurs/:id`
Corps : champs H0 + **`qte_paquet`** (nombre de **pièces par paquet**, lu par `nombrePositif`) : absent, `null` ou `''` ⇒
**rien n'est écrit** (une valeur existante n'est jamais effacée par du vide) ; `0`, négatif ou texte ⇒ **400** « Quantité par
paquet illisible ou nulle » ; `> 0` ⇒ écrit tel quel. Le prix d'un accessoire reste le prix **du paquet**.

- la ligne existante est cherchée en **comparaison normalisée** (`getProduitsFournisseursParReference` + filtre
  `fournisseur_id`) et non plus par égalité stricte — sinon `REF` / `ref` partaient en insertion et se faisaient refuser par
  la base ; `reference_existante` est signalé quand l'orthographe en base diffère ;
- **mise à jour partielle H0 conservée** sur un couple existant (POST) : jamais d'effacement de prix, date, source, activité
  ou catégorie ; `champs_mis_a_jour` / `champs_ignores` / `existant` inchangés ;
- **409 `doublon_catalogue`** — « Cette référence existe déjà chez ce fournisseur (à la casse près) : modifiez la ligne
  existante. » Décidé **applicativement** (PUT) **et** sur `23505` : l'index `ux_produits_fournisseurs_ref_norm` peut être
  absent (base avec doublons, cloud sans `cloud-13`) ;
- écriture via `updateProduitFournisseurTolerant` / `insertProduitFournisseurSiAbsentTolerant` ; `qte_paquet_ignoree` ⇒
  `200 { ok:true, …, avertissement }`. ⚠ `PUT` sans fournisseur : pas de contrôle de doublon (deux `NULL` ne sont pas en
  conflit pour l'index).

#### `POST /api/demandes-prix/:id/reponses`
Chaque réponse accepte **`qte_paquet`** (accessoires : conditionnement auquel se rapporte **ce** prix), écrit par
`create/updateDemandePrixReponseTolerant`. Les `.catch(() => {})` morts sont remplacés par la lecture de `{ error }` :
**500** détaillé `{ echecs[], enregistrees }` ; le statut `reponse_recue` n'est posé que si **au moins une** réponse a été
écrite. Repli sans la colonne : `avertissement`.

#### `POST /api/demandes-prix/:id/valider` (changement de contrat)
`retenus` devient la liste de **TOUTES les réponses chiffrées** (`prix_unitaire > 0`), pas seulement celle du fournisseur
choisi ; `retenu: true` ne marque plus qu'une **préférence d'achat**.

```jsonc
{ "retenus": [ { "reponse_id": "...", "fournisseur_id": "...", "fournisseur_nom": "...",
                 "reference": "136290", "designation": "Vis M6", "categorie": "accessoire",
                 "prix_unitaire": 10.4, "qte_paquet": 100, "retenu": true } ] }
```

- pour **chaque** réponse : ligne catalogue **du fournisseur de la réponse** (retrouvée en référence normalisée) — `prix`,
  `date_prix`, `source_prix: 'rfq'`, `statut: 'actif'`, `+ qte_paquet` si fournie ; création par
  `insertProduitFournisseurSiAbsentTolerant` + relecture / patch en cas de course (plus d'upsert complet) ;
- garanties H0 **conservées** : `{ error }` lu à chaque écriture, prix ≤ 0 refusé, échec partiel ⇒ **500** `echecs[]` et
  demande **laissée ouverte**, un point de `ref_prix_historique` au plus par (référence, fournisseur, demande, prix) —
  l'historique est écrit sous l'orthographe **de la référence catalogue** (sinon une revalidation dans une autre casse
  dédoublait la courbe) ;
- compatibilité : si l'écran n'exprime aucune préférence (ancien client), tout l'envoi est marqué retenu ; jamais de
  `retenu:false` écrit d'office. `prix_maj` = nombre de prix catalogue écrits.
- **C'est cette route qui alimente la moyenne** : sans elle, `nb_fournisseurs` vaut 1 partout.

#### `POST /api/nomenclature` et `PUT /api/nomenclature/:id` — deux refus **avant** toute écriture
| Code | HTTP | Route | Quand |
|---|---|---|---|
| `doublon_reference` | **409** | `POST` **et** `PUT` | la même référence normalisée apparaît deux fois dans `fournitures[]`, **matière et accessoires confondus** (désignation à défaut de référence). Réponse : `error` (message commun client/serveur), `reference`, `reference_normalisee`, `cle_sur`, `designation`, `indices[]` (0-based), `categories[]`. ⚠ Évalué **avant `upsertFournitures`**, qui efface puis réinsère |
| `fournitures_vides` | **409** | `PUT` | la fiche a des fournitures en base et la liste envoyée est vide, **sans** `vider_fournitures: true`. Réponse : `fournitures_en_base`. Le drapeau n'est posé par l'écran que lorsqu'il a réellement lu l'état de la base (même modèle que `vider_composants`). Fournitures en base illisibles ⇒ **503** (refus, rien d'effacé) |

`vider_fournitures` est retiré du corps avant écriture par `POST /api/nomenclature` et `POST /api/nomenclature/:id/nouvel-indice`
(ce n'est pas une colonne) ; côté écran, `nomSave` et `nomCreerNouvelIndice` sont bloqués tant que les fournitures n'ont pas
été relues.

`fournituresPropres()` retire des lignes reçues les seules clés **de sortie** de `prixMoyenReference` (dont `prix_moyen`) :
un écran qui renverrait l'objet de calcul ne fait plus échouer l'insertion entière (PGRST204). Le **nouveau modèle** de ligne
(sans `fournisseur` ni `qte_paquet`) est accepté tel quel — voir le tableau des champs dans `06-modules/be.md`.
`syncFournituresToCatalogue` sort immédiatement si aucune ligne ne nomme de fournisseur (création seule H0 conservée pour
les anciennes lignes).

#### `GET /api/nomenclature/:id/fournitures` (lecture stricte)
**503** + `Cache-Control: no-store` si la lecture échoue. Avant : `ok:true` + liste vide — l'éditeur vidait ses compartiments
et l'enregistrement suivant effaçait vraiment les fournitures.

#### `GET /api/be/analyse-dt/:id` (chiffrage en direct)
- catalogue lu en **strict** ⇒ **503** s'il est illisible (même convention que les taux dans cette route : on refuse de
  chiffrer une offre sur des copies) ;
- `recalculerFournitures(...)` recalcule chaque ligne au **prix moyen du catalogue** (sinon copie enregistrée conservée) et
  alimente `computeNomCostForQty` **et** `fournitures_stock[]` ;
- `besoin_unite` = **`'pièce'`** pour un accessoire sans `qte_paquet` (plus « paquet » pour des pièces), coût série
  **linéaire** ; `'tôle'` pour la matière (inchangé) ;
- chaque ligne porte `prix_moyen { nb_fournisseurs, min, max, perime, incomplet, sans_conditionnement, dates }` ; chaque
  pièce porte `fournitures_incompletes` / `_perimees` / `_sans_conditionnement` ; `prix_a_chiffrer` garde sa forme et gagne
  `nb_fournisseurs` / `incomplet` / `perime` ;
- **rien n'est réécrit en base** : une analyse acceptée reste figée (comportement inchangé).

#### `GET /api/catalogue-fournisseurs` (source changée)
Les **fournisseurs** sont servis depuis la table `produits_fournisseurs` (lecture stricte ⇒ **503**), avec `qte_paquet`
(`qtePaquetDe`), `date_prix`, `source_prix`, `produit_id` ; le jsonb `fournisseurs.catalogue` n'est plus qu'un **complément**
pour les références absentes de la table (0 article constaté le 17/09/2026). Les **sous-traitants** gardent le jsonb (pas de
table équivalente).

#### Pages (rendu serveur)
- **`GET /be/service`** : catalogue lu par `getProduitsFournisseursStrict()` (paginé, strict ; erreur journalisée côté
  serveur, repli `[]`) au lieu de `getProduitsFournisseursAll()` (une page PostgREST, erreur avalée). `NOM_PRODUITS` expose
  exactement `{ fournisseur_id, fournisseur_nom, reference, designation, prix, qte_paquet, conditionnement, date_prix,
  categorie, source_prix }` — `qte_paquet: p.qte_paquet ?? null`, **jamais 1 par défaut** (`null` = non déclaré).
- **`GET /achats/fournisseur/:id`** : la fiche ne rend plus le bloc jsonb « Catalogue produits » ; `PATCH
  /api/fournisseurs/:id` n'envoie plus la clé `catalogue`.
- **`GET /stock/service`** : `pageServiceStock` reçoit un **5ᵉ argument** `dbProduits` (lignes `produits_fournisseurs`) — le
  bloc « Catalogue fournisseurs par catégorie » de l'onglet Gestion lisait le jsonb, donc affichait l'état vide en permanence.

### Lot H0 (17/09/2026) — mères, nouvel indice, catalogue fournisseur, demandes de prix, GED, génération des BDT

Familles **`nomenclature`**, **`produits-fournisseurs`**, **`produit-prix`**, **`demandes-prix`**, **`be`**, **`ged`** — **aucune
nouvelle famille** (la route ajoutée appartient à `nomenclature`, déjà mappée sur le service BE). Migrations Docker **015** / **016**,
**aucun script cloud** (voir `03-base-de-donnees.md`). Règles et écrans : `06-modules/be.md` (section « Lot H0 »). Constante
commune : `PRIX_VALIDITE_JOURS = 183` (`src/shared.ts`) = un prix catalogue est « frais » pendant 6 mois ; lecture tolérante
des composants : `composantsDe(fiche | valeur)` rend **toujours un tableau** (tableau tel quel, chaîne JSON d'un tableau
parsée, sinon `[]`).

#### `GET /api/nomenclature/:id` (nouvelle)
Lecture = lecture BE (famille `nomenclature`, comme la liste). `Cache-Control: no-store`. Sert au formulaire BE à relire la
fiche **en base** à chaque ouverture (l'instantané sérialisé dans la page devenait périmé après un enregistrement).

| Réponse | Cas |
|---|---|
| **200** `{ok:true, nomenclature:{…toutes les colonnes…, composants: [...]}}` | `composants` **toujours un tableau**, que la colonne soit `text` ou `jsonb` |
| **404** `{ok:false, error:'Nomenclature introuvable (supprimée entre-temps ?)'}` | fiche absente |
| **500** `{ok:false, error:'Lecture de la nomenclature impossible : …'}` | lecture en échec (jamais confondue avec « absente ») |

#### `POST /api/nomenclature` et `PUT /api/nomenclature/:id` (changées)
- `vider_composants` est retiré du corps (ce n'est pas une colonne) ; `composants`, s'il est présent, est converti en tableau.
- **PUT — garde-fou composants** : fiche en base avec **au moins un** composant + liste envoyée **vide** + pas de
  `vider_composants: true` ⇒ **409** `{ok:false, code:'composants_vides', error:'Enregistrement refusé : cette nomenclature compte N
  composant(s) en base et la liste envoyée est vide. Rouvrez la fiche pour recharger ses composants ; pour les retirer tous
  volontairement, confirmez le retrait.', composants_en_base: N}`. Rien n'est écrit.
- **PUT — clé `composants` omise sur une mère** (fiche `type_nom = 'mere'` qui reste mère) : `prix_revient_unitaire`,
  `prix_mo_unitaire` et `cout_machine_unitaire` du corps sont **ignorés** (la base garde ses composants, donc le coût qui en
  découle). Le formulaire omet la clé quand sa liste locale est vide sans action de l'utilisateur.
- Les autres règles (statut validé conservé, journal EN 9100, 503 si l'état « avant » est illisible) sont inchangées.
- Effet de bord commun (`syncFournituresToCatalogue`) : **n'écrit plus jamais** une ligne existante du catalogue. Un couple
  fournisseur + référence absent est **inséré sans prix** (`prix: null`, `statut: 'en_attente_prix'`, `source_prix: 'be'`,
  catégorie `accessoire` ou `matiere_premiere`, activité = site de la fiche) ; un échec est journalisé côté serveur
  (`[nomenclature → catalogue] …`) sans bloquer l'enregistrement.

#### `POST /api/nomenclature/:id/nouvel-indice` (changée)
- La révision naît **toujours `en_cours`**, `valide_par` et `date_validation` à `null`, **quel que soit** le corps : `statut`,
  `valide_par`, `date_validation`, `vider_composants`, `devalider` et `motif` sont retirés du corps (avant : une révision créée
  depuis une fiche validée naissait `valide`, devenait l'indice validé le plus haut — donc la gamme de production des nouvelles
  commandes — sans événement `validation` au journal). Elle se valide ensuite par `PUT`.
- `composants` = ceux du corps s'ils sont fournis, sinon ceux de la base, **toujours en tableau**.
- Mère sans clé `composants` : les trois champs de coût du corps sont ignorés (même règle que le PUT).
- Journal EN 9100 inchangé : `nouvel_indice` sur l'ancienne fiche, `creation` sur la révision.

#### `POST /api/produits-fournisseurs` (changée)
Corps inchangé (`reference` et `designation` obligatoires). Prix illisible ⇒ **400** « Prix illisible : « … » ».
- **Couple fournisseur + référence déjà au catalogue** : mise à jour **partielle**. Écrits : `designation`, `fournisseur_nom`
  (si connu), `unite` et `delai_jours` s'ils sont fournis et non vides, le **prix seulement s'il est > 0** (avec `date_prix` du
  jour, `source_prix` = corps ou `manuel`, `statut: 'actif'`). **`categorie` et `activite` ne sont jamais réécrites** sur une
  ligne existante, sauf si elles sont vides en base (les formulaires envoient toujours une valeur par défaut : re-déclarer un
  accessoire pour lui donner un prix le reclassait en matière). Pour les changer : `PUT`.
  Réponse **200** `{ok:true, produit, existant:true, champs_mis_a_jour:[…], champs_ignores:['categorie'|'activite']}`.
- **Couple absent** : insertion **si absent** (`insertProduitFournisseurSiAbsent`, plus d'upsert complet) ; prix ≤ 0 ou vide ⇒
  ligne `en_attente_prix`. Réponse **200** `{ok:true, produit, existant:false}`. Si le couple est créé **entre la lecture et
  l'écriture** (course avec une validation de demande de prix), la ligne est relue et reçoit le même patch partiel (réponse
  `existant:true`) : une ligne chiffrée n'est plus écrasée sans prix.
- Erreurs : **500** « Lecture du catalogue impossible, rien n'a été écrit : … » · **400** « Mise à jour de la référence existante
  impossible : … » / « Déclaration de la référence impossible : … » · **409** « La référence vient d'être créée par ailleurs et
  n'a pas pu être relue : … Réessayez. »

#### `PUT /api/produits-fournisseurs/:id` (changée)
- Patch **partiel** : `categorie`, `activite`, `unite`, `fournisseur_id` (+ `fournisseur_nom`) et `delai_jours` ne sont écrits que
  s'ils sont fournis **et non vides**. ⚠ Conséquence assumée : on ne peut plus **vider** un délai ni **détacher** une référence de
  son fournisseur en envoyant une valeur vide (la modale BE envoyait `fournisseur_id: null` quand sa liste ne retrouvait pas le
  fournisseur, ce qui détachait la référence).
- Prix : touché seulement s'il est > 0 **et différent** du prix en base (relu par `getProduitFournisseurParId`). Un prix
  **inchangé** ne « rajeunit » pas la ligne : `date_prix`, `source_prix` (ex. `rfq`) et `statut` restent. Prix modifié : date
  du jour, `source_prix: 'manuel'`, `statut: 'actif'`.
- Erreurs : **400** prix illisible · **500** lecture de la ligne impossible (rien écrit) · **404** « Référence catalogue
  introuvable (supprimée entre-temps ?) » · **409** « Cette référence existe déjà chez ce fournisseur : modifiez la ligne
  existante. » (23505) · **400** autre échec d'écriture.

#### `GET /api/produit-prix` (élargie)
Paramètres : `fournisseur` (optionnel), `reference` **ou** `designation` (une ligne de nomenclature peut n'avoir qu'une
désignation) — les deux absents ⇒ **400** `reference ou designation requise`. Réponse **200** : champs historiques
(`prix`, `date_prix`, `designation`, `reference`, `fournisseur_id`, `fournisseur_nom` = la ligne chiffrée la plus récente) **+
`lignes[]`** = **toutes** les lignes chiffrées (prix > 0) correspondantes, avec `fournisseur_id`, `fournisseur_nom`, `reference`,
`designation`, `prix`, `date_prix`, `categorie`, `conditionnement`. Le formulaire BE : une seule ligne fraîche ⇒ il reprend son
fournisseur ; plusieurs ⇒ il demande de choisir le fournisseur.

#### `POST /api/demandes-prix/:id/valider` (changée)
Corps inchangé (`retenus[]`). Chaque `{ error }` Supabase est lu (supabase-js ne lève jamais : les anciens `.catch` étaient
morts et un prix non écrit était compté « mis à jour »).
- Demande introuvable ou illisible ⇒ **404** « Demande de prix introuvable (ou lecture impossible) : aucun prix écrit. »
- Par retenu (référence + prix lisible) :
  - prix **≤ 0** ⇒ échec « prix nul ou négatif (…), non écrit » (un 0 daté du jour passait pour frais dans l'éditeur) ;
  - ligne catalogue **existante** : seuls `prix`, `devise`, `date_prix` (jour), `source_prix: 'rfq'`, `statut: 'actif'` sont
    écrits ; `designation`, `categorie`, `activite`, `fournisseur_nom` seulement **s'ils sont vides en base** ;
  - ligne absente : création chiffrée (source `rfq`) ;
  - **historique** (`ref_prix_historique`) : un point **une seule fois** par (référence, fournisseur, n° de demande, prix) —
    lecture stricte `getRefPrixHistoriqueRfq` ; si elle échoue, rien n'est ajouté et c'est signalé en échec ;
  - réponse fournisseur marquée `retenu: true` (échec signalé).
- Au moins un échec ⇒ **500** `{ok:false, error:'N écriture(s) en échec, demande de prix laissée ouverte : …', echecs:[…], prix_maj}` :
  la demande **reste ouverte** et peut être revalidée (sans doubler l'historique). Journal serveur `[RFQ] validation …`.
- Tout écrit mais clôture impossible ⇒ **500** « Prix écrits (N) mais clôture de la demande impossible : … ». Succès ⇒ **200**
  `{ok:true, prix_maj}` (inchangé).
- ⚠ **Écran non branché** : `rfqValider` (`src/achats.tsx`) affiche encore « Échec de la validation. » sans `error` ni `echecs`.

#### `POST /api/be/analyse-dt/:id/generer-bdt` (changée — aucun appelant client aujourd'hui)
- Bons existants lus **strictement** et par pages (`getClesBonsStrictes('BDT' | 'BDS')`) : lecture en échec ⇒ **503**
  « Lecture des bons existants impossible, aucun bon créé : … Réessayez. »
- Idempotence inchangée (clé affaire | pièce | seq) ; chaque nouveau bon prend le **premier identifiant libre** à partir du numéro
  prévu (une étape passée de sous-traitée à interne reprenait l'id d'un bon existant : 23505 à chaque relance). Sur 23505, l'id est
  relu (`getCleBonParId`) : même clé ⇒ compté « déjà présent » (`skipped`), sinon id suivant (50 essais au plus).
- Les compteurs n'avancent qu'après une insertion **réussie**. Échec(s) ⇒ **500** `{ok:false, error:'N bon(s) non créé(s) : … Relancer
  la génération recrée seulement les bons manquants.', bdt, bds, skipped, sansNom, oasGates, echecs:[{bon, piece, seq, erreur}]}`.
  Succès : **200** `{ok:true, bdt, bds, skipped, sansNom, oasGates, echecs:[]}` (+ `avertissement` cloud-9 inchangé).

#### `GET /api/be/analyse-dt/:id` (seuil)
Fraîcheur des prix matière : `PRIX_VALIDITE_JOURS` (183 j) au lieu de 92 j. Contrat inchangé par ailleurs.

#### `GET /api/ged/file/:id` (changée)
- **`Content-Disposition`** construit par `dispositionFichier(nom, 'inline')` (RFC 6266 / RFC 5987) :
  `inline; filename="<repli ASCII>"; filename*=UTF-8''<nom exact percent-encodé>`. Repli : accents retirés, `’` → `'`, `–`/`—`
  → `-`, `œ` → `oe`, `€` → `EUR`, guillemets et `\` supprimés, autre caractère non ASCII → `_`. Avant : le nom brut partait dans
  l'en-tête ; sous **Node** (Docker, VM) un seul caractère > U+00FF (`’ – œ €`, fréquents dans un nom de fichier Office) levait
  une TypeError avalée par le `catch` ⇒ **502 « Fichier injoignable »** alors que le fichier était intact. (Sous workerd /
  Cloudflare l'en-tête était accepté : pas de 502, nom peut-être illisible à l'enregistrement.)
- `Content-Type` = `documents.mime` (sinon celui du stockage), `Content-Length` recopié, `Cache-Control: private, max-age=300` —
  inchangés. Contenu servi à l'identique (vérifié octet par octet).
- Erreurs, chacune journalisée `console.error('[GED] ouverture <id> : …')` : **404** « Document introuvable » · **500** « Lien de
  stockage indisponible pour ce document (bucket « ged » ou fichier absent du stockage). » · **502** « Stockage injoignable : le
  service de fichiers ne répond pas. » · **502** « Fichier indisponible dans le stockage (<statut>) » · **500** « Réponse impossible
  à construire pour ce document : … ».

#### Page `GET /production/lot/:id` (rendu serveur)
Nomenclature de la fiche lot et de l'OF imprimé = **la nomenclature validée d'indice le plus haut** (ordre de recherche inchangé :
lien de la commande, lot, pièce, affaire). Avant : la dernière fiche **créée**, brouillon compris (indice B non relu imprimé alors
que les BDT venaient de A). Aucune fiche validée ⇒ repli sur l'ancien choix, `console.warn('[fiche lot] …')`, drapeau
`nomenclature_non_validee: true` et indice imprimé **« B — GAMME NON VALIDÉE (en_cours) »**. ⚠ Pas encore de bandeau à l'écran
(`pageLotDetail`, `src/prod.tsx`).

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
| GET | `/production/affectation` | L7796 |
| GET | `/production/bdt` | L10482 |
| GET | `/production/bdt-liste` | L14322 |
| GET | `/production/bdts-a-programmer` | L14390 |
| GET | `/production/commande/:id` | L10220 |
| GET | `/production/commandes` | L10211 |
| GET | `/production/competences` | L7797 |
| GET | `/production/dashboard-production` | L10470 |
| GET | `/production/dashboard-programmation` | L10469 |
| GET | `/production/fiches-suivi` | L10476 |
| GET | `/production/gantt-bdt` | L10199 |
| GET | `/production/gantt-bst` | L10207 |
| GET | `/production/habilitations` | L14951 |
| GET | `/production/horaires` | L7798 |
| GET | `/production/lot-liste` | L14323 |
| GET | `/production/lot/:id` | L10236 |
| GET | `/production/lots` | L10215 |
| GET | `/production/matricule` | L10474 |
| GET | `/production/non-faits` | L10475 |
| GET | `/production/operateur` | L7799 |
| GET | `/production/ordonnancement` | L7758 |
| GET | `/production/pilotage` | L10575 |
| GET | `/production/planning` | L7890 |
| GET | `/production/pointage` | L10473 |
| GET | `/production/service` | L7802 |
| GET | `/production/soustraitance` | L10548 |
| GET | `/production/st-liste` | L10477 |
| GET | `/production/suivi-st` | L10478 |
| GET | `/commercial/affaire/:num` | L567 |
| GET | `/commercial/avoirs` | L650 |
| GET | `/commercial/avoirs-liste` | L14326 |
| GET | `/commercial/client/:id` | L555 |
| GET | `/commercial/cmd-liste` | L14318 |
| GET | `/commercial/commande` | L1911 |
| GET | `/commercial/commande-old` | L1908 |
| GET | `/commercial/commandes-validees` | L642 |
| GET | `/commercial/dt` | L1801 |
| GET | `/commercial/dt-liste` | L646 |
| GET | `/commercial/dt-liste` | L14316 |
| GET | `/commercial/offre` | L621 |
| GET | `/commercial/offre-old` | L1883 |
| GET | `/commercial/offre/edit` | L631 |
| GET | `/commercial/offres-liste` | L625 |
| GET | `/commercial/offres-liste` | L14317 |
| GET | `/commercial/references-pieces` | L14328 |
| GET | `/commercial/rentree` | L620 |
| GET | `/commercial/service` | L544 |
| GET | `/dashboard` | L14222 |
| GET | `/dashboard/achats` | L14225 |
| GET | `/dashboard/be` | L14224 |
| GET | `/dashboard/commercial` | L14223 |
| GET | `/dashboard/direction` | L14233 |
| GET | `/dashboard/environnement` | L14235 |
| GET | `/dashboard/expedition` | L14229 |
| GET | `/dashboard/finance` | L14236 |
| GET | `/dashboard/fournisseurs` | L14238 |
| GET | `/dashboard/maintenance` | L14230 |
| GET | `/dashboard/oas` | L14234 |
| GET | `/dashboard/production` | L14227 |
| GET | `/dashboard/programmation` | L14226 |
| GET | `/dashboard/qualite` | L14228 |
| GET | `/dashboard/rh` | L14232 |
| GET | `/dashboard/stock` | L14237 |
| GET | `/qualite/8d` | L13043 |
| GET | `/qualite/anomalie` | L13017 |
| GET | `/qualite/audit-9001` | L14652 |
| GET | `/qualite/audit-en9100` | L14711 |
| GET | `/qualite/ecme` | L13709 |
| GET | `/qualite/liberation` | L13685 |
| GET | `/qualite/nc-liste` | L14320 |
| GET | `/qualite/perishables` | L14764 |
| GET | `/qualite/pv` | L13659 |
| GET | `/qualite/service` | L10686 |
| GET | `/rh/competences` | L12489 |
| GET | `/rh/conge` | L13790 |
| GET | `/rh/conge-liste` | L14325 |
| GET | `/rh/employes` | L12465 |
| GET | `/rh/habilitations` | L12481 |
| GET | `/rh/organigramme` | L12477 |
| GET | `/rh/pointage` | L12954 |
| GET | `/rh/pointage` | L13819 |
| GET | `/rh/service` | L12460 |
| GET | `/rh/temps` | L12940 |
| GET | `/achats/da-auto` | L10480 |
| GET | `/achats/da-liste` | L14319 |
| GET | `/achats/demande` | L7679 |
| GET | `/achats/fournisseur` | L7730 |
| GET | `/achats/fournisseur/:id` | L2183 |
| GET | `/achats/fournisseurs-st` | L14327 |
| GET | `/achats/reception` | L7706 |
| GET | `/achats/service` | L1979 |
| GET | `/achats/sous-traitant/:id` | L2193 |
| GET | `/be/analyse` | L6527 |
| GET | `/be/ged` | L7653 |
| GET | `/be/preparation` | L7419 |
| GET | `/be/references-pieces` | L14329 |
| GET | `/be/service` | L4489 |
| GET | `/stock` | L14833 |
| GET | `/stock/alertes` | L14836 |
| GET | `/stock/entrees` | L14834 |
| GET | `/stock/service` | L12119 |
| GET | `/stock/sorties` | L14835 |
| GET | `/oas/balancelles` | L14439 |
| GET | `/oas/rejets-eau` | L14527 |
| GET | `/oas/service` | L10638 |
| GET | `/oas/session` | L10655 |
| GET | `/maintenance/intervention` | L13762 |
| GET | `/maintenance/liste` | L14324 |
| GET | `/maintenance/mtbf` | L14231 |
| GET | `/maintenance/service` | L12225 |
| GET | `/finances/couts` | L14844 |
| GET | `/finances/imputations` | L14847 |
| GET | `/finances/machines` | L14846 |
| GET | `/finances/taux` | L14845 |
| GET | `/expedition/bl` | L13735 |
| GET | `/expedition/bl-liste` | L14321 |
| GET | `/expedition/envoi-client` | L14395 |
| GET | `/manuels` | L346 |
| GET | `/manuels/:slug` | L350 |
| GET | `/securite/chimique/:id` | L11041 |
| GET | `/securite/service` | L10938 |
| GET | `/direction/service` | L13854 |
| GET | `/direction/validation` | L14178 |
| GET | `/comptabilite/dashboard` | L15139 |
| GET | `/comptabilite/factures` | L15140 |
| GET | `/login` | L264 |
| GET | `/logout` | L307 |
| GET | `/` | L388 |
| GET | `/plans/service` | L5847 |
| GET | `/environnement/service` | L11015 |
| GET | `/expeditions/service` | L11484 |
| GET | `/compta/service` | L13000 |
| GET | `/reglages/objectifs` | L14241 |
