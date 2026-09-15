# Référence API & routes

> **Fichier généré** par `node scripts_doc/gen_api_ref.mjs` — ne pas éditer à la main, **sauf** le bloc
> « Contrats détaillés » (entre les marqueurs `manuel:contrats`), conservé d'une génération à l'autre.
> Source : `src/index.tsx` (381 routes). Les numéros de ligne sont indicatifs (au moment de la génération).

## Routes API (248)

| Famille | Routes |
|---|---|
| `api/production` | 37 |
| `api/qualite` | 28 |
| `api/achats` | 16 |
| `api/audit` | 16 |
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
| `api/stock` | 1 |
| `api/commande` | 1 |
| `api/compta` | 1 |
| `api/pointage` | 1 |
| `api/commandes-p` | 1 |
| `api/prepa-technique` | 1 |

### api/production

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/production/bds/:id` | L6575 |
| POST | `/api/production/bds/:id/envoyer` | L6638 |
| POST | `/api/production/bds/:id/retour` | L6640 |
| POST | `/api/production/bdt/:id/affecter` | L6988 |
| POST | `/api/production/bdt/:id/deprogrammer` | L7063 |
| POST | `/api/production/bdt/:id/recoller` | L7339 |
| POST | `/api/production/bdt/:id/recu` | L7502 |
| POST | `/api/production/bdt/:id/separer` | L7087 |
| POST | `/api/production/bdt/:id/solder` | L7553 |
| GET | `/api/production/bdt/:id/temps` | L7275 |
| POST | `/api/production/bdt/reglage/reconstituer` | L7445 |
| POST | `/api/production/bdts` | L6530 |
| PATCH | `/api/production/bdts/:id` | L6496 |
| POST | `/api/production/bst/:id/affecter-st` | L7784 |
| POST | `/api/production/bst/affecter` | L7727 |
| POST | `/api/production/conge/:id/valider` | L10268 |
| POST | `/api/production/demande-achat-operateur` | L2245 |
| POST | `/api/production/machine` | L7846 |
| DELETE | `/api/production/machine/:id` | L7953 |
| PATCH | `/api/production/machine/:id` | L7921 |
| POST | `/api/production/machine/:id/panne` | L9650 |
| POST | `/api/production/machine/:id/reparer` | L9657 |
| POST | `/api/production/machine/reorder` | L6935 |
| POST | `/api/production/non-conformites` | L6642 |
| POST | `/api/production/operateur-contexte` | L2226 |
| POST | `/api/production/poste` | L6946 |
| DELETE | `/api/production/poste/:id` | L6967 |
| PATCH | `/api/production/poste/:id` | L6958 |
| POST | `/api/production/poste/reorder` | L6979 |
| DELETE | `/api/production/presence` | L8014 |
| GET | `/api/production/presence` | L7982 |
| POST | `/api/production/presence` | L7993 |
| POST | `/api/production/process` | L6875 |
| DELETE | `/api/production/process/:id` | L6920 |
| PATCH | `/api/production/process/:id` | L6899 |
| POST | `/api/production/process/reorder` | L6928 |
| POST | `/api/production/sortie-matiere` | L8295 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L9333 |
| DELETE | `/api/qualite/capabilite/:id` | L9362 |
| POST | `/api/qualite/derogation` | L8829 |
| PATCH | `/api/qualite/derogation/:id` | L8843 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L10587 |
| POST | `/api/qualite/ecme` | L9170 |
| DELETE | `/api/qualite/ecme/:id` | L9209 |
| PATCH | `/api/qualite/ecme/:id` | L9182 |
| POST | `/api/qualite/ecme/:id/etalonner` | L9196 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L9258 |
| POST | `/api/qualite/ecme/:id/verification` | L9215 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L9252 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L9244 |
| POST | `/api/qualite/lot/:id/liberer` | L6717 |
| POST | `/api/qualite/nc/:id/quarantaine` | L10643 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L10527 |
| PATCH | `/api/qualite/non-conformites/:id` | L10504 |
| POST | `/api/qualite/perissable` | L8684 |
| DELETE | `/api/qualite/perissable/:id` | L8698 |
| PATCH | `/api/qualite/perissable/:id` | L8692 |
| POST | `/api/qualite/perissable/:id/sortie` | L8704 |
| POST | `/api/qualite/plan-controle` | L8723 |
| DELETE | `/api/qualite/plan-controle/:id` | L8741 |
| PATCH | `/api/qualite/plan-controle/:id` | L8732 |
| POST | `/api/qualite/quarantaine/:id/decision-fournisseur` | L10746 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L10662 |
| POST | `/api/qualite/rapports-8d` | L10460 |
| PATCH | `/api/qualite/rapports-8d/:id` | L10485 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/avoirs-fournisseurs` | L1836 |
| POST | `/api/achats/avoirs-fournisseurs/:id/annuler` | L1936 |
| POST | `/api/achats/avoirs-fournisseurs/:id/imputer` | L1896 |
| POST | `/api/achats/avoirs-fournisseurs/:id/recu` | L1871 |
| POST | `/api/achats/bc` | L2528 |
| POST | `/api/achats/bc/:id/certificat-matiere` | L4083 |
| POST | `/api/achats/da` | L2198 |
| PATCH | `/api/achats/da/:id` | L2329 |
| POST | `/api/achats/da/:id/defusionner` | L2465 |
| POST | `/api/achats/da/:id/editer` | L2348 |
| POST | `/api/achats/da/:id/masquer` | L2379 |
| POST | `/api/achats/da/:id/soumettre` | L2574 |
| POST | `/api/achats/da/fusionner` | L2406 |
| POST | `/api/achats/da/regrouper` | L2496 |
| POST | `/api/achats/fournisseur` | L2069 |
| POST | `/api/achats/sous-traitant` | L2091 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L8798 |
| POST | `/api/audit/fai` | L8794 |
| DELETE | `/api/audit/fai/:id` | L8796 |
| PATCH | `/api/audit/fai/:id` | L8795 |
| POST | `/api/audit/grille` | L8786 |
| DELETE | `/api/audit/grille/:id` | L8788 |
| PATCH | `/api/audit/grille/:id` | L8787 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L4047 |
| POST | `/api/audit/programme` | L8759 |
| DELETE | `/api/audit/programme/:id` | L8771 |
| PATCH | `/api/audit/programme/:id` | L8765 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L4017 |
| POST | `/api/audit/programme/reconduire` | L8777 |
| POST | `/api/audit/question` | L8790 |
| DELETE | `/api/audit/question/:id` | L8792 |
| PATCH | `/api/audit/question/:id` | L8791 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L10103 |
| DELETE | `/api/rh/certification/:id` | L10133 |
| PATCH | `/api/rh/certification/:id` | L10123 |
| POST | `/api/rh/competence` | L9871 |
| POST | `/api/rh/conge` | L10141 |
| POST | `/api/rh/conge/:id/valider` | L10249 |
| GET | `/api/rh/export-silae` | L10010 |
| POST | `/api/rh/pointage` | L10318 |
| POST | `/api/rh/salarie` | L9955 |
| DELETE | `/api/rh/salarie/:id` | L10086 |
| PATCH | `/api/rh/salarie/:id` | L10043 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1336 |
| PATCH | `/api/offre/:id` | L1259 |
| POST | `/api/offre/:id/accepter` | L1174 |
| GET | `/api/offre/:id/devis` | L849 |
| POST | `/api/offre/:id/envoyer` | L821 |
| POST | `/api/offre/:id/negocier` | L896 |
| POST | `/api/offre/:id/pricing` | L1285 |
| POST | `/api/offre/:id/refuser` | L887 |
| POST | `/api/offre/:id/valider` | L839 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L3208 |
| POST | `/api/expeditions/bc/:id/pv` | L3230 |
| POST | `/api/expeditions/bc/:id/receptionner` | L2962 |
| POST | `/api/expeditions/bds/:id/envoyer` | L6637 |
| POST | `/api/expeditions/bds/:id/retour` | L6639 |
| POST | `/api/expeditions/bl-partiel` | L3440 |
| POST | `/api/expeditions/bl/:id/reception-infos` | L3079 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L3109 |
| POST | `/api/expeditions/retour-fournisseur/:qid/expedie` | L3421 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L3875 |
| DELETE | `/api/demandes-prix/:id` | L4176 |
| GET | `/api/demandes-prix/:id` | L4112 |
| POST | `/api/demandes-prix/:id/envoyer` | L4120 |
| GET | `/api/demandes-prix/:id/pdf` | L3967 |
| POST | `/api/demandes-prix/:id/reponses` | L4127 |
| POST | `/api/demandes-prix/:id/valider` | L4147 |
| POST | `/api/demandes-prix/grouped` | L3905 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L4854 |
| DELETE | `/api/nomenclature/:id` | L5093 |
| PUT | `/api/nomenclature/:id` | L4937 |
| GET | `/api/nomenclature/:id/fournitures` | L4225 |
| GET | `/api/nomenclature/:id/journal` | L4209 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L5049 |
| POST | `/api/nomenclature/:id/prepa-validee` | L11531 |
| POST | `/api/nomenclature/:id/programmes` | L5018 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L9663 |
| PATCH | `/api/maintenance/om/:id` | L9729 |
| POST | `/api/maintenance/om/:id/cloturer` | L9741 |
| POST | `/api/maintenance/piece` | L9758 |
| DELETE | `/api/maintenance/piece/:id` | L9787 |
| PATCH | `/api/maintenance/piece/:id` | L9775 |
| POST | `/api/maintenance/preventif/generer` | L9725 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L4662 |
| PATCH | `/api/plans/:id` | L4670 |
| GET | `/api/plans/:id/marqueurs` | L4678 |
| POST | `/api/plans/:id/marqueurs` | L4681 |
| POST | `/api/plans/entity` | L4707 |
| DELETE | `/api/plans/marqueur/:id` | L4699 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L705 |
| GET | `/api/dt/:id` | L677 |
| PUT | `/api/dt/:id` | L747 |
| POST | `/api/dt/:id/analyse` | L1444 |
| POST | `/api/dt/:id/valider` | L1419 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L4235 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L4421 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L4464 |
| GET | `/api/be/noms-signature` | L2724 |
| GET | `/api/be/refs` | L4201 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L3814 |
| DELETE | `/api/produits-fournisseurs/:id` | L3868 |
| PUT | `/api/produits-fournisseurs/:id` | L3839 |
| POST | `/api/produits-fournisseurs/purge` | L4189 |
| GET | `/api/produits-fournisseurs/sans-prix` | L4183 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L4615 |
| GET | `/api/ged/file/:id` | L4596 |
| GET | `/api/ged/nomenclature/:id` | L4582 |
| GET | `/api/ged/ref/:ref` | L4586 |
| POST | `/api/ged/upload` | L4539 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L8117 |
| PATCH | `/api/oas/balancelle/:id` | L8283 |
| POST | `/api/oas/balancelle/:id/cloturer` | L7654 |
| POST | `/api/oas/releve-bain` | L8219 |
| POST | `/api/oas/releve-eau` | L8170 |

