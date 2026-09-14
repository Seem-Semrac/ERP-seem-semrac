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
| PATCH | `/api/production/bds/:id` | L6217 |
| POST | `/api/production/bds/:id/envoyer` | L6280 |
| POST | `/api/production/bds/:id/retour` | L6282 |
| POST | `/api/production/bdt/:id/affecter` | L6630 |
| POST | `/api/production/bdt/:id/deprogrammer` | L6664 |
| POST | `/api/production/bdt/:id/recu` | L6776 |
| POST | `/api/production/bdt/:id/separer` | L6682 |
| POST | `/api/production/bdt/:id/solder` | L6827 |
| POST | `/api/production/bdts` | L6198 |
| PATCH | `/api/production/bdts/:id` | L6188 |
| POST | `/api/production/bst/:id/affecter-st` | L7058 |
| POST | `/api/production/bst/affecter` | L7001 |
| POST | `/api/production/demande-achat-operateur` | L2205 |
| POST | `/api/production/machine` | L7103 |
| DELETE | `/api/production/machine/:id` | L7210 |
| PATCH | `/api/production/machine/:id` | L7178 |
| POST | `/api/production/machine/:id/panne` | L8854 |
| POST | `/api/production/machine/:id/reparer` | L8861 |
| POST | `/api/production/machine/reorder` | L6577 |
| POST | `/api/production/non-conformites` | L6284 |
| POST | `/api/production/operateur-contexte` | L2186 |
| POST | `/api/production/poste` | L6588 |
| DELETE | `/api/production/poste/:id` | L6609 |
| PATCH | `/api/production/poste/:id` | L6600 |
| POST | `/api/production/poste/reorder` | L6621 |
| POST | `/api/production/presence` | L7233 |
| POST | `/api/production/process` | L6517 |
| DELETE | `/api/production/process/:id` | L6562 |
| PATCH | `/api/production/process/:id` | L6541 |
| POST | `/api/production/process/reorder` | L6570 |
| POST | `/api/production/sortie-matiere` | L7520 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L8558 |
| DELETE | `/api/qualite/capabilite/:id` | L8587 |
| POST | `/api/qualite/derogation` | L8054 |
| PATCH | `/api/qualite/derogation/:id` | L8068 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L9733 |
| POST | `/api/qualite/ecme` | L8395 |
| DELETE | `/api/qualite/ecme/:id` | L8434 |
| PATCH | `/api/qualite/ecme/:id` | L8407 |
| POST | `/api/qualite/ecme/:id/etalonner` | L8421 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L8483 |
| POST | `/api/qualite/ecme/:id/verification` | L8440 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L8477 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L8469 |
| POST | `/api/qualite/lot/:id/liberer` | L6359 |
| POST | `/api/qualite/nc/:id/quarantaine` | L9789 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L9673 |
| PATCH | `/api/qualite/non-conformites/:id` | L9650 |
| POST | `/api/qualite/perissable` | L7909 |
| DELETE | `/api/qualite/perissable/:id` | L7923 |
| PATCH | `/api/qualite/perissable/:id` | L7917 |
| POST | `/api/qualite/perissable/:id/sortie` | L7929 |
| POST | `/api/qualite/plan-controle` | L7948 |
| DELETE | `/api/qualite/plan-controle/:id` | L7966 |
| PATCH | `/api/qualite/plan-controle/:id` | L7957 |
| POST | `/api/qualite/quarantaine/:id/decision-fournisseur` | L9892 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L9808 |
| POST | `/api/qualite/rapports-8d` | L9606 |
| PATCH | `/api/qualite/rapports-8d/:id` | L9631 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L8023 |
| POST | `/api/audit/fai` | L8019 |
| DELETE | `/api/audit/fai/:id` | L8021 |
| PATCH | `/api/audit/fai/:id` | L8020 |
| POST | `/api/audit/grille` | L8011 |
| DELETE | `/api/audit/grille/:id` | L8013 |
| PATCH | `/api/audit/grille/:id` | L8012 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L3759 |
| POST | `/api/audit/programme` | L7984 |
| DELETE | `/api/audit/programme/:id` | L7996 |
| PATCH | `/api/audit/programme/:id` | L7990 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L3729 |
| POST | `/api/audit/programme/reconduire` | L8002 |
| POST | `/api/audit/question` | L8015 |
| DELETE | `/api/audit/question/:id` | L8017 |
| PATCH | `/api/audit/question/:id` | L8016 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/avoirs-fournisseurs` | L1796 |
| POST | `/api/achats/avoirs-fournisseurs/:id/annuler` | L1896 |
| POST | `/api/achats/avoirs-fournisseurs/:id/imputer` | L1856 |
| POST | `/api/achats/avoirs-fournisseurs/:id/recu` | L1831 |
| POST | `/api/achats/bc` | L2488 |
| POST | `/api/achats/da` | L2158 |
| PATCH | `/api/achats/da/:id` | L2289 |
| POST | `/api/achats/da/:id/defusionner` | L2425 |
| POST | `/api/achats/da/:id/editer` | L2308 |
| POST | `/api/achats/da/:id/masquer` | L2339 |
| POST | `/api/achats/da/:id/soumettre` | L2525 |
| POST | `/api/achats/da/fusionner` | L2366 |
| POST | `/api/achats/da/regrouper` | L2456 |
| POST | `/api/achats/fournisseur` | L2029 |
| POST | `/api/achats/sous-traitant` | L2051 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L9307 |
| DELETE | `/api/rh/certification/:id` | L9337 |
| PATCH | `/api/rh/certification/:id` | L9327 |
| POST | `/api/rh/competence` | L9075 |
| POST | `/api/rh/conge` | L9345 |
| POST | `/api/rh/conge/:id/valider` | L9392 |
| GET | `/api/rh/export-silae` | L9214 |
| POST | `/api/rh/pointage` | L9464 |
| POST | `/api/rh/salarie` | L9159 |
| DELETE | `/api/rh/salarie/:id` | L9290 |
| PATCH | `/api/rh/salarie/:id` | L9247 |

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
| POST | `/api/expeditions/bc/:id/date-arrivee` | L3016 |
| POST | `/api/expeditions/bc/:id/pv` | L3020 |
| POST | `/api/expeditions/bc/:id/receptionner` | L2849 |
| POST | `/api/expeditions/bds/:id/envoyer` | L6279 |
| POST | `/api/expeditions/bds/:id/retour` | L6281 |
| POST | `/api/expeditions/bl-partiel` | L3157 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L2917 |
| POST | `/api/expeditions/retour-fournisseur/:qid/expedie` | L3138 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L3592 |
| DELETE | `/api/demandes-prix/:id` | L3855 |
| GET | `/api/demandes-prix/:id` | L3791 |
| POST | `/api/demandes-prix/:id/envoyer` | L3799 |
| GET | `/api/demandes-prix/:id/pdf` | L3684 |
| POST | `/api/demandes-prix/:id/reponses` | L3806 |
| POST | `/api/demandes-prix/:id/valider` | L3826 |
| POST | `/api/demandes-prix/grouped` | L3622 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L4555 |
| DELETE | `/api/nomenclature/:id` | L4794 |
| PUT | `/api/nomenclature/:id` | L4638 |
| GET | `/api/nomenclature/:id/fournitures` | L3904 |
| GET | `/api/nomenclature/:id/journal` | L3888 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L4750 |
| POST | `/api/nomenclature/:id/prepa-validee` | L10673 |
| POST | `/api/nomenclature/:id/programmes` | L4719 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L8867 |
| PATCH | `/api/maintenance/om/:id` | L8933 |
| POST | `/api/maintenance/om/:id/cloturer` | L8945 |
| POST | `/api/maintenance/piece` | L8962 |
| DELETE | `/api/maintenance/piece/:id` | L8991 |
| PATCH | `/api/maintenance/piece/:id` | L8979 |
| POST | `/api/maintenance/preventif/generer` | L8929 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L4363 |
| PATCH | `/api/plans/:id` | L4371 |
| GET | `/api/plans/:id/marqueurs` | L4379 |
| POST | `/api/plans/:id/marqueurs` | L4382 |
| POST | `/api/plans/entity` | L4408 |
| DELETE | `/api/plans/marqueur/:id` | L4400 |

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
| GET | `/api/be/analyse-dt/:id` | L3938 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L4124 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L4167 |
| GET | `/api/be/noms-signature` | L2666 |
| GET | `/api/be/refs` | L3880 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L3531 |
| DELETE | `/api/produits-fournisseurs/:id` | L3585 |
| PUT | `/api/produits-fournisseurs/:id` | L3556 |
| POST | `/api/produits-fournisseurs/purge` | L3868 |
| GET | `/api/produits-fournisseurs/sans-prix` | L3862 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L4316 |
| GET | `/api/ged/file/:id` | L4297 |
| GET | `/api/ged/nomenclature/:id` | L4283 |
| GET | `/api/ged/ref/:ref` | L4287 |
| POST | `/api/ged/upload` | L4240 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L7342 |
| PATCH | `/api/oas/balancelle/:id` | L7508 |
| POST | `/api/oas/balancelle/:id/cloturer` | L6928 |
| POST | `/api/oas/releve-bain` | L7444 |
| POST | `/api/oas/releve-eau` | L7395 |

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
| POST | `/api/locks/acquire` | L2615 |
| POST | `/api/locks/heartbeat` | L2635 |
| POST | `/api/locks/release` | L2647 |
| GET | `/api/locks/status` | L2656 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L3775 |
| POST | `/api/bc/:id/date-arrivee` | L3017 |
| GET | `/api/bc/:id/pdf` | L3707 |
| POST | `/api/bc/:id/relance` | L3783 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L7293 |
| POST | `/api/interlocuteurs` | L7301 |
| DELETE | `/api/interlocuteurs/:id` | L7333 |
| PATCH | `/api/interlocuteurs/:id` | L7321 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L8212 |
| PATCH | `/api/securite/` | L8205 |
| POST | `/api/securite/` | L8198 |
| POST | `/api/securite/duer/cloner-annee` | L8230 |

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
| GET | `/api/export/clients.xlsx` | L6434 |
| GET | `/api/export/fournisseurs.xlsx` | L6403 |
| GET | `/api/export/seirich.xlsx` | L6456 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L8352 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L8366 |
| POST | `/api/environnement/perissables-expires/declarer` | L8257 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L10474 |
| POST | `/api/direction/scan-alertes` | L10383 |
| GET | `/api/direction/source` | L10507 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1203 |
| POST | `/api/quarantaine/:id/rejeter` | L1213 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L1979 |
| PATCH | `/api/fournisseurs/:id` | L1943 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L1984 |
| PATCH | `/api/sous-traitants/:id` | L1960 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L3261 |
| POST | `/api/factures/:id/valider-paiement` | L3310 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L3325 |
| PATCH | `/api/factures-fournisseur/:id` | L3365 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L7277 |
| POST | `/api/planning/affectation-poste` | L7253 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L8594 |
| DELETE | `/api/controles/cote/:id` | L8619 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L10432 |
| POST | `/api/validations/:id/decision` | L10444 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L10632 |
| DELETE | `/api/kpi-objectifs/:id` | L10644 |

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
| GET | `/api/catalogue-fournisseurs` | L1992 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L3411 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L3509 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L3519 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L8287 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/seuils` | L8739 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L8787 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L9231 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L9368 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L10054 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L10718 |

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
| GET | `/production/affectation` | L6099 |
| GET | `/production/bdt` | L7646 |
| GET | `/production/bdt-liste` | L10661 |
| GET | `/production/bdts-a-programmer` | L10729 |
| GET | `/production/commande/:id` | L7584 |
| GET | `/production/commandes` | L7575 |
| GET | `/production/competences` | L6100 |
| GET | `/production/dashboard-production` | L7634 |
| GET | `/production/dashboard-programmation` | L7633 |
| GET | `/production/fiches-suivi` | L7640 |
| GET | `/production/gantt-bdt` | L7563 |
| GET | `/production/gantt-bst` | L7571 |
| GET | `/production/habilitations` | L11290 |
| GET | `/production/horaires` | L6101 |
| GET | `/production/lot-liste` | L10662 |
| GET | `/production/lot/:id` | L7600 |
| GET | `/production/lots` | L7579 |
| GET | `/production/matricule` | L7638 |
| GET | `/production/non-faits` | L7639 |
| GET | `/production/operateur` | L6102 |
| GET | `/production/ordonnancement` | L6061 |
| GET | `/production/pilotage` | L7739 |
| GET | `/production/planning` | L6182 |
| GET | `/production/pointage` | L7637 |
| GET | `/production/service` | L6105 |
| GET | `/production/soustraitance` | L7712 |
| GET | `/production/st-liste` | L7641 |
| GET | `/production/suivi-st` | L7642 |
| GET | `/commercial/affaire/:num` | L524 |
| GET | `/commercial/avoirs` | L607 |
| GET | `/commercial/avoirs-liste` | L10665 |
| GET | `/commercial/client/:id` | L512 |
| GET | `/commercial/cmd-liste` | L10657 |
| GET | `/commercial/commande` | L1658 |
| GET | `/commercial/commande-old` | L1655 |
| GET | `/commercial/commandes-validees` | L599 |
| GET | `/commercial/dt` | L1548 |
| GET | `/commercial/dt-liste` | L603 |
| GET | `/commercial/dt-liste` | L10655 |
| GET | `/commercial/offre` | L578 |
| GET | `/commercial/offre-old` | L1630 |
| GET | `/commercial/offre/edit` | L588 |
| GET | `/commercial/offres-liste` | L582 |
| GET | `/commercial/offres-liste` | L10656 |
| GET | `/commercial/references-pieces` | L10667 |
| GET | `/commercial/rentree` | L577 |
| GET | `/commercial/service` | L501 |
| GET | `/dashboard` | L10561 |
| GET | `/dashboard/achats` | L10564 |
| GET | `/dashboard/be` | L10563 |
| GET | `/dashboard/commercial` | L10562 |
| GET | `/dashboard/direction` | L10572 |
| GET | `/dashboard/environnement` | L10574 |
| GET | `/dashboard/expedition` | L10568 |
| GET | `/dashboard/finance` | L10575 |
| GET | `/dashboard/fournisseurs` | L10577 |
| GET | `/dashboard/maintenance` | L10569 |
| GET | `/dashboard/oas` | L10573 |
| GET | `/dashboard/production` | L10566 |
| GET | `/dashboard/programmation` | L10565 |
| GET | `/dashboard/qualite` | L10567 |
| GET | `/dashboard/rh` | L10571 |
| GET | `/dashboard/stock` | L10576 |
| GET | `/qualite/8d` | L9546 |
| GET | `/qualite/anomalie` | L9520 |
| GET | `/qualite/audit-9001` | L10991 |
| GET | `/qualite/audit-en9100` | L11050 |
| GET | `/qualite/ecme` | L10156 |
| GET | `/qualite/liberation` | L10132 |
| GET | `/qualite/nc-liste` | L10659 |
| GET | `/qualite/perishables` | L11103 |
| GET | `/qualite/pv` | L10106 |
| GET | `/qualite/service` | L7845 |
| GET | `/rh/competences` | L9058 |
| GET | `/rh/conge` | L10237 |
| GET | `/rh/conge-liste` | L10664 |
| GET | `/rh/employes` | L9034 |
| GET | `/rh/habilitations` | L9050 |
| GET | `/rh/organigramme` | L9046 |
| GET | `/rh/pointage` | L9457 |
| GET | `/rh/pointage` | L10266 |
| GET | `/rh/service` | L9029 |
| GET | `/rh/temps` | L9444 |
| GET | `/achats/da-auto` | L7644 |
| GET | `/achats/da-liste` | L10658 |
| GET | `/achats/demande` | L5982 |
| GET | `/achats/fournisseur` | L6033 |
| GET | `/achats/fournisseur/:id` | L1921 |
| GET | `/achats/fournisseurs-st` | L10666 |
| GET | `/achats/reception` | L6009 |
| GET | `/achats/service` | L1726 |
| GET | `/achats/sous-traitant/:id` | L1931 |
| GET | `/be/analyse` | L4840 |
| GET | `/be/ged` | L5956 |
| GET | `/be/preparation` | L5722 |
| GET | `/be/references-pieces` | L10668 |
| GET | `/be/service` | L3483 |
| GET | `/stock` | L11172 |
| GET | `/stock/alertes` | L11175 |
| GET | `/stock/entrees` | L11173 |
| GET | `/stock/service` | L8753 |
| GET | `/stock/sorties` | L11174 |
| GET | `/oas/balancelles` | L10778 |
| GET | `/oas/rejets-eau` | L10866 |
| GET | `/oas/service` | L7802 |
| GET | `/oas/session` | L7814 |
| GET | `/maintenance/intervention` | L10209 |
| GET | `/maintenance/liste` | L10663 |
| GET | `/maintenance/mtbf` | L10570 |
| GET | `/maintenance/service` | L8794 |
| GET | `/finances/couts` | L11183 |
| GET | `/finances/imputations` | L11186 |
| GET | `/finances/machines` | L11185 |
| GET | `/finances/taux` | L11184 |
| GET | `/expedition/bl` | L10182 |
| GET | `/expedition/bl-liste` | L10660 |
| GET | `/expedition/envoi-client` | L10734 |
| GET | `/manuels` | L303 |
| GET | `/manuels/:slug` | L307 |
| GET | `/securite/chimique/:id` | L8185 |
| GET | `/securite/service` | L8082 |
| GET | `/direction/service` | L10301 |
| GET | `/direction/validation` | L10517 |
| GET | `/comptabilite/dashboard` | L11478 |
| GET | `/comptabilite/factures` | L11479 |
| GET | `/login` | L222 |
| GET | `/logout` | L265 |
| GET | `/` | L345 |
| GET | `/plans/service` | L4335 |
| GET | `/environnement/service` | L8159 |
| GET | `/expeditions/service` | L8628 |
| GET | `/compta/service` | L9503 |
| GET | `/reglages/objectifs` | L10580 |
