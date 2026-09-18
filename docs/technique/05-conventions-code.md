# 05 — Conventions de code

## Structure d'une page SSR
```ts
export const pageServiceX = (data) => {
  const content = `
    ${serviceHeader({ icon, color, title, tabs, switchFn:'switchX', tabIdPrefix:'x-tab', activeId:'…' })}
    <div id="x-tab-...">…</div>
    <script>
      var DATA = ${sjX(data.rows)};   // données serveur -> client
      function switchX(id){ … }        // JS vanilla, guillemets doubles
    </script>`
  return layout('Titre', content, 'service-x')   // layout = sidebar + shell
}
```
- `layout(title, content, activeKey)` et `serviceHeader(...)` sont dans `src/shared.ts`.
- Les onglets : boutons `#<prefix>-<id>` + panneaux `#<prefix>-<id>` masqués/affichés par `switchFn`.

## JS client dans les *template literals* — LA source de bugs n°1
Le JS client est écrit dans des chaînes TSX. Deux passes d'échappement se superposent (template TS → HTML → parseur JS du navigateur). Règles :

| Règle | Bon | Piège |
|---|---|---|
| Chaînes JS client en **guillemets doubles**, attributs HTML en simples | `"<div class='x'>"` | apostrophes françaises qui cassent |
| Apostrophe dans une chaîne JS simple-quote | **`\\'`** (produit `\'`) | `\'` seul → `'` → **casse tout le script** |
| Saut de ligne pour le client (`confirm`, `alert`) | **`\\n`** | `\n` → vrai retour ligne → SyntaxError |
| `</script>` imbriqué | `<\\/script>` | ferme le script prématurément |
| Caractères spéciaux | `\\u2713` (✓), `\\u2014` (—) | encodage cp1252 |
| Données → client | **`sjX(v)`** (échappe `<`) | `JSON.stringify` brut → `</script>` breakout |
| Texte utilisateur → HTML | **`esc`/`escX`** (échappe `& < > " '`) | injection / XSS stocké |

**Ces règles sont vérifiées automatiquement** par `node scripts_doc/harness_all_pages.mjs` (rend chaque page, `new Function` sur chaque `<script>`). ⚠ Il ne couvre pas les pages **inline dans `index.tsx`** (non exportées) — les relire à la main.

### Partager une règle métier entre le serveur et le navigateur (lot H1, 17/09/2026)

Plutôt qu'un **miroir écrit à la main** (`BE_ETAPE_COUT_JS`, `CADENCE_CLIENT_JS`… : deux copies à faire évoluer ensemble), un module pur peut **générer sa propre copie navigateur** par `Function.toString` — c'est ce que fait `prixMoyenClientJs()` (`src/prix_moyen.ts`). Le texte produit s'injecte tel quel (`${prixMoyenClientJs()}`) : ce n'est pas une donnée, il n'y a **rien à échapper**. Conditions à respecter dans un tel module, sinon la page casse **en production seulement** (le bundle Cloudflare est minifié) :

- aucun `import`, aucune référence à une constante de module, pas de `let`/`const` de portée module — chaque fonction doit être **autonome** ;
- syntaxe **ES5**, texte **pur ASCII** (`\\u…` pour les accents), sans accent grave, sans `${`, sans `</` ;
- un test qui rejoue la suite **sur le bundle minifié** et compare serveur ⟷ client (`scripts_doc/test_prix_moyen.mjs` : 220 assertions, JSON identique des deux côtés).

