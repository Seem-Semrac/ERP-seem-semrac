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
| PATCH | `/api/production/bds/:id` | L6686 |
| POST | `/api/production/bds/:id/envoyer` | L6749 |
| POST | `/api/production/bds/:id/retour` | L6751 |
| POST | `/api/production/bdt/:id/affecter` | L7105 |
| POST | `/api/production/bdt/:id/deprogrammer` | L7180 |
| POST | `/api/production/bdt/:id/recoller` | L7456 |
| POST | `/api/production/bdt/:id/recu` | L7619 |
| POST | `/api/production/bdt/:id/separer` | L7204 |
| POST | `/api/production/bdt/:id/solder` | L7686 |
| GET | `/api/production/bdt/:id/temps` | L7392 |
| POST | `/api/production/bdt/reglage/reconstituer` | L7562 |
| POST | `/api/production/bdts` | L6641 |
| PATCH | `/api/production/bdts/:id` | L6607 |
| POST | `/api/production/bst/:id/affecter-st` | L7925 |
| POST | `/api/production/bst/affecter` | L7868 |
| POST | `/api/production/conge/:id/valider` | L10426 |
| POST | `/api/production/demande-achat-operateur` | L2281 |
| POST | `/api/production/machine` | L7987 |
| DELETE | `/api/production/machine/:id` | L8094 |
| PATCH | `/api/production/machine/:id` | L8062 |
| POST | `/api/production/machine/:id/panne` | L9801 |
| POST | `/api/production/machine/:id/reparer` | L9808 |
| POST | `/api/production/machine/reorder` | L7052 |
| POST | `/api/production/nc` | L2319 |
| POST | `/api/production/non-conformites` | L6753 |
| POST | `/api/production/poste` | L7063 |
| DELETE | `/api/production/poste/:id` | L7084 |
| PATCH | `/api/production/poste/:id` | L7075 |
| POST | `/api/production/poste/reorder` | L7096 |
| DELETE | `/api/production/presence` | L8155 |
| GET | `/api/production/presence` | L8123 |
| POST | `/api/production/presence` | L8134 |
| POST | `/api/production/process` | L6992 |
| DELETE | `/api/production/process/:id` | L7037 |
| PATCH | `/api/production/process/:id` | L7016 |
| POST | `/api/production/process/reorder` | L7045 |
| POST | `/api/production/sortie-matiere` | L8436 |

