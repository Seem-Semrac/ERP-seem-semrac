# 04 — Authentification & autorisations (RBAC)

Tout est dans `src/auth.ts` (logique) + middleware dans `src/index.tsx` (~L114).

## Authentification — login matricule + PIN
- Page autonome `src/login.tsx` : champ **matricule** (majuscules auto) + **PIN 4 chiffres**.
- `POST /api/login` → vérifie le PIN (haché **PBKDF2-SHA256**, avec re-hachage paresseux à la volée) → pose un **cookie de session JWT** (algorithme **HS256** — l'algo doit être explicite, cf. gotcha `hono/jwt`).
- Session valable ~12 h. `GET /api/me` renvoie l'utilisateur courant.
- `AUTH_ENFORCE` (env, défaut **ON**) active le gating. **Compte de secours** `ADMIN` / PIN `246810` (bootstrap intégré).
- Routes publiques (`PUBLIC_PREFIXES`) : `/login`, `/api/login`, `/logout`, `/static`, `/api/contact`, `/favicon.ico`.

## Autorisations — modèle
Le middleware appelle `canAccess(user, path, method)` sur **chaque** requête (hors routes publiques). La décision suit :

1. `perms` contient `all` (rôle **direction**) → **autorisé** (tout).
2. Route **self-service** atelier (PIN dans le corps) → autorisé (`isSelfService`).
3. `accesExplicites(perms)` est calculé **ici**, avant tout le reste : dès que la personne porte au moins un jeton `lire:`/`ecrire:`, ces jetons décident seuls — **y compris** pour `interlocuteurs`, `plans` et `habilitations`, qui les ignoraient jusqu'au 09/09/2026.
4. `interlocuteurs` (contacts clients ET fournisseurs), **à défaut de jeton** → autorisé si écriture `rw` sur **commercial/achats/be** (cas multi-services).
5. `serviceFor(path)` déduit le **service** de la route :
   - `/api/<famille>/…` → `API_FAM_SERVICE[famille]`
   - `/<segment>/…` (page) → `PAGE_SEG_SERVICE[segment]`
   - `/dashboard/<segment>` → `DASHBOARD_SERVICE[segment]` — **toute** route `/dashboard/*` doit y figurer, faute de quoi elle retombe en « page inconnue » et s'ouvre à tout compte connecté.
   - routes explicitement neutres (`/api/me`, `/api/ged/file`, soumission `/api/validations`) → `__neutral__` (autorisé au connecté).
6. **Défaut FAIL-CLOSED** (depuis l'audit 2026-07-04) : une route `/api/*` **non mappée** est **refusée** ; une page non mappée reste ouverte au connecté.
7. Sinon : niveau du service dans `ROLE_MATRIX` — **écriture** (POST/PATCH/DELETE) exige `rw`, **lecture** (GET) accepte `r` ou `rw`. Multi-rôles → meilleur niveau.

> ⚠ **Règle d'or pour toute nouvelle route API** : ajouter sa **famille** à `API_FAM_SERVICE` (sinon elle est refusée par défaut). Voir skill `erp-new-module`.

## Les 13 rôles (`ROLE_MATRIX`)
`rw` = lecture+écriture · `r` = lecture seule · (vide) = aucun accès.

| Rôle | Écriture (rw) | Lecture (r) |
|---|---|---|
| **direction** | **tous** (perm `all`) | tous |
| **commercial** | commercial | be, production, qualite, expeditions, stock |
| **bei** (bureau d'études) | be, achats | commercial, production, oas, qualite, securite, stock, maintenance |
| **achats** | achats, stock | commercial, be, production, expeditions, maintenance |
| **production** | production | be, achats, oas, qualite, securite, expeditions, stock, maintenance |
| **oas** | oas | be, production, qualite, securite, stock, maintenance |
| **qualite** | qualite, securite | be, production, oas, expeditions, stock, maintenance |
| **logistique** | expeditions, stock | commercial, achats, production |
| **maintenance** | maintenance | achats, production, oas, securite, stock |
| **comptable** | compta | commercial, achats, expeditions, stock, rh |
| **rh** | rh | production, securite, compta |
| **operateur** | — (aucune) | production, oas, qualite, expeditions |

## Cas particuliers
- **`plans` (Plan/Bâtiment)** : **sans jeton**, lecture ouverte à tout connecté et écriture BE/Production/Maintenance/Qualité/Direction. **Avec jetons**, `lire:plans` / `ecrire:plans` décident seuls.
- **`habilitations`** : **sans jeton**, géré par RH **et** Qualité (jeton `habilitations`), sans donner accès au reste de la RH. **Avec jetons**, suit le niveau accordé sur `rh` ou `qualite` — sinon fermer la RH par les cases laissait les habilitations grandes ouvertes.
- **`pointage`** : borne self-service (matricule+PIN dans le corps) → ouvert à tout connecté.
- **GED** : ouverture d'un fichier (`/api/ged/file`) ouverte au connecté ; upload/suppression réservés au BE.
- **Validations** : la **soumission** (`POST /api/validations`) est ouverte au connecté (n'importe quel service peut soumettre un jalon) ; la **décision** (`/decision`) est réservée à la Direction (garde inline + non neutre).

## Filtrage du menu
`navServices(user)` retourne les services **lisibles** → la sidebar n'affiche que ce à quoi l'utilisateur a droit. Sans jeton, `plans` reste visible par tous ; avec jetons, il suit `lire:plans` comme les autres. Menu et `canAccess()` disent donc exactement la même chose.

> ⚠ Les entrées de sidebar **sans service réel** (Accueil, Tableaux de bord, Pointage, Manuels) portent `data-svc=""` et ne sont jamais masquées. Une entrée dont le `data-svc` déduit de l'URL n'existe pas dans `MENU_SERVICES` est masquée **pour tout le monde** — c'était le cas du hub `/dashboard` jusqu'au 09/09/2026. Pour un lien hors nomenclature des services, poser `svc: ''` dans `SIDEBAR_ITEMS`.

---

## Accès par service définis sur la personne (depuis le 09/09/2026)

La fiche salarié (**RH › Employés**) porte un tableau des **15 services**, chacun avec deux **cases à cocher** : *Lire* et *Écrire*.

**Cocher Écrire coche automatiquement Lire et la verrouille** — on ne peut pas écrire sans lire. Décocher Écrire rend la lecture de nouveau libre. La réciproque n'existe pas : on peut lire sans écrire, et faire passer quelqu'un de la lecture à l'écriture.

> Le bloc **« Rôles supplémentaires »** a été retiré de la fiche : l'accès se définit désormais service par service, ce qui rend le cumul de rôles inutile. Le **rôle principal** reste, il fixe le métier et l'entité. Elles se rangent dans `salaries.autorisations` sous forme de jetons `lire:<service>` et `ecrire:<service>` — aucune colonne nouvelle, la colonne est déjà `jsonb`.

**Règle appliquée par `canAccess()`** — dans cet ordre :

1. `perms` contient `all` (Direction) → accès total, jamais restreint ;
2. route self-service atelier → autorisée ;
3. **au moins un jeton `lire:` ou `ecrire:` → ces listes font foi** et remplacent la matrice des rôles pour l'accès aux services : elles peuvent aussi bien **ouvrir** un service que **fermer** un service que le rôle accordait. Cela vaut pour **les 15 services sans exception**, `plans` et `habilitations` compris ;
4. aucun jeton → la matrice `ROLE_MATRIX` s'applique, comme avant.

⚠ **Rôle Direction** : le jeton `all` court-circuite tout, en tête de `canAccess()`. Les cases sont bien enregistrées mais restent **sans effet** tant que le rôle principal est Direction — la fiche affiche désormais un avertissement quand ce rôle est choisi.

✅ **Prise d'effet IMMÉDIATE (depuis le 09/09/2026).** Le jeton ne prouve plus que l'**identité** ; les **droits** sont relus dans `salaries` à chaque requête par `droitsAJour()` (`src/index.tsx`), avec un cache mémoire d'isolate de **8 s** (`PERMS_TTL_MS`) et une invalidation immédiate après le PATCH ou le DELETE de la fiche salarié. Un changement s'applique donc en quelques secondes, sans reconnexion, dans les deux sens. Désactiver un compte (`actif=false`) ou supprimer un salarié **éjecte la session** au lieu de la laisser vivre 12 h.

Trois points de conception à ne pas défaire :

1. **Le cache porte la TABLE entière, pas une ligne par personne.** La latence domine (~30-80 ms depuis un Worker) : lire 36 lignes en projection légère coûte le même aller-retour qu'une seule ligne en `select('*')`. Coût = **une requête par isolate et par TTL**, quel que soit le nombre de connectés — et les hash de PIN cessent de transiter.
2. **⚠ RÈGLE DE SÛRETÉ — `null` veut dire « la requête a ÉCHOUÉ », jamais « salarié absent ».** `getDroitsSalaries()` (`src/queries.ts`) renvoie `null` uniquement sur erreur. C'est vital : **supabase-js ne lève jamais d'exception**, il renvoie `{data:null, error}`. Confondre les deux ferait basculer *tous* les utilisateurs sur la branche « compte fermé » au moindre hoquet réseau — cookie supprimé, atelier entier renvoyé au login, et impossible de se reconnecter puisque `/api/login` lit aussi `salaries`. En cas d'échec on **garde les droits du jeton**. Vérifié par un test qui pointe l'application sur une base injoignable.
3. **Le cache est opportuniste** : les isolates Cloudflare sont éphémères et multiples, il peut être vide à tout instant — le code reste correct sans lui.

⚠ **Le compte BOOTSTRAP échappe à ce mécanisme** (aucune ligne `salaries`) : ses droits restent figés dans le cookie 12 h. Raison de plus pour poser `BOOTSTRAP_MATRICULE`/`BOOTSTRAP_PIN` en production.

⚠ **« Décocher toutes les cases » ne ferme pas l'accès** : sans aucun jeton `lire:`/`ecrire:`, la matrice des rôles reprend la main — c'est la règle écrite dans la fiche (« tout laisser vide = les droits du rôle »). Pour fermer réellement : décocher **partiellement** (garder au moins une case), changer le rôle, ou désactiver le compte.

`ecrire:<svc>` implique `lire:<svc>` : inutile de cocher le service des deux côtés.

`navServices()` suit la même règle, donc le menu latéral reflète exactement les droits réels.

**Vérifié par 36 cas** : comportement historique préservé sans jeton (9 cas) ; ouverture **et** fermeture par jeton sur les services ordinaires comme sur `plans`, `habilitations`, `interlocuteurs` et `/dashboard/environnement` ; écriture impliquant la lecture ; Direction jamais restreinte ; et un contrôle de **cohérence menu ↔ `canAccess` sur 75 couples** (5 profils × 15 services), qui garantit que la sidebar ne ment jamais sur les droits réels.

### Aller-retour de la fiche (le piège qui a coûté le plus cher)

Les jetons transitent par une chaîne à quatre maillons ; **casser un seul rend la fonction inutilisable sans jamais lever d'erreur** :

| # | Maillon | Fichier |
|---|---|---|
| 1 | `select('*')` sur `salaries` | `queries.ts` · `getSalaries()` |
| 2 | `autorisations` conservé dans l'objet Employé | `index.tsx` · `mapSalarieToEmploye()` |
| 3 | `autorisations` **projeté dans `RH_EMPS`** envoyé au navigateur | `rh_service.tsx` · `pageRHEmployes()` |
| 4 | `acces_services` fusionné côté serveur — **POST *et* PATCH** | `index.tsx` · `jetonsAccesServices()` |

Le maillon 3 manquait : les cases revenaient toujours vides et, comme `rhSaveFiche()` recalcule les jetons depuis les cases affichées, **le moindre ré-enregistrement de la fiche effaçait les accès déjà accordés**. Le maillon 4 manquait côté POST : les cases cochées à la création n'étaient jamais écrites.

> **Règle générale** : toute projection `sjX(rows.map(…))` alimentant un formulaire doit contenir **tous** les champs que ce formulaire ré-enregistre. Un champ absent n'est pas seulement « pas réaffiché » : il est **écrasé au prochain enregistrement**. Même cause pour `sexe` / `oeth` / `date_sortie`, corrigés dans la foulée.
