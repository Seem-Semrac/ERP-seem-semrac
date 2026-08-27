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

## Accès données (`queries.ts`)
- Une fonction par opération : `getX()` (lecture, retourne `[]` en fallback), `createX/updateX/deleteX` (retournent `{data, error}` supabase-js).
- **supabase-js ne lève pas d'exception** sur erreur DB → **toujours vérifier `error`** (ne pas faire `.catch(()=>{})` qui masque un échec partiel — cf. audit R4).
- Ids texte lisibles générés côté serveur (pas de séquence auto pour la plupart).

## Routes (`index.tsx`)
- Pages : `app.get('/x/service', c => c.html(pageServiceX(data)))`.
- API : `app.{post,patch,delete}('/api/<famille>/…')`. **Toute nouvelle famille doit être mappée dans `auth.ts`** (`API_FAM_SERVICE`) sinon elle est refusée (fail-closed).
- Validation d'entrée : borner les montants/quantités (`Math.max(0, …)`), garder l'idempotence sur les actions à effet financier (cf. `traiter-retour` / `lancer`).

## Convention de commit
Messages descriptifs en français (ASCII), préfixe `type(scope): …`. Terminer par `Co-Authored-By: Claude …`. Committer code **et** doc ensemble (skill `erp-doc-sync`).