### api/qualite

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/qualite/capabilite` | L9474 |
| DELETE | `/api/qualite/capabilite/:id` | L9503 |
| POST | `/api/qualite/derogation` | L8970 |
| PATCH | `/api/qualite/derogation/:id` | L8984 |
| POST | `/api/qualite/derogation/:id/traiter-refus` | L10745 |
| POST | `/api/qualite/ecme` | L9311 |
| DELETE | `/api/qualite/ecme/:id` | L9350 |
| PATCH | `/api/qualite/ecme/:id` | L9323 |
| POST | `/api/qualite/ecme/:id/etalonner` | L9337 |
| GET | `/api/qualite/ecme/:id/fiche-vie.pdf` | L9399 |
| POST | `/api/qualite/ecme/:id/verification` | L9356 |
| DELETE | `/api/qualite/ecme/verification/:vid` | L9393 |
| PATCH | `/api/qualite/ecme/verification/:vid` | L9385 |
| POST | `/api/qualite/lot/:id/liberer` | L6834 |
| POST | `/api/qualite/nc/:id/quarantaine` | L10801 |
| POST | `/api/qualite/nc/:id/traiter-retour` | L10685 |
| PATCH | `/api/qualite/non-conformites/:id` | L10662 |
| POST | `/api/qualite/perissable` | L8825 |
| DELETE | `/api/qualite/perissable/:id` | L8839 |
| PATCH | `/api/qualite/perissable/:id` | L8833 |
| POST | `/api/qualite/perissable/:id/sortie` | L8845 |
| POST | `/api/qualite/plan-controle` | L8864 |
| DELETE | `/api/qualite/plan-controle/:id` | L8882 |
| PATCH | `/api/qualite/plan-controle/:id` | L8873 |
| POST | `/api/qualite/quarantaine/:id/decision-fournisseur` | L10904 |
| POST | `/api/qualite/quarantaine/:id/statuer` | L10820 |
| POST | `/api/qualite/rapports-8d` | L10618 |
| PATCH | `/api/qualite/rapports-8d/:id` | L10643 |

### api/achats

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/achats/avoirs-fournisseurs` | L1841 |
| POST | `/api/achats/avoirs-fournisseurs/:id/annuler` | L1941 |
| POST | `/api/achats/avoirs-fournisseurs/:id/imputer` | L1901 |
| POST | `/api/achats/avoirs-fournisseurs/:id/recu` | L1876 |
| POST | `/api/achats/bc` | L2639 |
| POST | `/api/achats/bc/:id/certificat-matiere` | L4194 |
| POST | `/api/achats/da` | L2203 |
| PATCH | `/api/achats/da/:id` | L2440 |
| POST | `/api/achats/da/:id/defusionner` | L2576 |
| POST | `/api/achats/da/:id/editer` | L2459 |
| POST | `/api/achats/da/:id/masquer` | L2490 |
| POST | `/api/achats/da/:id/soumettre` | L2685 |
| POST | `/api/achats/da/fusionner` | L2517 |
| POST | `/api/achats/da/regrouper` | L2607 |
| POST | `/api/achats/fournisseur` | L2074 |
| POST | `/api/achats/sous-traitant` | L2096 |

### api/audit

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/audit/constat-to-nc` | L8939 |
| POST | `/api/audit/fai` | L8935 |
| DELETE | `/api/audit/fai/:id` | L8937 |
| PATCH | `/api/audit/fai/:id` | L8936 |
| POST | `/api/audit/grille` | L8927 |
| DELETE | `/api/audit/grille/:id` | L8929 |
| PATCH | `/api/audit/grille/:id` | L8928 |
| GET | `/api/audit/grille/:id/vierge.pdf` | L4158 |
| POST | `/api/audit/programme` | L8900 |
| DELETE | `/api/audit/programme/:id` | L8912 |
| PATCH | `/api/audit/programme/:id` | L8906 |
| GET | `/api/audit/programme/:id/rapport.pdf` | L4128 |
| POST | `/api/audit/programme/reconduire` | L8918 |
| POST | `/api/audit/question` | L8931 |
| DELETE | `/api/audit/question/:id` | L8933 |
| PATCH | `/api/audit/question/:id` | L8932 |

### api/rh

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/rh/certification` | L10261 |
| DELETE | `/api/rh/certification/:id` | L10291 |
| PATCH | `/api/rh/certification/:id` | L10281 |
| POST | `/api/rh/competence` | L10022 |
| POST | `/api/rh/conge` | L10299 |
| POST | `/api/rh/conge/:id/valider` | L10407 |
| GET | `/api/rh/export-silae` | L10161 |
| POST | `/api/rh/pointage` | L10476 |
| POST | `/api/rh/salarie` | L10106 |
| DELETE | `/api/rh/salarie/:id` | L10244 |
| PATCH | `/api/rh/salarie/:id` | L10194 |

### api/offre

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/offre/:id` | L1341 |
| PATCH | `/api/offre/:id` | L1264 |
| POST | `/api/offre/:id/accepter` | L1179 |
| GET | `/api/offre/:id/devis` | L854 |
| POST | `/api/offre/:id/envoyer` | L826 |
| POST | `/api/offre/:id/negocier` | L901 |
| POST | `/api/offre/:id/pricing` | L1290 |
| POST | `/api/offre/:id/refuser` | L892 |
| POST | `/api/offre/:id/valider` | L844 |

### api/expeditions

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/expeditions/bc/:id/date-arrivee` | L3319 |
| POST | `/api/expeditions/bc/:id/pv` | L3341 |
| POST | `/api/expeditions/bc/:id/receptionner` | L3073 |
| POST | `/api/expeditions/bds/:id/envoyer` | L6748 |
| POST | `/api/expeditions/bds/:id/retour` | L6750 |
| POST | `/api/expeditions/bl-partiel` | L3551 |
| POST | `/api/expeditions/bl/:id/reception-infos` | L3190 |
| POST | `/api/expeditions/retour-client/:ncId/receptionner` | L3220 |
| POST | `/api/expeditions/retour-fournisseur/:qid/expedie` | L3532 |

