# Audit de code — revue pré-remise prestataire (2026-07-04)

Revue adversariale multi-agents (3 angles : RBAC, endpoints d'écriture, échappement JS client), chaque trouvaille **vérifiée** avant d'être retenue. **16 défauts confirmés, 0 rejeté.** Ce document liste chaque défaut, son statut (corrigé / résiduel assumé) et le correctif.

> Rappel de la **posture assumée** (décisions actées, hors périmètre d'audit) : clé anon Supabase committée mais utilisée **côté serveur uniquement** ; RLS permissive ; secret JWT intégré + compte bootstrap `ADMIN/246810` (bêta zéro-config) ; login sans rate-limit. Ces points sont documentés dans `08-securite.md`.

## Vérification
`rtk tsc` + `rtk npm run build` verts · `node scripts_doc/harness_all_pages.mjs` = 57 PASS · tests unitaires RBAC (29 cas) · e2e réels (idempotence 409, RBAC opérateur bloqué).

---

## 1. RBAC « ouvert par défaut » — **CORRIGÉ** (était HIGH)
`serviceFor()` renvoyait `null` pour toute famille d'API non répertoriée, et `canAccess()` faisait `if (!svc) return true` → **toute route non mappée était ouverte en écriture à n'importe quel compte connecté**. Un opérateur pouvait : libérer une quarantaine (contourne la porte qualité EN9100), télécharger le FEC comptable, générer des DA, supprimer des interlocuteurs, lancer une commande P, polluer la file de validation Direction.

**Correctif** (`src/auth.ts`) :
- Familles d'API manquantes ajoutées à `API_FAM_SERVICE` : `quarantaine→qualite`, `compta→compta`, `commandes/commande/commandes-p→commercial`, `catalogue-fournisseurs→achats`, `direction/kpi-objectifs→direction`.
- **Défaut inversé (fail-closed)** : `if (!svc) return !path.startsWith('/api/')` — toute route `/api/*` inconnue est désormais **refusée** ; les pages inconnues restent ouvertes au connecté.
- Liste blanche explicite `NEUTRAL_API` (routes réellement neutres : `/api/me`, `/api/ged/file`, soumission `/api/validations`).
- `interlocuteurs` (contacts clients ET fournisseurs) : cas particulier multi-services (`commercial`/`achats`/`be`) via `hasAnyLevel`.
- `PAGE_SEG_SERVICE` complété : `finances→compta`, `expedition→expeditions`, `reglages→direction`.

## 2. Quarantaine libérable par tous — **CORRIGÉ** (était HIGH)
`POST /api/quarantaine/:id/liberer|rejeter` sans contrôle → `quarantaine` maintenant mappée à `qualite` (écriture réservée Qualité/Direction). Vérifié : opérateur refusé, qualité autorisé.

## 3. `traiter-retour` non idempotent — **CORRIGÉ** (était HIGH)
Rejouer `POST /api/qualite/nc/:id/traiter-retour` (double-clic, ré-émission) créait un **second avoir / une seconde commande P** (uniqueNum contournait la collision d'id). **Correctif** : lecture de la NC en tête ; si `decision_retour` déjà posé → **409**. Vérifié en e2e.

## 4. Facture à montant négatif — **CORRIGÉ** (était HIGH)
`/api/expeditions/bl-partiel` acceptait `montant_ht` négatif → facture + écriture de vente (VTE) négatives faussant le CA. **Correctif** : `Math.max(0, montant_ht)`, transport ≥ 0, `tva_pct` borné [0..100].

## 5. Script mort sur `/production/habilitations` — **CORRIGÉ** (était HIGH)
`pushNotif(...,'Formulaire d\'ajout d\'habilitation...')` : apostrophe simple-échappée dans un template literal → apostrophe non échappée dans le JS servi → **SyntaxError tuant tout le bloc `<script>`** (filtres, recherche, modales inertes depuis mars 2026). **Correctif** : `d\\'ajout`. ⚠ Le harnais `harness_all_pages.mjs` ne couvre pas les pages **inline dans index.tsx** (non exportées) — voir « suivi » ci-dessous.

## 6. XSS stocké — retour client (Qualité) — **CORRIGÉ** (était HIGH)
`rtEsc()` (qualite.tsx) était une fonction identité (n'échappait rien) et son résultat injecté via `innerHTML` avec `client_nom`/`ref_article` bruts → un nom de client `<img onerror=...>` s'exécutait chez le qualiticien. **Correctif** : `rtEsc` échappe `& < > " '`.

## 7. XSS stocké — plan/bâtiment — **CORRIGÉ** (était MEDIUM)
`esc()` (plans.tsx) n'échappait pas l'apostrophe, alors que les attributs sont en `'…'` → un libellé forgé injectait un handler. **Correctif** : `esc` échappe aussi `'`. (Corrige aussi le bug fonctionnel « Salle d'oxydation ».)

## 8. XSS stocké — planning production — **CORRIGÉ** (était MEDIUM)
`innerHTML` du planning concaténait `op.nom`/`op.poste` (RH) et `client`/`piece`/`operation` (commandes) sans échappement — dont un point **auto-exécuté au chargement** (cartes opérateur). **Correctif** : helper client `pEsc()` appliqué aux cartes opérateur, à la modale de soldage et à la modale de réaffectation.

## 9. Export FEC comptable ouvert — **CORRIGÉ** (était MEDIUM)
Couvert par le correctif #1 (`compta→compta`) : `/api/compta/export-fec` réservé compta/direction. Vérifié : opérateur refusé.

## 10. Écritures métier ouvertes (generer-da, lancer, interlocuteurs, scan-alertes) — **CORRIGÉ** (était MEDIUM)
Couvert par #1 (mappings + fail-closed). Vérifié : opérateur refusé sur chacune ; commercial/achats/BE conservent leurs accès légitimes.

---

## Résiduels — **CORRIGÉS** (2ᵉ passe, 2026-07-04)

| # | Sévérité | Défaut | Correctif appliqué |
|---|---|---|---|
| R1 | MEDIUM | Self-service sans PIN (receptionner/pv/cote/non-conformites) : signataire en texte libre → usurpable. | **Helper `resolveSigner(c, body, fallback)`** : identité = **PIN opérateur vérifié** si fourni (borne partagée), sinon **utilisateur de session** ; le champ texte libre n'est **plus** l'identité signataire. Appliqué à `pv` (controleur/detecteur), `controles/cote` (operateur_nom/controleur), `production/non-conformites` (detecteur). |
| R2 | MEDIUM | Pages `/dashboard/*` (RH, finance) non gatées par rôle. | `serviceFor` : `/dashboard/<x>` gaté par la **lecture du service** correspondant (`DASHBOARD_SERVICE`) ; `/finances/*` déjà gaté (→compta). Testé : opérateur bloqué sur dashboard RH/finance, autorisé sur production. |
| R3 | LOW | `/api/contact` public sans anti-abus. | **Throttle mémoire par IP** (5/min) + **honeypot** (`website`/`_hp` → faux OK sans insertion) + **plafonds de longueur** des champs. ⚠ mitigation *douce* (worker éphémère) — la vraie protection anti-flood reste **Cloudflare WAF Rate Limiting / Turnstile** (à activer côté dashboard). |
| R4 | MEDIUM | Échecs silencieux `bl-partiel` (`.catch(()=>{})`). | **Réordonnancement** : BL créé **en premier** (erreur → 400, stock intact) ; décrément stock, MAJ facture et écriture VTE vérifiés → **`warnings[]`** remontés dans la réponse au lieu d'être avalés. |
| R5 | LOW | Notification de réaffectation avec nom d'opérateur non échappé. | `pEsc` appliqué (planning). |

## Suivi outillage — FAIT
- **`scripts_doc/harness_routes.mjs`** ajouté : rend les pages **inline de `index.tsx`** via `app.request` (template évalué) et vérifie leurs `<script>` → couvre l'angle mort qui avait laissé passer le défaut #5. **20 routes PASS** (dont `/production/habilitations`).
- Rejouer l'audit (workflow) avant chaque remise majeure ; reproductible.

> **Bilan** : 15 des 16 défauts corrigés. Reste à **activer côté Cloudflare** une règle anti-flood (WAF/Turnstile) sur `/api/contact` — non faisable dans le code (posture assumée `08-securite.md`).
