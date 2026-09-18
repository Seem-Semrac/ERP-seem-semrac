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
Masse en g ; temps en millièmes d'heure ; réglage = coût FIXE/lot ; prix des fournitures = MOYENNE des fournisseurs du catalogue (lot H1 : plus de fournisseur ni de qté/paquet sur la ligne, une même référence une seule fois par fiche) ; prix « frais » 6 mois (183 j) sinon demande de prix (bouton libellé « Demande de prix » sur chaque ligne, lot H2) ; indices A/B/C ; drag-drop des process. Mères (lot H2) : l'ordre des composants = ORDRE DE FABRICATION (haut → bas, rang = n° de sous-lot), une mère peut contenir des mères (5 niveaux au plus, 409 cycle_composants / profondeur_max), chaque composant devient un sous-lot en production ; une fiche encore composant d'une mère ne se supprime pas (409 composant_utilise) ; journal EN 9100 pleine largeur. Supprimer une nomenclature VALIDÉE exige un MOTIF (sinon 400 motif_requis), inscrit au journal EN 9100 avec l’auteur et la date ; sans le journal en base, la suppression d’une fiche suivie est refusée (409) plutôt que tracée nulle part.
<!-- /auto -->

> ⚠ **Seuil des prix** : un prix catalogue est « frais » pendant **6 mois** (`PRIX_VALIDITE_JOURS = 183`, `src/shared.ts`),
> partout (formulaire nomenclature, BE › Références, `GET /api/be/analyse-dt/:id`) — lot H0, 17/09/2026. **Depuis le lot H1**
> (même jour), le prix d'une ligne matière / accessoire est la **moyenne des fournisseurs du catalogue** qui portent la
> référence : la ligne ne porte plus ni fournisseur ni quantité par paquet. Détail : sections « Lot H0 » et « Lot H1 » plus bas.
> Le manifeste de `scripts_doc/gen_module_fiches.mjs` (bloc `auto:notes` ci-dessus) a été corrigé en conséquence.
> **Lot H2** (18/09/2026) : l'ordre des composants d'une mère = **ordre de fabrication** (haut → bas), une mère peut contenir
> des mères (**5 niveaux** au plus, cycle refusé), chaque composant devient un **sous-lot** en production ; bouton libellé
> **« Demande de prix »** sur chaque ligne ; journal EN 9100 **pleine largeur**. Détail : section « Lot H2 » plus bas, et
> [production.md](production.md) (sous-lots).

Le formulaire nomenclature est en **deux colonnes** : saisie des champs à gauche (`minmax(340px, 0.78fr)`), déclaration des process et gamme à droite (`minmax(0, 1.22fr)`) — la gamme porte 10 colonnes depuis l'ajout de ROP/RGM et a besoin de la place. **Depuis le lot H1**, les compartiments **Matière** et **Accessoires** sont en **tête de la colonne de droite**, au-dessus des Étapes (la colonne de gauche ne porte plus que l'identification, les documents et la validation). **Depuis le lot H2**, pour une **mère**, c'est le bloc **« Composants — ordre de fabrication »** qui occupe la tête de la colonne de droite (les compartiments de fournitures y sont masqués, comme avant) ; la carte **« Journal des modifications · EN 9100 »** est sortie de la colonne de droite et occupe **toute la largeur** du formulaire, sous les deux colonnes.

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
- **Composants d'une mère** (lot H2, `diffComposants`) : suivis **ligne par ligne**, plus en bloc JSON (une permutation
  donnait « Composants : [JSON] → [JSON] », uuid compris). Voir la section « Lot H2 » plus bas.

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
EN 9100 »** — **depuis le lot H2, sous les deux colonnes, sur toute la largeur du formulaire** (avant :
dans la colonne de droite, sous la carte Validation, 60 % de la largeur) ; `nomJournalLoad()` — une réponse
arrivée après un changement de fiche ou de portée est ignorée ; une modification par ligne (champ à
gauche, « avant → après » à droite, étiquette « recalcul » pour les valeurs recalculées) ; valeurs longues
coupées à **180 caractères** (90 avant H2) autour de la première différence, valeur entière et définition
complète au survol.

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

## Lot H1 (17/09/2026) — prix moyen multi-fournisseurs, quantité par paquet au catalogue, recherche sans fournisseur

> « pour le moment on va aller sur le fait de faire un **prix moyen de tous les fournisseurs** pour la dite référence (et faire
> la conversion quand le nombre de pièces dans un paquet par exemple diffère selon le fournisseur) » · « il faut être capable
> d'aller retrouver les refs de produits à commander **sans mettre le fournisseur** et le remplir par la désignation » ·
> « Retirer le nombre de pièces dans un paquet et le gérer **uniquement au niveau du catalogue fournisseurs** […] on ne doit
> pas pouvoir mettre **deux fois la même référence** de produit. »

Une ligne de fourniture ne porte plus de fournisseur ni de conditionnement : elle porte une **référence** (cherchée par
référence **ou** par désignation dans tout le catalogue) et son prix est la **moyenne des fournisseurs** qui la portent,
chacun ramené à la pièce par sa **quantité par paquet** déclarée au catalogue. Migration Docker **017** / script cloud
**`cloud-13`** (à jouer à la main : `03-base-de-donnees.md`). Contrats des routes : `07-api-reference.md`, section « Lot H1 ».
Écrans Achats et fiche fournisseur : [achats.md](achats.md), section « Lot H1 ».