### api/demandes-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/demandes-prix` | L3986 |
| DELETE | `/api/demandes-prix/:id` | L4287 |
| GET | `/api/demandes-prix/:id` | L4223 |
| POST | `/api/demandes-prix/:id/envoyer` | L4231 |
| GET | `/api/demandes-prix/:id/pdf` | L4078 |
| POST | `/api/demandes-prix/:id/reponses` | L4238 |
| POST | `/api/demandes-prix/:id/valider` | L4258 |
| POST | `/api/demandes-prix/grouped` | L4016 |

### api/nomenclature

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/nomenclature` | L4965 |
| DELETE | `/api/nomenclature/:id` | L5204 |
| PUT | `/api/nomenclature/:id` | L5048 |
| GET | `/api/nomenclature/:id/fournitures` | L4336 |
| GET | `/api/nomenclature/:id/journal` | L4320 |
| POST | `/api/nomenclature/:id/nouvel-indice` | L5160 |
| POST | `/api/nomenclature/:id/prepa-validee` | L11689 |
| POST | `/api/nomenclature/:id/programmes` | L5129 |

### api/maintenance

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/maintenance/om` | L9814 |
| PATCH | `/api/maintenance/om/:id` | L9880 |
| POST | `/api/maintenance/om/:id/cloturer` | L9892 |
| POST | `/api/maintenance/piece` | L9909 |
| DELETE | `/api/maintenance/piece/:id` | L9938 |
| PATCH | `/api/maintenance/piece/:id` | L9926 |
| POST | `/api/maintenance/preventif/generer` | L9876 |

### api/plans

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/plans` | L4773 |
| PATCH | `/api/plans/:id` | L4781 |
| GET | `/api/plans/:id/marqueurs` | L4789 |
| POST | `/api/plans/:id/marqueurs` | L4792 |
| POST | `/api/plans/entity` | L4818 |
| DELETE | `/api/plans/marqueur/:id` | L4810 |

### api/dt

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/dt` | L710 |
| GET | `/api/dt/:id` | L682 |
| PUT | `/api/dt/:id` | L752 |
| POST | `/api/dt/:id/analyse` | L1449 |
| POST | `/api/dt/:id/valider` | L1424 |

### api/be

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/be/analyse-dt/:id` | L4346 |
| POST | `/api/be/analyse-dt/:id/etapes-libres` | L4532 |
| POST | `/api/be/analyse-dt/:id/generer-bdt` | L4575 |
| GET | `/api/be/noms-signature` | L2835 |
| GET | `/api/be/refs` | L4312 |

### api/produits-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/produits-fournisseurs` | L3925 |
| DELETE | `/api/produits-fournisseurs/:id` | L3979 |
| PUT | `/api/produits-fournisseurs/:id` | L3950 |
| POST | `/api/produits-fournisseurs/purge` | L4300 |
| GET | `/api/produits-fournisseurs/sans-prix` | L4294 |

### api/ged

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/ged/:id` | L4726 |
| GET | `/api/ged/file/:id` | L4707 |
| GET | `/api/ged/nomenclature/:id` | L4693 |
| GET | `/api/ged/ref/:ref` | L4697 |
| POST | `/api/ged/upload` | L4650 |

### api/oas

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/oas/balancelle` | L8258 |
| PATCH | `/api/oas/balancelle/:id` | L8424 |
| POST | `/api/oas/balancelle/:id/cloturer` | L7795 |
| POST | `/api/oas/releve-bain` | L8360 |
| POST | `/api/oas/releve-eau` | L8311 |