### api/clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/clients` | L644 |
| DELETE | `/api/clients/:id` | L662 |
| PATCH | `/api/clients/:id` | L652 |
| GET | `/api/clients/search` | L622 |

### api/locks

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/locks/acquire` | L2673 |
| POST | `/api/locks/heartbeat` | L2693 |
| POST | `/api/locks/release` | L2705 |
| GET | `/api/locks/status` | L2714 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L4063 |
| POST | `/api/bc/:id/date-arrivee` | L3209 |
| GET | `/api/bc/:id/pdf` | L3990 |
| POST | `/api/bc/:id/relance` | L4071 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L8068 |
| POST | `/api/interlocuteurs` | L8076 |
| DELETE | `/api/interlocuteurs/:id` | L8108 |
| PATCH | `/api/interlocuteurs/:id` | L8096 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L8987 |
| PATCH | `/api/securite/` | L8980 |
| POST | `/api/securite/` | L8973 |
| POST | `/api/securite/duer/cloner-annee` | L9005 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L786 |
| POST | `/api/references-clients` | L795 |
| DELETE | `/api/references-clients/:id` | L809 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1345 |
| DELETE | `/api/credits/:id` | L1409 |
| PATCH | `/api/credits/:id` | L1388 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L6792 |
| GET | `/api/export/fournisseurs.xlsx` | L6761 |
| GET | `/api/export/seirich.xlsx` | L6814 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L9127 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L9141 |
| POST | `/api/environnement/perissables-expires/declarer` | L9032 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L11332 |
| POST | `/api/direction/scan-alertes` | L11241 |
| GET | `/api/direction/source` | L11365 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1237 |
| POST | `/api/quarantaine/:id/rejeter` | L1247 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L2019 |
| PATCH | `/api/fournisseurs/:id` | L1983 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L2024 |
| PATCH | `/api/sous-traitants/:id` | L2000 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L3544 |
| POST | `/api/factures/:id/valider-paiement` | L3593 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L3608 |
| PATCH | `/api/factures-fournisseur/:id` | L3648 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L8052 |
| POST | `/api/planning/affectation-poste` | L8028 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L9369 |
| DELETE | `/api/controles/cote/:id` | L9394 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L11290 |
| POST | `/api/validations/:id/decision` | L11302 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L11490 |
| DELETE | `/api/kpi-objectifs/:id` | L11502 |

### api/login

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/login` | L245 |

