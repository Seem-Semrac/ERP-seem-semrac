---
name: erp-new-module
description: Patron complet pour ajouter un service, un onglet ou une famille d'API à l'ERP — tous les points de câblage (sidebar, RBAC, queries, routes, page) et les conventions du JS client dans les templates TSX. À invoquer pour toute nouvelle fonctionnalité structurante.
---

# erp-new-module — Ajouter un service / onglet / API

## Les 8 étapes (dans l'ordre)
1. **Table(s)** si besoin → skill **erp-db** (DDL + `scripts_import/*.sql`).
2. **Queries** (`src/queries.ts`) : `getX/createX/updateX/deleteX` — suivre les patterns existants (`supabase.from('table')...`, retour `{data,error}` pour les mutations).
3. **Page** (`src/<module>.tsx`) : `export const pageServiceX = (data) => layout('Titre', content, 'service-x')`. En-tête à onglets via `serviceHeader({icon,color,title,tabs,switchFn,tabIdPrefix,activeId})` (`src/shared.ts`). Injecter les données serveur→client via `const sjX = v => JSON.stringify(v).replace(/</g,'\\u003c')`.
4. **Routes** (`src/index.tsx`) : `app.get('/x/service', ...)` qui charge les données (`Promise.all` + `.catch(()=>[])`) + les routes `/api/x/...` (import des queries en tête de fichier).
5. **Sidebar** (`src/shared.ts`, `SIDEBAR_ITEMS`) : `{ href:'/x/service', icon:'fa-…', label:'…', active:'service-x' }`.
6. **RBAC** (`src/auth.ts`) — **4 points, tous obligatoires** sinon la route est mal gatée :
   - `MENU_SERVICES` : ajouter `'x'`
   - `PAGE_SEG_SERVICE` : `x: 'x'` (segment d'URL → service)
   - `API_FAM_SERVICE` : `x: 'x'` pour CHAQUE famille `/api/<fam>/…` du module (une famille oubliée = service null = gating par défaut)
   - `ROLE_MATRIX` (rw/r par rôle) ou cas particulier dans `canAccess`
7. **Tuile d'accueil** (`src/index.tsx`, tableau `services` de `app.get('/')`) si le service mérite l'accueil.
8. **Vérifier** → skill **erp-verify** ; **documenter** → skill **erp-doc-sync**.

## Conventions du JS client dans les templates TSX (LA source de bugs n°1)
Le HTML+JS client est généré dans des template literals TS. Règles absolues :
- **Chaînes JS clientes en guillemets DOUBLES**, attributs HTML en simples : `"<div class='x'>"` — évite l'enfer des apostrophes françaises.
- Apostrophe dans une chaîne simple-quote côté client : écrire **`\\'`** dans le TSX (qui produit `\'`). Un seul `\'` produit `'` → **casse tout le script silencieusement**.
- Saut de ligne destiné au client (`confirm`, `alert`) : **`\\n`** dans le TSX, jamais `\n`.
- `</script>` à l'intérieur d'un script : écrire `<\\/script>`.
- Caractères spéciaux : `\\u2713` (✓), `\\u2014` (—), `\\u00e9` si doute d'encodage.
- Données → client : **toujours `sjX(...)`** (échappe `<`) ; texte → HTML : `esc`/`escX`.
- Préférer la **délégation d'événements** (`data-act` + un seul listener `document.addEventListener('click', …)`) aux `onclick` inline avec arguments — supprime la plupart des problèmes d'échappement.
- `${}` interpole côté SERVEUR : pour un `$` littéral client, l'échapper ; ne jamais interpoler de saisie utilisateur sans `esc`.
- Fonctions client en `function(){}` et `var` (cohérence avec l'existant).
- **Contrôle final : `node scripts_doc/harness_all_pages.mjs`** — il attrape exactement cette classe d'erreurs.

## Patterns UI réutilisables (ne pas réinventer)
- CRUD générique : `hseCrud(path, fields, fns)` (index.tsx) — whitelist de champs + POST/PATCH/DELETE.
- Sélection multiple/suppr. groupée : `bulkToolbar`/`bulkSelectAssets` (shared.ts).
- Case « soumettre à validation Direction » : `validationCheckbox`/`submitValidation` (shared.ts).
- Notifications : `pushNotif(type, icone, message, durée)` présent sur toutes les pages.
- Grosses listes dans un `<select>` → préférer `<input list>` + `<datalist>` (typeahead).
- Modales : div fixed `display:none` → `style.display='flex'` (voir `bdtModal`, `retourModal`).