**Lancer les tests** : `node scripts_doc/test_prix_moyen.mjs` depuis la racine du dépôt (utilise l'`esbuild` du `node_modules` local, aucune dépendance à installer, aucune base touchée) → attendu `220 PASS · 0 FAIL`. Il couvre le prix moyen (1 fournisseur, paquets de 100 et de 50, fournisseur sans prix, conditionnement non déclaré, prix périmé au jour près, casse / espaces / accents, matière avec pièces par tôle, base sans `qte_paquet`), la recherche, les doublons (dont `constructor` / `__proto__`) et le journal EN 9100 (bascule ancien → nouveau modèle). **À relancer après toute modification** de `src/prix_moyen.ts` ou de `src/nomenclature_journal.ts`, et avant `erp-verify`. Un nouveau module partagé de ce type doit venir avec son propre test sur le même modèle.

### Un module pur rendu au serveur seulement : `src/nomenclature_arbre.ts` (lot H2, 18/09/2026)

Contre-exemple assumé de `prix_moyen.ts` : l'arbre des nomenclatures mères et des sous-lots est calculé **au rendu serveur**
(`be.tsx`, `prod.tsx`) et par les routes (`index.tsx`, `queries.ts`) ; il n'est **jamais injecté** dans le navigateur. Le
navigateur reçoit des **résultats** (`${sjX(carteAncetres(NOMS))}`, `ORDRE_FAB`, `VIGIL_PAR_ID`…), et les deux seuls
miroirs client — tri des composants par rang (`nomCmpOrdonnes`) et clé de tri de la goulotte (`k + '~'`, `cmpOrdreFab`) —
font trois lignes, **commentés comme miroirs** sur place. Règles : aucune dépendance à Hono ni à Supabase ; seuls imports
`composantsDe` et `estAnnule` (`./shared`) ; **pas de réexport par `shared.ts`** (import circulaire) — importer depuis
`./nomenclature_arbre`. Les fonctions d'avancement / vigilance (`lotFini`, `avancementArbre`, `vigilanceSousLots`,
`vueArbreLot`…) mettent leur index en cache **par identité** du tableau `lots` : un tableau modifié **en place** entre deux
appels doit être recopié (`[...lots]`). Traduire les avertissements d'arbre par `e.message` (ne pas écrire de
`Record<CodeErreurArbre, …>` exhaustif : le type s'enrichit, ex. `revision_differente`).

**Lancer les tests** : `node scripts_doc/test_nomenclature_arbre.mjs` (même patron que `test_prix_moyen.mjs`, aucune base) →
attendu `147 PASS · 0 FAIL`. À relancer après toute modification de `src/nomenclature_arbre.ts` ou de
`src/nomenclature_journal.ts` (sa section 6 couvre `diffComposants`), et avant `erp-verify`.

**XSS** : ne jamais injecter une donnée base/utilisateur via `innerHTML` sans échappement côté client. Les scripts définissent au besoin un échappeur local (`pEsc`, `rtEsc`, `esc`) — l'utiliser sur `client_nom`, `piece`, `operation`, noms de salariés, libellés libres.

