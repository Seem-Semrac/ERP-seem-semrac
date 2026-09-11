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
Masse en g ; temps en millièmes d'heure ; réglage = coût FIXE/lot ; prix matière auto <3 mois sinon RFQ ; indices A/B/C ; drag-drop des process.

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

Pour **tracer** une modification de fond (gamme, matière) sur une pièce validée, le chemin prévu reste **« Incrémenter l'indice »** : il crée une révision et conserve l'ancienne.

**Le plan s'ouvre là où son nom est écrit (11/09/2026).** Le champ *Nom du fichier CAO* (`plan_fichier`) n'est que du texte ; le fichier vit dans la GED, zone *Plan CAO*, plus bas dans le formulaire. On cherchait le plan là où son nom apparaît, sans pouvoir l'ouvrir. Un lien **« Ouvrir le plan »** est désormais posé sous ce champ (`nomRenderLienPlan()`, appelé par `gedRenderAll()`) : il vise le document GED dont le nom égale `plan_fichier`, à défaut le dernier plan joint. Si seul le nom existe, sans fichier déposé, un message le dit au lieu de laisser croire que le plan est là. `GET /api/ged/file/:id` n'a pas changé : il servait déjà correctement le fichier, vérifié avec et sans authentification.

> Gotcha d'échappement : les boutons utilisent `this.previousElementSibling.click()` et non `getElementById('…')`. Une apostrophe imbriquée dans un `onclick` construit à l'intérieur d'une chaîne JS elle-même dans un template literal se fait manger (`'` → `'`) et casse tout le script client — panne invisible au build comme au typecheck.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/be.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
