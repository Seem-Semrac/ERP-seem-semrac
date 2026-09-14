# Référence API & routes

> **Fichier généré** par `node scripts_doc/gen_api_ref.mjs` — ne pas éditer à la main, **sauf** le bloc
> « Contrats détaillés » (entre les marqueurs `manuel:contrats`), conservé d'une génération à l'autre.
> Source : `src/index.tsx` (379 routes). Les numéros de ligne sont indicatifs (au moment de la génération).

## Routes API (246)

| Famille | Routes |
|---|---|
| `api/production` | 37 |
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
| PATCH | `/api/production/bds/:id` | L6279 |
| POST | `/api/production/bds/:id/envoyer` | L6342 |
| POST | `/api/production/bds/:id/retour` | L6344 |
| POST | `/api/production/bdt/:id/affecter` | L6692 |
| POST | `/api/production/bdt/:id/deprogrammer` | L6767 |
| POST | `/api/production/bdt/:id/recoller` | L7043 |
| POST | `/api/production/bdt/:id/recu` | L7206 |
| POST | `/api/production/bdt/:id/separer` | L6791 |
| POST | `/api/production/bdt/:id/solder` | L7257 |
| GET | `/api/production/bdt/:id/temps` | L6979 |
| POST | `/api/production/bdt/reglage/reconstituer` | L7149 |
| POST | `/api/production/bdts` | L6234 |
| PATCH | `/api/production/bdts/:id` | L6200 |
| POST | `/api/production/bst/:id/affecter-st` | L7488 |
| POST | `/api/production/bst/affecter` | L7431 |
| POST | `/api/production/conge/:id/valider` | L9951 |
| POST | `/api/production/demande-achat-operateur` | L2230 |
| POST | `/api/production/machine` | L7550 |
| DELETE | `/api/production/machine/:id` | L7657 |
| PATCH | `/api/production/machine/:id` | L7625 |
| POST | `/api/production/machine/:id/panne` | L9333 |
| POST | `/api/production/machine/:id/reparer` | L9340 |
| POST | `/api/production/machine/reorder` | L6639 |
| POST | `/api/production/non-conformites` | L6346 |
| POST | `/api/production/operateur-contexte` | L2211 |
| POST | `/api/production/poste` | L6650 |
| DELETE | `/api/production/poste/:id` | L6671 |
| PATCH | `/api/production/poste/:id` | L6662 |
| POST | `/api/production/poste/reorder` | L6683 |
| DELETE | `/api/production/presence` | L7718 |
| GET | `/api/production/presence` | L7686 |
| POST | `/api/production/presence` | L7697 |
| POST | `/api/production/process` | L6579 |
| DELETE | `/api/production/process/:id` | L6624 |
| PATCH | `/api/production/process/:id` | L6603 |
| POST | `/api/production/process/reorder` | L6632 |
| POST | `/api/production/sortie-matiere` | L7999 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L9037 |
| DELETE | `/api/qualite/capabilite/:id` | L9066 |
| POST | `/api/qualite/derogation` | L8533 |
| PATCH | `/api/qualite/derogation/:id` | L8547 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L10270 |
| POST | `/api/qualite/ecme` | L8874 |
| DELETE | `/api/qualite/ecme/:id` | L8913 |
| PATCH | `/api/qualite/ecme/:id` | L8886 |
| POST | `/api/qualite/ecme/:id/etalonner` | L8900 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L8962 |
| POST | `/api/qualite/ecme/:id/verification` | L8919 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L8956 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L8948 |
| POST | `/api/qualite/lot/:id/liberer` | L6421 |
| POST | `/api/qualite/nc/:id/quarantaine` | L10326 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L10210 |
| PATCH | `/api/qualite/non-conformites/:id` | L10187 |
| POST | `/api/qualite/perissable` | L8388 |
| DELETE | `/api/qualite/perissable/:id` | L8402 |
| PATCH | `/api/qualite/perissable/:id` | L8396 |
| POST | `/api/qualite/perissable/:id/sortie` | L8408 |
| POST | `/api/qualite/plan-controle` | L8427 |
| DELETE | `/api/qualite/plan-controle/:id` | L8445 |
| PATCH | `/api/qualite/plan-controle/:id` | L8436 |
| POST | `/api/qualite/quarantaine/:id/decision-fournisseur` | L10429 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L10345 |
| POST | `/api/qualite/rapports-8d` | L10143 |
| PATCH | `/api/qualite/rapports-8d/:id` | L10168 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L8502 |
| POST | `/api/audit/fai` | L8498 |
| DELETE | `/api/audit/fai/:id` | L8500 |
| PATCH | `/api/audit/fai/:id` | L8499 |
| POST | `/api/audit/grille` | L8490 |
| DELETE | `/api/audit/grille/:id` | L8492 |
| PATCH | `/api/audit/grille/:id` | L8491 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L3784 |
| POST | `/api/audit/programme` | L8463 |
| DELETE | `/api/audit/programme/:id` | L8475 |
| PATCH | `/api/audit/programme/:id` | L8469 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L3754 |
| POST | `/api/audit/programme/reconduire` | L8481 |
| POST | `/api/audit/question` | L8494 |
| DELETE | `/api/audit/question/:id` | L8496 |
| PATCH | `/api/audit/question/:id` | L8495 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/avoirs-fournisseurs` | L1821 |
| POST | `/api/achats/avoirs-fournisseurs/:id/annuler` | L1921 |
| POST | `/api/achats/avoirs-fournisseurs/:id/imputer` | L1881 |
| POST | `/api/achats/avoirs-fournisseurs/:id/recu` | L1856 |
| POST | `/api/achats/bc` | L2513 |
| POST | `/api/achats/da` | L2183 |
| PATCH | `/api/achats/da/:id` | L2314 |
| POST | `/api/achats/da/:id/defusionner` | L2450 |
| POST | `/api/achats/da/:id/editer` | L2333 |
| POST | `/api/achats/da/:id/masquer` | L2364 |
| POST | `/api/achats/da/:id/soumettre` | L2550 |
| POST | `/api/achats/da/fusionner` | L2391 |
| POST | `/api/achats/da/regrouper` | L2481 |
| POST | `/api/achats/fournisseur` | L2054 |
| POST | `/api/achats/sous-traitant` | L2076 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L9786 |
| DELETE | `/api/rh/certification/:id` | L9816 |
| PATCH | `/api/rh/certification/:id` | L9806 |
| POST | `/api/rh/competence` | L9554 |
| POST | `/api/rh/conge` | L9824 |
| POST | `/api/rh/conge/:id/valider` | L9932 |
| GET | `/api/rh/export-silae` | L9693 |
| POST | `/api/rh/pointage` | L10001 |
| POST | `/api/rh/salarie` | L9638 |
| DELETE | `/api/rh/salarie/:id` | L9769 |
| PATCH | `/api/rh/salarie/:id` | L9726 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1327 |
| PATCH | `/api/offre/:id` | L1250 |
| POST | `/api/offre/:id/accepter` | L1165 |
| GET | `/api/offre/:id/devis` | L840 |
| POST | `/api/offre/:id/envoyer` | L812 |
| POST | `/api/offre/:id/negocier` | L887 |
| POST | `/api/offre/:id/pricing` | L1276 |
| POST | `/api/offre/:id/refuser` | L878 |
| POST | `/api/offre/:id/valider` | L830 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L3041 |
| POST | `/api/expeditions/bc/:id/pv` | L3045 |
| POST | `/api/expeditions/bc/:id/receptionner` | L2874 |
| POST | `/api/expeditions/bds/:id/envoyer` | L6341 |
| POST | `/api/expeditions/bds/:id/retour` | L6343 |
| POST | `/api/expeditions/bl-partiel` | L3182 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L2942 |
| POST | `/api/expeditions/retour-fournisseur/:qid/expedie` | L3163 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L3617 |
| DELETE | `/api/demandes-prix/:id` | L3880 |
| GET | `/api/demandes-prix/:id` | L3816 |
| POST | `/api/demandes-prix/:id/envoyer` | L3824 |
| GET | `/api/demandes-prix/:id/pdf` | L3709 |
| POST | `/api/demandes-prix/:id/reponses` | L3831 |
| POST | `/api/demandes-prix/:id/valider` | L3851 |
| POST | `/api/demandes-prix/grouped` | L3647 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L4558 |
| DELETE | `/api/nomenclature/:id` | L4797 |
| PUT | `/api/nomenclature/:id` | L4641 |
| GET | `/api/nomenclature/:id/fournitures` | L3929 |
| GET | `/api/nomenclature/:id/journal` | L3913 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L4753 |
| POST | `/api/nomenclature/:id/prepa-validee` | L11213 |
| POST | `/api/nomenclature/:id/programmes` | L4722 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L9346 |
| PATCH | `/api/maintenance/om/:id` | L9412 |
| POST | `/api/maintenance/om/:id/cloturer` | L9424 |
| POST | `/api/maintenance/piece` | L9441 |
| DELETE | `/api/maintenance/piece/:id` | L9470 |
| PATCH | `/api/maintenance/piece/:id` | L9458 |
| POST | `/api/maintenance/preventif/generer` | L9408 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L4366 |
| PATCH | `/api/plans/:id` | L4374 |
| GET | `/api/plans/:id/marqueurs` | L4382 |
| POST | `/api/plans/:id/marqueurs` | L4385 |
| POST | `/api/plans/entity` | L4411 |
| DELETE | `/api/plans/marqueur/:id` | L4403 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L696 |
| GET | `/api/dt/:id` | L668 |
| PUT | `/api/dt/:id` | L738 |
| POST | `/api/dt/:id/analyse` | L1435 |
| POST | `/api/dt/:id/valider` | L1410 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L3939 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L4125 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L4168 |
| GET | `/api/be/noms-signature` | L2691 |
| GET | `/api/be/refs` | L3905 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L3556 |
| DELETE | `/api/produits-fournisseurs/:id` | L3610 |
| PUT | `/api/produits-fournisseurs/:id` | L3581 |
| POST | `/api/produits-fournisseurs/purge` | L3893 |
| GET | `/api/produits-fournisseurs/sans-prix` | L3887 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L4319 |
| GET | `/api/ged/file/:id` | L4300 |
| GET | `/api/ged/nomenclature/:id` | L4286 |
| GET | `/api/ged/ref/:ref` | L4290 |
| POST | `/api/ged/upload` | L4243 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L7821 |
| PATCH | `/api/oas/balancelle/:id` | L7987 |
| POST | `/api/oas/balancelle/:id/cloturer` | L7358 |
| POST | `/api/oas/releve-bain` | L7923 |
| POST | `/api/oas/releve-eau` | L7874 |

### api/clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/clients` | L635 |
| DELETE | `/api/clients/:id` | L653 |
| PATCH | `/api/clients/:id` | L643 |
| GET | `/api/clients/search` | L613 |

