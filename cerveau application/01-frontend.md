> 🧠 [Cerveau (accueil)](README.md) · Voisines : [⚙️ Backend](02-backend.md) · [📖 Utilisation](07-utilisation.md)

# 🖥️ Brique 01 — FRONTEND

**État : ✅ Fait** — c'est l'interface que voit l'utilisateur dans son navigateur.

## L'idée en une phrase
Le frontend est **rendu côté serveur** (SSR) : le serveur fabrique la page HTML **entièrement finie** et l'envoie au navigateur. **Aucun framework client** (pas de React/Vue). L'interactivité est du **JavaScript vanilla** glissé dans les pages.

Pourquoi ce choix ? Simplicité et robustesse : une techno de moins à maintenir, un rendu rapide, et un mainteneur externe n'a besoin de connaître que **HTML + JS de base**.

## Comment c'est fait ici
- **TSX côté serveur** : chaque page est une fonction qui renvoie du HTML (via JSX Hono). Ex. `pageDTStatuts(...)`, `pageClientFiche(...)`.
- **Layout commun** : [`src/shared.ts`](../src/shared.ts) (621 l.) = la barre latérale, l'en-tête, les helpers d'affichage réutilisés partout. [`src/renderer.tsx`](../src/renderer.tsx) = l'enveloppe HTML.
- **Style** : CSS **en ligne** dans les templates (pas de framework CSS). Cohérence assurée par les helpers de `shared.ts`.
- **Interactivité** : du JS écrit dans des *template strings* (ex. `onclick="nomRefClientAdd()"`). Les gros écrans (planning, dashboards) embarquent leurs propres fonctions.
- **Graphiques** : [`src/dash_ui.ts`](../src/dash_ui.ts) + Chart.js pour les 14 tableaux de bord.
- **Formulaires riches** : certains écrans embarquent beaucoup de JS client — ex. l'**analyse DT** ([`/be/analyse`](../src/index.tsx), dans le routeur) : listes déroulantes reliées à la base, gamme drag-drop (étapes verrouillées + glissables), CRU recalculé en direct, **upload GED** de documents, triplet réf/plan/client. Même piège d'échappement que les autres pages (ci-dessous).
- **Connexion** : [`src/login.tsx`](../src/login.tsx) = l'écran matricule + PIN.

## Les pages (fichiers `.tsx`, par taille)
| Fichier | Rôle | Lignes |
|---|---|---|
| `commercial.tsx` | Clients, offres, commandes, DT, fiche client | 3 409 |
| `prod.tsx` | Production, OF/BDT, lots, machines | 3 287 |
| `be.tsx` | Bureau d'études : nomenclatures, GED, répertoire réfs | 2 557 |
| `qualite.tsx` | Non-conformités, 8D, contrôles, dérogations | 2 137 |
| `planning_bdt_bds.tsx` | Le planning de production (drag, encadrés) | 1 794 |
| `rh_service.tsx`, `affectation.tsx`, `compta_service.tsx`, `listes.tsx` | RH, affectation, compta, listes/référentiels | 1 200-1 500 |
| `stock_service.tsx`, `securite.tsx`, `achats.tsx`, `expeditions.tsx`, `oas.tsx` | Stock, HSE, achats, expéditions, traitement OAS | ~1 000 |
| + `maintenance_service.tsx`, `finances.tsx`, `rapport8d.tsx`, `dashboards.tsx`, `fournisseur_fiche.tsx`, `direction_service.tsx`, `plans.tsx` | Autres services | 400-855 |

## ⚠️ Le piège central du frontend (à connaître absolument)
Le JS client vit **dans des chaînes de texte** TSX. Les apostrophes et retours à la ligne doivent être **doublement échappés** (`\\'`, `\\n`), sinon la page casse silencieusement. **C'est la 1ʳᵉ cause de régression du dépôt.**
→ Filet de sécurité : `node scripts_doc/harness_all_pages.mjs` (le *harnais*) exécute le JS de **toutes** les pages et attrape ces bugs. Conventions détaillées dans le skill [`erp-new-module`](../.claude/skills/erp-new-module/SKILL.md).

## Quand cette brique change → à maintenir
1. **L'UI a changé** → rafraîchir les captures : skill [`erp-screenshots`](../.claude/skills/erp-screenshots/SKILL.md) + mettre à jour [📖 Utilisation](07-utilisation.md).
2. **Toujours** → harnais vert avant commit.
3. Mettre à jour cette page si un écran majeur est ajouté/retiré.

## Pour aller plus loin
[`docs/technique/01-architecture.md`](../docs/technique/01-architecture.md) · [`docs/technique/05-conventions-code.md`](../docs/technique/05-conventions-code.md)
