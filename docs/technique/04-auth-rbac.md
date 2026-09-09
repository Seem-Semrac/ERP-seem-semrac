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
3. `interlocuteurs` (contacts clients ET fournisseurs) → autorisé si écriture `rw` sur **commercial/achats/be** (cas multi-services).
4. `serviceFor(path)` déduit le **service** de la route :
   - `/api/<famille>/…` → `API_FAM_SERVICE[famille]`
   - `/<segment>/…` (page) → `PAGE_SEG_SERVICE[segment]`
   - routes explicitement neutres (`/api/me`, `/api/ged/file`, soumission `/api/validations`) → `__neutral__` (autorisé au connecté).
5. **Défaut FAIL-CLOSED** (depuis l'audit 2026-07-04) : une route `/api/*` **non mappée** est **refusée** ; une page non mappée reste ouverte au connecté.
6. Sinon : niveau du service dans `ROLE_MATRIX` — **écriture** (POST/PATCH/DELETE) exige `rw`, **lecture** (GET) accepte `r` ou `rw`. Multi-rôles → meilleur niveau.

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
- **`plans` (Plan/Bâtiment)** : lecture ouverte à tout connecté ; écriture BE/Production/Maintenance/Qualité/Direction.
- **`habilitations`** : géré par RH **et** Qualité (jeton `habilitations`), sans donner accès au reste de la RH.
- **`pointage`** : borne self-service (matricule+PIN dans le corps) → ouvert à tout connecté.
- **GED** : ouverture d'un fichier (`/api/ged/file`) ouverte au connecté ; upload/suppression réservés au BE.
- **Validations** : la **soumission** (`POST /api/validations`) est ouverte au connecté (n'importe quel service peut soumettre un jalon) ; la **décision** (`/decision`) est réservée à la Direction (garde inline + non neutre).

## Filtrage du menu
`navServices(user)` retourne les services **lisibles** → la sidebar n'affiche que ce à quoi l'utilisateur a droit (`plans` visible par tous).

---

## Accès par service définis sur la personne (depuis le 09/09/2026)

La fiche salarié (**RH › Employés**) porte un tableau des **15 services**, chacun avec deux **cases à cocher** : *Lire* et *Écrire*.

**Cocher Écrire coche automatiquement Lire et la verrouille** — on ne peut pas écrire sans lire. Décocher Écrire rend la lecture de nouveau libre. La réciproque n'existe pas : on peut lire sans écrire, et faire passer quelqu'un de la lecture à l'écriture.

> Le bloc **« Rôles supplémentaires »** a été retiré de la fiche : l'accès se définit désormais service par service, ce qui rend le cumul de rôles inutile. Le **rôle principal** reste, il fixe le métier et l'entité. Elles se rangent dans `salaries.autorisations` sous forme de jetons `lire:<service>` et `ecrire:<service>` — aucune colonne nouvelle, la colonne est déjà `jsonb`.

**Règle appliquée par `canAccess()`** — dans cet ordre :

1. `perms` contient `all` (Direction) → accès total, jamais restreint ;
2. route self-service atelier → autorisée ;
3. **au moins un jeton `lire:` ou `ecrire:` → ces listes font foi** et remplacent la matrice des rôles pour l'accès aux services : elles peuvent aussi bien **ouvrir** un service que **fermer** un service que le rôle accordait ;
4. aucun jeton → la matrice `ROLE_MATRIX` s'applique, comme avant.

`ecrire:<svc>` implique `lire:<svc>` : inutile de cocher le service des deux côtés.

`navServices()` suit la même règle, donc le menu latéral reflète exactement les droits réels.

**Vérifié par 10 cas** : comportement historique préservé sans jeton (3 cas), ouverture en lecture puis en écriture, écriture impliquant la lecture, fermeture d'un service que le rôle ouvrait, Direction jamais restreinte, et filtrage du menu.