### api/clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/clients` | L649 |
| DELETE | `/api/clients/:id` | L667 |
| PATCH | `/api/clients/:id` | L657 |
| GET | `/api/clients/search` | L627 |

### api/locks

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/locks/acquire` | L2784 |
| POST | `/api/locks/heartbeat` | L2804 |
| POST | `/api/locks/release` | L2816 |
| GET | `/api/locks/status` | L2825 |

### api/bc

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/bc/:id/accuse` | L4174 |
| POST | `/api/bc/:id/date-arrivee` | L3320 |
| GET | `/api/bc/:id/pdf` | L4101 |
| POST | `/api/bc/:id/relance` | L4182 |

### api/interlocuteurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/interlocuteurs` | L8209 |
| POST | `/api/interlocuteurs` | L8217 |
| DELETE | `/api/interlocuteurs/:id` | L8249 |
| PATCH | `/api/interlocuteurs/:id` | L8237 |

### api/securite

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/securite/` | L9128 |
| PATCH | `/api/securite/` | L9121 |
| POST | `/api/securite/` | L9114 |
| POST | `/api/securite/duer/cloner-annee` | L9146 |

### api/references-clients

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/references-clients` | L791 |
| POST | `/api/references-clients` | L800 |
| DELETE | `/api/references-clients/:id` | L814 |

### api/credits

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/credits` | L1350 |
| DELETE | `/api/credits/:id` | L1414 |
| PATCH | `/api/credits/:id` | L1393 |

### api/export

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/export/clients.xlsx` | L6909 |
| GET | `/api/export/fournisseurs.xlsx` | L6878 |
| GET | `/api/export/seirich.xlsx` | L6931 |

### api/environnement

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/environnement/diagnostic-iso/init` | L9268 |
| POST | `/api/environnement/diagnostic-iso26000/init` | L9282 |
| POST | `/api/environnement/perissables-expires/declarer` | L9173 |

### api/direction

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/direction/jalon-traite` | L11490 |
| POST | `/api/direction/scan-alertes` | L11399 |
| GET | `/api/direction/source` | L11523 |

### api/quarantaine

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/quarantaine/:id/liberer` | L1242 |
| POST | `/api/quarantaine/:id/rejeter` | L1252 |

### api/fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/fournisseurs/:id` | L2024 |
| PATCH | `/api/fournisseurs/:id` | L1988 |

### api/sous-traitants

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/sous-traitants/:id` | L2029 |
| PATCH | `/api/sous-traitants/:id` | L2005 |

### api/factures

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/factures/:id` | L3655 |
| POST | `/api/factures/:id/valider-paiement` | L3704 |

### api/factures-fournisseur

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/factures-fournisseur` | L3719 |
| PATCH | `/api/factures-fournisseur/:id` | L3759 |

### api/planning

| Méthode | Chemin | index.tsx |
|---|---|---|
| DELETE | `/api/planning/affectation-poste` | L8193 |
| POST | `/api/planning/affectation-poste` | L8169 |

### api/controles

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/controles/cote` | L9510 |
| DELETE | `/api/controles/cote/:id` | L9535 |

### api/validations

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/validations` | L11448 |
| POST | `/api/validations/:id/decision` | L11460 |

### api/kpi-objectifs

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/kpi-objectifs` | L11648 |
| DELETE | `/api/kpi-objectifs/:id` | L11660 |

### api/login

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/login` | L249 |

### api/version

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/version` | L287 |

### api/me

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/me` | L300 |

### api/contact

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/contact` | L558 |

### api/catalogue-fournisseurs

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/catalogue-fournisseurs` | L2037 |

### api/commandes

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes/:id/generer-da` | L3805 |

### api/produit-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/produit-prix` | L3903 |