## Helpers réutilisables (ne pas réinventer)
| Besoin | Helper (fichier) |
|---|---|
| Injection données JSON échappée | `sjX = v => JSON.stringify(v).replace(/</g,'\\u003c')` |
| Échappement HTML | `esc` / `escX` (par page) |
| Layout + sidebar | `layout`, `SIDEBAR_ITEMS` (shared.ts) |
| En-tête à onglets | `serviceHeader` (shared.ts) |
| CRUD HSE générique | `hseCrud(path, fields, fns)` (index.tsx) |
| Sélection multiple / suppression groupée | `bulkToolbar` / `bulkSelectAssets` (shared.ts) |
| Case « validation Direction » | `validationCheckbox` / `submitValidation` (shared.ts) |
| Notifications | `pushNotif(type, icone, message, durée)` |
| **Rafraîchir une liste** après CRUD | **`softReload()`** (shared.ts) → recharge en **conservant la position de défilement** (et l'onglet via le hash). **Ne PAS utiliser `location.reload()` nu.** |
| **Confirmation** (« êtes-vous sûr ? ») | **`await appConfirm(message)`** (shared.ts) → `Promise<boolean>`, modale au design de l'app. **Ne PAS utiliser `confirm()` natif.** La fonction appelante doit être `async`. Danger (rouge) auto si le message évoque une suppression. |
| Grosse liste déroulante | `<input list="…">` + `<datalist>` (typeahead) plutôt qu'un `<select>` lourd → **auto-remplacé** par un combobox stylé recherchable (enhancer global du `layout`, `shared.ts`) qui préserve l'`onchange` (re-déclenche `change` à la sélection). Rien à câbler. |
| Modale | div `position:fixed;display:none` → `style.display='flex'` |
| **Coût d'une étape / taux de l'atelier** | Serveur : `construireTauxAtelier(process, salaries, machines)`, `etapeDecomp(e, tx, site)`, `computeNomCostForQty(nom, fournitures, q, { taux, site })`, `coutReelBdt(b, tx, salById)`, `typeProcess(p)` (shared.ts) ; lecture : `getTauxAtelier()` (queries.ts, erreur remontée). Navigateur : `BE_ETAPE_COUT_JS` (be.tsx, miroir exact injecté par `${BE_ETAPE_COUT_JS}`). **Ne jamais recoder un taux ni un classement ROP/RGM/THV/TMV à la main** : toute évolution se fait dans shared.ts **et** dans la chaîne miroir. Donner à `construireTauxAtelier` les lignes `process_atelier` **brutes** (`select *`). |
| **Horaires d'un créneau / d'un jour** (lot G) | Serveur : `lireDonneesCadence()` (cadence_db.ts, `{data, error, absente}` : **trois états**, une panne n'est jamais « tout ouvert ») puis `horairesCreneauSite(donnees, site, date, creneau)`, `creneauxDuJour`, `siteCadence(activite)`, `heuresPresence` (cadence.ts). Page Production : `cadHorairesCreneau(activite, date, creneau)`, `cadCalendrier(activite)`, objet `CAD` (copie ES5 `CADENCE_CLIENT_JS`). **Ne plus lire les horaires de `SHIFTS`** (libellés et couleurs seulement ; horaires = repli). Après un changement : `cadNotifierChangement()`. |
| **Temps du planning** (chemin critique, chevauchement, fin prévue) | `tempsPlanning(donnéesCadence \| null)` (gamme.ts) **une fois par requête**, passé en dernier argument de `auPlusTot` / `controleEnchainement` / `violationsEnchainement` / `successeursEnViolation` ; `heureFermee`, `intervallePosteOuvre`, `ajouterPourOp` (planning_cadence.ts) ; côté serveur `lireCadencePlanning()` (index.tsx : panne → 503). Client : `ccHorloge()`. Règles pures G3/G4 injectables (`intervalle`, `violations`, `ajouter` de poste_oas.ts). **Copies client ligne à ligne** : blocs `==CC-MOTEUR==`, `==POSTE-OAS==`, `==PLAN-CADENCE==`, `==CAD-MOTEUR==` — toute modification se reporte des deux côtés (tests de parité du scratchpad). |
| Bandeau « coût réel non calculable / incomplet » (fiches 360) | `alerteCoutReel(kpi)` + `LIBELLES_MANQUANTS_COUT` (shared.ts) |
| **Composants d'une mère** (lot H0) | `composantsDe(fiche \| valeur)` (shared.ts) → **toujours un tableau** (la colonne a été `text` sur Docker, `jsonb` sur le cloud). **Ne jamais lire `n.composants` directement** ni tester `Array.isArray` à la main. Navigateur BE : `nomComposantsDe`. |
| **Fraîcheur d'un prix catalogue** (lot H0) | `PRIX_VALIDITE_JOURS` (shared.ts, 183 j = 6 mois) ; page BE : `NOM_PRIX_VALIDITE_JOURS` injecté, libellé dérivé. Un prix ≤ 0 n'est jamais frais. Ne plus écrire 92 / 183 / « 3 mois » en dur. |
| **Prix d'une référence, recherche, doublons** (lot H1) | `src/prix_moyen.ts` (réexporté par shared.ts) : `prixMoyenReference`, `normaliserReference`, `memeReference`, `categorieFourniture`, `nombrePositif`, `arrondiPrix`, `qtePaquetDe`, `prixPerime`, `chercherReferences`, `doublonsFournitures` / `messageDoublonFourniture`, `recalculerFournitures`. **Ne jamais recoder une normalisation de référence, un test de catégorie ni une division par un conditionnement.** Côté navigateur : injecter `${prixMoyenClientJs()}` en tête du `<script>` — **mêmes noms, même code** (pas de miroir à maintenir). |
| **Composants ordonnés d'une mère, cycle, profondeur** (lot H2) | `src/nomenclature_arbre.ts` : `composantsOrdonnes` (lecture : ordre = ordre de fabrication), `normaliserComposants` (ce que le serveur stocke), `deplacerComposant`, `cleNomenclature` / `cleComposant` (identité = `lower(trim(code \|\| num_nom))`), `controlerComposants(fiche, toutes)` (409 `cycle_composants` / `profondeur_max`), `carteAncetres`, `PROFONDEUR_MAX_NOMENCLATURE` (5). **Ne jamais lire l'ordre de `n.composants` sans `composantsOrdonnes`.** |
| **Arbre des lots d'une pièce mère** (lot H2) | `developperArbre` → `planLotsArbre` → `attribuerIdsSousLots` (plan idempotent), `idSousLot`, `bonIdDuLot`, `cleBon` (clé racine **inchangée**), `estSousLot`, `parentDuLot` (colonne **ou** id), `racineDuLot`, `niveauDuLot`, `trierArborescence` (affichage : parent puis enfants) / `trierOrdreFabrication` (goulotte : enfants avant parent), `opsParLot`, `lotFini`, `avancementArbre`, `sousLotsNonTermines`, `vigilanceSousLots`, `vueArbreLot`. **Filtrer les racines** par `!parentDuLot(l)` (jamais par un motif d'id à la main) ; présence des colonnes : `lotsArbreDispo()` (queries.ts). ⚠ Jamais de `.or()` PostgREST construit avec des ids de lot. |
| **En-tête de téléchargement d'un fichier** (lot H0) | `dispositionFichier(nom, 'inline' \| 'attachment')` (index.tsx) : repli ASCII + `filename*=UTF-8''…`. **Jamais** de nom brut dans `Content-Disposition` : sous Node, un caractère > U+00FF lève une TypeError. |

## Accès données (`queries.ts`)
- Une fonction par opération : `getX()` (lecture, retourne `[]` en fallback), `createX/updateX/deleteX` (retournent `{data, error}` supabase-js).
- **supabase-js ne lève pas d'exception** sur erreur DB → **toujours vérifier `error`** (ne pas faire `.catch(()=>{})` qui masque un échec partiel — cf. audit R4).
- **Lecture stricte avant écriture** (lot H0) : quand une décision d'écriture dépend d'une lecture, utiliser une lecture qui rend `{ data, error }` et **refuser** en cas d'erreur (une panne n'est jamais « absent ») — ex. `getProduitFournisseurCouple`, `getProduitFournisseurParId`, `getRefPrixHistoriqueRfq`, `getClesBonsStrictes`, `getCleBonParId`, `getNomenclatureStricte`. Pour « créer si absent » : `insertProduitFournisseurSiAbsent` (pas d'upsert complet qui écraserait une ligne existante), puis relecture en cas de course.
- **Écriture tolérante à une colonne absente en cloud** (lot H1) : quand une colonne vient d'être ajoutée par une migration Docker et que son script `cloud-N` n'est pas encore joué, l'écriture passe par un helper `…Tolerant(...)` qui rend `{ data, error, <colonne>_ignoree }` — il réessaie **sans** le champ sur `42703` / `PGRST204` (`erreurQtePaquetAbsente`) ; la route répond alors **200** + `avertissement` (« … jouez `cloud-N` »), **jamais** 500. Côté lecture : `select('*')` **uniquement**, jamais de projection, de filtre ni d'`order` nommant la colonne — sinon la page entière tombe en 42703. Exemples : `updateProduitFournisseurTolerant`, `insertProduitFournisseurSiAbsentTolerant`, `create/updateDemandePrixReponseTolerant`.
- **Colonnes absentes en cloud, version « sonde »** (lot H2) : quand tout un comportement dépend de colonnes nouvelles (les 5
  colonnes de sous-lots de `lots`), on les **sonde une fois** (`lotsArbreDispo()` : `select` des colonnes `.limit(1)` ;
  `42703` / `PGRST204` ⇒ absentes, `{ dispo:false, erreur:null }` ; autre erreur ⇒ **panne**, `{ dispo:false, erreur }`) et on
  choisit le comportement dégradé **annoncé** (mère lancée sans sous-lots + avertissement « jouez cloud-14 ») plutôt que
  d'échouer. Une panne n'est jamais confondue avec « colonnes absentes » (`erreurColonneAbsente`).
- Ids texte lisibles générés côté serveur (pas de séquence auto pour la plupart).

## Routes (`index.tsx`)
- Pages : `app.get('/x/service', c => c.html(pageServiceX(data)))`.
- API : `app.{post,patch,delete}('/api/<famille>/…')`. **Toute nouvelle famille doit être mappée dans `auth.ts`** (`API_FAM_SERVICE`) sinon elle est refusée (fail-closed).
- Validation d'entrée : borner les montants/quantités (`Math.max(0, …)`), garder l'idempotence sur les actions à effet financier (cf. `traiter-retour` / `lancer`).

## Convention de commit
Messages descriptifs en français (ASCII), préfixe `type(scope): …`. Terminer par `Co-Authored-By: Claude …`. Committer code **et** doc ensemble (skill `erp-doc-sync`).
