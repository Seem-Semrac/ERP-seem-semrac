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

Le formulaire nomenclature est en **deux colonnes** : saisie des champs à gauche (`minmax(340px, 0.78fr)`), déclaration des process et gamme à droite (`minmax(0, 1.22fr)`) — la gamme porte 10 colonnes depuis l'ajout de ROP/RGM et a besoin de la place.

**Deux temps de réglage** depuis le 09/09/2026 — la gamme distingue **ROP** (réglage opérateur, imputé au **taux MO**) et **RGM** (réglage machine, imputé au **taux machine**). Un réglage occupe souvent les deux simultanément, ce que le champ unique ne permettait pas d'exprimer. Les deux restent des **coûts fixes par lot**, jamais multipliés par la quantité.

| Forme d'étape | ROP | RGM |
|---|---|---|
| Formulaire BE (minutes) | `temps_reglage_min` | `temps_reglage_machine_min` |
| Gamme importée (millièmes) | `temps_reglage_op_mille` | `temps_reglage_machine_mille` |

**Compatibilité ascendante** : si aucun des deux champs n'est renseigné, `etapeDecomp()` retombe sur le champ historique `temps_reglage_mille`, imputé à la ressource de l'étape — les nomenclatures déjà chiffrées gardent **exactement** le même coût. Vérifié par 7 cas de non-régression (ancien format machine et homme, nouveau format, ROP seul, RGM seul, forme minutes).

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
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/be.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