### api/version

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/version` | L283 |

### api/me

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/me` | L295 |

### api/contact

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/contact` | L553 |

### api/catalogue-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/catalogue-fournisseurs` | L2032 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L3694 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L3792 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L3802 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L9062 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/seuils` | L9535 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L9583 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L10027 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L10164 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L10909 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L11576 |

<!-- manuel:contrats -->
## Contrats détaillés (écrits à la main)

Bloc conservé par `gen_api_ref.mjs` : les tableaux ci-dessus sont régénérés, ce bloc ne l'est pas.

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
  - `livraison_partielle?` (booléen, oui/non, 1/0 ; absent ou vide = non) ; `qte_livree?` (> 0, ≤ 10 000 000).
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
  - non conforme : `lignes: [{ idx, conforme, observation? }]` — **chaque** ligne de `lignesBc(bc)` exactement une fois,
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
| GET | `/production/affectation` | L6398 |
| GET | `/production/bdt` | L8421 |
| GET | `/production/bdt-liste` | L11519 |
| GET | `/production/bdts-a-programmer` | L11587 |
| GET | `/production/commande/:id` | L8359 |
| GET | `/production/commandes` | L8350 |
| GET | `/production/competences` | L6399 |
| GET | `/production/dashboard-production` | L8409 |
| GET | `/production/dashboard-programmation` | L8408 |
| GET | `/production/fiches-suivi` | L8415 |
| GET | `/production/gantt-bdt` | L8338 |
| GET | `/production/gantt-bst` | L8346 |
| GET | `/production/habilitations` | L12148 |
| GET | `/production/horaires` | L6400 |
| GET | `/production/lot-liste` | L11520 |
| GET | `/production/lot/:id` | L8375 |
| GET | `/production/lots` | L8354 |
| GET | `/production/matricule` | L8413 |
| GET | `/production/non-faits` | L8414 |
| GET | `/production/operateur` | L6401 |
| GET | `/production/ordonnancement` | L6360 |
| GET | `/production/pilotage` | L8514 |
| GET | `/production/planning` | L6483 |
| GET | `/production/pointage` | L8412 |
| GET | `/production/service` | L6404 |
| GET | `/production/soustraitance` | L8487 |
| GET | `/production/st-liste` | L8416 |
| GET | `/production/suivi-st` | L8417 |
| GET | `/commercial/affaire/:num` | L536 |
| GET | `/commercial/avoirs` | L619 |
| GET | `/commercial/avoirs-liste` | L11523 |
| GET | `/commercial/client/:id` | L524 |
| GET | `/commercial/cmd-liste` | L11515 |
| GET | `/commercial/commande` | L1692 |
| GET | `/commercial/commande-old` | L1689 |
| GET | `/commercial/commandes-validees` | L611 |
| GET | `/commercial/dt` | L1582 |
| GET | `/commercial/dt-liste` | L615 |
| GET | `/commercial/dt-liste` | L11513 |
| GET | `/commercial/offre` | L590 |
| GET | `/commercial/offre-old` | L1664 |
| GET | `/commercial/offre/edit` | L600 |
| GET | `/commercial/offres-liste` | L594 |
| GET | `/commercial/offres-liste` | L11514 |
| GET | `/commercial/references-pieces` | L11525 |
| GET | `/commercial/rentree` | L589 |
| GET | `/commercial/service` | L513 |
| GET | `/dashboard` | L11419 |
| GET | `/dashboard/achats` | L11422 |
| GET | `/dashboard/be` | L11421 |
| GET | `/dashboard/commercial` | L11420 |
| GET | `/dashboard/direction` | L11430 |
| GET | `/dashboard/environnement` | L11432 |
| GET | `/dashboard/expedition` | L11426 |
| GET | `/dashboard/finance` | L11433 |
| GET | `/dashboard/fournisseurs` | L11435 |
| GET | `/dashboard/maintenance` | L11427 |
| GET | `/dashboard/oas` | L11431 |
| GET | `/dashboard/production` | L11424 |
| GET | `/dashboard/programmation` | L11423 |
| GET | `/dashboard/qualite` | L11425 |
| GET | `/dashboard/rh` | L11429 |
| GET | `/dashboard/stock` | L11434 |
| GET | `/qualite/8d` | L10400 |
| GET | `/qualite/anomalie` | L10374 |
| GET | `/qualite/audit-9001` | L11849 |
| GET | `/qualite/audit-en9100` | L11908 |
| GET | `/qualite/ecme` | L11014 |
| GET | `/qualite/liberation` | L10990 |
| GET | `/qualite/nc-liste` | L11517 |
| GET | `/qualite/perishables` | L11961 |
| GET | `/qualite/pv` | L10964 |
| GET | `/qualite/service` | L8620 |
| GET | `/rh/competences` | L9854 |
| GET | `/rh/conge` | L11095 |
| GET | `/rh/conge-liste` | L11522 |
| GET | `/rh/employes` | L9830 |
| GET | `/rh/habilitations` | L9846 |
| GET | `/rh/organigramme` | L9842 |
| GET | `/rh/pointage` | L10311 |
| GET | `/rh/pointage` | L11124 |
| GET | `/rh/service` | L9825 |
| GET | `/rh/temps` | L10298 |
| GET | `/achats/da-auto` | L8419 |
| GET | `/achats/da-liste` | L11516 |
| GET | `/achats/demande` | L6281 |
| GET | `/achats/fournisseur` | L6332 |
| GET | `/achats/fournisseur/:id` | L1961 |
| GET | `/achats/fournisseurs-st` | L11524 |
| GET | `/achats/reception` | L6308 |
| GET | `/achats/service` | L1760 |
| GET | `/achats/sous-traitant/:id` | L1971 |
| GET | `/be/analyse` | L5139 |
| GET | `/be/ged` | L6255 |
| GET | `/be/preparation` | L6021 |
| GET | `/be/references-pieces` | L11526 |
| GET | `/be/service` | L3766 |
| GET | `/stock` | L12030 |
| GET | `/stock/alertes` | L12033 |
| GET | `/stock/entrees` | L12031 |
| GET | `/stock/service` | L9549 |
| GET | `/stock/sorties` | L12032 |
| GET | `/oas/balancelles` | L11636 |
| GET | `/oas/rejets-eau` | L11724 |
| GET | `/oas/service` | L8577 |
| GET | `/oas/session` | L8589 |
| GET | `/maintenance/intervention` | L11067 |
| GET | `/maintenance/liste` | L11521 |
| GET | `/maintenance/mtbf` | L11428 |
| GET | `/maintenance/service` | L9590 |
| GET | `/finances/couts` | L12041 |
| GET | `/finances/imputations` | L12044 |
| GET | `/finances/machines` | L12043 |
| GET | `/finances/taux` | L12042 |
| GET | `/expedition/bl` | L11040 |
| GET | `/expedition/bl-liste` | L11518 |
| GET | `/expedition/envoi-client` | L11592 |
| GET | `/manuels` | L315 |
| GET | `/manuels/:slug` | L319 |
| GET | `/securite/chimique/:id` | L8960 |
| GET | `/securite/service` | L8857 |
| GET | `/direction/service` | L11159 |
| GET | `/direction/validation` | L11375 |
| GET | `/comptabilite/dashboard` | L12336 |
| GET | `/comptabilite/factures` | L12337 |
| GET | `/login` | L234 |
| GET | `/logout` | L277 |
| GET | `/` | L357 |
| GET | `/plans/service` | L4634 |
| GET | `/environnement/service` | L8934 |
| GET | `/expeditions/service` | L9403 |
| GET | `/compta/service` | L10357 |
| GET | `/reglages/objectifs` | L11438 |