### api/locks

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/locks/acquire` | L2640 |
| POST | `/api/locks/heartbeat` | L2660 |
| POST | `/api/locks/release` | L2672 |
| GET | `/api/locks/status` | L2681 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L3800 |
| POST | `/api/bc/:id/date-arrivee` | L3042 |
| GET | `/api/bc/:id/pdf` | L3732 |
| POST | `/api/bc/:id/relance` | L3808 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L7772 |
| POST | `/api/interlocuteurs` | L7780 |
| DELETE | `/api/interlocuteurs/:id` | L7812 |
| PATCH | `/api/interlocuteurs/:id` | L7800 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L8691 |
| PATCH | `/api/securite/` | L8684 |
| POST | `/api/securite/` | L8677 |
| POST | `/api/securite/duer/cloner-annee` | L8709 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L777 |
| POST | `/api/references-clients` | L786 |
| DELETE | `/api/references-clients/:id` | L800 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1336 |
| DELETE | `/api/credits/:id` | L1400 |
| PATCH | `/api/credits/:id` | L1379 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L6496 |
| GET | `/api/export/fournisseurs.xlsx` | L6465 |
| GET | `/api/export/seirich.xlsx` | L6518 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L8831 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L8845 |
| POST | `/api/environnement/perissables-expires/declarer` | L8736 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L11014 |
| POST | `/api/direction/scan-alertes` | L10923 |
| GET | `/api/direction/source` | L11047 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1228 |
| POST | `/api/quarantaine/:id/rejeter` | L1238 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L2004 |
| PATCH | `/api/fournisseurs/:id` | L1968 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L2009 |
| PATCH | `/api/sous-traitants/:id` | L1985 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L3286 |
| POST | `/api/factures/:id/valider-paiement` | L3335 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L3350 |
| PATCH | `/api/factures-fournisseur/:id` | L3390 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L7756 |
| POST | `/api/planning/affectation-poste` | L7732 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L9073 |
| DELETE | `/api/controles/cote/:id` | L9098 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L10972 |
| POST | `/api/validations/:id/decision` | L10984 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L11172 |
| DELETE | `/api/kpi-objectifs/:id` | L11184 |

### api/login

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/login` | L236 |