### api/ref-prix

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/ref-prix/:reference` | L3913 |

### api/atex

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/atex/:id/drpce.pdf` | L9203 |

### api/stock

| Méthode | Chemin | index.tsx |
|---|---|---|
| PATCH | `/api/stock/:id/seuils` | L9686 |

### api/commande

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/commande/:id/detail` | L9734 |

### api/compta

| Méthode | Chemin | index.tsx |
|---|---|---|
| GET | `/api/compta/export-fec` | L10178 |

### api/pointage

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/pointage/demande-conge` | L10322 |

### api/commandes-p

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/commandes-p/:id/lancer` | L11067 |

### api/prepa-technique

| Méthode | Chemin | index.tsx |
|---|---|---|
| POST | `/api/prepa-technique/:id/statut` | L11734 |

<!-- manuel:contrats -->
## Contrats détaillés (écrits à la main)

Bloc conservé par `gen_api_ref.mjs` : les tableaux ci-dessus sont régénérés, ce bloc ne l'est pas.

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
| GET | `/production/affectation` | L6509 |
| GET | `/production/bdt` | L8562 |
| GET | `/production/bdt-liste` | L11677 |
| GET | `/production/bdts-a-programmer` | L11745 |
| GET | `/production/commande/:id` | L8500 |
| GET | `/production/commandes` | L8491 |
| GET | `/production/competences` | L6510 |
| GET | `/production/dashboard-production` | L8550 |
| GET | `/production/dashboard-programmation` | L8549 |
| GET | `/production/fiches-suivi` | L8556 |
| GET | `/production/gantt-bdt` | L8479 |
| GET | `/production/gantt-bst` | L8487 |
| GET | `/production/habilitations` | L12306 |
| GET | `/production/horaires` | L6511 |
| GET | `/production/lot-liste` | L11678 |
| GET | `/production/lot/:id` | L8516 |
| GET | `/production/lots` | L8495 |
| GET | `/production/matricule` | L8554 |
| GET | `/production/non-faits` | L8555 |
| GET | `/production/operateur` | L6512 |
| GET | `/production/ordonnancement` | L6471 |
| GET | `/production/pilotage` | L8655 |
| GET | `/production/planning` | L6594 |
| GET | `/production/pointage` | L8553 |
| GET | `/production/service` | L6515 |
| GET | `/production/soustraitance` | L8628 |
| GET | `/production/st-liste` | L8557 |
| GET | `/production/suivi-st` | L8558 |
| GET | `/commercial/affaire/:num` | L541 |
| GET | `/commercial/avoirs` | L624 |
| GET | `/commercial/avoirs-liste` | L11681 |
| GET | `/commercial/client/:id` | L529 |
| GET | `/commercial/cmd-liste` | L11673 |
| GET | `/commercial/commande` | L1697 |
| GET | `/commercial/commande-old` | L1694 |
| GET | `/commercial/commandes-validees` | L616 |
| GET | `/commercial/dt` | L1587 |
| GET | `/commercial/dt-liste` | L620 |
| GET | `/commercial/dt-liste` | L11671 |
| GET | `/commercial/offre` | L595 |
| GET | `/commercial/offre-old` | L1669 |
| GET | `/commercial/offre/edit` | L605 |
| GET | `/commercial/offres-liste` | L599 |
| GET | `/commercial/offres-liste` | L11672 |
| GET | `/commercial/references-pieces` | L11683 |
| GET | `/commercial/rentree` | L594 |
| GET | `/commercial/service` | L518 |
| GET | `/dashboard` | L11577 |
| GET | `/dashboard/achats` | L11580 |
| GET | `/dashboard/be` | L11579 |
| GET | `/dashboard/commercial` | L11578 |
| GET | `/dashboard/direction` | L11588 |
| GET | `/dashboard/environnement` | L11590 |
| GET | `/dashboard/expedition` | L11584 |
| GET | `/dashboard/finance` | L11591 |
| GET | `/dashboard/fournisseurs` | L11593 |
| GET | `/dashboard/maintenance` | L11585 |
| GET | `/dashboard/oas` | L11589 |
| GET | `/dashboard/production` | L11582 |
| GET | `/dashboard/programmation` | L11581 |
| GET | `/dashboard/qualite` | L11583 |
| GET | `/dashboard/rh` | L11587 |
| GET | `/dashboard/stock` | L11592 |
| GET | `/qualite/8d` | L10558 |
| GET | `/qualite/anomalie` | L10532 |
| GET | `/qualite/audit-9001` | L12007 |
| GET | `/qualite/audit-en9100` | L12066 |
| GET | `/qualite/ecme` | L11172 |
| GET | `/qualite/liberation` | L11148 |
| GET | `/qualite/nc-liste` | L11675 |
| GET | `/qualite/perishables` | L12119 |
| GET | `/qualite/pv` | L11122 |
| GET | `/qualite/service` | L8761 |
| GET | `/rh/competences` | L10005 |
| GET | `/rh/conge` | L11253 |
| GET | `/rh/conge-liste` | L11680 |
| GET | `/rh/employes` | L9981 |
| GET | `/rh/habilitations` | L9997 |
| GET | `/rh/organigramme` | L9993 |
| GET | `/rh/pointage` | L10469 |
| GET | `/rh/pointage` | L11282 |
| GET | `/rh/service` | L9976 |
| GET | `/rh/temps` | L10456 |
| GET | `/achats/da-auto` | L8560 |
| GET | `/achats/da-liste` | L11674 |
| GET | `/achats/demande` | L6392 |
| GET | `/achats/fournisseur` | L6443 |
| GET | `/achats/fournisseur/:id` | L1966 |
| GET | `/achats/fournisseurs-st` | L11682 |
| GET | `/achats/reception` | L6419 |
| GET | `/achats/service` | L1765 |
| GET | `/achats/sous-traitant/:id` | L1976 |
| GET | `/be/analyse` | L5250 |
| GET | `/be/ged` | L6366 |
| GET | `/be/preparation` | L6132 |
| GET | `/be/references-pieces` | L11684 |
| GET | `/be/service` | L3877 |
| GET | `/stock` | L12188 |
| GET | `/stock/alertes` | L12191 |
| GET | `/stock/entrees` | L12189 |
| GET | `/stock/service` | L9700 |
| GET | `/stock/sorties` | L12190 |
| GET | `/oas/balancelles` | L11794 |
| GET | `/oas/rejets-eau` | L11882 |
| GET | `/oas/service` | L8718 |
| GET | `/oas/session` | L8730 |
| GET | `/maintenance/intervention` | L11225 |
| GET | `/maintenance/liste` | L11679 |
| GET | `/maintenance/mtbf` | L11586 |
| GET | `/maintenance/service` | L9741 |
| GET | `/finances/couts` | L12199 |
| GET | `/finances/imputations` | L12202 |
| GET | `/finances/machines` | L12201 |
| GET | `/finances/taux` | L12200 |
| GET | `/expedition/bl` | L11198 |
| GET | `/expedition/bl-liste` | L11676 |
| GET | `/expedition/envoi-client` | L11750 |
| GET | `/manuels` | L320 |
| GET | `/manuels/:slug` | L324 |
| GET | `/securite/chimique/:id` | L9101 |
| GET | `/securite/service` | L8998 |
| GET | `/direction/service` | L11317 |
| GET | `/direction/validation` | L11533 |
| GET | `/comptabilite/dashboard` | L12494 |
| GET | `/comptabilite/factures` | L12495 |
| GET | `/login` | L238 |
| GET | `/logout` | L281 |
| GET | `/` | L362 |
| GET | `/plans/service` | L4745 |
| GET | `/environnement/service` | L9075 |
| GET | `/expeditions/service` | L9544 |
| GET | `/compta/service` | L10515 |
| GET | `/reglages/objectifs` | L11596 |