### Un seul module de calcul — `src/prix_moyen.ts` (réexporté par `src/shared.ts`)

Aucune règle de prix n'est recopiée : serveur, navigateur BE, fiche fournisseur et écran Achats appellent **les mêmes
fonctions**. `prixMoyenClientJs()` rend le **texte JS** de ces fonctions (`Function.toString`), injecté tel quel dans le
`<script>` d'une page — donc pas de copie à maintenir en double (contrairement à `BE_ETAPE_COUT_JS`, miroir écrit à la main).

| Export | Ce qu'il fait |
|---|---|
| `normaliserReference(v)` | trim, espaces multiples → 1, accents retirés, minuscules. **La seule normalisation admise** (client, serveur, clé du journal EN 9100, index SQL). ⚠ les espaces internes sont conservés : `126 001` ≠ `126001` |
| `memeReference(a,b)` · `categorieFourniture(v)` · `categorieCompatible(cat, compartiment)` | comparaison normalisée · `matiere_premiere`/`matière` → `matiere` · une ligne catalogue **sans catégorie** est acceptée |
| `nombrePositif(v)` · `arrondiPrix(n)` | nombre fini **> 0** sinon `null` (virgule décimale acceptée) · arrondi à 1e-6 |
| `qtePaquetDe(produit)` | `qte_paquet`, sinon l'ancien libellé texte `conditionnement` **s'il est un nombre pur** (± « pce/pièces »), sinon `null`. ⚠ « 25 kg », « 6 m », « boîte de 25 » rendent `null` : diviser un prix par 25 parce que le libellé dit « 25 kg » donnerait un prix faux |
| `prixPerime(date, validiteJours?, maintenant?)` | date absente ou illisible = **périmé**. Défaut `PRIX_VALIDITE_JOURS` = 183 j |
| **`prixMoyenReference(produits, reference, categorie, opts)`** | le calcul (ci-dessous) |
| `chercherReferences` / `optionsReferences` | recherche « référence **ou** désignation », sous-chaîne, casse et accents ignorés, dédoublonnée par référence normalisée |
| `doublonsFournitures` / `premierDoublonFourniture` / `messageDoublonFourniture` | doublons **tous compartiments confondus**, message **identique** client et serveur |
| `recalculerFournitures(fournitures, produits, opts)` | recalcul en direct pour l'analyse DT |

