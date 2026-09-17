# Module Bureau d'Études

<!-- auto:entete -->
- **Route** : `/be/service` · **Fichier source** : `src/be.tsx`
- **Accès (RBAC)** : écriture — be, achats · lecture — commercial, production, oas, qualité, sécurité, stock, maintenance
<!-- /auto -->

## Mission
<!-- auto:mission -->
Nomenclatures (BOM), analyse des DT, préparation technique, références.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `noms` — Nomenclatures
- `analyse` — Analyse DT
- `prep` — Préparations tech.
- `refs` — Références
- `dashboard` — Dashboard BE
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`be` · `nomenclature` · `produits-fournisseurs` · `ref-prix` · `produit-prix`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`nomenclatures` · `fournitures_nomenclature` · `etapes_production` · `be_refs` · `ref_prix_historique` · `produits_fournisseurs`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Masse en g ; temps en millièmes d'heure ; réglage = coût FIXE/lot ; prix matière auto <3 mois sinon RFQ ; indices A/B/C ; drag-drop des process. Supprimer une nomenclature VALIDÉE exige un MOTIF (sinon 400 motif_requis), inscrit au journal EN 9100 avec l’auteur et la date ; sans le journal en base, la suppression d’une fiche suivie est refusée (409) plutôt que tracée nulle part.
<!-- /auto -->

> ⚠ **Seuil des prix (lot H0, 17/09/2026)** : un prix catalogue est « frais » pendant **6 mois** (`PRIX_VALIDITE_JOURS = 183`,
> `src/shared.ts`), partout (formulaire nomenclature, BE › Références, `GET /api/be/analyse-dt/:id`). La mention « <3 mois » du
> bloc ci-dessus vient du manifeste `scripts_doc/gen_module_fiches.mjs`, pas encore corrigé. Détail : section « Lot H0 » plus bas.

Le formulaire nomenclature est en **deux colonnes** : saisie des champs à gauche (`minmax(340px, 0.78fr)`), déclaration des process et gamme à droite (`minmax(0, 1.22fr)`) — la gamme porte 10 colonnes depuis l'ajout de ROP/RGM et a besoin de la place.

**Deux temps de réglage** depuis le 09/09/2026 — la gamme distingue **ROP** (réglage opérateur) et **RGM** (réglage machine). Les deux restent des **coûts fixes par lot**, jamais multipliés par la quantité. ⚠ **Depuis le 14/09/2026**, ROP compte en **homme** et RGM en **homme + machine** (avant : RGM au taux machine seul) — voir la section « Coût d'une étape » ci-dessous.

| Forme d'étape | ROP | RGM |
|---|---|---|
| Formulaire BE (minutes) | `temps_reglage_min` | `temps_reglage_machine_min` |
| Gamme importée (millièmes) | `temps_reglage_op_mille` | `temps_reglage_machine_mille` |

