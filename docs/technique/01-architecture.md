# 01 — Architecture

## Vue d'ensemble
ERP GPAO **mono-application** couvrant 15 services métier (commercial, BE, achats, production, OAS, qualité, sécurité/HSE, expéditions, stock, maintenance, plan bâtiment, RH, compta, direction). Conforme aux exigences EN 9100:2018 / ISO 9001:2015 (traçabilité par affaire, par lot, par opérateur).

## Stack
| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| Runtime | **Cloudflare Pages / Workers** | — | Exécution du serveur (`dist/_worker.js`) en edge |
| Framework | **Hono** | ^4.12 | Routeur HTTP + rendu **SSR** (aucun framework client) |
| Rendu | TSX **server-side** | — | Les pages sont des fonctions `(data) => string` (HTML) |
| Base de données | **Supabase** (PostgreSQL + PostgREST) | client ^2.105 | Données + API REST auto-générée |
| Build | **Vite** + `@hono/vite-build` | ^6.3 | Bundle unique `dist/_worker.js` |
| Déploiement (actuel) | **Wrangler** / Cloudflare Pages | ^4.4 | `wrangler pages deploy dist` |
| Déploiement (cible) | **Docker auto-hébergé** | — | Stack Supabase + app + N8N sur serveur propre — voir `../ROADMAP-2mois.md` |
| Front | HTML + Tailwind (CDN) + FontAwesome + JS *vanilla* inline | — | Interactivité côté client via `<script>` générés |

## Principe SSR « sans framework client »
Chaque page est une **fonction TSX qui retourne une chaîne HTML complète**, incluant ses propres `<style>` et `<script>` (JS *vanilla*). Il n'y a **ni React, ni build client, ni hydratation**. Les données serveur sont injectées dans le HTML (via `JSON.stringify` échappé, helper `sjX`) et le JS client les lit dans des variables globales.

**Pourquoi ce choix** :
- Un seul artefact déployable (`dist/`), démarrage edge instantané, pas de tuyauterie client/serveur.
- Simplicité de maintenance : une page = un fichier, pas de séparation composant/état/API à synchroniser.
- **Contrepartie** : le JS client vit dans des *template literals* → discipline d'échappement stricte (voir `05-conventions-code.md`) et un harnais de vérification dédié (`scripts_doc/harness_all_pages.mjs`).

## Flux d'une requête
```
Navigateur → Cloudflare Worker (dist/_worker.js)
           → Hono : middleware d'auth (JWT cookie → canAccess) [src/index.tsx ~L114]
           → route : app.get('/x/service') charge les données (queries.ts → Supabase PostgREST)
           → pageServiceX(data) retourne le HTML complet
           → réponse HTML (le JS inline s'exécute côté navigateur)
Actions   → le JS client appelle les routes /api/... (fetch) → JSON
```

## Découpage du code (`src/`, ~41 000 lignes / 35 fichiers)
| Fichier | Rôle | ~Lignes |
|---|---|---|
| `index.tsx` | **Routeur** : toutes les routes pages + API (~290), middleware d'auth | 6 800 |
| `queries.ts` | **Accès données** : toutes les fonctions Supabase (`getX/createX/…`) | 2 300 |
| `db.ts` | Client Supabase (URL + clé anon) | — |
| `auth.ts` | **RBAC** : rôles, `serviceFor`, `canAccess`, login helpers | — |
| `shared.ts` | `layout`, `serviceHeader`, sidebar, helpers UI réutilisables | — |
| `types.ts` | Interfaces métier (Commande, Lot, NonConformite, …) | 1 050 |
| `<module>.tsx` | Une page par service (commercial, be, prod, qualite, securite, …) | 1 000–3 400 |
| `qref.ts` | Référentiels QHSE (zones, secteurs, EPI…) — source unique | — |
| `kpi.ts` / `dashboards.tsx` | Moteur KPI + 14 dashboards (Chart.js) | — |

## Conventions structurantes
- **Numéro d'affaire** = fil conducteur (DT → offre → commande → facture → nomenclature → lot → BDT). Beaucoup de liens sont **souples** (texte `num_affaire`/`cmd_ref`) plutôt que des FK dures — voir `03-base-de-donnees.md`.
- **Identifiants texte lisibles** : `CMD-2026-1081`, `LOT-…-N`, `BDT-…-N-A`, `AV-2026-XX`, `NC-2954`.
- **Portabilité** : le code ne dépend que de `fetch` + client Supabase (aucune API propriétaire d'hébergeur) → il tourne aussi bien sur Cloudflare **que** dans un conteneur Node (Docker), ce qui rend l'auto-hébergement cible immédiat.

### Barre latérale repliable (2026-08-24)
- Bouton **hamburger** (3 barres) dans l'en-tête de `SIDEBAR_V2` (`#erpSidebarHide`) + bouton flottant de réouverture en haut à gauche (`#erpSidebarShow`, `position:fixed`, affiché uniquement replié).
- `erpToggleSidebar()` / `erpApplySidebar(off)` dans `layout()` ; état persisté dans `localStorage.erpSidebar` (`'on'` / `'off'`).
- ⚠ L'IIFE de restauration est placée **juste après l'`<aside>`, avant le `<main>`** : plus bas, l'utilisateur verrait le menu apparaître puis disparaître à chaque chargement.
- Mesuré : contenu **1029 px → 1265 px** replié (viewport 1280), soit les 236 px de la barre rendus au contenu.