### api/version

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/version` | L274 |

### api/me

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/me` | L286 |

### api/contact

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/contact` | L544 |

### api/catalogue-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/catalogue-fournisseurs` | L2017 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L3436 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L3534 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L3544 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L8766 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/seuils` | L9218 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L9266 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L9710 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L9847 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L10591 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L11258 |

<!-- manuel:contrats -->
## Contrats détaillés (écrits à la main)

Bloc conservé par `gen_api_ref.mjs` : les tableaux ci-dessus sont régénérés, ce bloc ne l'est pas.

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
| GET | `/production/affectation` | L6102 |
| GET | `/production/bdt` | L8125 |
| GET | `/production/bdt-liste` | L11201 |
| GET | `/production/bdts-a-programmer` | L11269 |
| GET | `/production/commande/:id` | L8063 |
| GET | `/production/commandes` | L8054 |
| GET | `/production/competences` | L6103 |
| GET | `/production/dashboard-production` | L8113 |
| GET | `/production/dashboard-programmation` | L8112 |
| GET | `/production/fiches-suivi` | L8119 |
| GET | `/production/gantt-bdt` | L8042 |
| GET | `/production/gantt-bst` | L8050 |
| GET | `/production/habilitations` | L11830 |
| GET | `/production/horaires` | L6104 |
| GET | `/production/lot-liste` | L11202 |
| GET | `/production/lot/:id` | L8079 |
| GET | `/production/lots` | L8058 |
| GET | `/production/matricule` | L8117 |
| GET | `/production/non-faits` | L8118 |
| GET | `/production/operateur` | L6105 |
| GET | `/production/ordonnancement` | L6064 |
| GET | `/production/pilotage` | L8218 |
| GET | `/production/planning` | L6187 |
| GET | `/production/pointage` | L8116 |
| GET | `/production/service` | L6108 |
| GET | `/production/soustraitance` | L8191 |
| GET | `/production/st-liste` | L8120 |
| GET | `/production/suivi-st` | L8121 |
| GET | `/commercial/affaire/:num` | L527 |
| GET | `/commercial/avoirs` | L610 |
| GET | `/commercial/avoirs-liste` | L11205 |
| GET | `/commercial/client/:id` | L515 |
| GET | `/commercial/cmd-liste` | L11197 |
| GET | `/commercial/commande` | L1683 |
| GET | `/commercial/commande-old` | L1680 |
| GET | `/commercial/commandes-validees` | L602 |
| GET | `/commercial/dt` | L1573 |
| GET | `/commercial/dt-liste` | L606 |
| GET | `/commercial/dt-liste` | L11195 |
| GET | `/commercial/offre` | L581 |
| GET | `/commercial/offre-old` | L1655 |
| GET | `/commercial/offre/edit` | L591 |
| GET | `/commercial/offres-liste` | L585 |
| GET | `/commercial/offres-liste` | L11196 |
| GET | `/commercial/references-pieces` | L11207 |
| GET | `/commercial/rentree` | L580 |
| GET | `/commercial/service` | L504 |
| GET | `/dashboard` | L11101 |
| GET | `/dashboard/achats` | L11104 |
| GET | `/dashboard/be` | L11103 |
| GET | `/dashboard/commercial` | L11102 |
| GET | `/dashboard/direction` | L11112 |
| GET | `/dashboard/environnement` | L11114 |
| GET | `/dashboard/expedition` | L11108 |
| GET | `/dashboard/finance` | L11115 |
| GET | `/dashboard/fournisseurs` | L11117 |
| GET | `/dashboard/maintenance` | L11109 |
| GET | `/dashboard/oas` | L11113 |
| GET | `/dashboard/production` | L11106 |
| GET | `/dashboard/programmation` | L11105 |
| GET | `/dashboard/qualite` | L11107 |
| GET | `/dashboard/rh` | L11111 |
| GET | `/dashboard/stock` | L11116 |
| GET | `/qualite/8d` | L10083 |
| GET | `/qualite/anomalie` | L10057 |
| GET | `/qualite/audit-9001` | L11531 |
| GET | `/qualite/audit-en9100` | L11590 |
| GET | `/qualite/ecme` | L10696 |
| GET | `/qualite/liberation` | L10672 |
| GET | `/qualite/nc-liste` | L11199 |
| GET | `/qualite/perishables` | L11643 |
| GET | `/qualite/pv` | L10646 |
| GET | `/qualite/service` | L8324 |
| GET | `/rh/competences` | L9537 |
| GET | `/rh/conge` | L10777 |
| GET | `/rh/conge-liste` | L11204 |
| GET | `/rh/employes` | L9513 |
| GET | `/rh/habilitations` | L9529 |
| GET | `/rh/organigramme` | L9525 |
| GET | `/rh/pointage` | L9994 |
| GET | `/rh/pointage` | L10806 |
| GET | `/rh/service` | L9508 |
| GET | `/rh/temps` | L9981 |
| GET | `/achats/da-auto` | L8123 |
| GET | `/achats/da-liste` | L11198 |
| GET | `/achats/demande` | L5985 |
| GET | `/achats/fournisseur` | L6036 |
| GET | `/achats/fournisseur/:id` | L1946 |
| GET | `/achats/fournisseurs-st` | L11206 |
| GET | `/achats/reception` | L6012 |
| GET | `/achats/service` | L1751 |
| GET | `/achats/sous-traitant/:id` | L1956 |
| GET | `/be/analyse` | L4843 |
| GET | `/be/ged` | L5959 |
| GET | `/be/preparation` | L5725 |
| GET | `/be/references-pieces` | L11208 |
| GET | `/be/service` | L3508 |
| GET | `/stock` | L11712 |
| GET | `/stock/alertes` | L11715 |
| GET | `/stock/entrees` | L11713 |
| GET | `/stock/service` | L9232 |
| GET | `/stock/sorties` | L11714 |
| GET | `/oas/balancelles` | L11318 |
| GET | `/oas/rejets-eau` | L11406 |
| GET | `/oas/service` | L8281 |
| GET | `/oas/session` | L8293 |
| GET | `/maintenance/intervention` | L10749 |
| GET | `/maintenance/liste` | L11203 |
| GET | `/maintenance/mtbf` | L11110 |
| GET | `/maintenance/service` | L9273 |
| GET | `/finances/couts` | L11723 |
| GET | `/finances/imputations` | L11726 |
| GET | `/finances/machines` | L11725 |
| GET | `/finances/taux` | L11724 |
| GET | `/expedition/bl` | L10722 |
| GET | `/expedition/bl-liste` | L11200 |
| GET | `/expedition/envoi-client` | L11274 |
| GET | `/manuels` | L306 |
| GET | `/manuels/:slug` | L310 |
| GET | `/securite/chimique/:id` | L8664 |
| GET | `/securite/service` | L8561 |
| GET | `/direction/service` | L10841 |
| GET | `/direction/validation` | L11057 |
| GET | `/comptabilite/dashboard` | L12018 |
| GET | `/comptabilite/factures` | L12019 |
| GET | `/login` | L225 |
| GET | `/logout` | L268 |
| GET | `/` | L348 |
| GET | `/plans/service` | L4338 |
| GET | `/environnement/service` | L8638 |
| GET | `/expeditions/service` | L9107 |
| GET | `/compta/service` | L10040 |
| GET | `/reglages/objectifs` | L11120 |
