# 08 — Sécurité : posture & risques résiduels

## Posture assumée (décisions actées par le porteur du produit)
Ces choix sont **volontaires** (contexte bêta / PME / zéro-configuration) et **ne sont pas des défauts** au sens de l'audit :

1. **Clé Supabase `anon` committée** (`src/db.ts`) — utilisée **côté serveur uniquement** (le worker Cloudflare exécute le code ; la clé n'est pas exposée au navigateur). L'accès au dépôt est requis pour la lire.
2. **RLS permissive** — les tables acceptent l'écriture via la clé anon. La véritable couche d'autorisation est le **RBAC applicatif** (`auth.ts`), pas la RLS. (⇒ importance d'un RBAC correct : voir audit.)
3. **Secret JWT intégré + compte bootstrap `ADMIN/246810`** — permet un démarrage sans configuration. **Surchargables** par variables d'environnement en production réelle.
4. ~~**Login sans rate-limit**~~ → **corrigé** (throttle applicatif, voir ci-dessous).

## Correctifs de sécurité appliqués (audit 2026-07-17, workflow adversarial)
Correctifs **sûrs, sans impact fonctionnel** (vérifiés tsc+build+harnais 57/0 + e2e login) :
- **XSS réfléchi + open-redirect pré-auth via `/login?next=`** : `next` validé **côté serveur** (`app.get('/login')` — chemin local uniquement, charset sûr sans `< > "`, pas de `//`) + échappement `<` dans le `<script>` (`login.tsx`). Ferme le breakout `</script>` ET la redirection ouverte.
- **XSS stocké** : nom de **fournisseur** dans le widget « Demande d'achat » partagé (`shared.ts` — `.replace(/</g,'\\u003c')`) et nom de **machine** dans le texte des `<option>` de `/production/bdt` (helper `escb` élargi à l'échappement HTML complet).
- **Bypass d'authentification par joker ILIKE** (critique) : `matricule='%'` matchait **tous** les salariés → `verifySalariePin`/`verifyOperateurPin` **rejettent les métacaractères LIKE/PostgREST** (`% _ * ( ) \ ,`). Les matricules réels ne sont pas affectés.
- **Rate-limit `/api/login`** : throttle mémoire par IP (**8 échecs/60 s → 429**, remis à zéro au succès), même patron que `/api/contact`. Défense de fond = Cloudflare WAF.
- **Dedup helper d'échappement** : `escX` centralisé dans `shared.ts` (était copié dans 15 pages → source de dérive, à l'origine des XSS ci-dessus).

**À faire côté DÉPLOIEMENT (config, pas code — le porteur doit agir)** :
- ⚠ **Roter et poser `JWT_SECRET`** en variable d'env : le secret HS256 intégré (`auth.ts`) est committé (donc public dans l'historique git) → quiconque a le dépôt peut forger un cookie `erp_session`. Idem **`BOOTSTRAP_MATRICULE`/`BOOTSTRAP_PIN`** (défaut `ADMIN/246810` public). Voir `erp-deploy`.
- **Élévation RH sans re-auth** (défense en profondeur, non corrigé pour ne pas casser le front RH) : `PATCH /api/rh/salarie/:id` accepte un changement de `role`/`pin` sans re-confirmation par un valideur (la **création**, elle, l'exige). À aligner (exiger `valideur_matricule`/`valideur_pin` quand `role`/`pin` changent).

## Défense en profondeur effective
- **Authentification** : matricule + PIN haché PBKDF2-SHA256, session JWT HS256, `AUTH_ENFORCE` défaut ON.
- **Autorisation** : `canAccess` sur chaque requête, **fail-closed** sur `/api/*` non mappé (depuis l'audit 2026-07-04), matrice 13 rôles × 15 services.
- **Traçabilité EN 9100** : actions signées (opérateur/qualité), porte qualité (BL bloqués si quarantaine/NC active), file de validation Direction.

## Renforcements pour une mise en production « sérieuse »
| Priorité | Action |
|---|---|
| Haute | Poser `JWT_SECRET` et les identifiants bootstrap en **variables d'environnement** (ne pas garder les valeurs intégrées). |
| Haute | Provisionner de vrais comptes salariés (matricule+PIN) et **désactiver/retirer** `ADMIN/246810`. |
| Moyenne | Restreindre la **RLS** Supabase (au moins lecture) et/ou passer par une clé `service_role` côté serveur avec RLS stricte. |
| ~~Moyenne~~ **fait** | ~~Rate-limit sur `/api/login`~~ (throttle applicatif ajouté 2026-07-17) + `/api/contact` (Cloudflare Rules / Turnstile pour la défense de fond). |
| Moyenne | Vérifier le **PIN** sur les 4 routes self-service qui ne le font pas (audit R1). |
| Basse | Rotation de la clé anon si le dépôt a été partagé largement. |

## Risques résiduels connus
Voir le détail dans [09-audit.md](09-audit.md) — section « Résiduels ». En résumé : self-service sans PIN (R1), pages dashboard non gatées par rôle (R2), `/api/contact` sans anti-abus (R3), échecs silencieux sur `bl-partiel` (R4), quelques notifications avec nom non échappé (R5).

## Secrets — règle de manipulation
- **PAT Supabase** (opérations DDL) : **jamais** dans le dépôt, un commit, ou une note. Le détenir hors-ligne, le passer en variable d'environnement à l'usage.
- Ne jamais logguer un secret. Ne jamais committer une variable d'environnement contenant un secret.