**Compatibilité ascendante** : si aucun des deux champs n'est renseigné, `etapeDecomp()` retombe sur le champ historique `temps_reglage_mille`, classé **RGM** si le process de l'étape est de type machine, **ROP** sinon (14/09/2026 ; avant : « imputé à la ressource de l'étape »).

## Coût d'une étape : taux porté par le process, homme au coût chargé RH (14/09/2026)

Même règle que le serveur (`etapeDecomp` + `construireTauxAtelier`, `src/shared.ts` — détail et tableau des champs dans [production.md](production.md#coût-horaire-porté-par-le-process-14092026)) :

| Colonne du formulaire | Temps | Homme | Machine |
|---|---|---|---|
| ROP ‰h | réglage homme, / lot | ✔ | — |
| RGM ‰h | réglage machine, / lot | ✔ | ✔ si process machine |
| MO ‰h | homme variable (THV), / pièce | ✔ | — |
| Mach ‰h | machine variable (TMV), / pièce | — | ✔ si process machine |

- **Taux machine** = `process_atelier[].taux_machine` résolu par le serveur (`getBeRefs`), lu en direct ; **taux homme** = `taux_homme` (moyennes du coût chargé RH `{moyen, seem, semrac, manquant}`) pour le site de la nomenclature (`nom.entite`). Plus aucun taux inventé (`TAUX_MO_DEFAULT`, `COUT_MACHINE_DEFAULT`, `TAUX_MO_MOYEN`, `COUT_MACHINE_MOY`, `nomMachCoutH` supprimés). `machines[]` n'expose plus `cout_h` ni `taux_horaire`.
- **Une seule source JS pour le navigateur** : `BE_ETAPE_COUT_JS` (export de `src/be.tsx`, chaîne sans accent grave, sans `${`, sans barre oblique inverse) définit `beTauxAtelierClient(refs)`, `beEtapeDecomp(e, tx, site)` et `beLibelleManquant(code)` ; elle est injectée **telle quelle** dans le formulaire nomenclature **et** dans `/be/analyse`. Parité vérifiée : 11 697 comparaisons navigateur ↔ serveur, écart max 7e-15 €.
- **Indications sous le process** : « Machine · X €/h », « (provisoire) » en transition (`transition_machine`), « Machine · taux à saisir », « Machine · process à choisir », « Manuel · homme au coût chargé RH (X €/h) », « OAS · aucun temps valorisé ». Encart `#nom-taux-alerte` « Coût de revient incomplet » (codes `taux_homme`, `taux_machine`, `sans_process`) ; bandeau d'en-tête « Coût chargé RH moyen Seem / Semrac » et « Process machine sans taux ».
- **Taux illisibles** (`BeRefs.taux_erreur`, lecture des process, salariés ou machines en échec) : bandeau rouge `#nom-taux-erreur` et `nomTauxIllisibles()` **bloque** `nomSave` et `nomCreerNouvelIndice` — le coût recalculé serait faux.
- **Changement de process** (`nomOnEtapeProcessChange`) : ne lit plus `cout_h` ; copies **informatives** `machine_taux_h` (taux du process) et `taux_mo_h` (taux homme du site). Process non machine : RGM reversé dans ROP, TMV dans THV (rien n'est perdu). Une étape importée (millièmes) voit ses minutes **re-déduites avec le nouveau process**. Le changement de **poste** ne convertit plus l'étape et ne remet plus le temps machine à 0.
- **Étape importée modifiée** : passe au format minutes (`nomEtapeEnMinutes`, clés `*_mille` supprimées) à coût constant — sinon la saisie resterait sans effet. Le journal EN 9100 le trace en modification de gamme.
- **Enregistrement** (`nomCollectPayload`) : `taux_mo` = coût chargé RH moyen du site (`null` s'il manque), `cout_machine_h = null`, copies d'étapes rafraîchies. Les prix enregistrés (`prix_revient_unitaire`, `prix_mo_unitaire`, `cout_machine_unitaire`) gardent leur sens.
- **OAS** : en série, max(forfait ; q × prix), comme la sous-traitance (libellé « Sous-traitance · OAS »). ⚠ Défaut connu, non corrigé : le CRU **serveur** (`computeNomCostForQty` → `coutEtapeST`) lit les champs `*_st_*` et compte 0 pour une étape OAS ; et la saisie du prix OAS n'est pas atteignable dans `nomRenderEtapes` (branche « interne » évaluée avant).
- ⚠ **Effet sur les prix** : la nomenclature cloud 7365635125 (Semrac, validée) passe de 9,85 € à 23,58 €/pièce à q = 1 à la réouverture (coût chargé Semrac 35,70 €/h au lieu de la copie 14,52 ; RGM compté en homme ; poinçonnage au taux de départ 35 €/h). Le prix enregistré ne change qu'au prochain enregistrement, qui ajoute des entrées « recalcul » au journal.

- **Tableau de bord BE** (`/dashboard/be`, `kpi.ts` `be()`) : CRU calculés avec `construireTauxAtelier` sur le socle déjà chargé par `getDashboardData` (process, salariés, machines — aucune requête en plus) ; nouveaux champs `coutsIncomplets`, `hommeManquant`, `lignes[].manquants` → tuile « CRU moyen … dont N au coût incomplet (sous-évalué) » et barres orange ⚠ dans « Pièces les plus coûteuses ».

### Analyse DT (`/be/analyse`, `GET /api/be/analyse-dt/:id`)
- Serveur : `getTauxAtelier()` ; lecture en échec ⇒ **503** (on refuse de chiffrer à 0). Étapes ajoutées (« libres ») chiffrées par `etapeDecomp(etapeLibreVersEtape(a), tx, site)` : réglage unique = **RGM**, `mo_min` = THV, `machine_min` = TMV, `prix_forfait` + 1 fois / lot ; une étape libre **sous-traitée** ne valorise aucun temps. Réponse : `taux_mo` / `taux_machine` (45 / 50) **supprimés**, remplacés par `site`, `taux_homme`, `homme_manquant`, `manquants` par pièce et, par étape, `type_process`, `taux_homme`, `taux_machine`, `taux_source`, `manquants`, heures homme/machine (contrat dans `07-api-reference.md`).
- Client : `TX = beTauxAtelierClient(__BE_REFS__)` ; taux homme de la pièce = celui renvoyé par le serveur. `addedCostPc` (variable) / `addedCostFixe` (réglage + forfait). Temps grisés en sous-traitance et sur un process OAS ; temps machine valorisé seulement sur un process machine (un temps déjà saisi reste visible, en orange). Alerte par produit `#gwarn-n`.
- **Chiffrage indisponible** (`beChiffrageKO`) : réponse en erreur (503…), erreur réseau ou `__BE_REFS__.taux_erreur` ⇒ bandeau rouge permanent, bouton d'enregistrement désactivé, `saveAnalyseBE` n'envoie rien.
- `POST /api/be/analyse-dt/:id/etapes-libres` : une liste **vide** n'efface des étapes existantes qu'avec `vider: true` (sinon **409**) — l'écran l'envoie quand l'utilisateur a réellement tout supprimé.
- `pieces_analyse[].cout_mo_ajoute` (part des étapes ajoutées dans `cout_mo`, à sa valeur d'enregistrement) est envoyé et **conservé** par `POST /api/dt/:id/analyse` : à la réouverture, cette part est retirée sans être revalorisée au taux du jour.

**Validation de la préparation technique** : le bouton **« Valider la prépa »** enregistre (plan + codes programme → nomenclature) puis appelle `POST /api/nomenclature/:id/prepa-validee`, qui passe à `faite` toutes les lignes de `preparations_techniques` portant la même référence produit. Le serveur **refuse** la validation si le plan manque ou si une étape CNC n'a pas de code (409) — on n'ouvre pas la porte de production sur une prépa vide.

C'est **l'une des deux conditions d'entrée en production**, l'autre étant la réception matière :
```
bdtsPrets = bdts.filter(b => b.matiere_ok !== false && !affPrepaOpen.has(b.num_affaire))
                              ^ BC du lot reçus            ^ aucune prépa au statut ≠ 'faite'
```
Les informations saisies (n° de plan, fichier, codes programme par étape) sont déjà déversées dans la nomenclature par `POST /api/nomenclature/:id/programmes` — elles sont donc imprimées sur l'OF.

**Préparation technique (`/be/preparation`)** : le plan et les programmes CN se chargent par un **bouton « Parcourir »** (sélecteur de fichier), plus par saisie du nom. Le fichier part en GED — `categorie: plan_cao` pour le plan, `programme_fao` + `etape_ordre` pour un programme —, rattaché à la **nomenclature**, ce qui lève `manque_plan` / `manque_code_cnc` sur la préparation. Le nom du fichier renseigne le champ *Fichier*, et le nom **sans extension** pré-remplit le *N° de plan* / *N° programme* **s'il est encore vide** (une valeur saisie n'est jamais écrasée). Un lien « ouvrir » apparaît sous le champ après l'envoi.

**Enregistrer une nomenclature validée ne la dévalide plus (11/09/2026).** Les deux boutons « Enregistrer » du formulaire appellent `nomSave('en_cours')`. Sur une fiche déjà `valide`, ce statut était écrit tel quel : la nomenclature quittait la liste des faites — l'utilisateur concluait « ça ne s'enregistre pas » — et surtout sortait de la **cascade de production**, qui ne lit que les nomenclatures `valide` (choix du dernier indice validé par référence). Preuve reproduite en base avant correction : `valide` / « note initiale » → `en_cours` / « note modifiée ». Désormais :

- **client** — `nomSave` calcule un statut effectif : une fiche déjà validée reste `valide`, on reste sur le formulaire, message « la nomenclature reste validée » ;
- **serveur** — garde-fou dans `PUT /api/nomenclature/:id` : si la fiche en base est `valide`, tout autre statut reçu est ramené à `valide`. Indispensable, car un onglet resté ouvert sur l'ancienne page envoie encore `en_cours`. Seul un appel explicite `{ devalider: true }` retire la validation. Si la lecture du statut courant échoue, le statut n'est pas modifié du tout — jamais de dévalidation par défaut.

Depuis le 11/09/2026, **toute** modification d'une pièce validée est tracée dans le **journal EN 9100** (section suivante). **« Incrémenter l'indice »** reste le chemin d'une modification de fond : il crée une révision et conserve l'ancienne.

**Le plan s'ouvre là où son nom est écrit (11/09/2026).** Le champ *Nom du fichier CAO* (`plan_fichier`) n'est que du texte ; le fichier vit dans la GED, zone *Plan CAO*, plus bas dans le formulaire. On cherchait le plan là où son nom apparaît, sans pouvoir l'ouvrir. Un lien **« Ouvrir le plan »** est désormais posé sous ce champ (`nomRenderLienPlan()`, appelé par `gedRenderAll()`) : il vise le document GED dont le nom égale `plan_fichier`, à défaut le dernier plan joint. Si seul le nom existe, sans fichier déposé, un message le dit au lieu de laisser croire que le plan est là. `GET /api/ged/file/:id` n'a pas changé : il servait déjà correctement le fichier, vérifié avec et sans authentification.

> Gotcha d'échappement : les boutons utilisent `this.previousElementSibling.click()` et non `getElementById('…')`. Une apostrophe imbriquée dans un `onclick` construit à l'intérieur d'une chaîne JS elle-même dans un template literal se fait manger (`'` → `'`) et casse tout le script client — panne invisible au build comme au typecheck.

## Journal EN 9100 des nomenclatures validées (11/09/2026)

> « Pour l'EN 9100, je veux pouvoir tracer dans les logs toutes les modifications effectuées sur
> une nomenclature déjà validée. »

**Table `nomenclature_journal`** (migration Docker **006**, script cloud
**`docker/db/cloud/cloud-5-nomenclature-journal.sql`**) : une ligne par événement — `evenement` ;
**qui** (`auteur_id`, `auteur_matricule`, `auteur_nom`, `auteur_role`, `auteur_source`) ; **quand**
(`created_at`, **imposé par la base**) ; **quoi** (`changements` : liste de
`{bloc, champ, avant, apres, detail?}`) ; l'identité de la fiche au moment des faits
(`nomenclature_id`, `groupe` = `version_groupe`, `code_ref_produit`, `num_nom`, `indice`, `entite`) ;
`statut_avant` / `statut_apres`, `route`, `lie_a` (révision liée), `instantane_avant` (dévalidation,
suppression).

**En ajout seul, garanti par la base** :
- un déclencheur `before update or delete` refuse toute modification et tout effacement ; un
  déclencheur de niveau instruction refuse le **vidage de table** — tous deux en mode `always`,
  actifs même en mode réplication. Seul le **propriétaire** de la table peut désactiver un
  déclencheur : acte d'administration visible, décrit dans le runbook pour purger un jeu de test ;
- un déclencheur `before insert` **impose l'heure** (`now()`) à toute écriture venue de l'API (clé
  anon, session, clé service) : une entrée ne peut pas être antidatée. Une **restauration** de
  sauvegarde, faite par l'administrateur de la base, garde l'heure d'origine des entrées ;
- droits : lecture et ajout seulement ; fonctions à `search_path` fixé ;
- **aucune clé étrangère** vers `nomenclatures` : le journal survit à la suppression de la fiche.

⚠ Le lanceur `docker/scripts/migrate.sh` refuse tout fichier qui contient le mot-clé de vidage — et
un refus bloque **toutes** les migrations. La clause `before truncate on` d'un déclencheur, qui
l'**interdit**, y est une exception **déclarée** ; le lanceur refuse en revanche toute concaténation
de chaînes littérales (`'dele' || 'te'`), qui servirait à masquer un mot-clé. Il se connecte en
`supabase_admin` (voir `12-docker-installation.md`).

### Quand une fiche est-elle suivie ?

Dès sa **validation** — et elle le **reste** après une dévalidation (`suiviEN9100` : statut `valide`,
ou déjà présente au journal). Sans cela, « dévalider, modifier, revalider » ferait une modification
sans trace. Un brouillon jamais validé n'est pas tracé. Si le journal ne peut pas être lu (table
présente), le suivi est **indéterminé** : l'enregistrement passe et la réponse dit `journal: false`
(orange à l'écran) ; une suppression est refusée (503).

| Événement | Quand | Route |
|---|---|---|
| `creation` | fiche créée directement validée ; révision créée depuis une fiche suivie (avec l'écart par rapport à l'ancienne) | `POST /api/nomenclature`, `POST /:id/nouvel-indice` |
| `validation` | passage au statut `valide`, brouillon écrasé au statut validé compris — référence de départ, avec **instantané** de la définition validée | `PUT /:id`, `POST /api/nomenclature` |
| `modification` | enregistrement d'une fiche suivie **qui change quelque chose** — un ré-enregistrement à l'identique n'écrit rien | `PUT /:id`, `POST` (brouillon suivi) |
| `devalidation` | `{ devalider: true }` explicite — avec **instantané** de la définition validée (fiche + fournitures) | `PUT /:id` |
| `prepa_technique` | programmes CN et plan écrits par la préparation technique | `POST /:id/programmes` |
| `nouvel_indice` | sur l'ancienne fiche, avec le lien vers la révision créée | `POST /:id/nouvel-indice` |
| `document_ajoute` / `document_retire` | plan ou programme joint / retiré dans la GED | `POST /api/ged/upload`, `DELETE /api/ged/:id` |
| `reference_client` | ligne du répertoire réf. interne ↔ client ↔ réf. client ↔ plan client, ajoutée / modifiée / retirée — depuis le formulaire **ou par l'enregistrement d'une DT** ; tracée sur la fiche éditée **et** sur celle que la ligne désigne | `POST` / `DELETE /api/references-clients`, `POST /api/dt`, `PUT /api/dt/:id`, `POST /api/dt/:id/valider` |
| `suppression` | fiche suivie supprimée — **instantané complet** (fiche + fournitures), écrit **avant** l'effacement | `DELETE /:id` |
| `suppression_echouee` | l'effacement a échoué après l'écriture de l'entrée `suppression` (le journal n'accepte que des ajouts) | `DELETE /:id` |

### Calcul des écarts — `src/nomenclature_journal.ts`

Module pur, testé seul. On compare la base **avant** à la base **après** (relue), jamais le corps de
la requête : c'est ce qui est réellement enregistré.

- **On compare tout.** Toute colonne de la fiche (sauf `id`, `created_at`, `updated_at`) et **toute
  clé d'une étape** (sauf `ordre` et les clés techniques `_…`). Une première version listait les
  champs d'étape « à suivre » : le sous-traitant, son opération, son prix et le prix OAS lui
  échappaient. Un champ ajouté plus tard au formulaire est désormais suivi d'office.
- **Valeurs effectives** : groupe vide = la fiche elle-même, indice vide = A (sinon le premier
  enregistrement après validation inventait « Groupe de révisions : ∅ → id »).
- **Normalisation** : `''`, `null`, `0`, `false`, liste vide se valent (l'appli lit partout
  `Number(x) || 0`) ; une chaîne numérique ne devient un nombre que si elle en est l'écriture
  canonique — « 4.10 », « 2.0 », « 0001 » restent du texte, un programme « 4.10 » → « 4.1 » est tracé.
- **Gamme** : alignement **qui respecte l'ordre** (plus longue sous-suite commune pondérée : même
  contenu, puis même nom), puis vrais déplacements, puis remplacement **sur place** (même rang
  entre deux étapes alignées, jamais par-dessus). Deux étapes identiques ne s'échangent pas ; une
  suppression suivie d'un ajout en fin de gamme reste une suppression et un ajout ; une étape insérée donne **un** ajout ; une permutation donne « gamme
  réordonnée ». Un élément ajouté ou retiré garde sa **définition complète** (`detail`).
- **Gammes importées** (millièmes) ou à l'ancien format (`temps_unitaire_min`) : à la 1ʳᵉ ouverture, le formulaire complète les étapes (minutes,
  type, machine, taux) — classé `recalcul`, tracé quand même. Ensuite les minutes sont comparées
  comme toute saisie : ce sont elles que l'OF imprime.
- **Fournitures** : remplacées en bloc avec de nouveaux id, donc appariées par catégorie +
  référence ; toutes leurs colonnes sont comparées.
- **Valeurs recalculées** (coûts, taux, prix par pièce) : bloc `recalcul`, à part des saisies.

### Règles de sûreté

- **Auteur** toujours tiré de la **session**, jamais du corps de la requête. Compte de secours :
  `auteur_source = bootstrap`, **sans matricule** (c'est la moitié de son identifiant de connexion,
  et le journal ne s'efface pas). Sans authentification : `auth_off`.
- **Enregistrement refusé (503)** si l'état « avant » de la fiche est illisible : on ne peut alors ni
  garder le statut validé ni tracer.
- **Statut rendu** : `PUT` et `POST /api/nomenclature` renvoient le statut **effectif** ; le
  formulaire s'y aligne — une fiche validée entre-temps par un collègue reste traitée comme validée
  (bon message, bon badge, et l'avertissement orange si le journal n'a pas pu écrire).
- **Suppression** : entrée `suppression` (avec instantané) écrite **avant** l'effacement ; refus
  (503) si la fiche, ses fournitures ou le journal ne peuvent être lus / écrits ; effacement vérifié
  (lignes réellement supprimées) ; seconde suppression = « déjà supprimée », sans nouvelle entrée.
- **Base sans la table** (cloud tant que `cloud-5` n'est pas joué) : sauvegardes et suppressions
  passent, la réponse porte `journal: false` + `journal_raison: "table_absente — …"`, et **tous les
  écrans appelants** l'affichent en orange (formulaire, suppression simple et groupée, nouvel indice,
  GED, préparation technique, références client).
- **GED** : « est-ce une nomenclature ? » se décide sur la **cible** (pas de préfixe `XX:`, pas une DT
  d'analyse) ; un document déjà retiré n'est pas tracé deux fois ; un retrait qui échoue n'est pas
  tracé.
- **Hors application** : l'import `scripts_import/import_nomenclatures.py` **ignore** les fiches
  suivies — validées ou déjà au journal (il les dévalidait et remplaçait leur gamme hors du
  journal), et lit la base par pages ; le miroir
  `docker/scripts/mirror-cloud.mjs` ne recopie **jamais** `nomenclature_journal` (propre à chaque
  base). Limite assumée : une écriture **directe** en base (Studio, script avec la clé anon) échappe
  au journal applicatif.

**Lecture** : `GET /api/nomenclature/:id/journal?portee=fiche|groupe` (groupe = toutes les révisions
de la pièce ; après la suppression de la fiche, le groupe est retrouvé dans le journal). 500 entrées
au plus, `tronque: true` au-delà (l'écran le signale). Écran : carte **« Journal des modifications ·
EN 9100 »** sous la carte Validation (`nomJournalLoad()` — une réponse arrivée après un changement de
fiche ou de portée est ignorée ; valeurs longues coupées autour de la première différence, valeur
entière et définition complète au survol).

**Purger un jeu de test** : voir le runbook (`02-exploitation-runbook.md`) — jamais sur des entrées
réelles.

**Vérifié** sur Docker, jeu `-TEST-` supprimé ensuite (comptages identiques avant / après) : 63
contrôles de bout en bout, 8 avec authentification (auteur tiré de la session, matricule du compte
de secours jamais écrit) et 50 tests du module pur. Deux **revues adverses** multi-agents : la
première a trouvé 10 défauts confirmés (dont le sous-traitant d'étape non tracé, la suppression
journalisée *après* l'effacement, l'enregistrement sans trace si la lecture échouait) et une
vingtaine de défauts secondaires ; la seconde a vérifié les correctifs et trouvé 7 défauts de plus
(dont le lanceur de migrations de la VM, un faux « réordonnancement », les références client
modifiées par une DT sans trace, une restauration qui aurait réécrit toutes les heures du journal).
Tous corrigés.

## Lot H0 (17/09/2026) — correctifs sans arbitrage métier

Correctifs seulement : **aucun** des sujets en attente de réponse de l'utilisateur n'est traité (ligne de nomenclature sans
fournisseur, prix moyen, retrait de `qte_paquet`, unification du catalogue, ordre et imbrication des mères, propagation d'un
indice aux commandes en cours). Contrats des routes : `07-api-reference.md`, section « Lot H0 ».

### Mères : les composants ne disparaissent plus
**Cause** : `nomenclatures.composants` était `text` dans la base Docker / VM (née de `schema.sql`, miroir d'une colonne vide) —
le cloud, lui, est déjà en `jsonb`. PostgREST rendait une **chaîne JSON** ; le formulaire n'acceptait qu'un tableau : à la
réouverture la mère semblait vide (total 0,00 €) et l'enregistrement suivant écrasait la base avec `[]`.

| Niveau | Correctif |
|---|---|
| Base | migration Docker **015** : `composants` → `jsonb` (vide / NULL → `[]`, JSON valide converti tel quel, rien d'effacé ; lève une exception et se retente si la conversion est impossible). `schema.sql` en `jsonb`. **Aucun script cloud** (sonde en lecture du 17/09/2026). |
| Lecture | `composantsDe(fiche \| valeur)` (`src/shared.ts`) rend **toujours un tableau** ; utilisé par la liste (compteur « Composants »), les routes nomenclature et, côté navigateur, `nomComposantsDe` (ouverture du formulaire). |
| Serveur | `PUT /api/nomenclature/:id` refuse en **409 `composants_vides`** le passage d'une liste non vide en base à une liste vide sans `vider_composants: true`. Une mère qui **omet** la clé `composants` garde ses composants **et son coût** (les trois champs de prix du corps sont ignorés, au PUT comme au nouvel indice). |
| Client | `nomComposantsPourEnvoi` (appelée par `nomCollectPayload`) : au moins un composant → la liste ; mère existante vidée **par l'utilisateur** (`nomComposantsModifies`, posé par `nomRemoveComposant` / `nomComposantPick`) → `[]` + `vider_composants: true` ; fiche jamais enregistrée ou fiche qui n'était pas une mère à l'ouverture (`nomTypeCharge`) → `[]` ; fiche existante à liste vide **sans action** → clé `composants` **omise** (et les prix de revient avec) ; mère repassée en standard → `null` + `vider_composants: true`. |

⚠ Le message du 409 s'affiche tel quel (pas de fenêtre dédiée « confirmer le retrait »).

### Fiche relue à chaque ouverture
Le formulaire s'ouvrait sur l'instantané sérialisé au rendu de la page (`NOM_BY_ID`), jamais mis à jour après un enregistrement :
rouvrir puis réenregistrer écrasait la saisie récente.
- **`GET /api/nomenclature/:id`** (nouvelle, famille `nomenclature`, lecture BE, `no-store`) → `{ok, nomenclature}`.
- `nomFicheFraiche` : relit la fiche **une fois le verrou pris** ; route en échec ou plus de 6 s → repli sur `NOM_BY_ID[id]`, puis
  sur l'objet de la liste. `nomMajInstantane` (dans `nomSave`) met `NOM_BY_ID` à jour avec ce qui vient d'être écrit.
- **Jeton d'ouverture** (`nomOuvertureJeton`, pris par `nomOpenForm`, `nomNewForm`, `nomCloseForm`) : une réponse arrivée après
  l'ouverture d'une autre fiche (ou d'un formulaire neuf) est ignorée et le verrou de la fiche abandonnée est relâché. Même
  protection pour `nomLoadFournitures` (des fournitures en retard remplaçaient la saisie du nouveau formulaire).

### Nouvel indice : la révision naît « en cours »
Depuis le formulaire d'une fiche validée, « Incrémenter l'indice » envoyait `statut: 'valide'` et le serveur recopiait
`valide_par` / `date_validation` : la révision non relue devenait l'**indice validé le plus haut**, donc la gamme des nouvelles
commandes, sans événement `validation` au journal EN 9100. Désormais le client (`nomCreerNouvelIndice`) envoie `en_cours` sans
drapeau, et le **serveur impose** `statut: 'en_cours'`, `valide_par` et `date_validation` à `null` quel que soit le corps. Journal
inchangé (`nouvel_indice` + `creation`). La révision se valide ensuite normalement.

**Fiche lot / OF imprimé** (`GET /production/lot/:id`) : prend la **nomenclature validée d'indice le plus haut** (avant : la
dernière fiche créée, brouillon compris). Sans fiche validée : repli sur l'ancien choix, indice imprimé suffixé **« — GAMME NON
VALIDÉE (statut) »** et drapeau `nomenclature_non_validee` (pas encore de bandeau à l'écran, `src/prod.tsx`).

### Prix : jamais remis à 0 au rendu
**Avant** : `nomMatiereApplyPrix` / `nomAccApplyPrixStatus` remettaient le prix d'une ligne à 0 à **chaque rendu** dès que le
prix catalogue n'était pas frais (ou que le fournisseur n'était pas retrouvé), puis l'enregistrement écrivait 0 (« X → 0 » au
journal EN 9100). **Maintenant** :

| Situation de la ligne | Prix affiché | Statut / couleur |
|---|---|---|
| prix catalogue **frais** (> 0 et < 6 mois, `nomPrixFrais`) | prix catalogue (remplace la valeur de la ligne) | frais — bleu ciel (matière) / violet (accessoire, auparavant bleu) |
| prix catalogue périmé, fournisseur non retrouvé ou référence absente du catalogue, **valeur déjà sur la ligne** | valeur de la ligne **conservée** | « périmé » — orange |
| aucun prix | — | « absent » — bouton orange |

- Un prix **périmé** du catalogue ne remplit jamais une ligne vide (règle du « prix estimé » en attente d'arbitrage).
- Le prix ne repasse à 0 que si **l'utilisateur** change la référence, le fournisseur, ou la désignation d'une ligne sans
  référence. `nomAccApplyProd` ne reprend qu'un prix frais.
- Un prix **0** n'est jamais « frais » (client) ni écrit comme prix officiel (validation d'une demande de prix : échec explicite).
- Seuil unique `PRIX_VALIDITE_JOURS` (183 j) injecté dans la page (`NOM_PRIX_VALIDITE_JOURS`, libellé « 6 mois ») ; plus de 92 j
  dans l'analyse DT ni de « 3 mois » dans `be.tsx`.

### Demande de prix possible à tout moment
- **Nomenclature** (`nomPrixCellHtml`, compartiments Matière et Accessoires) : prix frais → prix + petit bouton gris
  « redemander un prix » ; prix périmé → prix orange + bouton orange ; pas de prix → bouton orange « demande de prix » ;
  demande envoyée → sablier « vérifier » (prix actuel conservé à côté s'il existe).
- **Sans fournisseur** : `nomMatiereRFQ` accepte une ligne qui n'a qu'une référence ou une désignation.
- **Suivi de la réponse** (`nomRfqVerifier` / `nomRfqAppliquer`) : l'identifiant de la demande (`_rfqId`) est gardé sur la ligne ;
  elle reste « en attente » tant que la demande n'est pas **clôturée** (`GET /api/demandes-prix/:id`), puis le prix est relu par
  `GET /api/produit-prix` (fournisseur de la ligne, sinon **toutes** les lignes chiffrées de la référence ou de la désignation,
  `lignes[]`) et le catalogue local `NOM_PRODUITS` est mis à jour. Une seule réponse fraîche → prix **et fournisseur** repris ;
  plusieurs → message « N fournisseurs ont un prix récent… choisissez le fournisseur » ; clôturée sans prix récent → prix actuel
  conservé. La règle de date (prix daté du jour de la demande ou après, `nomRfqRepondue`) ne sert plus que de repli. ⚠ L'état
  « en attente » est un drapeau du navigateur, perdu au rechargement de la page.
- **BE › Références** : bouton « Demande de prix » sur **chaque** ligne — orange si le prix manque ou a plus de 6 mois, gris sinon.

### Catalogue fournisseur : plus d'écrasement
- **`syncFournituresToCatalogue`** (enregistrement d'une nomenclature) : n'écrit **plus jamais** une ligne existante ; insère
  seulement un couple fournisseur + référence absent, **sans prix** (`en_attente_prix`, source `be`). Avant, chaque enregistrement
  pouvait réécrire désignation, catégorie, activité et effacer le prix d'une référence du catalogue.
- **`POST /api/produits-fournisseurs`** (« Déclarer », modale « Entrée catalogue ») : sur un couple existant, mise à jour des seuls
  champs fournis et non vides, prix seulement s'il est > 0, **catégorie et activité jamais réécrites** (sauf vides en base) ;
  insertion « si absent » sinon (course avec une validation de demande de prix rattrapée).
- **`PUT /api/produits-fournisseurs/:id`** (« Éditer ») : même règle, y compris `fournisseur_id`, `unite`, `delai_jours` ; prix
  **inchangé** = date et source conservées. ⚠ Effet assumé : un délai ne se vide plus et une référence ne se détache plus de son
  fournisseur en envoyant une valeur vide.
- **`POST /api/demandes-prix/:id/valider`** : chaque erreur est lue ; sur une ligne existante, seuls prix, date, source `rfq` et
  statut sont écrits ; un échec laisse la demande **ouverte** (500 + `echecs`) ; un point d'historique au plus par (référence,
  fournisseur, demande, prix). ⚠ L'écran Achats (`rfqValider`, `src/achats.tsx`) affiche encore « Échec de la validation. » sans
  le détail.

### Mise en page des compartiments Matière / Accessoires
- En-tête et lignes de chaque compartiment dans un conteneur **`.nom-grid-scroll`** à défilement horizontal ; grille commune
  `.nom-mat-grid` / `.nom-acc-grid` (remplace la classe morte `.nom-f-row`) ; colonne Désignation `minmax(30px,1fr)` (avec `1fr`
  seul, en-tête et ligne n'avaient pas la même largeur). Mesuré (Playwright) : écart en-tête / case **0 px** à 1920, 1600, 1366 et
  1280 px ; croix de suppression toujours dans la carte et cliquable.
- **Limite (filet seulement)** : la désignation ne fait que 30 à 34 px ; il faut défiler dès 1600 px, et à 1920 px pour les
  accessoires (50 px). Le vrai gabarit est pour le lot suivant ; « €/pièce » passe encore sur deux lignes ; code mort
  `nomFournSelect` / `nomRefSelect` non retiré.

### GED : ouverture d'un document au nom accentué
`GET /api/ged/file/:id` envoie `Content-Disposition` en double forme (repli ASCII + `filename*=UTF-8''…`, `dispositionFichier`).
Avant, sous Node (Docker, VM), un seul caractère au-delà de U+00FF dans le nom (`’ – œ €`) donnait **502 « Fichier injoignable »**
alors que le fichier était intact ; le lien « Ouvrir le plan » en héritait. Chaque erreur est désormais journalisée
(`[GED] ouverture <id> : …`) avec un message explicite. Base neuve sans bucket ni policies : migration Docker **016**. Dépannage :
`12-docker-installation.md`, section GED.

### Génération des BDT depuis l'analyse DT
`POST /api/be/analyse-dt/:id/generer-bdt` (sans appelant client aujourd'hui) : compteurs avancés seulement après une insertion
réussie, identifiant libre suivant en cas de conflit, bons existants lus strictement (503 sinon), échecs rendus en 500 avec
`echecs[{bon, piece, seq, erreur}]` ; une relance ne recrée que les bons manquants.

### Vérifications
`npx tsc --noEmit` 0 erreur · harnais toutes pages 60 PASS / 0 FAIL / 1 SKIP (`manuels.tsx :: pageManuel`, sans rapport) · e2e
Docker local 28/28 (`scratchpad/lot-h/h0_e2e.mjs`) puis, après la relecture adverse (13 constats, tous réels, tous corrigés côté
serveur et BE), 33/33 (`h0r_e2e.mjs`, dont un parcours Playwright de la page BE sans erreur JS) · Playwright mesures de mise en
page (4 largeurs) et parcours d'écriture d'une mère `-TEST-H0-MERE-…` (réouverture, enregistrement sans modification, retrait
volontaire, 409 sans drapeau) · migration 015 éprouvée sur table jetable (JSON invalide → exception, verrou tenu → exception
55P03, données valides → conversion, rejeu → rien) · données `-TEST-H0` / `-TEST-H0R-` supprimées et **relues à 0**.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/be.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