**Contraintes du module** (tenues, testées) : aucun `import`, aucune référence à une constante de module, pas de `let`/`const`
de portée module, syntaxe ES5. Sinon le bundle **minifié** de Cloudflare casserait côté navigateur — le test rejoue toute la
suite sur la copie navigateur **du bundle minifié**. Le texte rendu est **pur ASCII**, sans accent grave, sans `${`, sans
`</` : il ne peut ni fermer le `<script>` ni être interpolé par accident (il n'est pas une donnée : rien à échapper).

### Le prix moyen (`prixMoyenReference`)

Entrent dans la moyenne **toutes** les lignes `produits_fournisseurs` de même référence normalisée, de catégorie compatible,
**dont le prix est > 0** — quels que soient le fournisseur, son site, son activité et l'âge du prix. Un même fournisseur ne
pèse **qu'une fois** (deux lignes du même fournisseur : on garde **la plus récemment chiffrée**, `date_prix` puis `updated_at`).

| Catégorie | Conversion | Prix par pièce de nomenclature |
|---|---|---|
| **Accessoire** | `prix_pièce_i = prix_i / qte_paquet_i` (paquet non déclaré ⇒ **divisé par 1 ET signalé**) | moyenne des `prix_pièce_i` × `Nb/pièce` |
| **Matière** | moyenne des prix de **tôle** (pas de conversion : une tôle est une tôle) | `prix_tôle_moyen / Pc/tôle` (`Pc/tôle` reste saisi au BE : il dépend de l'imbrication) |

- un seul prix de plus de 183 j ⇒ `perime = true` (orange, « demande de prix conseillée »), le prix reste compté ;
- aucun prix ⇒ `incomplet = true`, `prix_unitaire = 0` (rouge, « coût incomplet ») — **la validation reste permise** ;
- retour : `prix_unitaire` (€/pièce), `prix_base` (€/tôle en matière, €/pièce en accessoire), `prix_tole`, `nb_fournisseurs`,
  `min`/`max`, `perime`, `incomplet`, `sans_conditionnement[]` (noms des fournisseurs chiffrés sans qté/paquet),
  `date_plus_ancienne` / `date_plus_recente`, et `detail[]` par fournisseur (prix catalogue, qté/paquet, prix converti, date).

**Exemple du manuel** : réf. `VIS-M6-20` à 10 € le paquet de 100 chez A (0,10 €/pièce) et 6 € le paquet de 50 chez B
(0,12 €/pièce) → **0,11 €/pièce**, badge « 2 fourn. · 0,10–0,12 €/pce ».

### La ligne de fourniture — nouveau modèle

`payload.fournitures[]` de `POST` / `PUT /api/nomenclature` :

| Champ | Matière | Accessoire |
|---|---|---|
| `ref_stock` / `designation` | référence catalogue (ou désignation seule) | idem |
| `quantite_par_piece` | `1 / nb_par_tole` (inchangé) | **nb de pièces par pièce fabriquée** |
| `nb_par_tole` | pièces par tôle | `null` |
| `prix_unitaire` | prix moyen d'**UNE TÔLE** | prix moyen d'**UNE PIÈCE** |
| `prix_total_par_piece` | `prix_unitaire / nb_par_tole` | `prix_unitaire × quantite_par_piece` |
| ~~`fournisseur`~~, ~~`qte_paquet`~~ | **plus envoyés** | **plus envoyés** |

- Les colonnes `fournisseur` et `qte_paquet` de `fournitures_nomenclature` **restent en base** (aucun `DROP`) : elles ne sont
  simplement plus écrites. **Aucune reprise en masse** — une ancienne ligne (fournisseur + qté/paquet + prix du paquet) est
  **réaffichée avec le nouveau calcul** (marquée « ancien modèle » dans le détail) et la bascule en base n'a lieu qu'au
  prochain enregistrement volontaire.
- ⚠ `prix_total_par_piece` devient **obligatoire** pour un accessoire : sans `qte_paquet`, `computeNomCostForQty`
  (`src/shared.ts`, **inchangé**) passe au calcul **linéaire** `prix_total_par_piece × qté`. L'envoyer à 0 avec un
  `prix_unitaire` renseigné donnerait un coût nul.

### Compartiments Matière / Accessoires — ce que l'écran montre

Colonnes : **Réf · Désignation · Pc/tôle (ou Nb/pièce) · Prix estimé / pièce · demande de prix · croix**. Plus de colonne
Fournisseur ni Qté/paquet.

- **Cellule de prix** : valeur en `fr-FR` (4 décimales) + badge `n fourn. · min–max €/tôle` (ou `€/pce`), `· cond. ?` quand un
  fournisseur n'a pas déclaré son conditionnement. **Survol** = infobulle détaillée ; **clic** = popover `#nom-prix-detail`
  (fournisseur, prix catalogue, qté/paquet, €/pièce, date, avertissements, mention « ancien modèle »).
- **Couleurs** : compartiment (prix frais) · **orange** = un prix de plus de 6 mois, ou prix hors catalogue conservé ·
  **rouge** = « coût incomplet » (aucun prix) · ambre = en attente d'une demande de prix.
- **Prix jamais remis à 0** (règle H0 conservée) : quand la moyenne est inconnue (`incomplet`) ou **non convertible** (pas de
  `Pc/tôle` / `Nb/pièce`), `recalculerFournitures` **garde la copie enregistrée** ; 0 + rouge seulement s'il n'y a pas de copie.
- **Recherche réf ou désignation** : popover `#nom-ref-pop` maison (un seul pour toutes les lignes, `role=combobox/listbox`,
  ↑ ↓ Entrée Échap Tab, `aria-activedescendant`, délégation d'événements), alimenté par `chercherReferences`. Choisir une
  entrée remplit **les deux** champs ; la saisie libre reste permise.
  > ⚠ **Pourquoi pas une `<datalist>`** : le navigateur refiltre nos options avec sa **comparaison littérale**, qui n'ignore
  > pas les accents — « tole alu » ne proposait pas « Tôle aluminium ». Le filtrage doit rester le nôtre.
- **Mise en page** (spec §10) : le bloc `#nom-fournitures-block` est passé **en tête de la colonne droite**, au-dessus des
  Étapes ; en-tête et lignes partagent **un seul gabarit 6 pistes** (`.nom-mat-grid` / `.nom-acc-grid`), Désignation large
  (190 → 442 px selon la largeur, contre 18 px avant). Mesuré à 1280 / 1366 / 1600 / 1920 px : écart en-tête ↔ case **0 px**,
  `elementFromPoint(croix)` = le bouton, croix dans le cadre, **0 px de défilement interne**, 0 erreur JS.

### Doublons : une référence une seule fois par nomenclature

Matière et accessoires **confondus** (une ligne sans référence est comparée sur sa désignation normalisée) :

- **client** — même appel (`doublonsFournitures` / `messageDoublonFourniture`), ligne **refusée à la saisie**, valeur
  restaurée, notification. ⚠ Le test se fait **avant toute mutation** : le refus ne doit effacer ni le prix enregistré ni la
  demande de prix en cours de la ligne ;
- **serveur** — `POST` / `PUT /api/nomenclature` répondent **409 `doublon_reference`** (`indices`, `cle_sur`, `categories`)
  **avant** `upsertFournitures`, qui efface puis réinsère : un refus tardif viderait les fournitures de la fiche ;
- **catalogue** (autre règle) : la même référence chez **plusieurs** fournisseurs reste normale — c'est la base de la moyenne ;
  c'est le **même fournisseur deux fois** qui est refusé (409 `doublon_catalogue`), à la casse et aux espaces près.

### Perdre ses fournitures n'est plus possible

`GET /api/nomenclature/:id/fournitures` est passé en **lecture stricte** (503 + `Cache-Control: no-store`). Avant, une panne
rendait `ok:true` + liste vide : l'éditeur vidait ses deux compartiments et l'enregistrement suivant effaçait **vraiment** les
fournitures (même famille que la perte des composants du lot H0). Deux verrous :

| Niveau | Garde |
|---|---|
| Client | `nomFournituresEtat` (`ok` / `attente` / `erreur`) : notification, `nomSave` et `nomCreerNouvelIndice` **bloqués** tant que les fournitures ne sont pas chargées |
| Serveur (`PUT /api/nomenclature/:id`) | **409 `fournitures_vides`** si la fiche a des fournitures en base et que la liste envoyée est vide, sauf drapeau explicite `vider_fournitures: true` — que l'écran ne pose **que** lorsqu'il fait foi ; **503** si les fournitures en base ne peuvent pas être relues pour en juger |

### Demande de prix sans fournisseur

`nomLigneRFQ(k,i)` ouvre la modale RFQ **pré-remplie** (référence, désignation, quantité, catégorie, `dt_ref` = n° de
nomenclature) avec un bloc **Destinataires** : tous les fournisseurs qui **portent la référence**, cochés d'office ; aucun
porteur → choix libre, rien de coché. L'envoi passe par le champ **déjà existant** `fournisseurs_cibles` de
`POST /api/demandes-prix` (aucune route modifiée). Le sablier « vérifier » du lot H0 est conservé.

### Unités : l'accessoire se compte en PIÈCES

« Linéaire au BE, paquets au BC » — l'acheteur connaît le fournisseur, donc son conditionnement ; le BE ne l'invente plus.

- `cascadeDAManques` : besoin accessoire = `ceil(quantite_par_piece × qté)` **en pièces** (plus de division par un `qte_paquet`
  de fiche non réenregistrée). Matière inchangée (tôles) ;
- analyse DT : `besoin_unite = 'pièce'` pour un accessoire sans `qte_paquet` (plus « paquet » pour des pièces), et **coût série
  linéaire** — y compris pour une fiche restée à l'ancien modèle, dont le prix du paquet est ramené à la pièce. C'est ce qui
  rend besoin et coût cohérents. ⚠ Les analyses **déjà acceptées** restent figées (comportement inchangé) ;
- `GET /api/be/analyse-dt/:id` : `recalculerFournitures` recalcule en direct depuis le catalogue (sinon copie enregistrée),
  alimente `computeNomCostForQty` **et** `fournitures_stock` ; chaque ligne porte `prix_moyen { nb_fournisseurs, min, max,
  perime, incomplet, sans_conditionnement, dates }`, chaque pièce `fournitures_incompletes / _perimees /
  _sans_conditionnement`. Catalogue illisible ⇒ **503**, comme les taux de la même route (on refuse de chiffrer une offre sur
  des copies périmées).
- ⚠ `src/kpi.ts` (`computeNomCostForQty` du tableau de bord BE) lit toujours la **copie enregistrée** : conforme à la spec
  (« sinon la copie enregistrée »), à rebrancher sur `recalculerFournitures` si on veut le prix moyen partout.

### Journal EN 9100 — la bascule ne pollue pas le journal

`src/nomenclature_journal.ts` : clé d'appariement d'une fourniture = `catégorie | référence **normalisée**` (une référence
réécrite dans une autre casse n'est plus un changement) ; `DERIVES_FOURN = ['prix_total_par_piece', 'prix_unitaire']` (un prix
qui bouge parce que la **moyenne** a bougé part en bloc **« recalcul »**, ce n'est pas une saisie) ; la bascule ancien →
nouveau modèle produit **une** entrée `recalcul` « *&lt;réf&gt; · passage au prix moyen du catalogue (ancien modèle retiré)* »
au lieu de « fournisseur → ∅ » + « qte_paquet 100 → 0 ». Une qté/paquet **réellement modifiée** (fournisseur conservé) reste
une saisie (bloc « fourniture ») : rien n'est masqué.

### BE › Références et modale « Entrée catalogue »

Colonne **Qté/paquet** (badge orange « non déclarée » pour un accessoire sans conditionnement, « — » hors accessoires) et
bandeau d'alerte « *N accessoire(s) n'ont pas de quantité par paquet déclarée…* ». La modale porte le champ **Quantité par
paquet** (masqué hors catégorie « Accessoire »), lu par `nombrePositif()` et **omis du corps s'il est vide** — le serveur
n'écrase jamais une valeur existante. En modification, le prix est **pré-rempli**. L'`avertissement` du serveur (base sans
`cloud-13`) s'affiche en **avertissement**, jamais en erreur bloquante.

### Ce qui a été retiré

`nomFournSelect`, `nomRefSelect`, `nomFournItems`, `nomFournFournit`, `nomFournVisibles`, `nomMatProds*` / `nomAccProds*`,
`nomMat/AccSuppliersForRef`, `nomMat/AccFournSelect`, `nomMatiereSetFourn`, `nomAccSetFourn`, `nomAccApplyProd`,
`nomAccApplyPrixStatus`, `nomMatiereApplyPrix`, `nomPrixCellHtml`, `_fid()` — et **tous les lecteurs du jsonb
`fournisseurs.catalogue`** de `be.tsx` (rebranchés sur `NOM_PRODUITS`). Le type `BeRefs.fournisseurs[].catalogue` n'est plus
déclaré : `getBeRefs()` peut continuer à l'envoyer, personne ne le lit.

### Défauts trouvés en relecture (22 constats, aucun faux positif) et corrigés

Refus de doublon **après** avoir effacé le prix enregistré et la demande de prix en cours (remise à 0 en base) · fournitures
effacées après un 503 · caractères **perdus** à la frappe (tout `change` re-rendait la liste en `innerHTML` : plus de re-rendu,
`nomFourMajLigne` ne remplace que la cellule de prix et le bouton) · colonnes figées (« 120 » → « 1… », badge tronqué dès 2
fournisseurs) · deux lignes du même fournisseur comptées deux fois · libellé « 25 kg » pris pour un conditionnement ·
`Object.create(null)` pour les index à clé applicative (`constructor`, `__proto__` ne cassent plus le 409) · catégorie **déduite**
par `GET /api/produit-prix` au lieu de « accessoire » supposé · `aria-activedescendant` posé/retiré · avertissements passés en
notification « warn » au lieu d'erreurs.

### Vérifications

`npx tsc --noEmit` 0 erreur · `node scripts_doc/test_prix_moyen.mjs` **220 PASS / 0 FAIL** (module **et** bundle **minifié**,
serveur **et** client, égalité stricte des deux) · `npm run build` ✓ · harnais toutes pages **60 PASS / 0 FAIL / 1 SKIP** ·
`erp-docker.sh maj` ✓ (017 appliquée) · e2e Docker local **16 PASS / 0 FAIL** (catégorie déduite, référence accentuée reconnue
sans accents sans créer de doublon, 409 `fournitures_vides` avec fournitures **relues intactes**, 409 `doublon_reference`, 409
propre sur `__proto__`, besoin d'accessoire en « pièce ») · navigateur Chromium **44 PASS / 0 FAIL** (frappe ligne 1 → clic
ligne 2 → frappe sans perte, doublon refusé sans perdre le prix ni la RFQ, aucune colonne coupée de 1280 à 1920 px) · données
`-TEST-` supprimées **et relues** (0 restante).

**Captures de la doc** (18/09/2026, serveur local sur la base en ligne, **sans `cloud-13`**) : `form-be-nomenclature.png`
refaite — la ligne matière et la ligne accessoire sont prises dans le vrai catalogue par `capture_forms.mjs` (navigateur seul,
rien n'est enregistré) ; l'accessoire `136290` y porte « cond. ? » faute de quantité par paquet (capture **refaite au lot H2**
sur la stack Docker, qui a 017 : 136290 y est à 0,1040 €/pce, bouton « Demande de prix » libellé). `be-refs.png` refaite
(bandeau + colonne Qté/paquet). ⚠ `form-be-analyse.png` **gardée dans sa version d'avant H1** (besoin en « paquets ») avec
l'avertissement « capture à rafraîchir » : refaite sans `cloud-13`, elle montrait `136290` à 10,40 € la pièce (17 040 pièces →
177 216 € d'accessoires sur `DT-2026-0001`). À refaire après `cloud-13` : `node scripts_doc/capture_screens.mjs --only form-be-analyse`.

## Lot H2 (18/09/2026) — mères ordonnées, mère dans mère, bouton « Demande de prix », journal pleine largeur

> « LE BOUTON DE DEMANDE DE PRIX DANS LA NOMENCLATURE N'A PAS ÉTÉ remis. Dans les nomenclatures mères, il faut pouvoir
> changer l'ordre des pièces et les ordonnancer dans l'ordre qu'on veut, l'ordre de fabrication sera toujours considéré du
> haut vers le bas. […] Le journal des modifications dans la nomenclature, tu peux l'étirer pour qu'il prenne toute la
> largeur de l'écran. » (18/09/2026 — la suite de la demande, les sous-lots en production, est dans
> [production.md](production.md#lot-h2--sous-lots-des-pièces-mères-18092026))

Arbitrages retenus (liste complète A1 → A9 : `docs/CHANGELOG.md`, 18/09/2026) : **A1** l'ordre du tableau `composants` =
ordre de fabrication, du haut vers le bas ; il fixe le **rang** (1, 2, 3…), donc le numéro du sous-lot, l'ordre d'affichage et
l'ordre de la goulotte ; aucune contrainte d'antériorité entre sœurs · **A2** mère dans mère autorisée, **cycle refusé**
(409 `cycle_composants`), **5 niveaux au plus**, racine comprise (409 `profondeur_max`, constante unique
`PROFONDEUR_MAX_NOMENCLATURE = 5`) · **A5** en production, un composant est résolu comme la pièce racine : **dernière
révision VALIDÉE** de son code · **A6** vrai bouton libellé « Demande de prix » · **A7** journal sur toute la largeur.
Contrats des routes : `07-api-reference.md`, section « Lot H2 ». Aucune DDL côté BE (`composants` est `jsonb` depuis 015) ;
les colonnes de sous-lots (018 / `cloud-14`) sont côté Production.

### Le bouton « Demande de prix » (A6)

**Constat** (Docker, H1) : le bouton existait et fonctionnait, mais c'était une **icône grise de 26 × 24 px sans libellé**,
dans une colonne dont l'en-tête était **vide** — rien ne disait « demande de prix ». Avant H0, c'était un bouton bleu
« demande / de prix » dans la case prix ; H0 l'avait réduit à une icône dès qu'un prix existait, H1 l'avait sorti dans une
colonne dédiée, icône seule dans tous les cas. « Le bouton n'a pas été remis » = le bouton **libellé** avait disparu.

**Correction** — `nomFourRfqBtnHtml(k, l, i)` rend `<button type="button" class="nom-rfq-btn" data-rfq data-nk>` : icône +
**« Demande / de prix »** sur deux lignes, `aria-label="Demande de prix — <réf>"`, infobulle inchangée ; `nomFourMajLigne`
le remplace toujours par `[data-rfq][data-nk]`. En-tête de colonne libellé **« Demande de prix »**.

| État de la ligne | Rendu |
|---|---|
| prix récent (< 6 mois) | bleu (`#eff6ff` / `#1d4ed8`) — redemander reste possible |
| demande conseillée (prix ancien, absent ou hors catalogue) | orange (`#fff7ed` / `#c2410c`) |
| demande envoyée, en attente | ambre, sablier, **« En attente / vérifier »** |

Grilles `.nom-mat-grid` / `.nom-acc-grid` (en-tête et lignes, un seul gabarit) :
`minmax(96px,.55fr) minmax(88px,1fr) minmax(60px,.16fr) minmax(172px,.42fr) 72px 24px` — **532 px** de minimums pour un cadre
de 548 px à 1280 px. **Mesuré** (Playwright, 1280 / 1366 / 1600 / 1920 px) : bouton **72 × 28 px**, libellé entièrement
visible, dans son cadre, `elementFromPoint` au centre = le bouton, **aucun défilement horizontal**, écart en-tête ↔ ligne
**0 px**, hauteur de ligne 30,7 px, Désignation 104 px à 1280, badge « n fourn. · min–max » non tronqué, clic → fenêtre
de demande de prix (`#be-rfq-overlay`). Le bouton « Créer une demande de prix » de la barre de la liste est inchangé.

### Journal EN 9100 pleine largeur (A7)

`#nom-journal-card` est sorti de la colonne de droite et placé **après la grille à deux colonnes**, dans `#nom-form-view` :
largeur = celle du formulaire (ratio mesuré **1,0** à toutes les largeurs, contre 0,60 avant). Identifiants et fonctions
inchangés (`nomJournalLoad`, `#nom-journal-list`, `#nom-journal-portee`). Une modification par ligne (champ à gauche,
« avant → après » à droite), étiquette **« recalcul »** sur les valeurs recalculées, valeurs coupées à 180 caractères.

### Composants d'une mère : l'ordre est l'ordre de fabrication (A1)

**Format** (`nomenclatures.composants`, jsonb) — l'**ordre du tableau** est l'ordre de fabrication :

```json
[ { "nom_id": "…", "code": "PIECE-F1", "num_nom": "PIECE-F1", "qte": 1, "rang": 1, "type_nom": "standard", "indice": "A", "prix": 12.3 },
  { "nom_id": "…", "code": "SE-02",    "num_nom": "SE-02",    "qte": 2, "rang": 2, "type_nom": "mere",     "indice": "B", "prix": 40 } ]
```

- `rang`, `type_nom`, `indice` sont **nouveaux** (aucune DDL) ; les anciennes lignes `{nom_id, num_nom, code, prix, qte}`
  restent lisibles. `prix` est une **copie informative** (coût au moment du choix).
- **Lecture** : `composantsOrdonnes(v)` (`src/nomenclature_arbre.ts`, via `composantsDe`) — ordre = `rang` si **tous** les
  éléments ont un rang entier ≥ 1 distinct, sinon ordre du tableau ; rangs réécrits 1..n ; un élément qui n'a qu'un
  `num_nom` est gardé (sinon un ré-enregistrement le perdrait). `GET /api/nomenclature/:id` rend les composants **dans cet
  ordre**.
- **Écriture** : le serveur stocke `normaliserComposants(...)` (POST, PUT, nouvel indice) — `qte` > 0 (« 0,5 » accepté,
  invalide ⇒ 1), `rang` 1..n, `type_nom` ∈ `standard|mere`, clés `_…` retirées. Le garde-fou `composants_vides` (H0)
  s'applique à la liste **normalisée**.

**Écran** (`src/be.tsx`) — bloc **« Composants — ordre de fabrication (du haut vers le bas) »**, **en tête de la colonne de
droite** (il était dans la carte Identification, colonne gauche de 370 px : la croix débordait) ; `nomSetType` le montre
pour une mère et masque les fournitures. Aide : « Le 1ᵉʳ composant est fabriqué en premier. Chaque composant devient un
sous-lot du lot de la mère ; une mère peut contenir des mères (5 niveaux au plus, mère comprise). »

| Élément d'une ligne | Rôle |
|---|---|
| poignée ⠿ · pastille de **rang** · ▲ ▼ | réordonner : ▲ ▼ (grisés aux extrémités, `aria-label` « Monter » / « Descendre »), flèches ↑ ↓ au clavier sur la poignée, **glisser-déposer** par la poignée ; la nouvelle position est annoncée aux lecteurs d'écran (`#nom-cmp-annonce`) |
| recherche (popover maison) | deux groupes **« Nomenclatures filles (standards) »** et **« Nomenclatures mères »** ; dernière révision **validée** de chaque produit (`NOM_COMPOSABLES`, remplace `NOM_STANDARDS`) ; n°, code, description, casse et accents ignorés |
| Qté / mère · total · × | quantité par unité de la mère (vide ou ≤ 0 ⇒ **1**, à l'écran comme à l'enregistrement, champ encadré rouge « 1 sera enregistré ») |
| sous la ligne | badge standard / mère, **n° de sous-lot** (`.01`, `.02`…), prix unitaire ; pour une sous-mère, bouton « n composants — arborescence » qui déplie son propre arbre |

- **Exclusions** (confort, le serveur reste juge) : la fiche elle-même et **toute mère qui la contient** ne sont jamais
  proposées — `var NOM_ANCETRES = ${sjX(carteAncetres(NOMS))}`, calculé au **rendu serveur** (le module n'est jamais
  injecté dans le navigateur) ; un composant qui ferait dépasser 5 niveaux est listé mais **grisé « trop profond »**. Un
  composant enregistré qui n'est plus proposable reste affiché « (indisponible) » pour ne pas le perdre.
- **Résumé sous la liste** : « Fabrication : 1. … → 2. … → assemblage de la mère », « N sous-lots à la mise en production, sur
  K niveaux (mère comprise ; 5 au plus) », et les mères qui contiennent déjà la fiche ; **alerte rouge avant l'enregistrement**
  si l'arbre dépasserait 5 niveaux.
- **Refus du serveur** (`nomSave`, 409 `cycle_composants` / `profondeur_max`) : message du serveur **avec le chemin**,
  12 s, ligne fautive encadrée en rouge (`nomComposantsErreur`), **formulaire laissé ouvert**.
- **Envoi** (`nomComposantsPourEnvoi`) : `{ nom_id, code, num_nom, qte, rang: i+1, type_nom, indice, prix }` **dans l'ordre
  affiché**. Correctifs : une ancienne ligne avec un code mais sans `nom_id` n'est plus perdue ; la saisie d'une quantité ne
  re-rend plus toute la liste à chaque frappe (le focus était perdu).
- **Liste des mères** : colonne « n composants dont m mère(s) ».
- ⚠ Limite connue : après l'enregistrement d'une mère, rouvrir **une autre** mère dans la même page sans recharger utilise
  une liste d'exclusions légèrement périmée — le serveur refuse alors avec un message clair.

**Coût d'une mère** : **inchangé** — somme de `prix × qte` des composants (le prix d'une sous-mère est déjà la somme des
siens) ; les étapes propres de la mère (assemblage) ne sont pas ajoutées. Le **chiffrage récursif** est un point ouvert
(voir « Reste à faire » du CHANGELOG) ; l'analyse DT le signale (plus bas).

### Contrôles serveur avant toute écriture — cycle et profondeur (A2)

`refusComposants(c, fiche)` (`src/index.tsx`) appelle `controlerComposants(fiche, toutes)` (`src/nomenclature_arbre.ts`)
**avant** toute écriture, sur `POST /api/nomenclature` (création **et** écrasement d'un brouillon), `PUT /api/nomenclature/:id`
(mère résultante — `{...avant, ...corps}` — dont les composants, le type ou l'identité changent) et
`POST /api/nomenclature/:id/nouvel-indice`. `toutes` = nomenclatures lues **strictement** ; la fiche en cours remplace sa
version en base.

| Refus | HTTP | Réponse | Message (exact) |
|---|---|---|---|
| `cycle_composants` | 409 | `{ ok:false, code, chemin, error }` | « Enregistrement refusé : une nomenclature mère ne peut pas se contenir elle-même. Chemin : A › B › A. Retirez « B » des composants. » |
| `profondeur_max` | 409 | `{ ok:false, code, profondeur, max:5, chemin, error }` | « Enregistrement refusé : imbrication trop profonde (6 niveaux, 5 au plus). Chemin le plus long : A › B › C › D › E › F. » |
| `lecture_impossible` | 503 | `{ ok:false, code, error }` | nomenclatures illisibles : on n'enregistre pas sans contrôle |

- **Identité** d'une nomenclature = `cleNomenclature` = `lower(trim(code_ref_produit || num_nom))` (même clé que
  `_nomByCode`) : un cycle se juge sur le **produit**, pas sur une révision.
- **Deux révisions suivies** pour chaque composant : sa révision d'**édition** (`nom_id` s'il existe, sinon dernière
  révision du code, tout statut), sa révision de **production** (dernière validée du code) — et, correctif de relecture, la
  **dernière révision en cours**. Un cycle que seule la production rencontrerait (mère ind. A vide choisie au BE, ind. B
  validée contenant la fiche) est refusé **dès le BE**.
- **Profondeur** = niveaux au-dessus de la fiche (`hauteurAncetres`, mères qui la contiennent) + hauteur de son sous-arbre,
  racine = 1 ; > 5 ⇒ 409.
- Composant introuvable (ni `nom_id` ni code en base) : **pas** de refus (le BE ne propose que des fiches existantes).
- Standard (`type_nom` ≠ mère) : aucun contrôle ; s'il **devient** mère, le contrôle s'applique.

**Suppression d'une fiche encore composant** (`DELETE /api/nomenclature/:id`) : **409 `composant_utilise`**
`{ meres: [n°…] }`, **avant** tout motif et toute entrée de journal — « Suppression refusée : « X » est un composant de la
nomenclature mère : M1. Retirez-le d'abord de leurs composants. ». Une fiche est bloquée si une mère la désigne par sa
révision (`nom_id`) ; par son **code**, seulement si c'est la **dernière révision validée** de ce code (une autre révision
validée reste utilisable par la production). Les mères examinées : dernière révision de chaque groupe et dernière validée
de chaque code (`revisionsRetenues`). L'écran affiche ce refus avec son propre message.

### Journal EN 9100 des composants — `diffComposants` (`src/nomenclature_journal.ts`)

`composants` sort de la boucle générique (`HORS_FICHE`) ; `diffNomenclature` (signature **inchangée**) ajoute
`diffComposants(avant, apres)`. Identité d'une ligne = `cleComposant` (code, à défaut n°) + n° d'occurrence : deux fois la
même fille s'apparient dans l'ordre, elles ne « s'échangent » jamais.

| Entrée | Bloc | Quand |
|---|---|---|
| « Ordre de fabrication des composants » (`A, B, C` → `B, A, C`) | fiche | **une seule**, quand l'ordre **relatif** des lignes conservées change (un ajout en tête n'en crée pas) |
| « Composant ajouté « X » » / « Composant retiré « X » » | fiche | valeur lisible « X × q (ind. I) [mère] », définition complète dans `detail` |
| « Composant « X » — quantité » | fiche | quantité changée |
| « Composant « X » — révision » | fiche | `nom_id` changé : « X — ind. A » → « X — ind. B » (n° et indice, jamais l'id interne, gardé dans `detail` ; « indice non renseigné » au lieu de « ? ») |
| « Composant « X » · prix » (et `indice`, `type_nom`, `code` / `num_nom` hors identité à `nom_id` égal) | recalcul | copies tirées de la fille |
| « Composants · indice et type complétés automatiquement (pas une saisie) » | recalcul | **une seule** entrée pour toute la liste, au 1ᵉʳ enregistrement d'une mère d'avant H2 (lignes sans `indice` / `type_nom`) |

`rang` n'est **jamais** comparé ligne à ligne (il découle de l'ordre). Libellés **définitifs** (journal en ajout seul) :
« mère » et non « mere ».

### Analyse DT d'une pièce mère (signalement, aucun changement de calcul)

`GET /api/be/analyse-dt/:id` ajoute à une pièce mère `mere: { sous_ensembles: [{ chemin, piece, qte, niveau, statut }],
cout_non_inclus: true, avertissements }` (même développement que la cascade : `developperArbre` + `resolveurProduction`) ;
`/be/analyse` affiche un bandeau orange : « Pièce mère : le coût affiché ne compte que les étapes propres de la mère ; ses
N sous-ensembles seront fabriqués en sous-lots et ne sont PAS chiffrés ici. » ⚠ Conséquence : une offre sur une pièce mère
reste **sous-évaluée** tant que le chiffrage récursif n'est pas arbitré.

### Module pur `src/nomenclature_arbre.ts`

Aucune dépendance à Hono ni à Supabase ; seuls imports : `composantsDe`, `estAnnule` (`./shared`). Utilisé par le serveur
(`index.tsx`, `queries.ts`) et au **rendu serveur** de `be.tsx` / `prod.tsx` — **jamais injecté dans le navigateur** (à la
différence de `src/prix_moyen.ts`) : les deux miroirs client (tri des composants par rang, clé de tri de la goulotte) font
trois lignes et sont commentés sur place. `src/shared.ts` ne le réexporte **pas** (import circulaire) : importer depuis
`./nomenclature_arbre`. Familles d'exports : composants (`cleNomenclature`, `cleComposant`, `composantsOrdonnes`,
`normaliserComposants`, `deplacerComposant`), contrôles (`resolveurEdition`, `resolveurProduction`, `dernieresRevisions`,
`revisionsRetenues`, `ancetresDe`, `hauteurAncetres`, `carteAncetres`, `controlerComposants`), production (voir
[production.md](production.md#lot-h2--sous-lots-des-pièces-mères-18092026)). Tests : `node scripts_doc/test_nomenclature_arbre.mjs`
(**147 PASS**, dont la section 6 = journal des composants).

### Vérifications (BE)

`npx tsc --noEmit` 0 erreur · `test_nomenclature_arbre` 147 PASS · `test_prix_moyen` 220 PASS · harnais toutes pages 60 PASS /
0 FAIL / 1 SKIP · Playwright sur le Docker local : éditeur de mère 31/31 puis 77 (réordonnancement de M1, enregistrement,
réouverture dans une page neuve = même ordre, rangs 1, 2, 3 en base, refus 409 cycle et profondeur **sans rien modifier en
base**), bouton « Demande de prix » et journal aux 4 largeurs · données `-TEST-H2-` supprimées et relues (0), journal
EN 9100 resté à 0 entrée (nomenclatures de test insérées en SQL, jamais par l'API).

**Captures de la doc** (18/09/2026, stack Docker locale — la seule base qui a `cloud-14` — avec un jeu `-TEST-DOCH2-`
supprimé et relu ensuite — nombre de lignes de chaque table identique avant / après) : `form-be-nomenclature` (bouton
« Demande de prix » libellé ; `136290` y a sa quantité par paquet, 017 étant jouée sur le Docker), nouvelle
`form-be-nomenclature-mere` (composants ordonnés, sous-mère dépliée, résumé de fabrication ; posés dans le navigateur, rien
n'est enregistré), `be-noms`, nouvelle `be-noms-meres` (« 2 composants dont 1 mère »). Pas de capture du journal pleine
largeur : le journal du Docker est vide (et reste vide : aucune entrée de test n'y est écrite).

---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/be.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
