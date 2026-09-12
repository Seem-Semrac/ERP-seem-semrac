> 🧠 [Cerveau (accueil)](README.md) · Voisines : [🖥️ Frontend](01-frontend.md) · [🗄️ DB & API REST](03-db-et-api-rest.md)

# ⚙️ Brique 02 — BACKEND

**État : ✅ Fait** — la logique serveur : routage, droits, règles métier, accès aux données.

## L'idée en une phrase
Un seul programme **Hono** reçoit chaque requête, vérifie **qui a le droit**, exécute la **règle métier**, lit/écrit dans la base, puis renvoie soit une **page** (frontend), soit du **JSON** (API).

## Le trio de fichiers à connaître
| Fichier | Rôle | Lignes |
|---|---|---|
| [`src/index.tsx`](../src/index.tsx) | **Le routeur** : ~290 routes. Le point d'entrée (`export default app`). Câble chaque URL à sa page ou son handler. | 6 950 |
| [`src/queries.ts`](../src/queries.ts) | **L'accès aux données** : toutes les fonctions qui lisent/écrivent dans Supabase (ex. `upsertReferenceClient`, `createDemandeTravaux`). Aucune requête DB ailleurs. | 2 381 |
| [`src/auth.ts`](../src/auth.ts) | **Les droits (RBAC)** : 13 rôles × 15 services, login matricule+PIN, JWT, hachage PBKDF2. | 245 |

+ [`src/types.ts`](../src/types.ts) (types partagés, 1 055 l.) · [`src/db.ts`](../src/db.ts) (client Supabase) · [`src/qref.ts`](../src/qref.ts) (référentiels QHSE).

## Où ça tourne
Aujourd'hui : **Cloudflare Pages** (runtime « edge » Workers). Le code lit ses secrets via `c.env` (jamais en dur). Demain : **Node dans Docker** — voir [🐳 Docker](04-docker.md) (petit adaptateur Worker→Node à prévoir).

## Les routes (comptage réel)
**146 GET · 87 POST · 2 PUT · 24 DELETE**, dont **~130 sous `/api/*`**. Réparties par service :

| Service | Routes | | Service | Routes |
|---|---|---|---|---|
| production | 28 | | qualité | 10 |
| commercial | 18 | | achats | 9 |
| dashboard | 14 | | be / stock | 6 / 5 |
| rh | 10 | | oas / maintenance / finances | 4 chacun |

## Les droits (RBAC) — le point sensible
- **Login** : matricule + PIN → session **JWT** en cookie (PIN hachés PBKDF2, re-hash paresseux).
- **Contrôle** : `serviceFor(path)` associe chaque URL à un service ; `canAccess` décide. **Fail-closed** : une `/api/*` non mappée est refusée par défaut (corrigé lors de l'audit).
- **Activation** : `AUTH_ENFORCE=on` (off en bêta) + compte de secours `BOOTSTRAP`.
- **4 points de câblage** par service (MENU_SERVICES, PAGE_SEG_SERVICE, API_FAM_SERVICE, canAccess) → toute nouvelle route doit les respecter (skill `erp-new-module`).
- **Confidentialité au niveau champ** : une donnée sensible peut être gardée serveur selon le droit d'écriture. Ex. le **taux horaire** de la fiche employé n'est **sérialisé côté client que si `canAccess(user,'/api/rh/salarie','POST')`** (droits d'écriture RH) ; sinon `null` — masqué (`***`), jamais dans la page. Révélé « au clic maintenu » pour les autorisés.

## Les grands flux métier (câblés dans le backend)
- **BE** : DT → **analyse BE** (`/be/analyse` déverse la nomenclature : CRU, **couverture matière/stock/seuils**, gamme identique à la nomenclature — étapes verrouillées + étapes glissables, exigences = DT, plan client ouvrable, upload GED `analyse_dt`) → **offre** (brouillon) → planning ; **répertoire réfs clients** (réf interne ↔ client ↔ réf client ↔ plan). Une **DT mixte Seem/Semrac** s'analyse en **2 volets** (un par site, chaque pièce individuelle) ; l'**offre fusionnée** n'est créée qu'aux deux volets terminés (`POST /api/dt/:id/analyse` param `site`, avancement dans la méta `sites`, sans migration).
- **Traçabilité EN 9100** : toute écriture sur une nomenclature **validée** (fiche, gamme, fournitures, prépa technique, GED, nouvel indice, suppression) ajoute une entrée à `nomenclature_journal` — auteur tiré de la session, écarts avant → après calculés par `src/nomenclature_journal.ts` ; sans la table, la sauvegarde passe et la réponse dit `journal: false`.
- **Commercial** : offre (les **avoirs client en cours** s'affichent en **déduction → net**) → **commande** (les avoirs sont **décomptés à l'acceptation**, plus ancien d'abord → `partiel`/`cloture`) → BL (partiels) → **facture** (PDF).
- **Retour client** : NC → avoir (AV-) *ou* commande prioritaire (CMDP-) → « Lancer la production ».
- **Achats** : DA → BC → réception (BL) → PV → NC/quarantaine → **décision sur le lot** : renvoi au fournisseur, dérogation avec le fournisseur (entrée en stock, réfaction possible) ou **entrée partielle** (le reste repart ou part au rebut) — `POST /api/qualite/quarantaine/:id/decision-fournisseur`. Compensation **avoir** (registre des Achats, `avoirs_fournisseurs`) ou **remplacement** (`qte_recue` du BC décrémentée, retour en `recu_partiel`). La décision est **réservée atomiquement** (transition conditionnelle `en_cours` → décidé) avant tout effet, et chaque effet raté est **dit** dans la réponse ; le statut du BC se recalcule au même endroit pour tous (`recalculerStatutBc` : PV conforme **ou** lot tranché). Matière renvoyée sans remplacement ⇒ la porte matière **reste fermée**.
- **Avoirs fournisseurs** : `POST /api/achats/avoirs-fournisseurs` (+ `/recu`, `/imputer`, `/annuler`) — cycle à recevoir → reçu → partiel → soldé, annulation motivée, jamais de suppression ; transitions **conditionnelles** (statut et montant imputé attendus) pour qu'un euro ne soit pas imputé deux fois.
- **Stock** : toute **nouvelle référence de catalogue** (`produits_fournisseurs`) crée une **entrée `stock` vide** automatiquement (idempotent) — le stock reflète le catalogue, se remplit via les BL.
- **Qualité** : NC → 8D ; contrôles cotes → Cp/Cpk ; dérogations. **Portes qualité** : un BL est **bloqué (409)** si NC/quarantaine.

## Quand cette brique change → à maintenir
1. Nouvelle route → câbler les **4 points RBAC** + `queries.ts` (jamais de requête DB dans une page).
2. `npm run verify` (tsc + build + harnais) **vert** avant commit.
3. Mettre à jour [`docs/technique/07-api-reference.md`](../docs/technique/07-api-reference.md) (généré) et cette page si une famille de routes apparaît.

## Pour aller plus loin
[`docs/technique/04-auth-rbac.md`](../docs/technique/04-auth-rbac.md) · [`docs/technique/07-api-reference.md`](../docs/technique/07-api-reference.md) · [`docs/technique/05-conventions-code.md`](../docs/technique/05-conventions-code.md)
